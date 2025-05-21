import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "TipOnX - Web3 Tipping for X Creators",
  description: "Support your favorite X (Twitter) creators directly with cryptocurrency tips. Easy, secure, and instant Web3 tipping platform for content creators.",
  generator: 'Next.js',
  applicationName: 'TipOnX',
  keywords: ['crypto tipping', 'X creators', 'Twitter tips', 'Web3', 'cryptocurrency', 'content creators', 'social media tipping', 'blockchain', 'Ethereum', 'Solana', 'USDC', 'digital payments'],
  authors: [{ name: 'TipOnX Team' }],
  creator: 'TipOnX',
  publisher: 'TipOnX',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tiponx.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'es-ES': '/es-ES',
    },
  },
  openGraph: {
    title: 'TipOnX - Web3 Tipping for X Creators',
    description: 'Support your favorite X (Twitter) creators directly with cryptocurrency tips. Easy, secure, and instant Web3 tipping platform for content creators.',
    url: 'https://tiponx.com',
    siteName: 'TipOnX',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TipOnX - Web3 Tipping Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipOnX - Web3 Tipping for X Creators',
    description: 'Support your favorite X (Twitter) creators directly with cryptocurrency tips. Easy, secure, and instant Web3 tipping platform.',
    creator: '@TipOnX',
    images: ['/og-image.jpg'],
    site: '@TipOnX',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ]
  },
  manifest: '/manifest.json'
} 