import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token, fingerprint } = await req.json()
    if (!token) return NextResponse.json({ ok:false, error:'Token manquant' }, { status:400 })
    const db = supabaseAdmin()
    const { data, error } = await db.from('apprenants').select('*').eq('token', token.trim()).single()
    if (error || !data) return NextResponse.json({ ok:false, error:'Token invalide ou inconnu' }, { status:401 })
    if (data.status === 'pending') return NextResponse.json({ ok:false, error:'Ton accès est en attente de validation. Tu seras contacté sur WhatsApp.' }, { status:403 })

    // Single-use logic for paid tokens
    if (token.startsWith('ASC_')) {
      if (data.first_use_at && data.device_fingerprint && fingerprint && data.device_fingerprint !== fingerprint) {
        return NextResponse.json({ ok:false, error:'Ce token est déjà activé sur un autre appareil.' }, { status:403 })
      }
      if (!data.first_use_at) {
        await db.from('apprenants').update({ first_use_at: new Date().toISOString(), device_fingerprint: fingerprint }).eq('token', token)
      }
    }
    return NextResponse.json({ ok:true, apprenant: data })
  } catch { return NextResponse.json({ ok:false, error:'Erreur serveur' }, { status:500 }) }
}
