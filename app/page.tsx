'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Msg = { role: string; content: string }

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const show = useCallback((msg: string, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3400)
  }, [])
  return { toast, show }
}

export default function LandingPage() {
  const router = useRouter()
  const { toast, show } = useToast()
  const [view, setView] = useState<'home' | 'login' | 'register'>('home')
  const [token, setToken] = useState('')
  const [form, setForm] = useState({ prenom:'', nom:'', telephone:'' })
  const [loading, setLoading] = useState(false)
  const [lkMsgs, setLkMsgs] = useState<Msg[]>([
    { role:'ai', content:'Bonjour ! Je coordonne votre accès à la formation Ascension. Posez-moi vos questions sur le programme ou les inscriptions.' }
  ])
  const [lkIn, setLkIn] = useState('')
  const [lkLoad, setLkLoad] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [lkMsgs, lkLoad])

  async function handleLogin() {
    if (!token.trim()) return
    setLoading(true)
    const fp = localStorage.getItem('asc_fp') || (Math.random().toString(36).slice(2) + Date.now().toString(36))
    localStorage.setItem('asc_fp', fp)
    const res = await fetch('/api/auth', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ token: token.trim(), fingerprint: fp }) })
    const data = await res.json()
    if (data.ok) {
      localStorage.setItem('asc_token', token.trim())
      router.push('/apprenant')
    } else {
      show(data.error || 'Token invalide', 'er')
    }
    setLoading(false)
  }

  async function handleRegister() {
    if (!form.prenom || !form.nom || !form.telephone) { show('Tous les champs sont requis', 'er'); return }
    setLoading(true)
    const res = await fetch('/api/apprenants', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ ...form, action:'register' }) })
    const data = await res.json()
    if (data.ok) {
      show('✅ Demande enregistrée ! Vous serez contacté sur WhatsApp.')
      setForm({ prenom:'', nom:'', telephone:'' })
      setView('home')
    } else { show(data.error || 'Erreur', 'er') }
    setLoading(false)
  }

  async function sendLk() {
    if (!lkIn.trim() || lkLoad) return
    const newMsgs: Msg[] = [...lkMsgs, { role:'u', content: lkIn }]
    setLkMsgs(newMsgs); setLkIn(''); setLkLoad(true)
    const res = await fetch('/api/chat', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role === 'u' ? 'user' : 'assistant', content: m.content })), agent:'LK' }) })
    const d = await res.json()
    setLkMsgs([...newMsgs, { role:'ai', content: d.content }])
    setLkLoad(false)
  }

  return (
    <>
      <style>{`
        .land-hero{background:linear-gradient(135deg,rgba(76,29,149,.09),rgba(12,74,110,.04));border:1px solid rgba(124,58,237,.2);border-radius:14px;padding:36px 24px;text-align:center;margin-bottom:14px;position:relative;overflow:hidden;}
        .land-title{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(2.4rem,8vw,3.6rem);background:linear-gradient(135deg,#A78BFA 0%,#7C3AED 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.05;margin-bottom:6px;}
        .land-sub{color:#7C3AED;font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;font-weight:600;margin-bottom:4px;}
        .land-quote{color:var(--txt3);font-style:italic;font-size:.74rem;margin-bottom:22px;}
        .btn-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}
      `}</style>

      <div className="app">
        {toast && <div className={`toast ${toast.type}`}><span style={{flex:1}}>{toast.msg}</span></div>}
        {/* Sidebar nav */}
        <div className="sb">
          <div className="sb-logo">
            <div className="logo-ico">A</div>
            <div><div className="logo-tx">ASCENSION</div><div className="logo-sub">Design · Post-Production</div></div>
          </div>
          <div className="nav-sep" />
          <div className="ni ac" onClick={() => setView('home')}>
            <i className="ti ti-home ni-ico" aria-hidden="true" />
            <span>Accueil</span>
          </div>
          <div className="nav-sep" />
          <div className="nav-sec">Espaces</div>
          <div className="ni" onClick={() => setView('login')}>
            <i className="ti ti-school ni-ico" aria-hidden="true" />
            <span>Espace Apprenant</span>
          </div>
          <div className="ni" onClick={() => router.push('/formateur')}>
            <i className="ti ti-crown ni-ico" aria-hidden="true" />
            <span>Espace Formateur</span>
          </div>
          <div className="sb-sig">
            <div className="sb-sig-name">Junior Lecco</div>
            <div className="sb-sig-roles">Graphic Designer · Motion Designer · UXP Developer · 3D Artist · Video editor</div>
          </div>
          <div className="sb-ft">
            <div className="ni" style={{color:'var(--txt3)',fontSize:'.7rem'}}>
              <i className="ti ti-info-circle ni-ico" aria-hidden="true" />
              <span>Formation Ascension 2026</span>
            </div>
          </div>
        </div>

        <div className="main-scroll">
          <div className="pg">
            {/* HERO */}
            <div className="land-hero">
              <div className="orb1" /><div className="orb2" />
              <div style={{position:'relative'}}>
                <div className="land-sub">Formation · Promotion 2026</div>
                <div className="land-title">Ascension</div>
                <div style={{color:'#7C3AED',fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'4px'}}>Design Graphique · Post-Production</div>
                <div className="land-quote">« Élève le regard. Bâtis ta présence. »</div>
                <div className="g3" style={{maxWidth:360,margin:'0 auto 22px'}}>
                  <div className="mc"><div className="mc-v" style={{color:'var(--accent)'}}>32</div><div className="mc-l">Apprenants</div></div>
                  <div className="mc"><div className="mc-v" style={{color:'#6EE7B7'}}>7</div><div className="mc-l">Modules</div></div>
                  <div className="mc"><div className="mc-v" style={{color:'var(--gold)'}}>14</div><div className="mc-l">Semaines</div></div>
                </div>
                <div className="btn-row">
                  <button className="btn btn-p" onClick={() => setView('register')}>
                    <i className="ti ti-plus" aria-hidden="true" />S&apos;inscrire à la formation
                  </button>
                  <button className="btn btn-o" onClick={() => setView('login')}>
                    <i className="ti ti-key" aria-hidden="true" />J&apos;ai un token
                  </button>
                </div>
              </div>
            </div>

            {/* LOGIN */}
            {view === 'login' && (
              <div className="card nh" style={{marginBottom:14,animation:'fadeUp .25s ease-out'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1rem',marginBottom:4}}>🔑 Connexion Apprenant</div>
                <div style={{fontSize:'.72rem',color:'var(--txt2)',marginBottom:14}}>Entre ton token d'accès personnel</div>
                <div className="fg">
                  <label className="fl">Token d'accès</label>
                  <input className="fi" value={token} onChange={e=>setToken(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="DEMO_xxxxxxxx ou ASC_xxxxxxxx" />
                </div>
                <button className="btn btn-p btn-f" onClick={handleLogin} disabled={loading}>
                  {loading ? <><span className="sp" />Vérification…</> : <>Accéder à ma formation →</>}
                </button>
                <button className="btn btn-o" style={{width:'100%',marginTop:8,justifyContent:'center'}} onClick={()=>setView('home')}>← Retour</button>
              </div>
            )}

            {/* REGISTER */}
            {view === 'register' && (
              <div className="card nh" style={{marginBottom:14,animation:'fadeUp .25s ease-out'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1rem',marginBottom:3}}>📋 Demande d&apos;inscription</div>
                <div style={{fontSize:'.72rem',color:'var(--txt2)',marginBottom:14}}>Votre token sera envoyé sur WhatsApp après validation.</div>
                <div className="g2">
                  <div className="fg"><label className="fl">Prénom</label><input className="fi" value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} placeholder="Votre prénom" /></div>
                  <div className="fg"><label className="fl">Nom</label><input className="fi" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="VOTRE NOM" /></div>
                </div>
                <div className="fg"><label className="fl">Téléphone / WhatsApp</label><input className="fi" value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))} placeholder="+237 6XX XXX XXX" /></div>
                <button className="btn btn-p btn-f" onClick={handleRegister} disabled={loading}>
                  {loading ? <><span className="sp" />Envoi…</> : <><i className="ti ti-send" />Envoyer ma demande</>}
                </button>
                <button className="btn btn-o" style={{width:'100%',marginTop:8,justifyContent:'center'}} onClick={()=>setView('home')}>← Retour</button>
              </div>
            )}

            {/* LK CHAT */}
            <div className="card nh card-teal">
              <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:13,paddingBottom:11,borderBottom:'1px solid var(--bdr)'}}>
                <div className="av" style={{background:'linear-gradient(135deg,#041828,#0c3250)',color:'#7DD3FC',fontWeight:800}}>LK</div>
                <div>
                  <div style={{fontWeight:600,fontSize:'.85rem'}}>LK</div>
                  <div style={{fontSize:'.62rem',color:'var(--txt2)',display:'flex',alignItems:'center',gap:5}}>
                    <span className="online-dot" />Coordinateur de formation
                  </div>
                </div>
              </div>
              <div className="chat-w" style={{height:240}}>
                <div className="chat-m" ref={chatRef}>
                  {lkMsgs.map((m,i) => (
                    <div key={i} style={{display:'flex',justifyContent:m.role==='u'?'flex-end':'flex-start'}}>
                      <div className={`bub bub-${m.role==='u'?'u':'ai'}`}>{m.content}</div>
                    </div>
                  ))}
                  {lkLoad && (
                    <div style={{display:'flex',gap:4,padding:'8px 12px',background:'var(--bg-03)',borderRadius:'12px 12px 12px 2px',width:'fit-content',alignItems:'center'}}>
                      {[0,1,2].map(j=><span key={j} style={{width:6,height:6,borderRadius:'50%',background:'var(--txt3)',display:'inline-block',animation:`fadeUp .8s ${j*.2}s infinite`}} />)}
                    </div>
                  )}
                </div>
                <div className="chat-ir">
                  <input className="fi" value={lkIn} onChange={e=>setLkIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendLk()} placeholder="Posez une question sur la formation…" />
                  <button className="btn btn-teal btn-s" onClick={sendLk}><i className="ti ti-send" aria-hidden="true" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
