// src/components/OfferCard.tsx

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { takeOfferOnChain } from "../anchor/anchorClient";
import { OnChainOffer } from "../store/offersStore";
import { AddressLine } from "./AddressDisplay";
import { fetchTokenMetadata } from "../utils/tokenImage";

//
// ─── TOKEN METADATA UTILITY ─────────────────────────────────────────────────────
//

/**
 * Represents the fields we care about from the SPL Token Registry.
 */
interface TokenMetadata {
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
  decimals?: number;
}

//
// ─── OFFER CARD COMPONENT ────────────────────────────────────────────────────────
//

interface OfferCardProps {
  offer: OnChainOffer;
  onSuccess?: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onSuccess }) => {
  const anchorWallet = useAnchorWallet();
  const { connected } = useWallet();

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Token metadata states (for Token A and Token B)
  const [tokenAMetadata, setTokenAMetadata] = useState<TokenMetadata | null>(null);
  const [tokenBMetadata, setTokenBMetadata] = useState<TokenMetadata | null>(null);
  const [loadingTokenA, setLoadingTokenA] = useState(true);
  const [loadingTokenB, setLoadingTokenB] = useState(true);

  // "Copied" states for Maker, Mint A, and Mint B addresses
  const [copiedMaker, setCopiedMaker] = useState(false);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  // ─── Fetch metadata for both token mints on mount or when mints change ───
  useEffect(() => {
    const fetchBothTokens = async () => {
      setLoadingTokenA(true);
      setLoadingTokenB(true);

      try {
        const [metadataA, metadataB] = await Promise.all([
          fetchTokenMetadata(offer.tokenMintA),
          fetchTokenMetadata(offer.tokenMintB),
        ]);

        setTokenAMetadata(metadataA);
        setTokenBMetadata(metadataB);
      } catch (error) {
        console.error("Error fetching token metadata:", error);
      } finally {
        setLoadingTokenA(false);
        setLoadingTokenB(false);
      }
    };

    fetchBothTokens();
  }, [offer.tokenMintA, offer.tokenMintB]);

  // ─── Copy-to-clipboard helper ───────────────────────────────────────────────
  const copyToClipboard = async (
    text: string,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // ─── Handle accepting the offer on-chain ───────────────────────────────────
  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await takeOfferOnChain({
        anchorWallet,
        offerPDA: new PublicKey(offer.publicKey),
        maker: new PublicKey(offer.maker),
        tokenMintA: new PublicKey(offer.tokenMintA),
        tokenMintB: new PublicKey(offer.tokenMintB),
      });
      setAccepted(true);
      onSuccess?.();
    } catch (err: any) {
      console.error("Failed to accept offer:", err);
      setErrorMsg(err.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Subcomponent: TokenImage ───────────────────────────────────────────────
  // Renders either a loading spinner, the token image, or a fallback with a letter.
  const TokenImage: React.FC<{
    metadata: TokenMetadata | null;
    loading: boolean;
    fallbackLetter: string;
  }> = ({ metadata, loading, fallbackLetter }) => {
    const [imageError, setImageError] = useState(false);

    if (loading) {
      return (
        <div className="w-16 h-16 mb-2 bg-gray-700 rounded-full flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      );
    }

    if (metadata?.image && !imageError) {
      return (
        <div className="w-16 h-16 mb-2 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
          <img
            src={metadata.image}
            alt={metadata.name || "Token"}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div className="w-16 h-16 mb-2 bg-gray-700 rounded-full flex items-center justify-center">
        <span className="text-gray-400 text-xl font-semibold">
          {metadata?.symbol?.[0] || fallbackLetter}
        </span>
      </div>
    );
  };

  // ─── Helper: Normalize a raw amount by decimals ────────────────────────────
  // Returns a JS number = rawAmount / (10^decimals). If decimals undefined, uses 0.
  const normalizeAmount = (rawAmount: number, decimals?: number) => {
    const dec = decimals ?? 6;
    return rawAmount / Math.pow(10, dec);
  };

  // Compute the “human” amounts once metadata is loaded:
  const humanAmountA =
    tokenAMetadata && typeof offer.tokenAOfferedAmount === "number"
      ? normalizeAmount(offer.tokenAOfferedAmount, tokenAMetadata.decimals)
      : null;

  const humanAmountB =
    tokenBMetadata && typeof offer.tokenBWantedAmount === "number"
      ? normalizeAmount(offer.tokenBWantedAmount, tokenBMetadata.decimals)
      : null;

  return (
    <div className="w-96 mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-102 duration-200 flex flex-col">
      {/* ─────────────── Header ─────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex flex-col space-y-1">
        <h3 className="text-lg font-semibold text-white">Offer #{offer.id}</h3>

        {/* Maker Address: truncate front/back */}
        <AddressLine
          label="Maker"
          address={offer.maker}
          copied={copiedMaker}
          onCopy={() => copyToClipboard(offer.maker, setCopiedMaker)}
          startChars={9}
          endChars={9}
        />
      </div>

      {/* ─────────────── Content ─────────────── */}
      <div className="flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4 flex-1">
        {/* Left Column: Offered (Token A) */}
        <div className="flex-1 bg-gray-800 rounded-xl p-4 flex flex-col items-center text-center">
          <TokenImage
            metadata={tokenAMetadata}
            loading={loadingTokenA}
            fallbackLetter="A"
          />

          <h4 className="text-sm text-gray-400 uppercase mb-1">You Get</h4>

          {/* Display name or symbol once loaded */}
          {tokenAMetadata && (
            <p className="text-sm text-gray-300 mb-1">
              {tokenAMetadata.name || tokenAMetadata.symbol || "Unknown"}
            </p>
          )}

          <p className="text-2xl font-semibold text-white mb-2">
            {humanAmountA !== null
              ? humanAmountA.toLocaleString()
              : offer.tokenAOfferedAmount.toLocaleString()}
          </p>

          {/* Mint A Address: truncate */}
          <AddressLine
            label="Mint"
            address={offer.tokenMintA}
            copied={copiedA}
            onCopy={() => copyToClipboard(offer.tokenMintA, setCopiedA)}
            startChars={2}
            endChars={2}
          />
        </div>

        {/* Divider (vertical line on md+) */}
        <div className="hidden md:flex items-center">
          <div className="w-px h-full bg-gray-700"></div>
        </div>

        {/* Right Column: Wanted (Token B) */}
        <div className="flex-1 bg-gray-800 rounded-xl p-4 flex flex-col items-center text-center">
          <TokenImage
            metadata={tokenBMetadata}
            loading={loadingTokenB}
            fallbackLetter="B"
          />

          <h4 className="text-sm text-gray-400 uppercase mb-1">You Give</h4>

          {/* Display name or symbol once loaded */}
          {tokenBMetadata && (
            <p className="text-sm text-gray-300 mb-1">
              {tokenBMetadata.name || tokenBMetadata.symbol || "Unknown"}
            </p>
          )}

          <p className="text-2xl font-semibold text-white mb-2">
            {humanAmountB !== null
              ? humanAmountB.toLocaleString()
              : offer.tokenBWantedAmount.toLocaleString()}
          </p>

          {/* Mint B Address: truncate */}
          <AddressLine
            label="Mint"
            address={offer.tokenMintB}
            copied={copiedB}
            onCopy={() => copyToClipboard(offer.tokenMintB, setCopiedB)}
            startChars={2}
            endChars={2}
          />
        </div>
      </div>

      {/* ─────────────── Footer: Accept Button ─────────────── */}
      <div className="p-4 border-t border-gray-700">
        {accepted ? (
          <div className="flex items-center justify-center text-green-400">
            <CheckCircle2 size={20} className="mr-2" />
            <span className="font-medium">Offer Accepted</span>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="flex items-center text-red-400 mb-2">
                <XCircle size={20} className="mr-2" />
                <span className="text-xs">{errorMsg}</span>
              </div>
            )}
            <button
              onClick={handleAccept}
              disabled={!connected || isSubmitting}
              className={`w-full py-2 rounded-lg font-medium flex items-center justify-center transition-colors ${
                !connected
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                "Accept Offer"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OfferCard;
