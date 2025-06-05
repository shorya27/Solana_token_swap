import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import { readFileSync } from "fs";
import idl from "./target/idl/swap.json";

const programId = new PublicKey("JAsfN61Cak6sz6HpDDzJZyFYMUFHD29f8vvc7ReYRJiW");
const secret = JSON.parse(readFileSync("/home/shorya/.config/solana/id.json", "utf8"));
const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
const wallet = new anchor.Wallet(keypair);
const connection = new Connection(clusterApiUrl("devnet"));
const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
const program = new anchor.Program(idl as anchor.Idl, provider);

const [counterPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("counter")],
  programId
);

async function getCounter() {
  const counterAccount = await program.account.counter.fetch(counterPda);
  console.log("Counter value (direct fetch):", counterAccount.count.toString());
  return counterAccount.count;
}

async function incrementCounter() {
  await program.methods
    .incrementCounter()
    .accounts({
      counter: counterPda,
      authority: provider.wallet.publicKey,
    })
    .rpc({ commitment: "finalized" });
  console.log("✅ Counter incremented.");
}

(async () => {
  const before = await getCounter();
  await incrementCounter();
  const after = await getCounter();
  console.log(`Counter before: ${before}, after: ${after}`);
})();
