import { ArrowRightLeft, MoveRight } from 'lucide-react';
import WalletConnectButton from './components/WalletConnectButton';
import CreateOfferForm from './components/CreateOfferForm';
import OffersList from './components/OffersList';
import { useWalletStore } from './store/walletStore';
import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

function App() {
  const network = WalletAdapterNetwork.Devnet;
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      // if desired, manually define specific/custom wallets here (normally not required)
      // otherwise, the wallet-adapter will auto detect the wallets a user's browser has available
    ],
    [network],
  );
  // Animation background elements
  const bgElements = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="absolute rounded-full bg-gradient-to-br from-primary-500/10 to-secondary-500/10 animate-pulse-slow"
      style={{
        width: `${Math.random() * 300 + 50}px`,
        height: `${Math.random() * 300 + 50}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${Math.random() * 10 + 10}s`,
        opacity: 0.05 + Math.random() * 0.05,
        filter: `blur(${Math.random() * 50 + 50}px)`,
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>

            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              {bgElements}
            </div>

            {/* Content container */}
            <div className="relative z-10">
              {/* Header */}
              <header className="border-b border-gray-800 backdrop-blur-md bg-gray-900/70 sticky top-0 z-20">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <ArrowRightLeft size={24} className="text-primary-500 mr-2" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                      SolanaSwap
                    </h1>
                  </div>


                  <WalletMultiButton />

                </div>
              </header>

              {/* Main content */}
              <main className="container mx-auto px-4 py-8">
                {/* Hero section for new users */}

                <div className="mb-12 text-center max-w-3xl mx-auto">
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent">
                    Swap Solana Tokens Your Way
                  </h1>
                  <p className="text-xl text-gray-300 mb-8">
                    Create custom token swap offers or fulfill existing ones from other users
                  </p>
                  <div className="flex flex-wrap justify-center gap-8 mb-8">
                    <div className="flex items-center">
                      <div className="bg-primary-500/20 p-3 rounded-full mr-4">
                        <ArrowRightLeft size={24} className="text-primary-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium">Create Custom Offers</h3>
                        <p className="text-sm text-gray-400">Set your own exchange rate</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-secondary-500/20 p-3 rounded-full mr-4">
                        <MoveRight size={24} className="text-secondary-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium">Instant Token Swaps</h3>
                        <p className="text-sm text-gray-400">Browse and accept offers from others</p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Two-column layout for offers and creation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 order-2 lg:order-1">
                    <CreateOfferForm />
                  </div>

                  <div className="lg:col-span-2 order-1 lg:order-2">
                    <OffersList />
                  </div>
                </div>
              </main>

              {/* Footer */}
              <footer className="border-t border-gray-800 py-6 mt-12">
                <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
                  <p>SolanaSwap — A decentralized token swapping platform</p>
                  <p className="mt-2">
                    <span className="text-xs">This is a demo application. No real transactions are performed.</span>
                  </p>
                </div>
              </footer>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

export default App;