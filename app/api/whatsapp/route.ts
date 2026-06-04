import { NextRequest, NextResponse } from 'next/server'
import { buildWAMessage, buildWALink } from '@/lib/tokens'

export async function POST(req: NextRequest) {
  const { phone, token, pseudo } = await req.json()
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const message = buildWAMessage(pseudo, token, APP_URL)
  const WA_URL = process.env.WHATSAPP_SERVICE_URL
  if (WA_URL) {
    try {
      const r = await fetch(`${WA_URL}/send`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-secret': process.env.WHATSAPP_SERVICE_SECRET||'' }, body: JSON.stringify({ phone, message }) })
      if (r.ok) return NextResponse.json({ ok:true, sent:true })
    } catch {}
  }
  const waLink = buildWALink(phone, message)
  return NextResponse.json({ ok:true, sent:false, waLink })
}
