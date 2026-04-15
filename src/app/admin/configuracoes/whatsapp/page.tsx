'use client'
import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Edit2, Zap, Eye, EyeOff, Star } from 'lucide-react'

export default function WhatsAppConfigPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [numeros, setNumeros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editando, setEditando] = useState<any>(null)
  const [salvando, setSalvando] = useState(false)
  const [testandoId, setTestandoId] = useState('')
  const [numTeste, setNumTeste] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [form, setForm] = useState({ nome:'', numero:'', instanceId:'', apiUrl:'', apiKey:'', ehPadrao:false })

  async function carregar() {
    setLoading(true)
    const res = await fetch('/api/admin/whatsapp')
    const d = await res.json()
    setNumeros(d.numeros||[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function salvar() {
    setSalvando(true)
    const url = editando ? `/api/admin/whatsapp/${editando.id}` : '/api/admin/whatsapp'
    const method = editando ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSalvando(false)
    setMostrarForm(false)
    setEditando(null)
    setForm({ nome:'', numero:'', instanceId:'', apiUrl:'', apiKey:'', ehPadrao:false })
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este número?')) return
    await fetch(`/api/admin/whatsapp/${id}`, { method: 'DELETE' })
    carregar()
  }

  async function definirPadrao(id: string) {
    await fetch(`/api/admin/whatsapp/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ehPadrao: true }) })
    carregar()
  }

  async function testar(id: string) {
    setTestandoId(id)
    const res = await fetch(`/api/admin/whatsapp/${id}/testar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numeroTeste: numTeste }) })
    const d = await res.json()
    alert(d.ok ? '✅ Mensagem de teste enviada!' : `❌ Erro: ${d.erro}`)
    setTestandoId('')
    setNumTeste('')
    carregar()
  }

  const STATUS: Record<string, { label: string; cls: string }> = {
    CONECTADO:     { label: '● Conectado',    cls: 'bg-green-100 text-green-700' },
    DESCONECTADO:  { label: '○ Desconectado', cls: 'bg-gray-100 text-gray-600' },
    QR_CODE:       { label: '⟳ QR Code',     cls: 'bg-amber-100 text-amber-700' },
    ERRO:          { label: '✕ Erro',         cls: 'bg-red-100 text-red-700' },
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
  const lbl = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5"

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2"><MessageSquare size={20} className="text-green-500"/>Configuração WhatsApp</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie os números para campanhas via Evolution API</p>
        </div>
        {!mostrarForm && numeros.length < 5 && (
          <button onClick={() => setMostrarForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm" style={{backgroundColor:'#25D366',color:'white'}}>
            <Plus size={15}/>Adicionar número
          </button>
        )}
      </div>

      {(mostrarForm || editando) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-black text-gray-900">{editando?'Editar número':'Novo número'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Nome *</label><input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} className={inp} placeholder="Ex: Principal"/></div>
            <div><label className={lbl}>Número (c/ DDD e país) *</label><input value={form.numero} onChange={e=>setForm(p=>({...p,numero:e.target.value}))} className={inp} placeholder="5518997474701"/></div>
          </div>
          <div><label className={lbl}>Instance ID</label><input value={form.instanceId} onChange={e=>setForm(p=>({...p,instanceId:e.target.value}))} className={inp} placeholder="sixxis-wa1"/></div>
          <div><label className={lbl}>API URL</label><input value={form.apiUrl} onChange={e=>setForm(p=>({...p,apiUrl:e.target.value}))} className={inp} placeholder="https://evolution-api..."/></div>
          <div>
            <label className={lbl}>API Key</label>
            <div className="relative">
              <input type={mostrarSenha?'text':'password'} value={form.apiKey} onChange={e=>setForm(p=>({...p,apiKey:e.target.value}))} className={`${inp} pr-10`} placeholder="••••••••"/>
              <button onClick={()=>setMostrarSenha(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{mostrarSenha?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={()=>setForm(p=>({...p,ehPadrao:!p.ehPadrao}))} className={`w-10 h-6 rounded-full transition-colors ${form.ehPadrao?'bg-[#3cbfb3]':'bg-gray-200'} flex items-center px-1`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.ehPadrao?'translate-x-4':'translate-x-0'}`}/>
            </div>
            <span className="text-sm font-semibold text-gray-700">Definir como número padrão</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>{setMostrarForm(false);setEditando(null);setForm({nome:'',numero:'',instanceId:'',apiUrl:'',apiKey:'',ehPadrao:false})}} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">Cancelar</button>
            <button onClick={salvar} disabled={salvando||!form.nome||!form.numero} className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-50" style={{backgroundColor:'#25D366',color:'white'}}>
              {salvando?'Salvando...':'Salvar número'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(2)].map((_,i)=><div key={i} className="h-20 animate-pulse bg-gray-50 rounded-2xl border border-gray-100"/>)}</div>
      ) : numeros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <MessageSquare size={36} className="text-gray-200 mb-3"/>
          <p className="text-gray-400 text-sm font-semibold">Nenhum número configurado</p>
          <button onClick={()=>setMostrarForm(true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm" style={{backgroundColor:'#25D366',color:'white'}}><Plus size={14}/>Adicionar primeiro número</button>
        </div>
      ) : (
        <div className="space-y-3">
          {numeros.map(n => {
            const st = STATUS[n.status] || STATUS.DESCONECTADO
            return (
              <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><MessageSquare size={20} className="text-green-500"/></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900">{n.nome}</p>
                        {n.ehPadrao && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{backgroundColor:'#3cbfb3',color:'#0f2e2b'}}>PADRÃO</span>}
                      </div>
                      <p className="text-xs text-gray-400">+{n.numero}</p>
                      {n.instanceId && <p className="text-[10px] text-gray-300 mt-0.5">Instance: {n.instanceId}</p>}
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input value={numTeste} onChange={e=>setNumTeste(e.target.value)} placeholder="Número p/ teste (opcional)" className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs w-44 focus:outline-none focus:border-green-400"/>
                    <button onClick={()=>testar(n.id)} disabled={testandoId===n.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50" style={{backgroundColor:'#25D366',color:'white'}}>
                      <Zap size={12}/>{testandoId===n.id?'Testando...':'Testar'}
                    </button>
                  </div>
                  {!n.ehPadrao && <button onClick={()=>definirPadrao(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#3cbfb3] text-[#3cbfb3] hover:bg-[#3cbfb3]/10 transition"><Star size={12}/>Definir padrão</button>}
                  <button onClick={()=>{setEditando(n);setForm({nome:n.nome,numero:n.numero,instanceId:n.instanceId||'',apiUrl:n.apiUrl||'',apiKey:n.apiKey||'',ehPadrao:n.ehPadrao});setMostrarForm(false)}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"><Edit2 size={12}/>Editar</button>
                  <button onClick={()=>excluir(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50 transition"><Trash2 size={12}/>Excluir</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
