'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MODULES } from '@/lib/modules'
import { getQuiz } from '@/lib/quiz'

type Ap = { token:string;pseudo:string;paye:boolean;status:string;module_actuel:number;badges:string[];participation:number;quiz_scores:Record<string,number> }
type Msg = { role:string; content:string }

function useToast() {
  const [t,setT]=useState<{msg:string;type:string}|null>(null)
  const show=useCallback((msg:string,type='ok')=>{setT({msg,type});setTimeout(()=>setT(null),3400)},[])
  return {toast:t,show}
}

const TABS = ['💬 Maëlys','📝 Quiz','📂 Projets','📈 Progression','🏆 Classement']

export default function ApprenantPage() {
  const router = useRouter()
  const {toast,show} = useToast()
  const [ap, setAp] = useState<Ap|null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [chatIn, setChatIn] = useState('')
  const [chatLoad, setChatLoad] = useState(false)
  const [qAns, setQAns] = useState<Record<number,number>>({})
  const [qDone, setQDone] = useState(false)
  const [qResult, setQResult] = useState<any>(null)
  const [projets, setProjets] = useState<any[]>([])
  const [projForm, setProjForm] = useState({titre:'',url_fichier:'',commentaire:''})
  const [classement, setClassement] = useState<any[]>([])
  const [sbCol, setSbCol] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('asc_token')
    if (!token) { router.push('/'); return }
    const fp = localStorage.getItem('asc_fp') || ''
    fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,fingerprint:fp})})
      .then(r=>r.json()).then(d=>{ if(d.ok){setAp(d.apprenant); initChat(d.apprenant)} else router.push('/') })
      .finally(()=>setLoading(false))
  },[router])

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight },[msgs,chatLoad])

  function initChat(a:Ap) {
    const m = MODULES.find(m=>m.id===a.module_actuel)
    setMsgs([{role:'ai',content:`Bonjour ${a.pseudo} ! Je t'accompagne dans le Module ${a.module_actuel} — "${m?.titre}". Qu'est-ce que tu veux approfondir aujourd'hui ? 🎨`}])
  }

  useEffect(()=>{
    if(!ap) return
    fetch(`/api/projets?token=${ap.token}`).then(r=>r.json()).then(d=>setProjets(d.projets||[]))
    fetch('/api/apprenants').then(r=>r.json()).then(d=>{
      if(d.ok){
        const sorted=[...d.apprenants].filter((a:any)=>a.participation>0).sort((a:any,b:any)=>{
          const sa=Object.values(a.quiz_scores||{}).reduce((s:any,v:any)=>s+v,0) as number
          const sb=Object.values(b.quiz_scores||{}).reduce((s:any,v:any)=>s+v,0) as number
          return sb-sa
        })
        setClassement(sorted)
      }
    }).catch(()=>{})
  },[ap])

  async function sendChat() {
    if(!chatIn.trim()||chatLoad||!ap) return
    const newMsgs:Msg[]=[...msgs,{role:'u',content:chatIn}]
    setMsgs(newMsgs);setChatIn('');setChatLoad(true)
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:newMsgs.map(m=>({role:m.role==='u'?'user':'assistant',content:m.content})),agent:'MAELYS',moduleId:ap.module_actuel})})
    const d=await r.json()
    setMsgs([...newMsgs,{role:'ai',content:d.content}])
    setChatLoad(false)
  }

  async function submitQuiz() {
    if(!ap) return
    const quiz=getQuiz(ap.module_actuel)
    if(!quiz||Object.keys(qAns).length<quiz.questions.length){show('Réponds à toutes les questions','wa');return}
    const r=await fetch('/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:ap.token,moduleId:ap.module_actuel,answers:qAns})})
    const d=await r.json()
    setQResult(d);setQDone(true)
    if(d.ok&&d.percent>=60) show(`🎉 Module validé ! Score : ${d.percent}%`)
  }

  async function submitProjet() {
    if(!ap||!projForm.titre){show('Titre requis','wa');return}
    const r=await fetch('/api/projets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:ap.token,module_id:ap.module_actuel,...projForm})})
    const d=await r.json()
    if(d.ok){show('✅ Projet soumis !');setProjets([d.projet,...projets]);setProjForm({titre:'',url_fichier:'',commentaire:''})}
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg-01)'}}><span className="sp" /></div>
  if(!ap) return null

  const module=MODULES.find(m=>m.id===ap.module_actuel)||MODULES[0]
  const quiz=getQuiz(ap.module_actuel)
  const prog=Math.round(((ap.module_actuel-1)/7)*100)

  return (
    <>
      {toast&&<div className={`toast ${toast.type}`}><span style={{flex:1}}>{toast.msg}</span></div>}
      <div className="app">
        {/* SIDEBAR */}
        <div className={`sb ${sbCol?'col':''}`}>
          <div className="sb-logo">
            <div className="logo-ico">A</div>
            {!sbCol&&<div><div className="logo-tx">ASCENSION</div><div className="logo-sub">Design · Post-Production</div></div>}
          </div>
          {!sbCol&&<>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 8px 10px',borderBottom:'1px solid var(--bdr)',marginBottom:8}}>
              <div className="av" style={{background:'var(--grd-pu)',color:'#fff',fontFamily:'Syne,sans-serif',fontWeight:800}}>{ap.pseudo.charAt(0).toUpperCase()}</div>
              <div style={{overflow:'hidden'}}>
                <div style={{fontWeight:600,fontSize:'.78rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ap.pseudo}</div>
                <div style={{fontSize:'.6rem',color:ap.paye?'#6EE7B7':'var(--gold)'}}>{ap.paye?'✓ Accès complet':'⏳ Accès démo'}</div>
              </div>
            </div>
            <div style={{padding:'0 4px 8px',borderBottom:'1px solid var(--bdr)',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'.58rem',color:'var(--txt2)',marginBottom:4}}><span>Progression</span><span style={{color:'var(--accent)'}}>{ap.module_actuel-1}/7</span></div>
              <div className="pb"><div className="pb-f" style={{width:`${prog}%`}} /></div>
            </div>
            <div className="nav-sep"/>
            <div className="nav-sec">Modules</div>
          </>}
          {MODULES.map(m=>{
            const done=m.id<ap.module_actuel,cur=m.id===ap.module_actuel
            return(
              <div key={m.id} className={`ni ${cur?'ac-pu':''}`} title={sbCol?m.titre:''} style={{opacity:m.id>ap.module_actuel&&!m.gratuit? 0.5:1}}>
                <span style={{fontSize:'1rem',flexShrink:0}}>{m.id>ap.module_actuel&&!m.gratuit?'🔒':m.emoji}</span>
                {!sbCol&&<span style={{fontSize:'.68rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:done?'#6EE7B7':cur?'var(--accent)':'var(--txt2)'}}>{done&&'✓ '}{m.titre}</span>}
              </div>
            )
          })}
          <div style={{marginTop:'auto'}}>
            {!sbCol&&<>
              <div className="sb-sig"><div className="sb-sig-name">Junior Lecco</div><div className="sb-sig-roles">Graphic Designer · Motion Designer · UXP Developer · 3D Artist · Video editor</div></div>
            </>}
            <div className="sb-ft">
              <div className="ni" onClick={()=>setSbCol(c=>!c)} title={sbCol?'Développer':'Réduire'}>
                <i className={`ti ti-${sbCol?'layout-sidebar-right':'layout-sidebar-left'} ni-ico`} aria-hidden="true"/>
                {!sbCol&&<span style={{fontSize:'.7rem',color:'var(--txt3)'}}>Réduire</span>}
              </div>
              <div className="ni" onClick={()=>{localStorage.removeItem('asc_token');router.push('/')}}>
                <i className="ti ti-logout ni-ico" aria-hidden="true"/>
                {!sbCol&&<span style={{fontSize:'.7rem',color:'var(--txt3)'}}>Déconnexion</span>}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main-scroll">
          <div className="pg">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.2rem'}}>Bienvenue, {ap.pseudo} 👋</div>
                <div style={{fontSize:'.72rem',color:'var(--txt2)',marginTop:2}}>Module {ap.module_actuel}/7 en cours · Formation Ascension 2026</div>
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {ap.badges.slice(0,3).map((b:string,i:number)=>{
                  const m=MODULES.find(mx=>`m${mx.id}`===b)
                  return m?<span key={i} className="bdg bdg-gd">{m.badge_emoji} {m.badge_nom}</span>:null
                })}
              </div>
            </div>

            <div className="g4" style={{marginBottom:16}}>
              <div className="mc"><div className="mc-v" style={{color:'var(--accent)'}}>{Object.values(ap.quiz_scores||{}).length>0?Math.round((Object.values(ap.quiz_scores).reduce((a:any,b:any)=>a+b,0) as number)/Object.values(ap.quiz_scores).length):'-'}</div><div className="mc-l">Score moy.</div></div>
              <div className="mc"><div className="mc-v" style={{color:'#6EE7B7'}}>{ap.module_actuel}/7</div><div className="mc-l">Module actif</div></div>
              <div className="mc"><div className="mc-v" style={{color:'var(--gold)'}}>{ap.badges.length}</div><div className="mc-l">Badges</div></div>
              <div className="mc"><div className="mc-v" style={{color:'var(--teal)'}}>{ap.participation}</div><div className="mc-l">Participations</div></div>
            </div>

            <div className="tabs">{TABS.map((t,i)=><div key={i} className={`tab ${tab===i?'ac':''}`} onClick={()=>setTab(i)}>{t}</div>)}</div>

            {/* TAB 0 — MAËLYS */}
            {tab===0&&(
              <div className="card nh tc">
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12,paddingBottom:10,borderBottom:'1px solid var(--bdr)'}}>
                  <div className="av" style={{background:'linear-gradient(135deg,#1a0535,#6D28D9)',borderRadius:'50%',color:'#C4B5FD',fontWeight:800}}>M</div>
                  <div><div style={{fontWeight:600,fontSize:'.85rem'}}>Maëlys</div><div style={{fontSize:'.62rem',color:'var(--txt2)'}}>Accompagnatrice pédagogique · Module {ap.module_actuel} — {module.titre}</div></div>
                  <div style={{marginLeft:'auto'}}><span className="online-dot" /></div>
                </div>
                <div className="chat-w" style={{height:340}}>
                  <div className="chat-m" ref={chatRef}>
                    {msgs.map((m,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:m.role==='u'?'flex-end':'flex-start'}}>
                        <div className={`bub bub-${m.role==='u'?'u':'ai'}`}>{m.content}</div>
                      </div>
                    ))}
                    {chatLoad&&<div style={{display:'flex',gap:4,padding:'8px 12px',background:'var(--bg-03)',borderRadius:'12px 12px 12px 2px',width:'fit-content',alignItems:'center'}}>
                      {[0,1,2].map(j=><span key={j} style={{width:6,height:6,borderRadius:'50%',background:'var(--txt3)',display:'inline-block',animation:`fadeUp .8s ${j*.2}s infinite`}} />)}
                    </div>}
                  </div>
                  <div className="chat-ir">
                    <input className="fi" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pose ta question sur le module…" />
                    <button className="btn btn-p btn-s" onClick={sendChat}><i className="ti ti-send" aria-hidden="true"/></button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1 — QUIZ */}
            {tab===1&&(
              <div className="card nh tc">
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
                  <span style={{fontFamily:'Syne,sans-serif',fontWeight:700}}>Quiz · Module {ap.module_actuel}</span>
                  <span style={{fontSize:'.7rem',color:'var(--txt2)'}}>— {module.titre}</span>
                  {qDone&&qResult&&<span className={`bdg ${qResult.percent>=60?'bdg-gn':'bdg-rd'}`}>{qResult.score}/{qResult.total} · {qResult.percent}%</span>}
                </div>
                {!quiz&&<div style={{color:'var(--txt2)'}}>Quiz non disponible.</div>}
                {quiz&&!qDone&&quiz.questions.map((q,qi)=>(
                  <div key={qi} style={{marginBottom:18}}>
                    <div style={{fontWeight:500,fontSize:'.82rem',marginBottom:9,lineHeight:1.5}}>Q{qi+1}. {q.q}</div>
                    {q.opts.map((opt,oi)=>(
                      <div key={oi} className={`qo${qAns[qi]===oi?' sel':''}`} onClick={()=>setQAns(a=>({...a,[qi]:oi}))}>{String.fromCharCode(65+oi)}. {opt}</div>
                    ))}
                  </div>
                ))}
                {quiz&&qDone&&qResult&&(
                  <div>
                    <div className={`card nh ${qResult.percent>=60?'alert-ok':'alert-warn'}`} style={{marginBottom:16,background:qResult.percent>=60?'rgba(2,44,34,.2)':'rgba(120,53,15,.15)',border:`1px solid ${qResult.percent>=60?'rgba(5,150,105,.2)':'rgba(252,211,77,.2)'}`,borderRadius:'var(--r-s)',padding:'12px'}}>
                      <div style={{fontWeight:600,marginBottom:3}}>{qResult.percent>=60?`✅ Module validé ! ${module.badge_emoji} Badge "${module.badge_nom}" débloqué !`:'📚 Continue à réviser — seuil de validation : 60%'}</div>
                      <div style={{fontSize:'.76rem',opacity:.8}}>Score : {qResult.score}/{qResult.total} ({qResult.percent}%)</div>
                    </div>
                    {qResult.results?.map((r:any,i:number)=>(
                      <div key={i} style={{marginBottom:10,padding:'12px',background:'var(--bg-03)',borderRadius:'var(--r-s)',border:`1px solid ${r.correct?'rgba(5,150,105,.2)':'rgba(239,68,68,.2)'}`}}>
                        <div style={{fontSize:'.78rem',fontWeight:600,marginBottom:4,color:r.correct?'#6EE7B7':'#FCA5A5'}}>{r.correct?'✓':'✗'} {r.question}</div>
                        <div style={{fontSize:'.72rem',color:'var(--txt2)',lineHeight:1.6}}>💡 {r.expl}</div>
                      </div>
                    ))}
                    <button className="btn btn-o" onClick={()=>{setQDone(false);setQAns({});setQResult(null)}}>↺ Refaire le quiz</button>
                  </div>
                )}
                {quiz&&!qDone&&(
                  <button className="btn btn-p" onClick={submitQuiz} disabled={Object.keys(qAns).length<(quiz?.questions.length||0)}>
                    <i className="ti ti-check" aria-hidden="true"/>
                    {Object.keys(qAns).length<(quiz?.questions.length||0)?`Réponds à toutes les questions (${Object.keys(qAns).length}/${quiz?.questions.length})`:'Valider le quiz'}
                  </button>
                )}
              </div>
            )}

            {/* TAB 2 — PROJETS */}
            {tab===2&&(
              <div className="g2 tc">
                <div className="card nh">
                  <div style={{fontWeight:600,marginBottom:13}}>📤 Soumettre un projet</div>
                  <div style={{fontSize:'.7rem',color:'var(--txt2)',marginBottom:12}}>Module : <strong style={{color:'var(--accent)'}}>{module.titre}</strong></div>
                  <div className="fg"><label className="fl">Titre du projet</label><input className="fi" value={projForm.titre} onChange={e=>setProjForm(f=>({...f,titre:e.target.value}))} placeholder="Titre de votre création" /></div>
                  <div className="fg"><label className="fl">Lien du fichier (Drive, Dropbox…)</label><input className="fi" value={projForm.url_fichier} onChange={e=>setProjForm(f=>({...f,url_fichier:e.target.value}))} placeholder="https://drive.google.com/…" /></div>
                  <div className="fg"><label className="fl">Description de votre démarche</label><textarea className="fi fta" value={projForm.commentaire} onChange={e=>setProjForm(f=>({...f,commentaire:e.target.value}))} placeholder="Décrivez vos choix créatifs…" /></div>
                  <button className="btn btn-p btn-f" onClick={submitProjet}><i className="ti ti-send" aria-hidden="true"/>Soumettre</button>
                </div>
                <div className="card nh">
                  <div style={{fontWeight:600,marginBottom:13}}>📋 Mes soumissions</div>
                  {projets.length===0&&<div style={{color:'var(--txt2)',fontSize:'.78rem',textAlign:'center',padding:'20px 0'}}>Aucun projet soumis</div>}
                  {projets.map((p:any)=>(
                    <div key={p.id} className="mdc" style={{cursor:'default',marginBottom:8}}>
                      <div style={{fontSize:'1.1rem'}}>{p.note?'✅':'⏳'}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500,fontSize:'.78rem'}}>{p.titre}</div>
                        <div style={{fontSize:'.62rem',color:'var(--txt2)'}}>Module {p.module_id} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</div>
                        {p.feedback&&<div style={{fontSize:'.62rem',color:'var(--txt2)',marginTop:3,fontStyle:'italic'}}>"{p.feedback}"</div>}
                      </div>
                      {p.note!=null?<span className="bdg bdg-gn">{p.note}/20</span>:<span className="bdg bdg-gr">En attente</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3 — PROGRESSION */}
            {tab===3&&(
              <div className="g2 tc">
                <div className="card nh">
                  <div style={{fontWeight:600,marginBottom:13}}>🗺️ Parcours de formation</div>
                  {MODULES.map(m=>{
                    const done=m.id<ap.module_actuel,cur=m.id===ap.module_actuel,locked=m.id>ap.module_actuel
                    const score=ap.quiz_scores?.[m.id]
                    return(
                      <div key={m.id} className={`mdc${locked?' lk':''}`} style={{cursor:'default'}}>
                        <div className="md-ico">{locked?'🔒':m.emoji}</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:500,fontSize:'.76rem',color:done?'#6EE7B7':cur?'var(--txt)':'var(--txt2)'}}>{m.titre}</div>
                          <div style={{fontSize:'.62rem',color:'var(--txt2)'}}>{m.description}</div>
                          {score!=null&&<div className="pb"><div className="pb-f" style={{width:`${score}%`}} /></div>}
                          {score!=null&&<div style={{fontSize:'.58rem',color:'var(--accent)',marginTop:2}}>Quiz : {score}%</div>}
                        </div>
                        {done&&<i className="ti ti-check" style={{color:'#6EE7B7',fontSize:14}} aria-hidden="true"/>}
                        {cur&&<span className="bdg bdg-pu">En cours</span>}
                      </div>
                    )
                  })}
                </div>
                <div>
                  <div className="card nh" style={{marginBottom:13}}>
                    <div style={{fontWeight:600,marginBottom:11}}>🏅 Mes badges</div>
                    {ap.badges.length===0&&<div style={{color:'var(--txt2)',fontSize:'.76rem'}}>Validez vos premiers quiz pour débloquer des badges.</div>}
                    {ap.badges.map((b:string,i:number)=>{
                      const m=MODULES.find(mx=>`m${mx.id}`===b)
                      if(!m) return null
                      return(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',borderBottom:'1px solid var(--bdr)'}}>
                          <span style={{fontSize:'1.3rem'}}>{m.badge_emoji}</span>
                          <div><div style={{fontSize:'.78rem',fontWeight:500}}>{m.badge_nom}</div><div style={{fontSize:'.62rem',color:'var(--txt2)'}}>{m.badge_desc}</div></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4 — CLASSEMENT */}
            {tab===4&&(
              <div className="card nh tc">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:700}}>🏆 Classement de la Promo</div>
                  <span className="bdg bdg-pu">Mis à jour en temps réel</span>
                </div>
                {classement.map((a:any,i:number)=>{
                  const score=Object.values(a.quiz_scores||{}).reduce((s:any,v:any)=>s+v,0) as number
                  const isMe=a.token===ap.token
                  return(
                    <div key={a.token} className="rk" style={{background:isMe?'rgba(124,58,237,.07)':'transparent'}}>
                      <div className="rk-n" style={{color:i===0?'var(--gold)':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--txt2)'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
                      <div className="av" style={{background:isMe?'var(--grd-pu)':'var(--bg-03)',color:isMe?'#fff':'var(--txt2)',fontWeight:800}}>{a.pseudo.charAt(0).toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'.78rem',fontWeight:isMe?600:400}}>{a.pseudo}{isMe&&' (moi)'}</div>
                        <div style={{fontSize:'.62rem',color:'var(--txt2)'}}>Module {a.module_actuel} · {a.badges?.length||0} badges</div>
                      </div>
                      <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--accent)',fontSize:'.88rem'}}>{Math.round(score/Math.max(Object.keys(a.quiz_scores||{}).length,1))}pts</div>
                    </div>
                  )
                })}
                {classement.length===0&&<div style={{color:'var(--txt2)',textAlign:'center',padding:'30px 0',fontSize:'.78rem'}}>Le classement s'affichera après les premiers quiz.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
