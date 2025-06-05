// src/components/CreateOfferForm.tsx

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { makeOfferOnChain } from "../anchor/anchorClient"; // your helper
import { BN } from "@coral-xyz/anchor";

export default function CreateOfferForm() {
  // 1) Wallet hooks
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();

  // 2) Form state for “You Offer”
  const [offerMintAddress, setOfferMintAddress] = useState<string>("");
  const [offerAmount, setOfferAmount] = useState<string>(""); // e.g. "1.23"

  // 3) Form state for “You Receive”
  const [receiveMintAddress, setReceiveMintAddress] = useState<string>("");
  const [receiveAmount, setReceiveAmount] = useState<string>(""); // e.g. "50.0"

  // 4) UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 5) Validate that a string is a valid PublicKey
  const parsePublicKey = (addr: string): PublicKey | null => {
    try {
      return new PublicKey(addr);
    } catch {
      return null;
    }
  };

  // 6) Handler: swap everything between Offer ↔ Receive
  const swapAll = () => {
    setOfferMintAddress(receiveMintAddress);
    setOfferAmount(receiveAmount);

    setReceiveMintAddress(offerMintAddress);
    setReceiveAmount(offerAmount);
  };

  // 7) Main submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // 7a) Ensure wallet is connected
    if (!connected || !publicKey || !anchorWallet) {
      setErrorMessage("Please connect your wallet before creating an offer.");
      return;
    }

    // 7b) Parse & validate Offer mint address
    if (!offerMintAddress) {
      setErrorMessage("Please enter the Offer token mint address.");
      return;
    }
    const offerMintPubkey = parsePublicKey(offerMintAddress);
    if (!offerMintPubkey) {
      setErrorMessage("Invalid Offer mint address (must be base58).");
      return;
    }

    // 7c) Parse & validate Offer amount
    if (!offerAmount) {
      setErrorMessage("Please enter the Offer amount.");
      return;
    }
    const parsedOfferFloat = parseFloat(offerAmount);
    if (isNaN(parsedOfferFloat)) {
      setErrorMessage("Offer amount must be a valid number.");
      return;
    }
    // Convert to on‐chain units (u64), assuming 6 decimals
    const DECIMALS = 6;
    const offeredAmountU64 = BigInt(
      Math.floor(parsedOfferFloat * 10 ** DECIMALS)
    );

    // 7d) Parse & validate Receive mint address
    if (!receiveMintAddress) {
      setErrorMessage("Please enter the Receive token mint address.");
      return;
    }
    const receiveMintPubkey = parsePublicKey(receiveMintAddress);
    if (!receiveMintPubkey) {
      setErrorMessage("Invalid Receive mint address (must be base58).");
      return;
    }

    // 7e) Parse & validate Receive amount
    if (!receiveAmount) {
      setErrorMessage("Please enter the Receive amount.");
      return;
    }
    const parsedReceiveFloat = parseFloat(receiveAmount);
    if (isNaN(parsedReceiveFloat)) {
      setErrorMessage("Receive amount must be a valid number.");
      return;
    }
    // Convert to on‐chain units (u64), also assuming 6 decimals
    const wantedAmountU64 = BigInt(
      Math.floor(parsedReceiveFloat * 10 ** DECIMALS)
    );

    // 7f) Generate a unique ID (u64). We’ll use the current timestamp.
    const uniqueId = new BN(Date.now());

    setIsSubmitting(true);
    try {
      // 7g) Call makeOfferOnChain with all parameters
      const newOfferPDA = await makeOfferOnChain({
        anchorWallet,
        id: uniqueId,
        tokenMintA: offerMintPubkey,
        tokenMintB: receiveMintPubkey,
        offeredAmount: offeredAmountU64,
        wantedAmount: wantedAmountU64,
      });

      console.log("✅ On‐chain Offer created at PDA:", newOfferPDA.toString());

      // 7h) Clear the form fields
      setOfferMintAddress("");
      setOfferAmount("");
      setReceiveMintAddress("");
      setReceiveAmount("");
      setErrorMessage("");
    } catch (err: any) {
      console.error("❌ makeOfferOnChain error:", err);
      setErrorMessage(
        err.message || "Failed to create on‐chain offer. See console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Create Swap Offer
          </h2>

          {/* “You Offer” Section */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-300">
              You Offer (Token A)
            </label>
            <input
              type="text"
              placeholder="Token Mint Address (base58)"
              value={offerMintAddress}
              onChange={(e) => setOfferMintAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 mb-2"
            />
            <input
              type="text"
              placeholder="Amount (e.g. 1.23)"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
            />
            
          </div>

          {/* Swap Arrow Button */}
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={swapAll}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors"
            >
              <RefreshCw size={18} className="text-white transform rotate-90" />
            </button>
          </div>

          {/* “You Receive” Section */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-300">
              You Receive (Token B)
            </label>
            <input
              type="text"
              placeholder="Token Mint Address (base58)"
              value={receiveMintAddress}
              onChange={(e) => setReceiveMintAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 mb-2"
            />
            <input
              type="text"
              placeholder="Amount (e.g. 50.0)"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
            />
           
          </div>

          {/* Error Message (if any) */}
          {errorMessage && (
            <p className="text-red-500 mb-4">{errorMessage}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              !connected ||
              isSubmitting ||
              !offerMintAddress ||
              !offerAmount ||
              !receiveMintAddress ||
              !receiveAmount
            }
            className={`w-full py-3 rounded-lg text-lg font-medium transition-colors ${
              connected
                ? "bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <RefreshCw size={18} className="animate-spin mr-2" />
                Creating On‐Chain Offer…
              </span>
            ) : !connected ? (
              "Connect Wallet to Create Offer"
            ) : (
              "Create On‐Chain Offer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
