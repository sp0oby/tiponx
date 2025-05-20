"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PrivacyPage() {
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
            <CardTitle className="font-pixel text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6 font-mono">
              <section>
                <h2 className="font-pixel text-xl mb-3">1. Information We Collect</h2>
                <p className="text-gray-600 mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>X (Twitter) account information</li>
                  <li>Public wallet addresses</li>
                  <li>Transaction history on our platform</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">2. How We Use Your Information</h2>
                <p className="text-gray-600 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Provide and improve our services</li>
                  <li>Process cryptocurrency transactions</li>
                  <li>Communicate with you about your account</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">3. Information Sharing</h2>
                <p className="text-gray-600 mb-4">
                  We do not sell your personal information. We may share your information only:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">4. Data Security</h2>
                <p className="text-gray-600 mb-4">
                  We implement appropriate security measures to protect your information. However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">5. Your Rights</h2>
                <p className="text-gray-600 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>

              <section>
                <h2 className="font-pixel text-xl mb-3">6. Contact Us</h2>
                <p className="text-gray-600 mb-4">
                  If you have questions about our Privacy Policy or your data, please contact our privacy team.
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