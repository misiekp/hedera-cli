/**
 * Converts a raw integer balance to human-readable decimal format.
 *
 * @param balance - The raw balance value as BigInt
 * @param decimals - The number of decimal places for the token (default: 8)
 * @returns A string representation of the balance in decimal format

 * @example
 * // HBAR balance (8 decimals) - 1 HBAR = 100000000 tinybar
 * normalizeBalance(100000000n, 8)   // "1"
 * normalizeBalance(999999n, 6)      // "0.999999"
 */
export function normalizeBalance(
  balance: bigint,
  decimals: number = 8,
): string {
  // Validate decimals parameter
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(
      `Decimals must be a non-negative integer, got: ${decimals}`,
    );
  }

  // Check for negative balance
  if (balance < 0n) {
    throw new Error(`Balance cannot be negative: ${balance}`);
  }

  // Use string manipulation instead of division by 10**decimals to avoid
  // floating-point precision issues and maintain exact decimal representation
  const balanceStr = balance.toString();

  // Add leading zeros if the number is too small
  const paddedBalance = balanceStr.padStart(decimals, '0');

  // Split the string into two parts at the decimal position
  const splitPosition = paddedBalance.length - decimals;
  const integerPart = paddedBalance.slice(0, splitPosition);
  const fractionalPart = paddedBalance.slice(splitPosition);

  // If integer part is empty, use "0"
  const finalIntegerPart = integerPart || '0';

  // Remove unnecessary trailing zeros from fractional part
  const trimmedFractional = fractionalPart.replace(/0+$/, '');

  // Build the final result
  if (trimmedFractional === '') {
    return finalIntegerPart;
  } else {
    return `${finalIntegerPart}.${trimmedFractional}`;
  }
}
