import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Heart, Github, Send } from "lucide-react"
import { XLogo } from "@/components/icons/x-logo"

export function RetroFooter() {
  const router = useRouter()

  return (
    <footer className="border-t-4 border-black py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-pixel text-lg mb-3">TipOnX</h3>
            <p className="text-sm font-mono">
              A Web3 tipping app for X creators. Support your favorite content creators with crypto.
            </p>
          </div>
          
          <div>
            <h3 className="font-pixel text-lg mb-3">Links</h3>
            <ul className="space-y-1 text-sm font-mono">
              <li>
                <button 
                  onClick={() => router.push('/terms')} 
                  className="hover:underline"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/privacy')} 
                  className="hover:underline"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/help')} 
                  className="hover:underline"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-pixel text-lg mb-3">Connect</h3>
            <div className="flex space-x-3">
              <a
                href="https://twitter.com/wearetipping"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                <XLogo className="h-4 w-4" />
              </a>
              <a
                href="https://t.me/tiponx"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/sp0oby/tiponx"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 border-2 border-black flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-pixel text-lg mb-3">Support the Creator</h3>
            <p className="text-sm font-mono mb-3">
              Love TipOnX? Support the creator and help us grow! 🚀
            </p>
            <Button
              onClick={() => router.push('/creator/spoobsV1')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-black font-pixel hover:from-purple-600 hover:to-pink-600"
            >
              <Heart className="h-4 w-4 mr-2" />
              Tip Creator
            </Button>
          </div>
        </div>
        
        <div className="text-center text-sm font-mono mt-8 pt-8 border-t-2 border-black">
          <p>© 2025 TipOnX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
