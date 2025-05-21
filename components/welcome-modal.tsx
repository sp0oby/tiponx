import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Rocket, Gift, Coins } from "lucide-react"
import { motion } from "framer-motion"

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setIsOpen(true)
      localStorage.setItem('hasSeenWelcome', 'true')
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl p-2 sm:p-6">
        <div className="relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 opacity-10" />
          
          {/* Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-12"
          >
            <h1 className="font-pixel text-2xl sm:text-5xl mb-2 sm:mb-3 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Welcome to TipOnX! ✨
            </h1>
            <p className="font-mono text-gray-600 text-sm sm:text-lg">
              Support your favorite X creators with crypto tips
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-12 w-full max-w-xl mx-auto">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-3 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center"
            >
              <Rocket className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 text-purple-500" />
              <h3 className="font-pixel text-base sm:text-lg mb-1 sm:mb-2">Easy Tipping</h3>
              <p className="font-mono text-[11px] sm:text-sm text-gray-600">
                Send ETH, SOL, and other tokens directly to creators
              </p>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-3 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center"
            >
              <Gift className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 text-pink-500" />
              <h3 className="font-pixel text-base sm:text-lg mb-1 sm:mb-2">Support Creators</h3>
              <p className="font-mono text-[11px] sm:text-sm text-gray-600">
                Help your favorite creators thrive with direct support
              </p>
            </motion.div>

            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-3 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center"
            >
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 text-yellow-500" />
              <h3 className="font-pixel text-base sm:text-lg mb-1 sm:mb-2">Earn Rewards</h3>
              <p className="font-mono text-[11px] sm:text-sm text-gray-600">
                Get recognized for supporting the community
              </p>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-3 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center"
            >
              <Coins className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 text-green-500" />
              <h3 className="font-pixel text-base sm:text-lg mb-1 sm:mb-2">Multiple Tokens</h3>
              <p className="font-mono text-[11px] sm:text-sm text-gray-600">
                Choose from various tokens to send tips
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel px-6 sm:px-10 py-4 sm:py-6 text-base sm:text-lg"
            >
              <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 mr-2" />
              Let's Go!
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 