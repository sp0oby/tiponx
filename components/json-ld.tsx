'use client'

import { usePathname } from 'next/navigation'

type StructuredData = {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  [key: string]: any; // Allow additional properties
}

export function JsonLd() {
  const pathname = usePathname()
  const baseUrl = 'https://tiponx.com'

  // Base organization data
  const organizationData: StructuredData = {
    '@type': 'Organization',
    '@context': 'https://schema.org',
    name: 'TipOnX',
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    sameAs: [
      'https://twitter.com/TipOnX',
      // Add other social media profiles here
    ]
  }

  // Base WebApplication data
  const webAppData: StructuredData = {
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
    author: organizationData,
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
    ]
  }

  // Page-specific structured data
  let structuredData: StructuredData = webAppData
  
  switch (pathname) {
    case '/about':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About TipOnX',
        description: 'Learn about TipOnX, the Web3 tipping platform for X creators',
        url: `${baseUrl}/about`,
        mainEntity: organizationData
      }
      break
    
    case '/help':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: 'TipOnX Help Center',
        description: 'Get help with using TipOnX platform',
        url: `${baseUrl}/help`,
        mainEntity: {
          '@type': 'WebApplication',
          name: 'TipOnX Platform Help',
          description: 'Documentation and help for the TipOnX platform',
          url: `${baseUrl}/help`
        }
      }
      break
    
    case '/privacy':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Privacy Policy',
        description: 'TipOnX privacy policy and data protection information',
        url: `${baseUrl}/privacy`,
        mainEntity: {
          '@type': 'WebContent',
          about: {
            '@type': 'Thing',
            name: 'Privacy Policy'
          }
        }
      }
      break
      
    default:
      // Use default WebApplication data for homepage and other pages
      structuredData = webAppData
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
} 