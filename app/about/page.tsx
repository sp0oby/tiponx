"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { ArrowLeft, Twitter, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AboutPage() {
  const router = useRouter()

  return (
    <RetroContainer>
      <RetroHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button
            variant="outline"
            className="border-2 border-black font-pixel"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-b-4 border-black">
            <CardTitle className="font-pixel text-3xl">About TipOnX</CardTitle>
            <CardDescription className="text-white opacity-90 font-mono">
              Supporting creators with crypto, one tip at a time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <section>
                <h2 className="font-pixel text-xl mb-3">What is TipOnX?</h2>
                <p className="font-mono text-gray-600 mb-4">
                  TipOnX is a Web3 tipping platform that connects X (formerly Twitter) creators with their supporters through cryptocurrency. 
                  We make it easy for fans to show their appreciation using various cryptocurrencies while ensuring creators maintain full control over their earnings.
                </p>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-2 border-black p-4">
                    <div className="flex items-center mb-2">
                      <Twitter className="h-5 w-5 mr-2 text-blue-500" />
                      <h3 className="font-pixel">1. Connect</h3>
                    </div>
                    <p className="font-mono text-sm">
                      Sign in with your X account to get started. Creators can claim their profile and add wallet addresses.
                    </p>
                  </Card>

                  <Card className="border-2 border-black p-4">
                    <div className="flex items-center mb-2">
                      <Wallet className="h-5 w-5 mr-2 text-green-500" />
                      <h3 className="font-pixel">2. Add Wallets</h3>
                    </div>
                    <p className="font-mono text-sm">
                      Connect your Ethereum and Solana wallets to start receiving tips in various cryptocurrencies.
                    </p>
                  </Card>

                  <Card className="border-2 border-black p-4">
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 mr-2 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <h3 className="font-pixel">3. Receive Tips</h3>
                    </div>
                    <p className="font-mono text-sm">
                      Supporters can send tips directly to your connected wallets. No intermediaries, no fees.
                    </p>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">Features</h2>
                <ul className="list-disc list-inside font-mono text-gray-600 space-y-2">
                  <li>Direct crypto tips to creators</li>
                  <li>Support for multiple cryptocurrencies</li>
                  <li>X account verification</li>
                  <li>Real-time transaction tracking</li>
                  <li>Secure wallet connections</li>
                  <li>No platform fees</li>
                </ul>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">Get Started</h2>
                <p className="font-mono text-gray-600 mb-4">
                  Ready to start supporting your favorite creators or receive tips for your content? 
                  Connect your X account and join the future of creator monetization.
                </p>
                <Button
                  className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
                  onClick={() => router.push('/')}
                >
                  Launch App
                </Button>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
      <RetroFooter />
    </RetroContainer>
  )
} 