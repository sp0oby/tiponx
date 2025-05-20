import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import Image from "next/image"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  creator: {
    handle: string
    avatar?: string
    name: string
  }
}

export function QRCodeModal({ isOpen, onClose, creator }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/creator/${creator.handle.replace('@', '')}`

  // Convert avatar URL to base64 for QR code embedding
  useEffect(() => {
    const loadImage = async () => {
      if (creator.avatar) {
        try {
          const response = await fetch(creator.avatar)
          const blob = await response.blob()
          const reader = new FileReader()
          reader.onloadend = () => {
            setAvatarUrl(reader.result as string)
          }
          reader.readAsDataURL(blob)
        } catch (error) {
          console.error('Error loading avatar:', error)
          setAvatarUrl("")
        }
      }
    }
    loadImage()
  }, [creator.avatar])

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('svg')
    if (canvas) {
      const svgData = new XMLSerializer().serializeToString(canvas)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${creator.handle}-qr-code.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel">Profile QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg relative">
            <QRCodeSVG 
              value={profileUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
            {avatarUrl && (
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full overflow-hidden bg-white"
                style={{
                  boxShadow: '0 0 0 6px white'
                }}
              >
                <img 
                  src={avatarUrl} 
                  alt={creator.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-center text-gray-500">
            Scan to visit {creator.handle}'s profile
          </p>
          <Button 
            onClick={handleDownload}
            variant="outline" 
            className="border-2 border-black font-pixel"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 