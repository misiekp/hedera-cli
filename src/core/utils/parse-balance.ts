/**
 * Parses a human-readable decimal balance to raw integer representation.
 *
 * @param balance - Human-readable balance (string, number, or BigInt)
 * @param decimals - Token decimal places (default: 8)
 * @returns Raw balance as bigint
 *
 * @example
 * parseBalance('1', 8)        // 100000000n
 * parseBalance('1.5', 6)      // 1500000n
 * parseBalance('0.999999', 6) // 999999n
 */

export function parseBalance(
  balance: string | number | bigint,
  decimals: number = 8,
): bigint {
  // Validate decimals
  if (decimals < 0) {
    throw new Error(
      `Invalid decimals: ${decimals}. Must be a non-negative integer.`,
    );
  }

  // Convert to string
  const balanceStr = String(balance).trim();

  // Check for NaN
  if (balanceStr === 'NaN') {
    throw new Error(`Invalid balance: "NaN". Must be a valid decimal number.`);
  }

  // Check for negative
  if (balanceStr.startsWith('-')) {
    throw new Error(
      `Invalid balance: "${balance}". Balance cannot be negative.`,
    );
  }

  // Check format for valid decimal number
  if (!/^\d+(\.\d+)?$/.test(balanceStr)) {
    throw new Error(`Invalid balance: "${balance}".`);
  }

  // Split integer and decimal parts
  const [integerStr, decimalStr = ''] = balanceStr.split('.');

  // Validate decimal places don't exceed allowed
  if (decimalStr.length > decimals) {
    throw new Error(`Invalid balance: "${balance}". Too many decimal places.`);
  }

  // String concatenation instead of multiplying by 10**decimals avoids
  // floating-point precision errors and ensures exact decimal handling
  const result = BigInt(integerStr + decimalStr.padEnd(decimals, '0'));

  // Ensure non-zero
  if (result === 0n) {
    throw new Error(`Invalid balance: "${balance}". Must be positive.`);
  }

  return result;
}
