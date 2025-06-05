// src/components/AddressDisplay.tsx
import React, { useState, useRef } from "react";
import { Copy, CheckCircle, Link2 } from "lucide-react";
import { truncatePubkey } from "../utils/truncateAddress";
interface AddressLineProps {
  label: string;
  address: string;
  copied: boolean;
  onCopy: () => void;
  startChars?: number; // how many characters to show at the front
  endChars?: number;   // how many characters to show at the back
}

export const AddressLine: React.FC<AddressLineProps> = ({
  label,
  address,
  copied,
  onCopy,
  startChars = 5,
  endChars = 5,
}) => {
  const truncated = truncatePubkey(address, startChars, endChars);

  return (
    <div className="flex items-center space-x-1 mt-2">
      <span className="text-xs font-medium text-gray-400">{label}:</span>
      <span
        className="text-sm font-mono text-white cursor-default"
        title={address} // hover tooltip shows full address
      >
        {truncated}
      </span>
      <button
        onClick={onCopy}
        disabled={copied}
        className="ml-1 p-1 rounded-full hover:bg-white/10 transition"
        title={copied ? "Copied!" : "Copy full address"}
      >
        {copied ? (
          <CheckCircle size={16} className="text-green-400" />
        ) : (
          <Copy size={16} className="text-gray-300" />
        )}
      </button>
    </div>
  );
};
