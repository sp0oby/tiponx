"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { ArrowLeft, HelpCircle, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function HelpPage() {
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
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-b-4 border-black">
            <CardTitle className="font-pixel text-3xl">Help Center</CardTitle>
            <CardDescription className="text-white opacity-90 font-mono">
              Frequently asked questions and support
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <section>
                <h2 className="font-pixel text-xl mb-4">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b-2 border-black">
                    <AccordionTrigger className="font-pixel text-left">
                      How do I get started with TipOnX?
                    </AccordionTrigger>
                    <AccordionContent className="font-mono">
                      Getting started is easy! Just connect your X (Twitter) account, and if you're a creator, 
                      add your cryptocurrency wallet addresses. Once connected, you can start receiving tips from your supporters.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border-b-2 border-black">
                    <AccordionTrigger className="font-pixel text-left">
                      What cryptocurrencies are supported?
                    </AccordionTrigger>
                    <AccordionContent className="font-mono">
                      We currently support Ethereum (ETH), USDC on Ethereum, and Solana (SOL). 
                      More cryptocurrencies will be added based on community feedback.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border-b-2 border-black">
                    <AccordionTrigger className="font-pixel text-left">
                      Are there any fees?
                    </AccordionTrigger>
                    <AccordionContent className="font-mono">
                      TipOnX doesn't charge any platform fees. You only pay the standard network transaction fees 
                      for the blockchain you're using (gas fees for Ethereum, transaction fees for Solana).
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border-b-2 border-black">
                    <AccordionTrigger className="font-pixel text-left">
                      How do I verify my X account?
                    </AccordionTrigger>
                    <AccordionContent className="font-mono">
                      After connecting your X account, you'll receive a unique verification code. Post this code 
                      in a tweet, and our system will automatically verify your account ownership.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="border-b-2 border-black">
                    <AccordionTrigger className="font-pixel text-left">
                      Is my wallet information secure?
                    </AccordionTrigger>
                    <AccordionContent className="font-mono">
                      Yes! We never store your private keys. We only store your public wallet addresses, 
                      which are safely encrypted in our database.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>

              <section className="pt-6">
                <Card className="border-2 border-black p-6 bg-gray-50">
                  <div className="flex items-center mb-4">
                    <HelpCircle className="h-6 w-6 mr-2 text-blue-500" />
                    <h2 className="font-pixel text-xl">Need More Help?</h2>
                  </div>
                  <p className="font-mono text-gray-600 mb-4">
                    Can't find what you're looking for? Our support team is here to help!
                  </p>
                  <Button className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </Card>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
      <RetroFooter />
    </RetroContainer>
  )
} 