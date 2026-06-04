// SOURCE DE VÉRITÉ : app.py original — NE PAS MODIFIER LES TITRES
export interface Module {
  id: number; titre: string; description: string
  badge_nom: string; badge_emoji: string; badge_desc: string
  gratuit: boolean; logiciels: string[]; prompt_specifique: string; emoji: string
}

export const MODULES: Module[] = [
  { id:1, titre:"L'Œil avant l'Outil", emoji:"👁️",
    description:"Fondamentaux visuels — composition, contraste, hiérarchie, couleur.",
    badge_nom:"L'Œil Éveillé", badge_emoji:"🔷", badge_desc:"Il voit ce que les autres ignorent",
    gratuit:true, logiciels:[],
    prompt_specifique:"Tu es expert en fondamentaux du design graphique. Réponds sur : composition visuelle, règle des tiers, équilibre, contraste, hiérarchie visuelle, espace négatif, répétition, alignement, proximité, théorie des couleurs de base." },
  { id:2, titre:"Langage Typographique", emoji:"✍️",
    description:"Choix de polices, pairing, hiérarchie de texte, lisibilité, espacement.",
    badge_nom:"Architecte du Mot", badge_emoji:"✍️", badge_desc:"La typographie comme structure",
    gratuit:true, logiciels:[],
    prompt_specifique:"Tu es expert en typographie appliquée au design graphique. Réponds sur : anatomie des polices, familles typographiques, pairing de polices, hiérarchie de texte, espacement (interlettrage, interlignage), lisibilité." },
  { id:3, titre:"Photoshop — Maîtrise Fondamentale", emoji:"⚡",
    description:"Interface, calques, masques, sélections, retouche de base, export.",
    badge_nom:"Pixel Maître", badge_emoji:"⚡", badge_desc:"Photoshop ne cache plus rien",
    gratuit:false, logiciels:["Adobe Photoshop"],
    prompt_specifique:"Tu es expert en Adobe Photoshop niveau fondamental. Réponds sur : interface, calques et groupes, masques de fusion, outils de sélection, retouche de base (luminosité, contraste, courbes, niveaux), modes de fusion, smart objects, formats d'export, résolution et DPI." },
  { id:4, titre:"Photoshop — Le Visuel qui Convainc", emoji:"🎯",
    description:"Visuels de présentation, affiches, planches archi, mockups, réseaux sociaux.",
    badge_nom:"Visuel d'Impact", badge_emoji:"🎯", badge_desc:"Ses créations parlent avant lui",
    gratuit:false, logiciels:["Adobe Photoshop"],
    prompt_specifique:"Tu es expert en création visuelle avec Adobe Photoshop. Réponds sur : création d'affiches et flyers, planches de présentation, mockups, visuels pour réseaux sociaux, montages photo, effets de texte, templates réutilisables, storytelling visuel." },
  { id:5, titre:"Identité Visuelle & Présentation", emoji:"👁️",
    description:"Charte graphique simplifiée, mockups, pitch visuel, storytelling design.",
    badge_nom:"Gardien de l'Image", badge_emoji:"👁️", badge_desc:"Il maîtrise son identité visuelle",
    gratuit:false, logiciels:["Adobe Photoshop"],
    prompt_specifique:"Tu es expert en identité visuelle et présentation de projet. Réponds sur : charte graphique, identité visuelle cohérente, mockups de présentation, storytelling visuel, pitch deck, moodboard, planche de style." },
  { id:6, titre:"Outils Avancés & Automatisation Créative", emoji:"🛠️",
    description:"Outils d'accélération créative, génération d'assets, automatisation du workflow design.",
    badge_nom:"Architecte du Flux", badge_emoji:"🛠️", badge_desc:"La technologie au service de sa vision",
    gratuit:false, logiciels:["Adobe Firefly"],
    prompt_specifique:"Tu es expert en outils avancés et automatisation dans le workflow créatif. Réponds sur : Adobe Firefly, écriture de prompts efficaces, génération d'assets visuels, moodboards génératifs, suppression d'arrière-plan automatique, vectorisation automatique, remplissage génératif Photoshop, intégration des assets dans les compositions." },
  { id:7, titre:"Illustrator — L'Essentiel", emoji:"🔺",
    description:"Vecteur vs pixel, formes, tracés, logo simple, export SVG/PDF.",
    badge_nom:"Vecteur d'Élite", badge_emoji:"🔺", badge_desc:"La précision absolue du vecteur",
    gratuit:false, logiciels:["Adobe Illustrator"],
    prompt_specifique:"Tu es expert en Adobe Illustrator niveau essentiel. Réponds sur : différence vecteur vs bitmap, interface Illustrator, outil plume et tracés, formes géométriques, couleurs et dégradés, création de logo simple, typographie dans Illustrator, formats d'export (SVG, PDF, AI, PNG), quand utiliser Illustrator vs Photoshop." },
]

export const getModule = (id: number) => MODULES.find(m => m.id === id)
