# TipOnX To-Do List

This to-do list outlines the step-by-step tasks to develop the **TipOnX** X-Integrated Crypto Tipping App, a sleek, simple Web3 app with a RetroUI frontend, X login, wallet connection (Ethereum and Solana), and direct tipping functionality. The goal is a 4-week MVP launch in Q3 2025. Tasks are organized by week, aligned with the business plan, and designed for a solo developer.

## Week 1: Project Setup and UI Foundations
### 1. Initialize Project
- [x] Create a new Next.js project with TypeScript: `npx create-next-app@latest tiponx --typescript`.
- [x] Install dependencies: `npm install retroui tailwindcss@latest postcss autoprefixer`.
- [x] Initialize Tailwind CSS: `npx tailwindcss init -p`.
- [x] Configure RetroUI: Import in `pages/_app.js` (`import 'retroui/dist/index.css'`).
- [x] Verify setup: Run `npm run dev`, ensure localhost:3000 displays a basic page.
- **Reference**: Business Plan - Tech Stack (Frontend: Next.js, RetroUI).

### 2. Design UI Wireframes
- [x] Sketch wireframes for 4 screens: Login, Home (Tipping Hub), Recent Transactions, Profile (Tips Sent, Dashboard).
- [x] Use RetroUI components: Button (neon green), Card (pixelated border), Select (chain/token dropdown), Input (amount), List (transactions).
- [x] Define color palette: White background, neon accents (green, pink), pixel fonts (RetroUI default).
- **Reference**: Business Plan - Product Description (RetroUI Design).

### 3. Implement Login Screen
- [x] Create `pages/index.js` with RetroUI **Button** ("Log in with X", neon blue).
- [x] Add X OAuth using `next-auth`: `npm install next-auth`.
- [x] Configure OAuth in `pages/api/auth/[...nextauth].js` with X API credentials (get from developer.x.com).
- [x] Test login: Clicking button redirects to X, returns user handle and follower data.
- [x] Style with RetroUI: White background, centered button, pixel font ("Connect X to Tip Creators").
- **Reference**: Business Plan - Core Features (X Login).

## Week 2: Wallet Integration and Tipping Hub
### 4. Build Home Screen (Tipping Hub)
- [x] Create `pages/home.js` with RetroUI **Card** for each followed account (fetch mock data initially).
- [x] Add components: **Select** (chain/token: "Ethereum - ETH," "Ethereum - USDC," "Solana - SOL," "Solana - USDC"), **Input** (amount), **Button** ("Tip Now", neon green).
- [x] Style cards: Pixelated border, neon glow, white background, scrollable list.
- [x] Implement navigation: RetroUI **Tabs** for Home, Recent, Profile.
- [x] Test UI: Ensure cards render, dropdown selects chains, button is clickable.
- **Reference**: Business Plan - Core Features (Tipping, Multi-Token Support).

### 5. Integrate Wallet Connections
- [x] Install wallet libraries: `npm install @web3-react/core @web3-react/injected-connector ethers @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets`.
- [x] Create `lib/blockchain.js` with functions for:
  - [x] Ethereum: Ethers.js for ETH and ERC-20 transfers.
  - [x] Solana: @solana/web3.js for SOL and SPL transfers.
- [x] Add wallet connect buttons in `pages/home.js` (RetroUI **Button**, "Connect Ethereum Wallet" and "Connect Solana Wallet").
- [x] Test: Connect MetaMask (Ethereum) and Phantom (Solana); verify wallet address retrieval.
- **Reference**: Business Plan - Tech Stack (Ethers.js, @solana/web3.js).

### 6. Implement Tipping Logic
- [x] Update `components/TippingCard.js` to trigger direct transfers:
  - [x] Fetch creator's wallet address (from MongoDB).
  - [x] Use `sendTip(chain, token, receiver, amount)` from `lib/blockchain.js`.
  - [x] Prompt wallet transaction (e.g., MetaMask for ETH/USDC, Phantom for SOL/USDC).
- [x] Add RetroUI **Modal** for tipping flow: Creator handle, **Select** (chain/token), **Input** (amount), **Button** ("Send Tip").
- [x] Show "Success!" with pixelated coin animation (RetroUI **Alert**).
- [x] Test: Send test tips on both chains.
- **Reference**: Business Plan - Core Features (Tipping, Multi-Token Support).

## Week 3: Backend Implementation and Transaction Tracking
### 7. Set Up Backend and Database
- [ ] Create Node.js server: `npm init -y`, `npm install express mongodb`.
- [ ] Set up MongoDB with collections: `users` (X handle, wallet addresses), `transactions` (sender, receiver, amount, token, USD, timestamp).
- [ ] Create API endpoints in `server.js`:
  - [ ] `/api/users`: Store/retrieve X handle, wallet addresses.
  - [ ] `/api/transactions`: Store tip data for Recent Transactions, Tips Sent.
- [ ] Secure with OAuth token encryption (use `jsonwebtoken`).
- [ ] Test: Save mock user data, query transactions.
- **Reference**: Business Plan - Tech Stack (Node.js, MongoDB).

### 8. Integrate Explorer APIs
- [ ] Install API clients: `npm install axios`.
- [ ] Create `lib/transactionTracker.js` to monitor wallet addresses:
  - [ ] Ethereum: Etherscan or Alchemy API (ETH/ERC-20 transfers).
  - [ ] Solana: Solana Explorer or QuickNode API (SOL/SPL transfers).
- [ ] Convert amounts to USD using CoinGecko API (`GET /simple/price`).
- [ ] Store transactions in MongoDB: Sender handle, receiver handle, amount, token, chain, USD, timestamp.
- [ ] Handle API rate limits: Cache data in MongoDB, use retry logic.
- [ ] Test: Detect a tip on each chain, save to MongoDB.
- **Reference**: Business Plan - Tech Stack (APIs: Etherscan, Solana Explorer).

### 9. Build Recent Transactions Screen
- [x] Create `pages/recent.js` with RetroUI **Card** for transaction feed.
- [ ] Fetch transactions from `/api/transactions` (Node.js API).
- [x] Display in RetroUI **List**: "@Sender tipped @Receiver $X Token (Chain) • Time ago".
- [x] Add RetroUI **Select** filter: "All Chains," "Ethereum," "Solana".
- [x] Implement opt-out: Checkbox in Profile to hide from feed.
- [ ] Test: Show transactions, verify filter works.
- **Reference**: Business Plan - Core Features (Recent Transactions).

### 10. Implement Tips Sent Section
- [x] Update `pages/profile.js` to fetch user's sent transactions.
- [x] Display in RetroUI **Card**: "Tips Sent: $X.XX" (sum USD values).
- [x] Add expandable RetroUI **List**: Each tip (e.g., "$5 USDC to @CryptoGuru").
- [ ] Test: Send tip, verify "Tips Sent" updates.
- **Reference**: Business Plan - Core Features (Tips Sent).

## Week 4: Testing, Deployment, and Launch
### 11. End-to-End Testing
- [ ] Test X login: Verify follower data retrieval.
- [ ] Test tipping: Send test tips on both chains to a test creator.
- [ ] Test Recent Transactions: Ensure tips appear in feed within 1 minute.
- [ ] Test Tips Sent: Verify total updates after tipping.
- [ ] Debug and fix any errors.
- **Reference**: Business Plan - MVP Scope.

### 12. Deploy Application
- [ ] Deploy frontend: Vercel (`vercel --prod`).
- [ ] Deploy backend: AWS EC2 or Heroku (`heroku deploy`).
- [ ] Set up MongoDB Atlas for production database.
- [ ] Configure Cloudflare: CDN for UI, DDoS protection.
- [ ] Test production: Verify login, tipping, and transaction tracking work.
- **Reference**: Business Plan - Tech Stack (Storage, Security).

### 13. Launch Beta
- [ ] Invite 100 X users for beta (crypto creators, followers).
- [ ] Announce on X: "TipOnX Beta Live! Tip Your First Creator!" with #TipOnX.
- [ ] Monitor feedback: Discord channel for bug reports, feature requests.
- [ ] Fix critical bugs.
- **Reference**: Business Plan - Marketing Strategy (Launch Campaign).

## Post-Launch Tasks (Week 5+)
### 14. Marketing Campaign
- [ ] Partner with 10 X creators (10K+ followers) to share TipOnX links.
- [ ] Post Recent Transactions snippets on X.
- [ ] Run referral program: $0.50 USDC tip credit for inviting friends.
- **Reference**: Business Plan - Marketing Strategy.

### 15. Monetization Setup
- [ ] Implement premium features (custom UI, analytics, badges for $5 USDC).
- [ ] Create TipOnX donation link (tiponx.com/@TipOnX).
- [ ] Contact sponsors: MetaMask, Coinbase for banners.
- **Reference**: Business Plan - Monetization Strategy.

## Notes
- **Testing**: Use testnet (Ethereum Goerli/Sepolia, Solana Devnet) for initial tipping tests to save costs.
- **Budget**: Allocate $5,000 for servers, marketing, and legal; use free tiers (Vercel, MongoDB Atlas) initially.
- **Legal**: Consult a crypto-friendly lawyer post-MVP for LLC setup, compliance.

## Completion Checklist
- [ ] All Week 1-4 tasks completed.
- [ ] Beta launched with 100 users.
- [ ] 10 creator partnerships secured.
- [ ] $10,000 revenue target from premiums/sponsorships (Year 1 goal).

---
**Total Tasks**: 15 (13 for MVP, 2 post-launch)
**Timeline**: 4 weeks
**Goal**: Launch a simple, retro-styled tipping app that delights X's crypto community.