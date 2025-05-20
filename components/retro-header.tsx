import { useRouter } from "next/navigation"
import Image from "next/image"

export function RetroHeader() {
  const router = useRouter()

  return (
    <header className="border-b-4 border-black py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => router.push('/')}
        >
          <div className="relative w-12 h-12 border-2 border-black">
            <Image
              src="/logo.svg"
              alt="TipOnX Logo"
              fill
              className="object-cover"
              priority
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <h1 className="text-2xl font-pixel tracking-tight ml-3">TipOnX</h1>
        </div>
        <nav>
          <ul className="flex space-x-1">
            <li>
              <button
                onClick={() => router.push('/about')}
                className="px-3 py-1 border-2 border-black bg-cyan-400 hover:bg-cyan-300 font-pixel text-sm inline-block"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/help')}
                className="px-3 py-1 border-2 border-black bg-pink-400 hover:bg-pink-300 font-pixel text-sm inline-block"
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
