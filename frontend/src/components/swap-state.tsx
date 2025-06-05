// import { useState } from "react";
// import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
// import { useSolanaProgram } from "../anchor/setup"; // Your custom hook providing program and PDA
// import * as anchor from "@coral-xyz/anchor";
// import { PublicKey } from "@solana/web3.js";

// export default function SwapState() {
//   const { program, swapPDA } = useSolanaProgram();
//   const wallet = useAnchorWallet();
//   const { connection } = useConnection();

//   const [swapValue, setSwapValue] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   // Fetch current swap value
//   const fetchSwapFromLogs = async () => {
//     if (!program || !swapPDA) return;
//     setLoading(true);
//     try {
//       const swapAccount = await program.account.swap.fetch(swapPDA);
//       console.log("Swap value (direct fetch):", swapAccount.count.toString());
//       setSwapValue(swapAccount.count.toString());
//     } catch (err) {
//       setSwapValue("Error");
//       console.error("Failed to fetch swap:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Increment swap
//   const incrementSwap = async () => {
//     if (!program || !swapPDA || !wallet) {
//       console.error("Missing program, PDA, or wallet");
//       return;
//     }
//     setLoading(true);
//     try {
//       // Send the transaction using existing program & wallet
//       await program.methods
//         .incrementSwap()
//         .accounts({
//           swap: swapPDA,
//           user: wallet.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .rpc();


//       console.log("✅ Swap incremented.");

//       // Optionally fetch updated swap right after increment
//       await fetchSwapFromLogs();
//     } catch (err) {
//       console.error("Failed to increment swap:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <button
//         className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
//         onClick={fetchSwapFromLogs}
//         disabled={loading}
//       >
//         {loading ? "Fetching..." : "Fetch Value"}
//       </button>
//       <button
//         className="px-4 py-2 bg-green-600 text-white rounded"
//         onClick={incrementSwap}
//         disabled={loading}
//       >
//         {loading ? "Incrementing..." : "Increment"}
//       </button>
//       <p className="text-lg mt-4">
//         {swapValue !== null ? `Count: ${swapValue}` : "Click to fetch swap value"}
//       </p>
//     </div>
//   );
// }
