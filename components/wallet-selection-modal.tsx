import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface WalletSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectWallet: (type: 'ETH' | 'SOL') => Promise<void>
  ethWallet: string | null
  solWallet: string | null
  isLoading: boolean
}

export function WalletSelectionModal({
  isOpen,
  onClose,
  onSelectWallet,
  ethWallet,
  solWallet,
  isLoading
}: WalletSelectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white p-0">
        <DialogHeader className="p-4">
          <DialogTitle className="font-pixel text-xl text-center">Select Wallet to Sign</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 px-2 pb-4">
          {ethWallet && (
            <Button
              onClick={() => onSelectWallet('ETH')}
              disabled={isLoading}
              className="w-full font-pixel bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center gap-2 h-12"
            >
              <Copy className="h-4 w-4" />
              <span className="font-mono text-sm">
                Sign with Ethereum ({ethWallet.slice(0, 4)}...{ethWallet.slice(-4)})
              </span>
            </Button>
          )}
          {solWallet && (
            <Button
              onClick={() => onSelectWallet('SOL')}
              disabled={isLoading}
              className="w-full font-pixel bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center gap-2 h-12"
            >
              <Copy className="h-4 w-4" />
              <span className="font-mono text-sm">
                Sign with Solana ({solWallet.slice(0, 4)}...{solWallet.slice(-4)})
              </span>
            </Button>
          )}
          {!ethWallet && !solWallet && (
            <p className="text-center text-sm text-gray-500 p-4">
              Please connect a wallet first to upvote creators
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 