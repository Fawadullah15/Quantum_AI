import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import React from 'react'
import '@/styles/tokens.css'
import '@/styles/globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Quantum AI',
    default: 'Quantum AI — Intelligent Softwares Company',
  },
  description:
    'Quantum AI builds AI systems, business software, and digital products for organizations that need technology to actually work.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Quantum AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}

