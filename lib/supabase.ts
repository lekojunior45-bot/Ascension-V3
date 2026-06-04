import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(url, anon)
export const supabaseAdmin = () => createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken:false, persistSession:false } })

export type ApprenantStatus = 'pending' | 'demo' | 'complet'
export type Apprenant = {
  token: string; pseudo: string; paye: boolean
  status: ApprenantStatus; type: string
  date: string; module_actuel: number
  badges: string[]; participation: number
  quiz_scores: Record<string,number>
  telephone?: string; nom?: string; prenom?: string
  device_fingerprint?: string; first_use_at?: string
  created_at?: string
}
export type Projet = {
  id?: number; token: string; module_id: number
  titre: string; url_fichier?: string; commentaire?: string
  note?: number; feedback?: string; notif_vu: boolean
  created_at?: string
}
