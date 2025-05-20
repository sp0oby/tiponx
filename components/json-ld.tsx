'use client'

import { usePathname } from 'next/navigation'

export function JsonLd() {
  const pathname = usePathname()
  const baseUrl = 'https://tiponx.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TipOnX',
    url: baseUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'Web3 tipping platform for X (Twitter) creators',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Organization',
      name: 'TipOnX',
      url: baseUrl,
    },
    potentialAction: {
      '@type': 'PayAction',
      name: 'Tip Creator',
      description: 'Send cryptocurrency tips to content creators',
    },
    additionalType: 'https://schema.org/CryptocurrencyExchange',
    acceptedPaymentMethod: [
      {
        '@type': 'PaymentMethod',
        name: 'Ethereum',
        alternateName: 'ETH',
        description: 'Ethereum cryptocurrency payments',
        currencyAccepted: 'ETH',
      },
      {
        '@type': 'PaymentMethod',
        name: 'Solana',
        alternateName: 'SOL',
        description: 'Solana cryptocurrency payments',
        currencyAccepted: 'SOL',
      },
      {
        '@type': 'PaymentMethod',
        name: 'USD Coin',
        alternateName: 'USDC',
        description: 'USDC stablecoin payments',
        currencyAccepted: 'USDC',
      }
    ],
    supportedToken: [
      {
        '@type': 'CryptocurrencyToken',
        name: 'Ethereum',
        symbol: 'ETH',
        network: 'Ethereum',
        tokenType: 'Native',
      },
      {
        '@type': 'CryptocurrencyToken',
        name: 'Solana',
        symbol: 'SOL',
        network: 'Solana',
        tokenType: 'Native',
      },
      {
        '@type': 'CryptocurrencyToken',
        name: 'USD Coin',
        symbol: 'USDC',
        network: ['Ethereum', 'Solana'],
        tokenType: 'Stablecoin',
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
} 