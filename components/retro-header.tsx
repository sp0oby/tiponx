import { useRouter } from "next/navigation"
import Image from "next/image"

export function RetroHeader() {
  const router = useRouter()

  return (
    <header className="border-b-4 border-black py-2 sm:py-4">
      <div className="container mx-auto px-2 sm:px-4 flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => router.push('/')}
        >
          <div className="relative w-8 h-8 sm:w-12 sm:h-12 border-2 border-black">
            <Image
              src="/logo.svg"
              alt="TipOnX Logo"
              fill
              className="object-cover"
              priority
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <h1 className="text-lg sm:text-2xl font-pixel tracking-tight ml-2 sm:ml-3">TipOnX</h1>
        </div>
        <nav>
          <ul className="flex space-x-1 sm:space-x-2">
            <li>
              <button
                onClick={() => router.push('/about')}
                className="px-2 sm:px-3 py-1 border-2 border-black bg-cyan-400 hover:bg-cyan-300 font-pixel text-[11px] sm:text-sm inline-block"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/help')}
                className="px-2 sm:px-3 py-1 border-2 border-black bg-pink-400 hover:bg-pink-300 font-pixel text-[11px] sm:text-sm inline-block"
              >
                Help
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
