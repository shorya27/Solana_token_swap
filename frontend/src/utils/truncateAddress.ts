/**
 * Helper: truncate a long string so it shows first `startChars` and last `endChars`.
 * E.g., truncatePubkey("0x9WV4H0a1b2c3d4e5f6g7h", 6, 6)  →  "0x9WV4H…5f6g7h"
 */
export const truncatePubkey = (
  pk: string,
  startChars: number,
  endChars: number
): string => {
  if (pk.length <= startChars + endChars) {
    // Nothing to truncate if the string is already short
    return pk;
  }
  const prefix = pk.slice(0, startChars);
  const suffix = pk.slice(pk.length - endChars);
  return `${prefix}…${suffix}`;
};
