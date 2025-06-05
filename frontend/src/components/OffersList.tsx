// OffersList.tsx
import React, { useEffect, useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import OfferCard from "./OfferCard";
import { useOffersStore, OnChainOffer } from "../store/offersStore";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

// ─────────────────────────────────────────────────────────────────────────────
const OffersList: React.FC = () => {
  // 1) Anchor wallet hook (to pass into fetchOffers)
  const anchorWallet = useAnchorWallet();

  // 2) Zustand store
  const offers = useOffersStore((state) => state.offers);
  const isLoading = useOffersStore((state) => state.isLoading);
  const fetchOffers = useOffersStore((state) => state.fetchOffers);

  // Filters & search state
  const [searchQuery, setSearchQuery] = useState("");

  // 3) On mount, load all on-chain offers
  useEffect(() => {
    fetchOffers(anchorWallet);
  }, [fetchOffers, anchorWallet]);

  // 4) Derive filteredOffers from offers + filters/search
  const filteredOffers = offers.filter((offer) => {
    // Determine status: “active” if tokenBWantedAmount > 0, else “filled”
    let status: "active" | "filled" = offer.tokenBWantedAmount > 0 ? "active" : "filled";


    // 4c) Filter by “search query” which might match id, maker pubkey, or mints
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      if (
        !offer.id.toString().includes(lowerQuery) &&
        !offer.maker.toLowerCase().includes(lowerQuery) &&
        !offer.tokenMintA.toLowerCase().includes(lowerQuery) &&
        !offer.tokenMintB.toLowerCase().includes(lowerQuery)
      ) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="w-full">
      {/* ─── Header & Search / Filter UI ───────────────────────────────────────── */}


      {/* Search Box */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Offer ID, maker, or mint..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
        />
      </div>
      <br></br>




      {/* ─── Main Content ────────────────────────────────────────────────────────── */}
      {
        isLoading ? (
          <div className="grid grid-cols-1 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-xl h-48"></div>
            ))}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => (
              // Pass the on-chain offer into your OfferCard
              <OfferCard key={offer.publicKey} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
            <Filter size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-300">No offers found</p>
            
          </div>
        )
      }
    </div >
  );
};

export default OffersList;
