"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TermsPage() {
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
            <CardTitle className="font-pixel text-3xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6 font-mono">
              <section>
                <h2 className="font-pixel text-xl mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using TipOnX, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                </p>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">2. Description of Service</h2>
                <p className="text-gray-600 mb-4">
                  TipOnX is a platform that enables users to send cryptocurrency tips to content creators on X (formerly Twitter).
                </p>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">3. User Responsibilities</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>You must be at least 18 years old to use TipOnX</li>
                  <li>You are responsible for maintaining the security of your wallets</li>
                  <li>You agree not to use the service for any illegal purposes</li>
                  <li>You are responsible for all activity that occurs under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">4. Cryptocurrency Transactions</h2>
                <p className="text-gray-600 mb-4">
                  All cryptocurrency transactions are final and irreversible. TipOnX is not responsible for any loss of funds due to user error or blockchain network issues.
                </p>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">5. Service Modifications</h2>
                <p className="text-gray-600 mb-4">
                  We reserve the right to modify or discontinue the service at any time without notice.
                </p>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">6. Limitation of Liability</h2>
                <p className="text-gray-600 mb-4">
                  TipOnX is provided "as is" without any warranties. We are not liable for any damages arising from the use of our service.
                </p>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">7. Contact</h2>
                <p className="text-gray-600 mb-4">
                  If you have any questions about these Terms, please contact our support team.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
      <RetroFooter />
    </RetroContainer>
  )
} 