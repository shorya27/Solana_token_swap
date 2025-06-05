// anchorClient.ts
import {
  Program,
  AnchorProvider,
  BN,
  Idl,
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
import { AnchorWallet } from "@solana/wallet-adapter-react";
import IDL  from "/home/shorya/blockchain/solana/swap/target/idl/swap.json";

export const PROGRAM_ID = new PublicKey(IDL.address);
export const CLUSTER_URL = "https://api.devnet.solana.com";
export const COMMITMENT: AnchorProvider["opts"] = {
  preflightCommitment: "processed",
};

export function getProgram(anchorWallet: AnchorWallet | null): Program<Idl> | null {
  if (!anchorWallet) return null;
  const connection = new Connection(CLUSTER_URL, COMMITMENT.preflightCommitment);
  const provider = new AnchorProvider(connection, anchorWallet, COMMITMENT);
  return new Program(IDL as Idl,  provider);
}

/**
 * Robustly fetch all Offer accounts on-chain.
 * - Fetch via getProgramAccounts filtered by the known size of Offer
 * - Attempt to decode each account; skip any that throw.
 */
export async function fetchAllOffersOnChain(anchorWallet: AnchorWallet | null) {
  const program = getProgram(anchorWallet);
  if (!program) return [];

  // 1) Compute the expected size of the Offer account from the IDL
  //    (Anchor prepends an 8-byte discriminator to every account)
  const offerSize = program.account.offer.size; // includes discriminator

  // 2) Fetch all accounts owned by this program where data length == offerSize
  const connection = program.provider.connection;
  const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ dataSize: offerSize }],
  });

  const offers: {
    publicKey: string;
    id: number;
    maker: string;
    tokenMintA: string;
    tokenMintB: string;
    tokenAOfferedAmount: number;
    tokenBWantedAmount: number;
    bump: number;
  }[] = [];

  // 3) Iterate and decode each one, skipping failures
  for (const { pubkey, account } of rawAccounts) {
    try {
      // `decode` returns the parsed struct (fields as BN or PublicKey)
      const decoded = program.coder.accounts.decode<{
        id: BN;
        maker: PublicKey;
        tokenMintA: PublicKey;
        tokenMintB: PublicKey;
        tokenAOfferedAmount: BN;
        tokenBWantedAmount: BN;
        bump: number;
      }>("offer", account.data);

      offers.push({
        publicKey: pubkey.toBase58(),
        id: decoded.id.toNumber(),
        maker: decoded.maker.toBase58(),
        tokenMintA: decoded.tokenMintA.toBase58(),
        tokenMintB: decoded.tokenMintB.toBase58(),
        tokenAOfferedAmount: decoded.tokenAOfferedAmount.toNumber(),
        tokenBWantedAmount: decoded.tokenBWantedAmount.toNumber(),
        bump: decoded.bump,
      });
    } catch (e) {
      console.warn("Skipping invalid Offer account:", pubkey.toBase58());
    }
  }
  console.log(offers);
  return offers;
}
export async function makeOfferOnChain(params: {
  anchorWallet: AnchorWallet | null;
  id: number | BN;
  tokenMintA: PublicKey;
  tokenMintB: PublicKey;
  offeredAmount: bigint | BN;
  wantedAmount: bigint | BN;
}): Promise<PublicKey> {
  const { anchorWallet, id, tokenMintA, tokenMintB, offeredAmount, wantedAmount } = params;
  const program = getProgram(anchorWallet);
  if (!program) throw new Error("Anchor provider not available (wallet not connected)");

  const makerPubkey = anchorWallet!.publicKey;
  const idBN = typeof id === "number" ? new BN(id) : id;
  const idBuffer = idBN.toArray("le", 8);
  const [offerPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("offer"), makerPubkey.toBuffer(), Buffer.from(idBuffer)],
    PROGRAM_ID
  );

  const makerTokenAccountA = await getAssociatedTokenAddress(
    tokenMintA,
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const vaultATA = await getAssociatedTokenAddress(
    tokenMintA,
    offerPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const offeredAmountBN =
    offeredAmount instanceof BN ? offeredAmount : new BN(offeredAmount.toString(), 10);
  const wantedAmountBN =
    wantedAmount instanceof BN ? wantedAmount : new BN(wantedAmount.toString(), 10);

  await program.methods
    .makeOffer(idBN, offeredAmountBN, wantedAmountBN)
    .accounts({
      maker: makerPubkey,
      tokenMintA,
      tokenMintB,
      makerTokenAccountA,
      offer: offerPDA,
      vault: vaultATA,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc();

  return offerPDA;
}

/**
 * Accept (take) an on-chain offer by calling `take_offer` instruction.
 * We unconditionally include ATA‐creation preInstructions, trusting `init_if_needed` on-chain.
 */
export async function takeOfferOnChain(params: {
  anchorWallet: AnchorWallet | null;
  offerPDA: PublicKey;
  maker: PublicKey;
  tokenMintA: PublicKey;
  tokenMintB: PublicKey;
}): Promise<void> {
  const { anchorWallet, offerPDA, maker, tokenMintA, tokenMintB } = params;
  const program = getProgram(anchorWallet);
  if (!program) throw new Error("Anchor provider not available (wallet not connected)");

  // 1) Derive all relevant public keys
  const takerPubkey = anchorWallet!.publicKey;

  // a) Vault ATA (owned by the offer PDA) for token A
  const vaultATA = await getAssociatedTokenAddress(
    tokenMintA,
    offerPDA,
    true, // allow the PDA as owner
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // b) Maker’s ATA for token B (creator’s account MUST exist before takeOffer)
  const makerTokenAccountB = await getAssociatedTokenAddress(
    tokenMintB,
    maker,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // c) Taker’s ATA for token A (we may need to create this if missing)
  const takerTokenAccountA = await getAssociatedTokenAddress(
    tokenMintA,
    takerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // d) Taker’s ATA for token B (so taker can receive token B)
  const takerTokenAccountB = await getAssociatedTokenAddress(
    tokenMintB,
    takerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // 2) Build a list of preInstructions to create missing ATAs for the taker
  const preInstructions: any[] = [];

  // Check if takerTokenAccountA already exists on‐chain
  const connection = (program.provider as AnchorProvider).connection;
  const takerATAInfo = await connection.getAccountInfo(takerTokenAccountA);
  if (!takerATAInfo) {
    // If it doesn't exist, create it
    preInstructions.push(
      createAssociatedTokenAccountInstruction(
        takerPubkey,         // payer = taker
        takerTokenAccountA,  // new ATA address for token A
        takerPubkey,         // owner = taker
        tokenMintA,          // mint = tokenMintA
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // We assume the maker already has their token B ATA. If not, the transaction will fail.
  // Do NOT attempt to create the maker’s ATA here, because the taker cannot create an ATA for the maker.

  // 3) Invoke the Anchor RPC for `takeOffer`
  await program.methods
    .takeOffer()
    .accounts({
      taker: takerPubkey,              // signer who is accepting the offer
      maker,                           // maker = the original creator of the offer
      tokenMintA,                      // mint for token A (the “offered” token)
      tokenMintB,                      // mint for token B (the “wanted” token)
      takerTokenAccountA,              // ATA of taker for token A (to pay the vault)
      takerTokenAccountB,              // ATA of taker for token B (so they can receive B)
      makerTokenAccountB,              // ATA of maker for token B (to receive B)
      offer: offerPDA,                 // the PDA holding the offer data
      vault: vaultATA,                 // ATA owned by the offer PDA (holds token A)
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .rpc();
}