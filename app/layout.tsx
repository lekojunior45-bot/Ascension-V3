import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Ascension - Design & Post-Production',
  description: 'Formation professionnelle en Design Graphique & Post-Production',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Ascension' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  themeColor: '#07070E',
}

// 👈 Utilisation directe de ReactNode
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}