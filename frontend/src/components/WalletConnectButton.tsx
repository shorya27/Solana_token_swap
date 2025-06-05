import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { PublicKey } from '@solana/web3.js';

const WalletConnectButton: React.FC = () => {
  const { connected, publicKey, fetchTokenAccounts } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    if (connected) {
      // Disconnect logic would go here in a real implementation
      useWalletStore.setState({ connected: false, publicKey: null, tokenAccounts: [] });
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate wallet connection for demo
    setTimeout(() => {
      const dummyPublicKey = new PublicKey('11111111111111111111111111111111');
      useWalletStore.setState({ connected: true, publicKey: dummyPublicKey });
      fetchTokenAccounts();
      setIsConnecting(false);
    }, 1000);
  };
  
  const truncateAddress = (address: string): string => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        connected
          ? 'bg-primary-500 text-white hover:bg-primary-600'
          : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600'
      }`}
    >
      <Wallet size={18} />
      <span>
        {isConnecting
          ? 'Connecting...'
          : connected && publicKey
            ? truncateAddress(publicKey.toString())
            : 'Connect Wallet'}
      </span>
    </button>
  );
};

export default WalletConnectButton;