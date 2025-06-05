# Solana Swap DApp

A full‐stack decentralized application (DApp) for creating and taking token swap offers on Solana. This repository contains:

1. **Anchor program** (Rust) that manages on‐chain “Offer” accounts and token vaults.
2. **Node.js server** (Express) that uses UMI to fetch on‐chain token metadata (e.g., images) and exposes a simple HTTP API.
3. **React frontend** that lets users connect their wallets, create swap offers, view available offers, and accept them—displaying token images fetched from the server.

---

## Table of Contents

* [Project Overview](#project-overview)
* [Features](#features)
* [Architecture](#architecture)
* [Prerequisites](#prerequisites)
* [Directory Structure](#directory-structure)
* [Setup & Installation](#setup--installation)

  * [1. Anchor Program](#1-anchor-program)
  * [2. Node.js Metadata Server](#2-nodejs-metadata-server)
  * [3. React Frontend](#3-react-frontend)
* [Configuration & Environment Variables](#configuration--environment-variables)
* [Usage](#usage)

  * [Deploying the Anchor Program](#deploying-the-anchor-program)
  * [Starting the Metadata Server](#starting-the-metadata-server)
  * [Running the React App](#running-the-react-app)
* [Troubleshooting](#troubleshooting)
* [Security Notes](#security-notes)
* [License](#license)

---

## Project Overview

This DApp enables peer‐to‐peer swaps of arbitrary SPL tokens on the Solana blockchain. A “maker” can deposit a specified amount of Token A into a Program‐Derived Address (PDA) vault, along with metadata about how much Token B they want in return. A “taker” can then view all active offers, send the desired tokens to the maker, and trigger the program to send the vaulted Token A to the taker.

Key parts:

* **Anchor program (Rust)**

  * Defines `MakeOffer` and `TakeOffer` instructions.
  * Uses PDAs and associated token accounts (ATAs) to manage vaults.
  * Stores each `Offer` with fields:

    ```rust
    pub struct Offer {
      pub id: u64,
      pub maker: Pubkey,
      pub token_mint_a: Pubkey,
      pub token_mint_b: Pubkey,
      pub token_b_wanted_amount: u64,
      pub bump: u8,
    }
    ```
* **Metadata Server (Node.js + Express)**

  * Uses UMI + MPL‐Token‐Metadata plugin to fetch on‐chain metadata for any mint.
  * Provides endpoint:

    ```
    GET /metadata/:mint
    ```

    → returns JSON `{ image: "<off‐chain image URL>" }`.
* **React Frontend**

  * Wrapped in `ConnectionProvider` → `WalletProvider` → `WalletModalProvider` from `@solana/wallet-adapter-react`.
  * “CreateOfferForm” component to build an on‐chain `makeOffer` transaction (passes in custom mint addresses, decimals, and amounts).
  * “OffersList” component (with `OfferCard` children) that fetches all on‐chain offers, displays token images (via Node API), and allows a taker to “Accept Offer”.

---

## Features

* **Create On‐Chain Swap Offers**

  * Specify any valid SPL token mint A, deposit an arbitrary amount, and set a desired amount of SPL token B in return.
  * Uses Anchor’s `Init` and `AssociatedToken` CPIs to create PDAs and ATAs automatically.
* **View & Filter Offers**

  * Frontend fetches all `Offer` accounts stored on‐chain and displays:

    * Maker address (truncated, copy‐to‐clipboard).
    * Token A & B mint addresses (with on‐chain images).
    * Offered amounts and wanted amounts.
  * Filter by token or search by ID/maker/mint.
* **Accept Offers**

  * Taker can connect wallet, ensure they have the required token balances, and invoke Anchor’s `takeOffer` instruction.
  * Program moves Token B from taker to maker and Token A from PDA vault to taker atomically.
* **Token Metadata & Images**

  * A separate Node.js server uses UMI + MPL‐Token‐Metadata to fetch off‐chain JSON (Arweave/IPFS), returning `image` URLs.
  * Frontend queries `http://localhost:5000/metadata/<mint>` to display token artwork.

---

## Architecture

```
+----------------------+        +----------------------+        +----------------------+
|                      |  RPC   |                      |  HTTP  |                      |
|  React Frontend      | <----> |  Solana Cluster      | <----> |  Node Metadata       |
|  (Wallet Connect,    |        |  (Devnet/Mainnet)    |        |  Server (Express)    |
|   Anchor RPCs, UI)   |        |                      |        |                      |
+----------------------+        +----------------------+        +----------------------+
        |                                                                  ^
        |                                                                  |
        v                                                                  |
  Local Anchor Devnet (or Mainnet)                                         |
  (Rust Program)                                                           |
                                                                            |
  +----------------------+                                                  |
  |                      |                                                  |
  |  Anchor Program      |--------------------------------------------------+
  |  (Rust)              |
  |                      |
  +----------------------+
```

* **Solana Cluster**

  * For development: Localnet or Devnet.
  * For production: Mainnet‐Beta.
* **Anchor Program**

  * Deployed via `anchor build && anchor deploy`.
  * Stores `Offer` accounts, vault ATAs, and handles CPIs to Token Program.
* **Metadata Server**

  * Written in Node.js + Express.
  * Uses UMI to decode on‐chain metadata PDA, fetch JSON from `metadata.uri`, and return the `image` field.
  * CORS‐enabled to allow calls from React app.
* **React App**

  * Uses `@solana/wallet-adapter-react` for wallet connection (Phantom, etc.).
  * Calls custom Node API to display token artwork.
  * Interacts with Anchor program via `@coral-xyz/anchor` client.

---

## Prerequisites

1. **Rust & Anchor**

   * Install Rust (1.65+).
   * Install Anchor CLI:

     ```bash
     cargo install --git https://github.com/coral-xyz/anchor avm --locked
     avm installing latest
     avm use latest
     ```
   * Confirm:

     ```bash
     anchor --version
     ```
2. **Node.js** (v16+ recommended)
3. **Yarn** (optional) or `npm`
4. **Solana CLI** (if using localnet):

   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.14.22/install)"
   solana --version
   ```

---

## Directory Structure

```
.
├── AnchorProgram/             ← Anchor (Rust) smart contract
│   ├── programs/              ← On‐chain program code
│   │   └── swap/
│   │       ├── src/
│   │       │   ├── instructions/
│   │       │   │   ├── make_offer.rs
│   │       │   │   └── take_offer.rs
│   │       │   ├── state/
│   │       │   │   └── offer.rs
│   │       │   ├── lib.rs
│   │       │   └── error.rs
│   │       └── Cargo.toml
│   ├── Anchor.toml
│   └── Cargo.lock
│
├── server/                     ← Node.js metadata‐fetching server
│   ├── server.js              ← Express app with `/metadata/:mint` endpoint
│   ├── package.json
│   └── package-lock.json
│
├── client/                     ← React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── anchorClient.ts     ← Anchor RPC helpers (makeOffer, takeOffer)
│   │   ├── components/
│   │   │   ├── CreateOfferForm.tsx
│   │   │   ├── OffersList.tsx
│   │   │   ├── OfferCard.tsx
│   │   │   └── AddressDisplay.tsx
│   │   ├── hooks/
│   │   │   └── useMetaplexTokenImage.ts
│   │   ├── store/
│   │   │   └── offersStore.ts   ← Zustand store for offers
│   │   ├── utils/
│   │   │   ├── truncateAddress.ts
│   │   │   └── tokens.ts        ← Sample token list (optional)
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                   ← ← ← You are here
```

---

## Setup & Installation

Below are step‐by‐step instructions to get each piece running locally. You can follow all of them in one terminal or split them across multiple.

### 1. Anchor Program

1. **Navigate to the AnchorProgram folder:**

   ```bash
   cd AnchorProgram
   ```

2. **Configure Anchor.toml**

   * Ensure `provider.cluster` is set to your desired network. For local development, you might use:

     ```toml
     [provider]
     cluster = "localnet"
     ```
   * If you plan to deploy to Devnet or Mainnet, set accordingly:

     ```toml
     cluster = "devnet"
     wallet = "~/.config/solana/id.json"
     ```

3. **Build the program:**

   ```bash
   anchor build
   ```

4. **Start a local validator (if using localnet):**

   ```bash
   solana-test-validator
   ```

   In another terminal, run:

   ```bash
   solana airdrop 10 $(solana-keygen pubkey)
   ```

5. **Deploy the program:**

   ```bash
   anchor deploy
   ```

   * This will output the program ID. Copy that into your `anchorClient.ts` or wherever you keep your IDL/client config.
   * Confirm the `Offer` account `InitSpace` matches the Rust layout.

---

### 2. Node.js Metadata Server

1. **Navigate to the `server/` folder:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install express cors node-fetch @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults \
     @metaplex-foundation/mpl-token-metadata @metaplex-foundation/js
   ```

3. **Run the server:**

   ```bash
   node server.js
   ```

   * By default, it listens on port **5000**.
   * Endpoint: `GET http://localhost:5000/metadata/<MINT_ADDRESS>`.
   * Returns JSON:

     ```json
     { "image": "https://arweave.net/..." }
     ```
   * If the metadata lacks an `image` field, it fetches the JSON via `metadata.uri` and returns `json.image`.

---

### 3. React Frontend

1. **Navigate to the `client/` folder:**

   ```bash
   cd client
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   Or with Yarn:

   ```bash
   yarn
   ```

3. **Configure `src/anchorClient.ts`**

   * Locate the constant where `const PROGRAM_ID = new PublicKey("...");` appears.
   * Replace with the Program ID from your Anchor deploy.
   * Ensure `CLUSTER_URL` matches your target network (Devnet / localnet / Mainnet).

4. **Tailwind CSS**

   * Your `tailwind.config.js` is already set up. Just ensure you run:

     ```bash
     npm run build:css
     ```

     (if you have a build script), or that `postcss` is configured correctly in your React setup.

5. **Start the React dev server:**

   ```bash
   npm run start
   ```

   or

   ```bash
   yarn start
   ```

   * By default, the app runs at `http://localhost:3000`.
   * It will attempt to talk to the Node server on port 5000 and to the Anchor program on whatever cluster you configured.

---

## Configuration & Environment Variables

* **Anchor Program ID**

  * In `client/src/anchorClient.ts`, set:

    ```ts
    export const PROGRAM_ID = new PublicKey("<YOUR_ANCHOR_PROGRAM_ID>");
    ```
* **Solana Cluster**

  * In `anchorClient.ts`:

    ```ts
    export const CLUSTER_URL = "https://api.devnet.solana.com";
    // or "http://localhost:8899" for localnet
    ```
* **Metadata Server URL**

  * In `OfferCard.tsx`, calls:

    ```ts
    fetch(`http://localhost:5000/metadata/${mintAddress}`)
    ```
  * If you deploy the server elsewhere, update that URL accordingly.
* **Wallet Adapter**

  * The React app uses `@solana/wallet-adapter-react`. No extra secrets needed. Users connect via Phantom / Solflare / Sollet in the browser.

---

## Usage

### Deploying the Anchor Program

1. Build & deploy as described in [Anchor Program](#1-anchor-program).
2. Note down the Program ID (in `Anchor.toml` and `client/src/anchorClient.ts`).
3. Create a few token mints or use existing SPL tokens on Devnet.
4. Pre‐mint or airdrop tokens into your test wallet accounts.

### Starting the Metadata Server

1. Run `node server.js` inside `/server`.
2. Verify it works:

   ```bash
   curl http://localhost:5000/metadata/So11111111111111111111111111111111111111112
   ```

   → should return JSON with `"image": "<URL>"` for the wrapped SOL token’s metadata (if available).

### Running the React App

1. In `/client`, run `npm run start` (or `yarn start`).

2. The homepage shows “Create Swap Offer” form:

   * Paste or select a token mint A, set decimals and amount.
   * Paste or select mint B, set decimals and amount.
   * Click **“Create On‐Chain Offer”** → signs and sends `makeOffer` to your Anchor program.

3. Go to **“Available Offers”** page (or component). It automatically fetches all on‐chain Offers using Anchor’s `program.account.offer.all()` RPC call.

   * For each offer, it displays:

     * Maker address (truncated “0x…” with copy‐to‐clipboard).
     * Token A & B images (via metadata server).
     * Amounts (offered and wanted).
     * “Accept Offer” button:

       * Clicking it signs the `takeOffer` transaction, which:

         1. Creates taker’s ATA for token A if missing.
         2. Transfers Token A from PDA vault to taker.
         3. Transfers Token B from taker to maker.
         4. Closes the vault (if appropriate).
   * On success, the card shows “Offer Accepted” in green.

---

## Troubleshooting

* **“Provided owner is not allowed”** error

  * Means you attempted to create another user’s ATA from the taker’s wallet.
  * Fix: Only create the taker’s own ATA (as shown in the final `takeOfferOnChain` above). The maker must have created their ATA when listing.

* **“readable‐stream” errors in browser**

  * Caused by trying to use UMI directly in the React app.
  * Fix: Move UMI code server‐side (as shown) and call it via Express. Use `@metaplex-foundation/js` on the front end if you need purely client‐side metadata, but the Node server approach avoids bundler issues.

* **Anchor “account not found” or PDA mismatch**

  * Ensure the `offerPDA` in your client matches exactly how you derived it in Rust (same seeds + bump).
  * Double‐check you passed the same `id.to_le_bytes()` and “`offer`” seed to `findProgramAddress` both in Rust and TypeScript.

* **CORS issues**

  * If your React app runs on `http://localhost:3000` and your Node server on `http://localhost:5000`, ensure you called `app.use(cors())` in `server.js` so that the browser can fetch without CORS errors.

---

## Security Notes

* **Never store private keys in the frontend.** Only the user’s wallet (Phantom et al.) holds its own keypair.
* **Node Server UMI keypair** is only a dummy “read‐only” keypair used for metadata fetching; it does not hold funds.
* **Always validate user inputs** on amounts and mint addresses. Garbage or malicious inputs (e.g., invalid base58) can break downstream instructions.

---

## License

This project is open source, licensed under the [MIT License](LICENSE). Feel free to fork, enhance, and adapt as needed.

---

### Acknowledgments

* [Anchor](https://github.com/coral-xyz/anchor) for making on‐chain development on Solana far more ergonomic.
* [UMI + MPL‐Token‐Metadata](https://github.com/metaplex-foundation/metaplex-program-library) for seamless token metadata fetching.
* The Solana and Metaplex communities for extensive documentation and examples.

Happy building—and happy swapping on Solana!
