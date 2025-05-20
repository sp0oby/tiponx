import type { ReactNode } from "react"

interface RetroContainerProps {
  children: ReactNode
}

export function RetroContainer({ children }: RetroContainerProps) {
  return (
    <div className="min-h-screen bg-white font-mono relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500"></div>
      {children}
    </div>
  )
}
