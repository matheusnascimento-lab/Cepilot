import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cepilot — Seu copiloto de aprendizado',
  description: 'Tutor de IA personalizado com o conteúdo real da CEFIS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
