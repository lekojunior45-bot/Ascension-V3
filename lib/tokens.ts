import { customAlphabet } from 'nanoid'
const alpha = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', 8)
export const generateDemoToken = () => `DEMO_${alpha()}`
export const generateFullToken = () => `ASC_${alpha()}`
export const generatePendingToken = () => `PRE_${alpha()}`

export function buildWAMessage(pseudo: string, token: string, appUrl: string): string {
  return `🎨 *Bienvenue dans Ascension !*\n\nBonjour *${pseudo}* !\n\nTon accès à la formation *Design & Post-Production* est confirmé.\n\n🔑 *Ton token personnel :*\n\`${token}\`\n\n🚀 *Accède à ta formation :*\n${appUrl}\n\n_Ce token est personnel et non transmissible._\n\n*— Formation Ascension*`
}

export function buildWALink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const intl = cleaned.startsWith('237') ? cleaned : `237${cleaned}`
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
}

export function generateFingerprint(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
