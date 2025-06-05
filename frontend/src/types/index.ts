import { PublicKey } from '@solana/web3.js';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  decimals: number;
}

export interface TokenAmount {
  token: TokenInfo;
  amount: number;
}

export interface SwapOffer {
  id: string;
  creator: PublicKey;
  offerToken: TokenAmount;
  receiveToken: TokenAmount;
  status: 'active' | 'filled' | 'cancelled';
  createdAt: number;
}

export interface WalletContextState {
  wallet: any | null;
  publicKey: PublicKey | null;
  connecting: boolean;
  connected: boolean;
  disconnecting: boolean;
  select: (walletName: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface TokenAccount {
  pubkey: PublicKey;
  mint: PublicKey;
  owner: PublicKey;
  amount: number;
  token?: TokenInfo;
}