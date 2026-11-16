import { hasScope } from './auth'
import type { ResourceDefinition } from './resource'
import { assertFilterDefinitions } from './resource'
import type { ApiIdentity } from './types'

/** Explicit map only: URL input is never resolved to a Prisma model name. */
export function createResourceRegistry(definitions:readonly ResourceDefinition[]) {
  const resources=new Map<string,ResourceDefinition>()
  for(const definition of definitions) {
    assertFilterDefinitions(definition)
    if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(definition.slug)||resources.has(definition.slug))throw new TypeError('Invalid or duplicate resource slug')
    if(!definition.fields.some(field=>field.name==='id')||new Set(definition.fields.map(field=>field.name)).size!==definition.fields.length)throw new TypeError('Invalid resource fields')
    if(new Set(definition.expands.map(expand=>expand.name)).size!==definition.expands.length)throw new TypeError('Duplicate expansion')
    resources.set(definition.slug,definition)
  }
  return {
    get:(slug:string)=>resources.get(slug),
    list:(identity?:ApiIdentity)=>[...resources.values()].filter(def=>!identity||hasScope(identity,def.scope)),
    get size(){return resources.size},
  }
}
export type ResourceRegistry=ReturnType<typeof createResourceRegistry>
