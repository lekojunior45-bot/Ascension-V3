import { NextRequest, NextResponse } from 'next/server'
import { groq, MODEL, PROMPT_MAELYS, PROMPT_LK, PROMPT_SOREN } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { messages, agent = 'MAELYS', moduleId, context } = await req.json()
    const prompts: Record<string, string> = {
      MAELYS: PROMPT_MAELYS + (moduleId ? `\n\nL'apprenant est au Module ${moduleId}.` : ''),
      LK: PROMPT_LK,
      SOREN: PROMPT_SOREN + (context ? `\n\nDonnées cohorte:\n${context}` : ''),
    }
    const c = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role:'system', content: prompts[agent] || PROMPT_LK }, ...messages],
      max_tokens: 700, temperature: 0.75,
    })
    return NextResponse.json({ ok:true, content: c.choices[0]?.message?.content || '...' })
  } catch (e: any) {
    return NextResponse.json({ ok:false, content: 'Service temporairement indisponible.' }, { status:500 })
  }
}
