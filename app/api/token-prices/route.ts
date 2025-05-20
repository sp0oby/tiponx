import { NextResponse } from 'next/server'
import { getExchangeRates } from '@/lib/blockchain'

export async function GET() {
  try {
    const rates = await getExchangeRates()
    
    // Return rates with CORS headers
    return new NextResponse(JSON.stringify({
      ETH: rates.ETH,
      USDC: rates.USDC,
      USDT: rates.USDT,
      DAI: rates.DAI,
      WETH: rates.WETH,
      SOL: rates.SOL,
      RAY: rates.RAY,
      SRM: rates.SRM
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('Error fetching token prices:', error)
    
    // Return fallback prices if API fails
    return new NextResponse(JSON.stringify({
      ETH: 2500,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      WETH: 2500,
      SOL: 95,
      RAY: 1,
      SRM: 1
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 