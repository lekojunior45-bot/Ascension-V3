# Ascension — Design & Post-Production v3
Formation professionnelle · Next.js 15 + Supabase + Groq + WhatsApp

---

## 🚀 DÉPLOIEMENT EN 4 ÉTAPES

### ÉTAPE 1 — Supabase (base de données)
1. Va sur https://supabase.com → créer un projet (gratuit)
2. **Project Settings → API** → copie :
   - Project URL
   - anon/public key
   - service_role key (clique "Reveal")
3. **SQL Editor → New query** → colle `supabase/migrations/001_init.sql` → Run
4. **SQL Editor → New query** → colle `supabase/seed.sql` → Run (migration des apprenants existants)

### ÉTAPE 2 — Variables d'environnement
Renomme `.env.example` en `.env.local` et remplis :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=
FORMATEUR_PASSWORD=ChoisisUnMotDePasse!
SUPER_ADMIN_PASSWORD=ChoisisUnSuperMotDePasse!
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
```

### ÉTAPE 3 — Déploiement sur Vercel
```bash
# Dans le dossier ascension-v3 :
npm install        # installer les dépendances
npm run dev        # tester en local → http://localhost:3000

# Pour déployer :
# 1. Crée un repo GitHub, pousse le code
# 2. Va sur vercel.com → New Project → importe le repo
# 3. Dans Settings → Environment Variables → ajoute les 7 variables
# 4. Redeploy → ton app est en ligne !
```

### ÉTAPE 4 — WhatsApp automatique (optionnel)
```bash
cd whatsapp-service
npm install
node server.js    # → scanne le QR code qui apparaît dans le terminal
```
Puis déploie ce dossier sur https://render.com (Free) avec le `render.yaml` fourni.
Ajoute ensuite dans Vercel :
```
WHATSAPP_SERVICE_URL=https://ascension-whatsapp.onrender.com
WHATSAPP_SERVICE_SECRET=ton_secret_random
```

---

## 📱 PWA — Installation sur mobile
L'app s'installe automatiquement sur Android (Chrome) et iOS (Safari) :
- **Android** : ouvre l'app → menu ⋮ → "Ajouter à l'écran d'accueil"
- **iOS** : ouvre l'app → bouton Partager → "Sur l'écran d'accueil"

---

## 🔑 Système de tokens

| Préfixe | Type | Généré par | Usage |
|---------|------|-----------|-------|
| `PRE_` | Pré-inscription | Auto à l'inscription | En attente de validation |
| `DEMO_` | Démo | Formateur | Accès modules 1-2 gratuits |
| `ASC_` | Payant | Super-Admin ONLY | Accès complet, single-use |

### Flux d'accès payant :
1. Apprenant remplit le formulaire → token `PRE_` créé (statut "pending")
2. Formateur voit la demande → clique "Approuver + Envoyer WA"
3. WhatsApp envoyé automatiquement (ou lien manuel en fallback)
4. Pour l'accès complet : Super-Admin génère un token `ASC_`
5. Token `ASC_` expire dès la première activation (fingerprint de l'appareil enregistré)

---

## 🏗️ Structure du projet
```
app/
  page.tsx              → Landing (inscription + LK)
  apprenant/page.tsx    → Espace apprenant (7 modules, Maëlys, Quiz, Projets, Classement)
  formateur/page.tsx    → Dashboard formateur (Dashboard, Modules, Apprenants, Projets, Soren)
  api/
    auth/               → Authentification + single-use tokens
    chat/               → Maëlys / LK / Soren (Groq LLaMA 3.3 70B)
    apprenants/         → CRUD + approbation + génération tokens
    projets/            → Soumission et notation projets
    quiz/               → Correction + sauvegarde scores + badges
    whatsapp/           → Relay WhatsApp
lib/
  modules.ts            → 7 modules exacts (source : app.py)
  quiz.ts               → 70 questions (10 × 7 modules, source : app.py)
  groq.ts               → Prompts Maëlys / LK / Soren
  supabase.ts           → Client Supabase
  tokens.ts             → Génération tokens + messages WhatsApp
supabase/
  migrations/           → Schéma SQL
  seed.sql              → Migration apprenants existants
whatsapp-service/       → Microservice Node.js (gratuit, Render.com)
public/
  manifest.json         → PWA manifest
  icon.svg              → Icône app
```

---

## 👤 Rôles et accès

| Rôle | Mot de passe | Capacités |
|------|-------------|-----------|
| Formateur | `FORMATEUR_PASSWORD` | Voir apprenants, approuver, noter projets, Soren, générer DEMO_ |
| Super-Admin | `SUPER_ADMIN_PASSWORD` | Tout + générer ASC_ (tokens payants) |

---

© 2026 Formation Ascension — Design & Post-Production · Junior Lecco
