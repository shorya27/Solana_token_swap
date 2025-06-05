import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { TokenInfo } from '../types';
import { SAMPLE_TOKENS } from '../utils/tokens';

interface TokenSelectorProps {
  value: TokenInfo | null;
  onChange: (token: TokenInfo) => void;
  label?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const filteredTokens = searchQuery
    ? SAMPLE_TOKENS.filter(
        (token) =>
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SAMPLE_TOKENS;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-left bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <div className="flex items-center">
          {value ? (
            <>
              <img
                src={value.logoURI}
                alt={value.symbol}
                className="w-6 h-6 rounded-full mr-2"
                onError={(e) => {
                  // Fallback for broken images
                  (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/4b5563/ffffff?text=' + value.symbol;
                }}
              />
              <span className="font-medium">{value.symbol}</span>
              <span className="ml-2 text-sm text-gray-400">{value.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Select token</span>
          )}
        </div>
        <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <div className="flex items-center px-2 py-1 bg-gray-700 rounded-md">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or symbol"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-1 bg-transparent border-none focus:outline-none text-white"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => {
                    onChange(token);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center w-full px-3 py-2 hover:bg-gray-700 transition-colors"
                >
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-6 h-6 rounded-full mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/4b5563/ffffff?text=' + token.symbol;
                    }}
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-xs text-gray-400">{token.name}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400 text-center">No tokens found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;