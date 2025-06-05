// /api/create-offer.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  Program,
  AnchorProvider,
  BN,
} from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Paste your IDL JSON or import it if you check it into a shared path
import IDL from "../src/anchor/idl/swap.json"; 
// └─ Make sure the relative path is correct; often you copy your IDL JSON into `src/anchor/idl/`
//    or reference it by copying to `api/idl/swap.json`.

const PROGRAM_ID = new PublicKey((IDL as any).address);
const CLUSTER_URL = "https://api.devnet.solana.com";
const COMMITMENT = { preflightCommitment: "processed" as const };

function getProgram(anchorWallet: any /* we only run on server, so we’ll pass in the raw Keypair or connection */) {
  if (!anchorWallet) return null;
  const connection = new Connection(CLUSTER_URL, COMMITMENT.preflightCommitment);
  const provider = new AnchorProvider(connection, anchorWallet, CLUSTER_URL);
  return new Program(IDL as any, PROGRAM_ID, provider);
}

/**
 * Helper: derive a Keypair (or other “wallet”) from a private key stored in ENV.
 * For security, store your Anchor wallet’s secret key as a base64 or array in Vercel Env.
 * Example: `V AnchorWalletSecret = "..."`
 */
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
function getAnchorWalletFromEnv() {
  const secret = process.env.ANCHOR_WALLET_SECRET;
  if (!secret) return null;
  const decoded = bs58.decode(secret);
  return Keypair.fromSecretKey(decoded);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  try {
    const {
      id,
      tokenMintA,
      tokenMintB,
      offeredAmount,
      wantedAmount,
      makerPublicKey, // the user’s wallet public key (base58 string)
    } = req.body as {
      id: number;
      tokenMintA: string;
      tokenMintB: string;
      offeredAmount: string; // we’ll parse to BN
      wantedAmount: string;
      makerPublicKey: string;
    };

    // 1) Reconstruct Anchor Wallet (Keypair) from ENV
    const anchorWallet = getAnchorWalletFromEnv();
    if (!anchorWallet) {
      throw new Error("Server wallet (ANCHOR_WALLET_SECRET) is not set");
    }

    // 2) Build Program instance
    const program = getProgram(anchorWallet);
    if (!program) {
      throw new Error("Failed to build Anchor Program");
    }

    // 3) Reconstruct all Pubkeys/BNs
    const makerPubkey = new PublicKey(makerPublicKey);
    const idBN = new BN(id);
    const idBuffer = idBN.toArray("le", 8);

    const tokenMintAPubkey = new PublicKey(tokenMintA);
    const tokenMintBPubkey = new PublicKey(tokenMintB);

    const offeredAmountBN = new BN(offeredAmount, 10);
    const wantedAmountBN = new BN(wantedAmount, 10);

    // 4) Derive the PDA
    const [offerPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("offer"), makerPubkey.toBuffer(), Buffer.from(idBuffer)],
      PROGRAM_ID
    );

    // 5) Derive ATAs
    const makerTokenAccountA = await getAssociatedTokenAddress(
      tokenMintAPubkey,
      makerPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const vaultATA = await getAssociatedTokenAddress(
      tokenMintAPubkey,
      offerPDA,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // 6) RPC call
    await program.methods
      .makeOffer(idBN, offeredAmountBN, wantedAmountBN)
      .accounts({
        maker: makerPubkey,
        tokenMintA: tokenMintAPubkey,
        tokenMintB: tokenMintBPubkey,
        makerTokenAccountA: makerTokenAccountA,
        offer: offerPDA,
        vault: vaultATA,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    res.status(200).json({ pda: offerPDA.toBase58() });
  } catch (err: any) {
    console.error("API create-offer error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
