# TipOnX - Web3 Tipping for X Creators

A sleek, simple Web3 tipping app that enables users to tip their favorite X (Twitter) creators with cryptocurrencies using direct wallet-to-wallet transfers.

## Features

- X login integration
- Ethereum and Solana wallet connections
- Direct tipping to creators
- Multi-token support (ETH, USDC, SOL)
- Recent Transactions feed
- Tips Sent tracking
- RetroUI design with pixelated elements and neon colors

## Tech Stack

- **Frontend**: Next.js, RetroUI, Tailwind CSS
- **Blockchain**: Ethers.js, @solana/web3.js
- **Backend**: MongoDB, Next.js API routes
- **APIs**: Etherscan, Solana Explorer, CoinGecko

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- pnpm package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/tiponx.git
   cd tiponx
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory and add:
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=tiponx
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   # Optional for production:
   # ETHERSCAN_API_KEY=your_etherscan_api_key
   # SOLANA_EXPLORER_API_KEY=your_solana_explorer_api_key
   ```

4. Start the development server
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Using the App

1. Connect your Ethereum (MetaMask) or Solana (Phantom) wallet
2. Browse creators in the Creators tab
3. Send tips to creators with compatible wallets
4. View recent transactions in the Recent Tips tab
5. Check your tipping history in the My Profile tab

## Development

### Project Structure

- `/app` - Next.js app directory with main pages and API routes
- `/components` - UI components
- `/lib` - Utility functions for blockchain and database operations
- `/public` - Static assets
- `/styles` - Global CSS

### Key Files

- `app/page.tsx` - Main application page
- `lib/blockchain.js` - Blockchain wallet connection and transaction functions
- `lib/mongodb.js` - MongoDB database connection and operations
- `lib/transactionTracker.js` - Blockchain explorer API integration

### Testing

For local testing, you'll need:
- MetaMask extension for Ethereum
- Phantom wallet extension for Solana

You can use testnets (Ethereum Sepolia, Solana Devnet) for testing without spending real crypto.

## Deployment

The app can be deployed to Vercel:

```bash
pnpm build
vercel --prod
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- RetroUI for nostalgic design
- Ethers.js and Solana Web3.js libraries
- X API for social integration 