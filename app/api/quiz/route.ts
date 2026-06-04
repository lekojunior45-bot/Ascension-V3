import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getQuiz } from '@/lib/quiz'

export async function POST(req: NextRequest) {
  try {
    const { token, moduleId, answers } = await req.json()
    const quiz = getQuiz(moduleId)
    if (!quiz) return NextResponse.json({ ok:false, error:'Quiz introuvable' }, { status:404 })
    let score = 0
    const results = quiz.questions.map((q, i) => {
      const correct = answers[i] === q.correct
      if (correct) score++
      return { question: q.q, userAnswer: answers[i], correct, expl: q.expl, correctAnswer: q.correct }
    })
    const percent = Math.round((score / quiz.questions.length) * 100)
    if (token) {
      const db = supabaseAdmin()
      const { data: ap } = await db.from('apprenants').select('quiz_scores,badges,participation').eq('token', token).single()
      if (ap) {
        const newScores = { ...(ap.quiz_scores || {}), [moduleId]: percent }
        const newBadges = [...(ap.badges || [])]
        const badgeKey = `m${moduleId}`
        if (percent >= 60 && !newBadges.includes(badgeKey)) newBadges.push(badgeKey)
        await db.from('apprenants').update({ quiz_scores: newScores, badges: newBadges, participation: (ap.participation || 0) + 1 }).eq('token', token)
      }
    }
    return NextResponse.json({ ok:true, score, percent, total: quiz.questions.length, results })
  } catch (e: any) { return NextResponse.json({ ok:false, error: e.message }, { status:500 }) }
}
