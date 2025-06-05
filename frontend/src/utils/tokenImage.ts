import { PublicKey } from "@solana/web3.js";
import { TokenListProvider, ENV } from "@solana/spl-token-registry";

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
  decimals?: number;
}

export async function fetchTokenMetadata(
  mintAddress: string,
  env: ENV = ENV.Devnet // Change to ENV.Devnet if testing on devnet
): Promise<TokenMetadata> {
  try {
    const provider = await new TokenListProvider().resolve();
    const tokenList = provider.filterByChainId(env).getList();

    const tokenInfo = tokenList.find((t) => t.address === mintAddress);

    if (!tokenInfo) {
      console.warn(`Token metadata not found for ${mintAddress}`);
      return {};
    }

    return {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      image: tokenInfo.logoURI,
      description: tokenInfo.tags?.join(", "),
      decimals: tokenInfo.decimals,
    };
  } catch (err) {
    console.error("Failed to fetch token metadata:", err);
    return {};
  }
}
