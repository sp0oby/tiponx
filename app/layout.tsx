import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ensureDatabaseInitialized } from "@/lib/init-mongodb"
import { Providers } from './providers'
import { metadata } from './metadata'
import { JsonLd } from '@/components/json-ld'

// Initialize database on the server side
if (typeof window === 'undefined') {
  ensureDatabaseInitialized()
    .then(() => console.log('MongoDB database initialized'))
    .catch(err => console.error('Failed to initialize MongoDB database:', err));
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <JsonLd />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export { metadata }
