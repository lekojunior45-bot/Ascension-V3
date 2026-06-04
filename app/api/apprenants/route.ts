import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateDemoToken, generateFullToken, generatePendingToken, buildWAMessage, buildWALink } from '@/lib/tokens'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FMT_PWD = process.env.FORMATEUR_PASSWORD!
const SUPER_PWD = process.env.SUPER_ADMIN_PASSWORD!

function getRole(pwd: string): 'none' | 'formateur' | 'super' {
  if (pwd === SUPER_PWD) return 'super'
  if (pwd === FMT_PWD) return 'formateur'
  return 'none'
}

// GET — liste apprenants (formateur+)
export async function GET(req: NextRequest) {
  const pwd = req.headers.get('x-pwd') || ''
  if (getRole(pwd) === 'none') return NextResponse.json({ ok:false, error:'Non autorisé' }, { status:401 })
  const db = supabaseAdmin()
  const { data } = await db.from('apprenants').select('*').order('created_at', { ascending:false })
  return NextResponse.json({ ok:true, apprenants: data || [] })
}

// POST — inscription (public) ou génération token (formateur)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // Inscription publique → crée un token PRE_ en attente
    if (!action || action === 'register') {
      const { prenom, nom, telephone } = body
      if (!prenom || !nom || !telephone) return NextResponse.json({ ok:false, error:'Champs manquants' }, { status:400 })
      const token = generatePendingToken()
      const pseudo = `${prenom} ${nom.toUpperCase()}`
      const db = supabaseAdmin()
      const { error } = await db.from('apprenants').insert({
        token, pseudo, paye:false, status:'pending', type:'pre_inscrit',
        date: new Date().toLocaleDateString('fr-FR'),
        module_actuel:1, badges:[], participation:0, quiz_scores:{}, prenom, nom, telephone
      })
      if (error) throw error
      return NextResponse.json({ ok:true, message:'Inscription enregistrée. En attente de validation.' })
    }

    // Génération token démo (formateur+)
    if (action === 'gen_demo') {
      const pwd = body.pwd || ''
      if (getRole(pwd) === 'none') return NextResponse.json({ ok:false, error:'Non autorisé' }, { status:401 })
      const token = generateDemoToken()
      return NextResponse.json({ ok:true, token })
    }

    // Génération token payant (super admin ONLY)
    if (action === 'gen_full') {
      const pwd = body.pwd || ''
      if (getRole(pwd) !== 'super') return NextResponse.json({ ok:false, error:'Accès super-admin requis' }, { status:403 })
      const token = generateFullToken()
      return NextResponse.json({ ok:true, token })
    }

    // Approbation d'un apprenant en attente (formateur+)
    if (action === 'approve') {
      const pwd = body.pwd || ''
      if (getRole(pwd) === 'none') return NextResponse.json({ ok:false, error:'Non autorisé' }, { status:401 })
      const { token: appToken } = body
      const db = supabaseAdmin()
      const { data: ap } = await db.from('apprenants').select('*').eq('token', appToken).single()
      if (!ap) return NextResponse.json({ ok:false, error:'Apprenant introuvable' }, { status:404 })

      // Activer
      await db.from('apprenants').update({ status:'demo' }).eq('token', appToken)

      // Envoyer WhatsApp
      const waMsg = buildWAMessage(ap.pseudo, ap.token, APP_URL)
      let waSent = false
      const WA_URL = process.env.WHATSAPP_SERVICE_URL
      if (WA_URL && ap.telephone) {
        try {
          const r = await fetch(`${WA_URL}/send`, {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'x-secret': process.env.WHATSAPP_SERVICE_SECRET||'' },
            body: JSON.stringify({ phone: ap.telephone, message: waMsg })
          })
          waSent = r.ok
        } catch {}
      }
      const waLink = ap.telephone ? buildWALink(ap.telephone, waMsg) : null
      return NextResponse.json({ ok:true, waSent, waLink })
    }

    return NextResponse.json({ ok:false, error:'Action inconnue' }, { status:400 })
  } catch (e: any) { return NextResponse.json({ ok:false, error: e.message }, { status:500 }) }
}

// PATCH — mise à jour apprenant (formateur+)
export async function PATCH(req: NextRequest) {
  try {
    const { token, pwd, ...updates } = await req.json()
    if (!pwd || getRole(pwd) === 'none') return NextResponse.json({ ok:false, error:'Non autorisé' }, { status:401 })
    if (!token) return NextResponse.json({ ok:false, error:'Token manquant' }, { status:400 })
    const db = supabaseAdmin()
    await db.from('apprenants').update(updates).eq('token', token)
    return NextResponse.json({ ok:true })
  } catch (e: any) { return NextResponse.json({ ok:false, error: e.message }, { status:500 }) }
}
