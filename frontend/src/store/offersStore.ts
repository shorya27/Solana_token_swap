// src/store/offersStore.ts
import create from "zustand";
import { fetchAllOffersOnChain } from "../anchor/anchorClient";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export interface OnChainOffer {
  publicKey:             string;
  id:                    number;
  maker:                 string;
  tokenMintA:            string;
  tokenMintB:            string;
  tokenAOfferedAmount:   number;  // ← new
  tokenBWantedAmount:    number;
  bump:                  number;
}

interface OffersState {
  offers: OnChainOffer[];
  isLoading: boolean;
  error: string | null;
  fetchOffers: (anchorWallet: AnchorWallet | null) => Promise<void>;
}

export const useOffersStore = create<OffersState>((set) => ({
  offers: [],
  isLoading: false,
  error: null,

  fetchOffers: async (anchorWallet) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAllOffersOnChain(anchorWallet);
      set({ offers: data, isLoading: false });
    } catch (err: any) {
      console.error("Failed to fetch on-chain offers:", err);
      set({ error: err.message, isLoading: false });
    }
  },
}));
