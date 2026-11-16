import type { ZodType } from 'zod'
import { hasScope } from './auth'
import { API_MAX_EXPAND_ITEMS, API_QUERY_TIMEOUT_MS } from './constants'
import { buildSeekWhere, decodeCursor, encodeCursor, filterHash, resolveCursorSecret, type CursorOptions } from './cursor'
import { itemEnvelope, listEnvelope } from './format'
import { ApiQueryError, validateListQuery } from './query'
import { isForbiddenKey, redactValue } from './redact'
import type { ApiContext, ApiScope, ItemEnvelope, ListEnvelope, ListQuery } from './types'

/** JSON-compatible value shape shared by field metadata and the OpenAPI generator. */
export type FieldSchema = { type: 'string'|'number'|'integer'|'boolean'|'object'|'array'; format?: string; nullable?: boolean; enum?: readonly string[]; items?: FieldSchema; properties?: Record<string,FieldSchema>; required?: readonly string[] }
export type FieldDefinition = FieldSchema & { name: string; description?: string; scope?: ApiScope; example?: unknown }
export type FilterDefinition = { field?: string; type: 'string'|'number'|'boolean'; values?: readonly string[]; mode?: 'equals'|'contains'; description?: string }
export type ExpandDefinition = { name:string; relation?:string; many:boolean; resource:()=>ResourceDefinition; scope?:ApiScope; description?:string }
export type ResourceQueryArgs = { where:Record<string,unknown>; select:Record<string,unknown>; orderBy:Record<string,'asc'|'desc'>[]; take:number }
export type ResourceDefinition<T extends Record<string, unknown> = Record<string, unknown>> = {
  slug:string; model:string; scope:ApiScope; fields:readonly FieldDefinition[]; expands:readonly ExpandDefinition[]
  /** Explicit Prisma scalar names; omit only when API fields map 1:1 to scalar columns. */
  scalarFields?:readonly string[]
  /** Nominal public string scalars (e.g. product names), never scoped fields or relations.
   * Their values skip PII masking only; secret/PAN redaction always remains active. */
  publicFields?:readonly string[]
  select:Record<string,boolean>; sorts:readonly string[]; defaultSort?:string; maxLimit?:number; searchFields?:readonly string[]
  dateFields?:{created?:string;updated?:string}
  window?:{from:'criadoDesde'|'atualizadoDesde';to:'criadoAte'|'atualizadoAte';maxDays:number}
  filters?:Record<string,FilterDefinition>; querySchema?:ZodType; deprecated?:boolean; description?:string
  adapter: { findMany(args:ResourceQueryArgs):Promise<T[]>; findFirst?(args:Pick<ResourceQueryArgs,'where'|'select'>):Promise<T|null> }
  /** Serializers must list fields nominally, never spread a database row. */
  serialize(row:T,ctx:ApiContext,fields?:string[]):Record<string,unknown>
  countAndLastUpdate?(ctx:ApiContext):Promise<{count:number;ultimaAtualizacao:string|null}>
  // Compatibility hooks for explicit resources; the engine always uses the bounded adapter above.
  list?(ctx:ApiContext,q:ListQuery):Promise<T[]>
  detail?(ctx:ApiContext,id:string,expand:string[]):Promise<T|null>
}

export function projectFields(data:Record<string,unknown>, requested:readonly string[]|undefined, fields:readonly FieldDefinition[]):Record<string,unknown> {
  const allowed=new Set(fields.map(field=>field.name))
  if (requested?.some(name=>!allowed.has(name))) throw new ApiQueryError(400)
  const selected=requested?new Set(['id',...requested]):allowed
  return Object.fromEntries(Object.entries(data).filter(([key])=>allowed.has(key)&&selected.has(key)))
}

function assertAuthorized(definition:ResourceDefinition, ctx:ApiContext):void {
  if (!ctx.identity || !hasScope(ctx.identity,definition.scope)) throw new ApiQueryError(403,'Escopo necessário não autorizado.')
}
function expandedDefinitions(def:ResourceDefinition,ctx:ApiContext,names:readonly string[]) {
  return names.map(name=>{
    const expansion=def.expands.find(item=>item.name===name)
    if (!expansion) throw new ApiQueryError(400)
    const child=expansion.resource()
    assertAuthorized(child,ctx)
    if (expansion.scope && (!ctx.identity || !hasScope(ctx.identity,expansion.scope))) throw new ApiQueryError(403,'Escopo necessário não autorizado.')
    return {expansion,child}
  })
}
function assertScalarSelector(def:ResourceDefinition):void {
  const scalars=new Set(def.scalarFields??def.fields.map(field=>field.name))
  // Relation aliases and DB relation names are forbidden even if mistakenly listed as scalars.
  const relations=new Set(def.expands.flatMap(expand=>[expand.name,expand.relation??expand.name]))
  const keys=Object.keys(def.select)
  if (keys.some(key=>def.select[key]!==true || !scalars.has(key) || relations.has(key)) || !def.select.id || !def.select[def.defaultSort?.replace(/^-/,'')??def.sorts[0]??'id']) throw new TypeError('Invalid resource scalar selector')
  if (def.publicFields?.some(name=>{
    const field=def.fields.find(item=>item.name===name)
    return !field || field.type!=='string' || !!field.scope || !scalars.has(name) || !def.select[name] || relations.has(name) || isForbiddenKey(name)
  })) throw new TypeError('Invalid public scalar policy')
}
function selection(def:ResourceDefinition,ctx:ApiContext,names:readonly string[]):Record<string,unknown> {
  assertScalarSelector(def)
  const select:Record<string,unknown>={...def.select}
  for (const {expansion,child} of expandedDefinitions(def,ctx,names)) {
    // Repeat the same scalar/relationship checks at each selected child boundary.
    // Child expands are never selected: depth remains exactly one.
    assertScalarSelector(child)
    select[expansion.relation??expansion.name]={select:child.select,...(expansion.many?{take:API_MAX_EXPAND_ITEMS+1,orderBy:{id:'asc'}}:{})}
  }
  return select
}
function serialize<T extends Record<string, unknown>>(def:ResourceDefinition<T>,row:T,ctx:ApiContext,fields?:string[]):Record<string,unknown> {
  const allowed=def.fields.filter(field=>!field.scope||(ctx.identity&&hasScope(ctx.identity,field.scope)))
  const data=projectFields(def.serialize(row,ctx,fields),undefined,allowed)
  const options={allowPii:!!ctx.identity&&hasScope(ctx.identity,'read:pii'),allowMessages:!!ctx.identity&&hasScope(ctx.identity,'read:mensagens')}
  const safe=redactValue(data,options) as Record<string,unknown>
  for (const name of def.publicFields??[]) if (Object.hasOwn(data,name)) {
    if (data[name]!==null && typeof data[name]!=='string') throw new TypeError('Invalid public scalar value')
    safe[name]=redactValue(data[name],{...options,allowPii:true})
  }
  // A requested field without its additive scope must remain absent, not restore the raw value.
  return projectFields(safe,fields,def.fields)
}
function serializeExpanded<T extends Record<string, unknown>>(def:ResourceDefinition<T>,row:T,ctx:ApiContext,q:Pick<ListQuery,'fields'|'expand'>):Record<string,unknown> {
  const result=serialize(def,row,ctx,q.fields)
  for (const {expansion,child} of expandedDefinitions(def,ctx,q.expand??[])) {
    const raw=(row as Record<string,unknown>)[expansion.relation??expansion.name]
    if (expansion.many) {
      if (!Array.isArray(raw)) throw new TypeError('Missing selected expansion')
      result[expansion.name]={data:raw.slice(0,API_MAX_EXPAND_ITEMS).map(value=>serialize(child,value,ctx)),_meta:{hasMore:raw.length>API_MAX_EXPAND_ITEMS}}
    } else result[expansion.name]=raw===null?null:serialize(child,raw as Record<string,unknown>,ctx)
  }
  return result
}
export function buildResourceWhere(def:ResourceDefinition,q:ListQuery):Record<string,unknown> {
  const conditions:Record<string,unknown>[]=[]
  if (q.ids) conditions.push({id:{in:q.ids}})
  for (const [kind,from,to] of [['created','criadoDesde','criadoAte'],['updated','atualizadoDesde','atualizadoAte']] as const) {
    const field=def.dateFields?.[kind]
    if (field&&(q[from]||q[to])) conditions.push({[field]:{...(q[from]?{gte:q[from]}:{}),...(q[to]?{lte:q[to]}:{})}})
  }
  for (const [name,values] of Object.entries(q.filters)) {
    const filter=def.filters![name], field=filter.field??name
    const typed=values.map(value=>filter.type==='boolean'?value==='true':filter.type==='number'?Number(value):value)
    if (filter.mode==='contains') conditions.push({OR:typed.map(value=>({[field]:{contains:value}}))})
    else conditions.push({[field]:typed.length===1?typed[0]:{in:typed}})
  }
  if (q.q) conditions.push({OR:def.searchFields!.map(field=>({[field]:{contains:q.q}}))})
  return {AND:conditions}
}
export async function withQueryTimeout<T>(work:()=>Promise<T>,timeoutMs=API_QUERY_TIMEOUT_MS):Promise<T> {
  let timer:ReturnType<typeof setTimeout>|undefined
  try {
    return await Promise.race([Promise.resolve().then(work),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new ApiQueryError(503,'Consulta temporariamente indisponível.')),timeoutMs)})])
  } finally { if(timer)clearTimeout(timer) }
}
export async function executeList<T extends Record<string, unknown>>(def:ResourceDefinition<T>,ctx:ApiContext,q:ListQuery,options:CursorOptions={}):Promise<ListEnvelope<Record<string,unknown>>> {
  assertAuthorized(def,ctx)
  validateListQuery(q,def,options)
  const secret=resolveCursorSecret(options.cursorSecret)
  const sortField=q.sort.replace(/^-/,''), direction=q.sort.startsWith('-')?'desc':'asc'
  if (!def.select[sortField]) throw new TypeError('Sort field must be selected')
  const where=buildResourceWhere(def,q)
  if(q.cursor)(where.AND as Record<string,unknown>[]).push(buildSeekWhere(decodeCursor(q.cursor,secret),def))
  const select=selection(def,ctx,q.expand??[])
  const orderBy=[{[sortField]:direction},...(sortField==='id'?[]:[{id:direction}])] as ResourceQueryArgs['orderBy']
  const rows=await withQueryTimeout(()=>def.adapter.findMany({where,select,orderBy,take:q.limit+1}))
  const hasMore=rows.length>q.limit, page=rows.slice(0,q.limit)
  const last=page.at(-1) as Record<string,unknown>|undefined
  const nextCursor=hasMore&&last?encodeCursor({v:1,resource:def.slug,sort:q.sort,value:last[sortField] instanceof Date?last[sortField].toISOString():last[sortField] as string|number|boolean,id:String(last.id),filterHash:filterHash(q)},secret):null
  return listEnvelope(page.map(row=>serializeExpanded(def,row,ctx,q)),{hasMore,nextCursor},ctx.requestId)
}
export async function executeItem<T extends Record<string, unknown>>(def:ResourceDefinition<T>,ctx:ApiContext,id:string,q:Pick<ListQuery,'fields'|'expand'>={}):Promise<ItemEnvelope<Record<string,unknown>>> {
  assertAuthorized(def,ctx)
  if(!id||id.length>500||!def.adapter.findFirst)throw new ApiQueryError(404,'Recurso não encontrado.')
  if(q.fields?.some(name=>!def.fields.some(field=>field.name===name)))throw new ApiQueryError(400)
  if(q.expand?.length) { const {parseExpand}=await import('./query'); parseExpand(q.expand.join(','),def) }
  const select=selection(def,ctx,q.expand??[])
  const row=await withQueryTimeout(()=>def.adapter.findFirst!({where:{id},select}))
  if(row===null)throw new ApiQueryError(404,'Recurso não encontrado.')
  return itemEnvelope(serializeExpanded(def,row,ctx,q),ctx.requestId)
}
