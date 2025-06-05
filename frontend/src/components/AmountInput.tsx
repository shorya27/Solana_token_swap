import React from 'react';
import { TokenInfo } from '../types';
import { formatTokenAmount } from '../utils/tokens';
import { useWalletStore } from '../store/walletStore';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  token: TokenInfo | null;
  label?: string;
  placeholder?: string;
  showBalance?: boolean;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  token,
  label,
  placeholder = '0.0',
  showBalance = true,
}) => {
  const { connected, tokenAccounts } = useWalletStore();
  
  const getTokenBalance = (): number | null => {
    if (!token || !connected) return null;
    
    const tokenAccount = tokenAccounts.find(
      account => account.mint.toString() === token.address
    );
    
    return tokenAccount ? tokenAccount.amount : null;
  };
  
  const balance = getTokenBalance();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Only allow numbers and decimals
    if (/^[0-9]*[.,]?[0-9]*$/.test(inputValue) || inputValue === '') {
      onChange(inputValue.replace(',', '.'));
    }
  };
  
  const handleMaxClick = () => {
    if (balance !== null && token) {
      onChange(String(balance / 10 ** token.decimals));
    }
  };
  
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
        />
        {connected && showBalance && balance !== null && token && (
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Balance: {formatTokenAmount(balance, token.decimals)} {token.symbol}</span>
            <button
              type="button"
              onClick={handleMaxClick}
              className="text-primary-400 hover:text-primary-300"
            >
              MAX
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmountInput;