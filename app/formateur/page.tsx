'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MODULES } from '@/lib/modules'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Ap = { token:string;pseudo:string;paye:boolean;status:string;type:string;date:string;module_actuel:number;badges:string[];participation:number;quiz_scores:Record<string,number>;telephone?:string;nom?:string;prenom?:string }
type Msg = { role:string; content:string }

function useToast() {
  const [t,setT]=useState<{msg:string;type:string}|null>(null)
  const show=useCallback((msg:string,type='ok')=>{setT({msg,type});setTimeout(()=>setT(null),3600)},[])
  return {toast:t,show}
}

const ACT_DATA=[{name:'Sem 1',actifs:24,projets:9,quiz:18},{name:'Sem 2',actifs:28,projets:14,quiz:23},{name:'Sem 3',actifs:30,projets:19,quiz:27},{name:'Sem 4',actifs:32,projets:22,quiz:30}]

export default function FormateurPage() {
  const router = useRouter()
  const {toast,show} = useToast()
  const [pwd, setPwd] = useState('')
  const [role, setRole] = useState<'none'|'formateur'|'super'>('none')
  const [tab, setTab] = useState(0)
  const [apprenants, setApprenants] = useState<Ap[]>([])
  const [projets, setProjets] = useState<any[]>([])
  const [notes, setNotes] = useState<Record<number,number>>({})
  const [feedbacks, setFeedbacks] = useState<Record<number,string>>({})
  const [unlocked, setUnlocked] = useState([1,2])
  const [sorenMsgs, setSorenMsgs] = useState<Msg[]>([{role:'ai',content:'Bonjour. Je suis Soren, le responsable du suivi de votre cohorte. Analysez les données, identifiez les apprenants en difficulté. Comment puis-je vous aider ?'}])
  const [sorenIn, setSorenIn] = useState('')
  const [sorenLoad, setSorenLoad] = useState(false)
  const [waLinks, setWaLinks] = useState<Record<string,string>>({})
  const [genToken, setGenToken] = useState('')
  const sorenRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ if(sorenRef.current) sorenRef.current.scrollTop=sorenRef.current.scrollHeight },[sorenMsgs,sorenLoad])

  const savedPwd = typeof window!=='undefined'?localStorage.getItem('asc_fmt_pwd'):null
  useEffect(()=>{ if(savedPwd) tryLogin(savedPwd) },[])

  async function tryLogin(p: string) {
    const FMT = process.env.NEXT_PUBLIC_FMT_CHECK // client-side unavailable, use API
    const res = await fetch('/api/apprenants',{headers:{'x-pwd':p}})
    const d = await res.json()
    if(d.ok) {
      setRole(p===localStorage.getItem('asc_super_check')?'super':'formateur')
      // Determine role by trying super endpoint
      const testSuper = await fetch('/api/apprenants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'gen_full',pwd:p})})
      const ts = await testSuper.json()
      const r = ts.ok ? 'super' : 'formateur'
      setRole(r)
      localStorage.setItem('asc_fmt_pwd', p)
      setApprenants(d.apprenants||[])
      const pr = await fetch('/api/projets')
      const pd = await pr.json()
      setProjets(pd.projets||[])
    } else {
      show('Mot de passe incorrect','er')
      localStorage.removeItem('asc_fmt_pwd')
    }
  }

  async function handleLogin() { if(!pwd) return; await tryLogin(pwd) }

  async function approveApprenant(token: string) {
    const res = await fetch('/api/apprenants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve',token,pwd:localStorage.getItem('asc_fmt_pwd')})})
    const d = await res.json()
    if(d.ok) {
      setApprenants(prev=>prev.map(a=>a.token===token?{...a,status:'demo'}:a))
      if(d.waSent) { show('✅ Approuvé + Token envoyé sur WhatsApp !') }
      else if(d.waLink) { setWaLinks(l=>({...l,[token]:d.waLink})); show('✅ Approuvé ! Clique sur le bouton WhatsApp.','wa') }
    } else show(d.error||'Erreur','er')
  }

  async function generateTok(type: 'demo'|'full') {
    const action = type==='demo'?'gen_demo':'gen_full'
    const res = await fetch('/api/apprenants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,pwd:localStorage.getItem('asc_fmt_pwd')})})
    const d = await res.json()
    if(d.ok) { setGenToken(d.token); show(`Token généré : ${d.token}`) }
    else show(d.error||'Non autorisé','er')
  }

  async function togglePaye(ap: Ap) {
    const pwd2 = localStorage.getItem('asc_fmt_pwd')||''
    await fetch('/api/apprenants',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:ap.token,paye:!ap.paye,pwd:pwd2})})
    setApprenants(prev=>prev.map(a=>a.token===ap.token?{...a,paye:!a.paye}:a))
    show(ap.paye?'Accès révoqué':'✅ Accès complet accordé')
  }

  async function gradeProjet(p: any) {
    const note = notes[p.id]??12
    const feedback = feedbacks[p.id]??''
    const res = await fetch('/api/projets',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,note,feedback,notif_vu:false})})
    if((await res.json()).ok) {
      setProjets(prev=>prev.map(pr=>pr.id===p.id?{...pr,note,feedback,reviewed:true}:pr))
      show('✅ Note publiée !')
    }
  }

  function toggleModule(id: number) { setUnlocked(p=>p.includes(id)?p.filter(m=>m!==id):[...p,id]) }

  async function sendSoren() {
    if(!sorenIn.trim()||sorenLoad) return
    const ctx = JSON.stringify(apprenants.map(a=>({pseudo:a.pseudo,module:a.module_actuel,badges:a.badges.length,quizScores:a.quiz_scores,participation:a.participation,paye:a.paye,status:a.status})))
    const newMsgs:Msg[]=[...sorenMsgs,{role:'u',content:sorenIn}]
    setSorenMsgs(newMsgs);setSorenIn('');setSorenLoad(true)
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:newMsgs.map(m=>({role:m.role==='u'?'user':'assistant',content:m.content})),agent:'SOREN',context:ctx})})
    const d=await r.json()
    setSorenMsgs([...newMsgs,{role:'ai',content:d.content}])
    setSorenLoad(false)
  }

  const TABS=['📊 Dashboard','🔓 Modules','👥 Apprenants','📂 Projets','🤝 Soren']
  const pending=apprenants.filter(a=>a.status==='pending')
  const projEnAttente=projets.filter(p=>!p.note&&!p.reviewed)

  if(role==='none') return (
    <div style={{minHeight:'100vh',background:'var(--bg-01)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif'}}>
      {toast&&<div className={`toast ${toast.type}`}><span style={{flex:1}}>{toast.msg}</span></div>}
      <div style={{background:'var(--bg-02)',border:'1px solid var(--bdr)',borderRadius:14,padding:32,width:340,maxWidth:'90vw'}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.2rem',background:'linear-gradient(135deg,var(--accent),var(--pu))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:4}}>ASCENSION</div>
        <div style={{color:'var(--txt2)',fontSize:'.76rem',marginBottom:24}}>Espace Formateur · Accès restreint</div>
        <div className="fg"><label className="fl">Mot de passe</label><input type="password" className="fi" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="••••••••" /></div>
        <button className="btn btn-p btn-f" onClick={handleLogin}>Accéder au tableau de bord</button>
        <div style={{textAlign:'center',marginTop:12}}><button onClick={()=>router.push('/')} style={{background:'transparent',border:'none',color:'var(--txt3)',cursor:'pointer',fontSize:'.72rem'}}>← Retour accueil</button></div>
      </div>
    </div>
  )

  const avgScore = apprenants.length>0 ? Math.round(apprenants.reduce((s,a)=>{
    const sc=Object.values(a.quiz_scores||{})
    return s+(sc.length>0?(sc.reduce((a:any,b:any)=>a+b,0) as number)/sc.length:0)
  },0)/apprenants.length) : 0

  return (
    <>
      {toast&&<div className={`toast ${toast.type}`}><span style={{flex:1}}>{toast.msg}</span></div>}
      <div className="app">
        <div className="sb">
          <div className="sb-logo"><div className="logo-ico">A</div><div><div className="logo-tx">ASCENSION</div><div className="logo-sub">Espace Formateur</div></div></div>
          <div className="nav-sep"/>
          <div className="ni" onClick={()=>router.push('/')}><i className="ti ti-home ni-ico" aria-hidden="true"/><span>Accueil</span></div>
          <div className="nav-sep"/>
          <div className="nav-sec">Espaces</div>
          <div className="ni" onClick={()=>router.push('/apprenant')}><i className="ti ti-school ni-ico" aria-hidden="true"/><span>Espace Apprenant</span></div>
          <div className="ni ac-pu"><i className="ti ti-crown ni-ico" aria-hidden="true"/><span>Espace Formateur</span></div>
          {pending.length>0&&<div style={{margin:'8px 0',padding:'8px 10px',background:'rgba(252,211,77,.07)',border:'1px solid rgba(252,211,77,.15)',borderRadius:'var(--r-s)',fontSize:'.66rem',color:'var(--gold)'}}>
            <span className="pending-dot" style={{marginRight:5}} />{pending.length} inscription{pending.length>1?'s':''} en attente
          </div>}
          {role==='super'&&<div style={{margin:'4px 0',padding:'6px 10px',background:'rgba(14,165,233,.07)',border:'1px solid rgba(14,165,233,.15)',borderRadius:'var(--r-s)',fontSize:'.62rem',color:'var(--teal)'}}>
            ⚡ Super-Admin actif
          </div>}
          <div className="sb-sig"><div className="sb-sig-name">Junior Lecco</div><div className="sb-sig-roles">Graphic Designer · Motion Designer · UXP Developer · 3D Artist · Video editor</div></div>
          <div className="sb-ft">
            <div className="ni" onClick={()=>{localStorage.removeItem('asc_fmt_pwd');setRole('none')}}><i className="ti ti-logout ni-ico" aria-hidden="true"/><span style={{fontSize:'.72rem',color:'var(--txt3)'}}>Déconnexion</span></div>
          </div>
        </div>

        <div className="main-scroll">
          <div className="pg">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
              <div><div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.2rem'}}>Tableau de bord 👑</div><div style={{fontSize:'.72rem',color:'var(--txt2)'}}>Formation Ascension · Promo 2026</div></div>
              <div style={{display:'flex',gap:5}}><span className="bdg bdg-pu">Junior Lecco</span><span className="bdg bdg-gn">Formateur · Actif</span>{role==='super'&&<span className="bdg bdg-teal">Super-Admin</span>}</div>
            </div>

            <div className="tabs">{TABS.map((t,i)=><div key={i} className={`tab ${tab===i?'ac':''}`} onClick={()=>setTab(i)}>{t}{i===2&&pending.length>0&&<span style={{marginLeft:4,background:'var(--gold)',color:'var(--bg-01)',borderRadius:'50%',width:14,height:14,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'.55rem',fontWeight:700}}>{pending.length}</span>}{i===3&&projEnAttente.length>0&&<span style={{marginLeft:4,background:'rgba(252,211,77,.8)',color:'var(--bg-01)',borderRadius:'50%',width:14,height:14,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'.55rem',fontWeight:700}}>{projEnAttente.length}</span>}</div>)}</div>

            {/* TAB 0 DASHBOARD */}
            {tab===0&&(
              <div className="tc">
                <div className="g4" style={{marginBottom:14}}>
                  <div className="mc"><div className="mc-v" style={{color:'var(--accent)'}}>{apprenants.length}</div><div className="mc-l">Apprenants</div></div>
                  <div className="mc"><div className="mc-v" style={{color:'#6EE7B7'}}>{apprenants.filter(a=>a.paye).length}</div><div className="mc-l">Payés</div></div>
                  <div className="mc"><div className="mc-v" style={{color:'var(--gold)'}}>{projets.length}</div><div className="mc-l">Projets soumis</div></div>
                  <div className="mc"><div className="mc-v" style={{color:'var(--teal)'}}>{avgScore||'—'}</div><div className="mc-l">Score moyen</div></div>
                </div>
                <div className="g2">
                  <div className="card nh">
                    <div style={{fontWeight:600,marginBottom:13}}>📈 Activité hebdomadaire</div>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={ACT_DATA} barGap={3}>
                        <XAxis dataKey="name" tick={{fill:'var(--txt2)',fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:'var(--txt2)',fontSize:11}} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{background:'var(--bg-03)',border:'1px solid var(--bdr)',borderRadius:8,fontSize:12}}/>
                        <Bar dataKey="actifs" name="Actifs" fill="#7C3AED" radius={[4,4,0,0]}/>
                        <Bar dataKey="projets" name="Projets" fill="#6EE7B7" radius={[4,4,0,0]}/>
                        <Bar dataKey="quiz" name="Quiz" fill={`var(--gold)`} radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card nh">
                    <div style={{fontWeight:600,marginBottom:13}}>📊 Indicateurs clés</div>
                    {[
                      {l:'Taux complétion M1',v:`${apprenants.filter(a=>a.module_actuel>1).length}/${apprenants.length}`,c:'#6EE7B7'},
                      {l:'Taux complétion M2',v:`${apprenants.filter(a=>a.module_actuel>2).length}/${apprenants.length}`,c:'var(--teal)'},
                      {l:'Score moyen quiz',v:avgScore?`${avgScore}%`:'—',c:'var(--accent)'},
                      {l:'Projets en attente',v:`${projEnAttente.length}`,c:'var(--gold)'},
                      {l:'Inscriptions en attente',v:`${pending.length}`,c:pending.length>0?'var(--gold)':'#6EE7B7'},
                      {l:'Modules actifs',v:`${unlocked.length}/7`,c:'var(--accent)'},
                    ].map((s,i)=>(
                      <div key={i} className="sr"><span style={{color:'var(--txt2)'}}>{s.l}</span><span style={{fontWeight:600,color:s.c}}>{s.v}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1 MODULES */}
            {tab===1&&(
              <div className="card nh tc">
                <div style={{fontWeight:600,marginBottom:4}}>🔓 Gestion des modules</div>
                <div style={{fontSize:'.72rem',color:'var(--txt2)',marginBottom:14}}>Activez ou verrouillez les modules pour la promotion</div>
                {MODULES.map(m=>(
                  <div key={m.id} className="mdc" style={{cursor:'default'}}>
                    <div className="md-ico">{m.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:'.78rem'}}>{m.titre}</div>
                      <div style={{fontSize:'.62rem',color:'var(--txt2)'}}>{m.description} · {m.logiciels.join(', ')||'Fondamentaux'} · {m.gratuit?'Gratuit':'Payant'}</div>
                    </div>
                    <button className={`btn btn-s ${unlocked.includes(m.id)?'btn-p':'btn-o'}`} onClick={()=>toggleModule(m.id)}>
                      {unlocked.includes(m.id)?<><i className="ti ti-check" aria-hidden="true"/>Actif</>:<><i className="ti ti-lock" aria-hidden="true"/>Verrouillé</>}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2 APPRENANTS */}
            {tab===2&&(
              <div className="g2 tc">
                <div className="card nh">
                  {pending.length>0&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontWeight:600,marginBottom:10,color:'var(--gold)'}}>⏳ En attente de validation ({pending.length})</div>
                      {pending.map(a=>(
                        <div key={a.token} style={{padding:'10px 12px',background:'rgba(120,53,15,.12)',border:'1px solid rgba(252,211,77,.15)',borderRadius:'var(--r-s)',marginBottom:8}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                            <div className="av" style={{background:'var(--bg-03)',color:'var(--txt2)'}}>{a.pseudo.charAt(0)}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:'.78rem',fontWeight:600}}>{a.pseudo}</div>
                              <div style={{fontSize:'.62rem',color:'var(--txt2)'}}>📱 {a.telephone} · {a.date}</div>
                            </div>
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button className="btn btn-teal btn-s btn-f" onClick={()=>approveApprenant(a.token)}>
                              <i className="ti ti-check" aria-hidden="true"/>Approuver + Envoyer WA
                            </button>
                          </div>
                          {waLinks[a.token]&&<a href={waLinks[a.token]} target="_blank" rel="noreferrer" style={{display:'block',marginTop:6,textAlign:'center',fontSize:'.68rem',color:'var(--teal)',textDecoration:'none',background:'rgba(14,165,233,.08)',border:'1px solid rgba(14,165,233,.2)',borderRadius:'var(--r-s)',padding:'6px'}}>📱 Ouvrir WhatsApp (envoi manuel)</a>}
                        </div>
                      ))}
                      <div style={{height:1,background:'var(--bdr)',margin:'14px 0'}} />
                    </div>
                  )}
                  <div style={{fontWeight:600,marginBottom:10}}>👥 Apprenants ({apprenants.filter(a=>a.status!=='pending').length})</div>
                  {apprenants.filter(a=>a.status!=='pending').map(a=>(
                    <div key={a.token} className="rk" style={{marginBottom:4}}>
                      <div className="av" style={{background:a.paye?'var(--grd-pu)':'var(--bg-03)',color:a.paye?'#fff':'var(--txt2)',fontWeight:700}}>{a.pseudo.charAt(0).toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'.76rem',fontWeight:500}}>{a.pseudo}</div>
                        <div style={{fontSize:'.6rem',color:'var(--txt2)',fontFamily:'monospace'}}>{a.token}</div>
                        {a.telephone&&<div style={{fontSize:'.6rem',color:'var(--txt2)'}}>📱 {a.telephone}</div>}
                      </div>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                        <span className={`bdg ${a.paye?'bdg-gn':'bdg-gr'}`}>{a.paye?'Complet':'Démo'}</span>
                        <span className="bdg bdg-pu">M{a.module_actuel}</span>
                        <button className="btn btn-o btn-s" onClick={()=>togglePaye(a)} style={{fontSize:'.6rem',padding:'2px 8px'}}>{a.paye?'Révoquer':'Valider'}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="card nh" style={{marginBottom:13}}>
                    <div style={{fontWeight:600,marginBottom:10}}>🔑 Génération de token</div>
                    <button className="btn btn-teal btn-f" style={{marginBottom:8}} onClick={()=>generateTok('demo')}>
                      <i className="ti ti-eye" aria-hidden="true"/>Générer token démo (DEMO_)
                    </button>
                    {role==='super'?(
                      <button className="btn btn-p btn-f" onClick={()=>generateTok('full')}>
                        <i className="ti ti-star" aria-hidden="true"/>Générer token payant (ASC_)
                      </button>
                    ):(
                      <button className="btn btn-lock btn-f" disabled>
                        <i className="ti ti-lock" aria-hidden="true"/>Token payant — Super-Admin requis
                      </button>
                    )}
                    {genToken&&(
                      <div className="alert-ok" style={{marginTop:10}}>
                        <div style={{fontWeight:600,marginBottom:3}}>Token généré :</div>
                        <code style={{fontSize:'.82rem',color:'var(--teal)',letterSpacing:'.05em'}}>{genToken}</code>
                        <div style={{fontSize:'.62rem',marginTop:4,opacity:.7}}>Copie ce token et envoie-le à l'apprenant.</div>
                      </div>
                    )}
                    {role==='super'&&(
                      <div className="alert-warn" style={{marginTop:10}}>
                        ⚠️ Token ASC_ à usage unique — expire dès la première activation sur un appareil.
                      </div>
                    )}
                  </div>
                  <div className="card nh">
                    <div style={{fontWeight:600,marginBottom:10}}>🛡️ Sécurité</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--bdr)'}}>
                      <i className="ti ti-shield-check" style={{color:'#6EE7B7',fontSize:16}} aria-hidden="true"/>
                      <div style={{flex:1,fontSize:'.74rem'}}>Aucune alerte en cours</div>
                      <span className="bdg bdg-gn">OK</span>
                    </div>
                    <div style={{fontSize:'.64rem',color:'var(--txt3)',marginTop:8,lineHeight:1.6}}>Fingerprinting appareil actif · Tokens ASC_ single-use · Accès super-admin cloisonné</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3 PROJETS */}
            {tab===3&&(
              <div className="tc">
                <div style={{fontWeight:600,marginBottom:14}}>📂 Projets à corriger <span style={{marginLeft:8}}><span className={`bdg ${projEnAttente.length>0?'bdg-gd':'bdg-gn'}`}>{projEnAttente.length} en attente</span></span></div>
                {projets.map(p=>(
                  <div key={p.id} className="card nh" style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:'.86rem'}}>{p.titre}</div>
                        <div style={{fontSize:'.64rem',color:'var(--txt2)'}}>{p.token} · Module {p.module_id} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</div>
                        {p.url_fichier&&<a href={p.url_fichier} target="_blank" rel="noreferrer" style={{fontSize:'.64rem',color:'var(--teal)',display:'inline-block',marginTop:3}}>🔗 Voir le fichier</a>}
                      </div>
                      {p.note!=null?<span className="bdg bdg-gn">{p.note}/20</span>:<span className="bdg bdg-gd">En attente</span>}
                    </div>
                    {p.commentaire&&<div style={{fontSize:'.72rem',color:'var(--txt2)',fontStyle:'italic',marginBottom:10}}>"{p.commentaire}"</div>}
                    {p.note==null&&!p.reviewed&&(
                      <>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                          <span style={{fontSize:'.72rem',color:'var(--txt2)',minWidth:32}}>Note</span>
                          <input type="range" min="0" max="20" step="1" value={notes[p.id]??12} onChange={e=>setNotes(n=>({...n,[p.id]:+e.target.value}))} style={{flex:1}}/>
                          <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--accent)',width:28,textAlign:'right'}}>{notes[p.id]??12}</span>
                        </div>
                        <textarea className="fi fta" style={{marginBottom:8,minHeight:52}} value={feedbacks[p.id]??''} onChange={e=>setFeedbacks(f=>({...f,[p.id]:e.target.value}))} placeholder="Feedback constructif pour l'apprenant…"/>
                        <button className="btn btn-p btn-s" onClick={()=>gradeProjet(p)}><i className="ti ti-check" aria-hidden="true"/>Valider la note</button>
                      </>
                    )}
                    {(p.note!=null||p.reviewed)&&p.feedback&&(
                      <div style={{fontSize:'.7rem',color:'var(--txt2)',fontStyle:'italic',borderTop:'1px solid var(--bdr)',paddingTop:8,marginTop:4}}>💬 {p.feedback}</div>
                    )}
                  </div>
                ))}
                {projets.length===0&&<div style={{textAlign:'center',color:'var(--txt2)',padding:'30px 0',fontSize:'.78rem'}}>Aucun projet soumis</div>}
              </div>
            )}

            {/* TAB 4 SOREN */}
            {tab===4&&(
              <div className="card nh card-teal tc">
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:13,paddingBottom:11,borderBottom:'1px solid var(--bdr)'}}>
                  <div className="av" style={{background:'var(--grd-teal)',color:'#fff',fontWeight:800}}>SR</div>
                  <div><div style={{fontWeight:600,fontSize:'.85rem'}}>Soren</div><div style={{fontSize:'.62rem',color:'var(--txt2)'}}>Responsable du suivi · Analyse de cohorte en temps réel</div></div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                  {['Qui sont les apprenants en difficulté ?','Rapport complet de la cohorte',"Quels modules ont le plus faible taux de complétion ?",'Qui n\'a pas encore participé ?'].map(q=>(
                    <button key={q} className="btn btn-o btn-s" style={{fontSize:'.65rem',borderColor:'rgba(14,165,233,.2)',color:'var(--teal)'}} onClick={()=>setSorenIn(q)}>{q}</button>
                  ))}
                </div>
                <div className="chat-w" style={{height:340}}>
                  <div className="chat-m" ref={sorenRef}>
                    {sorenMsgs.map((m,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:m.role==='u'?'flex-end':'flex-start'}}>
                        <div className={`bub bub-${m.role==='u'?'u':'ai'}`}>{m.content}</div>
                      </div>
                    ))}
                    {sorenLoad&&<div style={{display:'flex',gap:4,padding:'8px 12px',background:'var(--bg-03)',borderRadius:'12px 12px 12px 2px',width:'fit-content',alignItems:'center'}}>
                      {[0,1,2].map(j=><span key={j} style={{width:6,height:6,borderRadius:'50%',background:'var(--txt3)',display:'inline-block',animation:`fadeUp .8s ${j*.2}s infinite`}} />)}
                    </div>}
                  </div>
                  <div className="chat-ir">
                    <input className="fi" value={sorenIn} onChange={e=>setSorenIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendSoren()} placeholder="Ex: Quels apprenants sont en difficulté ce mois-ci ?" />
                    <button className="btn btn-teal btn-s" onClick={sendSoren}><i className="ti ti-send" aria-hidden="true"/></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}