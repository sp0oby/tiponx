import { PublicKey } from '@solana/web3.js'

interface PhantomProvider {
  isPhantom?: boolean
  publicKey: PublicKey
  isConnected: boolean
  signMessage(message: Uint8Array, encoding: string): Promise<{
    signature: Uint8Array
    publicKey: PublicKey
  }>
  connect(): Promise<{ publicKey: PublicKey }>
  disconnect(): Promise<void>
}

interface Window {
  solana?: PhantomProvider
} 