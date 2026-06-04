/**
 * ASCENSION — WhatsApp Microservice (100% gratuit)
 * 1. npm install
 * 2. node server.js → scanne le QR dans le terminal
 * 3. Déployer sur Render.com (Free tier)
 */
const express = require('express')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const app = express()
app.use(express.json())

const SECRET = process.env.WHATSAPP_SERVICE_SECRET || 'change_me'
const PORT = process.env.PORT || 3001
let isReady = false

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] },
})

client.on('qr', qr => { console.log('\n📱 Scanne ce QR avec WhatsApp :\n'); qrcode.generate(qr, { small: true }) })
client.on('ready', () => { isReady = true; console.log('✅ WhatsApp prêt !') })
client.on('disconnected', () => { isReady = false; client.initialize() })
client.initialize()

app.post('/send', (req, res) => {
  if (req.headers['x-secret'] !== SECRET) return res.status(401).json({ ok: false })
  if (!isReady) return res.status(503).json({ ok: false, error: 'WhatsApp non connecté' })
  const { phone, message } = req.body
  const cleaned = phone.replace(/\D/g, '')
  const intl = cleaned.startsWith('237') ? cleaned : `237${cleaned}`
  client.sendMessage(`${intl}@c.us`, message)
    .then(() => res.json({ ok: true }))
    .catch(err => res.status(500).json({ ok: false, error: err.message }))
})

app.get('/health', (_, res) => res.json({ ok: true, ready: isReady }))
app.listen(PORT, () => console.log(`🚀 Service démarré sur le port ${PORT}`))
