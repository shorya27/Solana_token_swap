import { create } from 'zustand';
import { TokenAccount } from '../types';
import { SAMPLE_TOKENS } from '../utils/tokens';
import { PublicKey } from '@solana/web3.js';

interface WalletState {
  connected: boolean;
  publicKey: PublicKey | null;
  tokenAccounts: TokenAccount[];
  isLoading: boolean;
  error: string | null;
  fetchTokenAccounts: () => void;
}

// Generate sample token accounts for demonstration
const generateSampleTokenAccounts = (): TokenAccount[] => {
  const dummyPublicKey = new PublicKey('11111111111111111111111111111111');
  
  return [
    {
      pubkey: new PublicKey('TokenAccount1111111111111111111111111'),
      mint: new PublicKey(SAMPLE_TOKENS[0].address),
      owner: dummyPublicKey,
      amount: 2.5 * 10 ** SAMPLE_TOKENS[0].decimals,
      token: SAMPLE_TOKENS[0], // SOL
    },
    {
      pubkey: new PublicKey('TokenAccount2222222222222222222222222'),
      mint: new PublicKey(SAMPLE_TOKENS[1].address),
      owner: dummyPublicKey,
      amount: 150 * 10 ** SAMPLE_TOKENS[1].decimals,
      token: SAMPLE_TOKENS[1], // USDC
    },
    {
      pubkey: new PublicKey('TokenAccount3333333333333333333333333'),
      mint: new PublicKey(SAMPLE_TOKENS[3].address),
      owner: dummyPublicKey,
      amount: 5000000 * 10 ** SAMPLE_TOKENS[3].decimals,
      token: SAMPLE_TOKENS[3], // BONK
    },
  ];
};

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  publicKey: null,
  tokenAccounts: [],
  isLoading: false,
  error: null,
  
  fetchTokenAccounts: () => {
    set({ isLoading: true, error: null });
    
    // Simulate API fetch
    setTimeout(() => {
      set({
        tokenAccounts: generateSampleTokenAccounts(),
        isLoading: false,
      });
    }, 800);
  },
}));