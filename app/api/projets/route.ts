import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const db = supabaseAdmin()
  const q = token
    ? db.from('projets').select('*').eq('token', token).order('created_at', { ascending:false })
    : db.from('projets').select('*').order('created_at', { ascending:false })
  const { data } = await q
  return NextResponse.json({ ok:true, projets: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const { token, module_id, titre, url_fichier, commentaire } = await req.json()
    if (!token || !module_id || !titre) return NextResponse.json({ ok:false, error:'Champs manquants' }, { status:400 })
    const db = supabaseAdmin()
    const { data, error } = await db.from('projets').insert({ token, module_id, titre, url_fichier, commentaire, notif_vu:false }).select().single()
    if (error) throw error
    return NextResponse.json({ ok:true, projet: data })
  } catch (e: any) { return NextResponse.json({ ok:false, error: e.message }, { status:500 }) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ ok:false, error:'ID manquant' }, { status:400 })
    const db = supabaseAdmin()
    await db.from('projets').update(updates).eq('id', id)
    return NextResponse.json({ ok:true })
  } catch (e: any) { return NextResponse.json({ ok:false, error: e.message }, { status:500 }) }
}
