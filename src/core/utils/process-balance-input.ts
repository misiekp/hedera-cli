import { parseBalance } from './parse-balance';

/**
 * Processes user balance input with intelligent unit detection.
 *
 * Detects whether input is a display value (fine units) or raw base units (with 't' suffix).
 * Converts both formats to raw units for internal API usage.
 *
 * Format rules:
 * - Default (no suffix): treat as fine units, multiply by 10^decimals
 *  - Example: '1.5' with 8 decimals → '150000000' raw units
 * - With 't' suffix: treat as raw base units, use as-is (no conversion)
 *  - Example: '100t' → '100' raw units (exact, no decimals applied)
 *
 * @param input - Balance input from user (string or number)
 * @param decimals - Number of decimal places (default: 8 for HBAR)
 * @returns Raw amount as string (ready for API calls)
 *
 * @throws Error if format is invalid (fractional raw units, wrong case, etc.)
 *
 * @example
 * // Fine units (default) - multiply by 10^decimals
 * processBalanceInput('1', 8)      // '100000000' (1 HBAR → 100000000 tinybar)
 * processBalanceInput('1.5', 8)    // '150000000' (1.5 HBAR → 150000000 tinybar)
 * processBalanceInput('1.5', 6)    // '1500000'   (1.5 TOKEN → 1500000 units)
 *
 * @example
 * // Raw units with 't' suffix - no conversion, direct value
 * processBalanceInput('100t', 8)   // '100' (100 tinybar, exact)
 * processBalanceInput('1000000t', 6) // '1000000' (1000000 token units, exact)
 *
 * @example
 * // Errors
 * processBalanceInput('1.5t', 8)   // Error: "Invalid raw units: fractional value not allowed"
 * processBalanceInput('100T', 8)   // Error: "Invalid format: 't' suffix must be lowercase"
 * processBalanceInput('-100', 8)   // Error: "Invalid balance: cannot be negative"
 */
export function processBalanceInput(
  input: string | number,
  decimals: number = 8,
): bigint {
  const inputStr = String(input).trim();

  // Check if input ends with lowercase 't' (raw units indicator)
  const hasRawUnitsSuffix = inputStr.endsWith('t');

  if (hasRawUnitsSuffix) {
    // Extract value without 't' suffix
    const rawValue = inputStr.slice(0, -1).trim();

    // Validate it's a valid integer (no decimals allowed for raw units)
    if (!/^[0-9]+$/.test(rawValue)) {
      throw new Error(
        `Invalid raw units: "${input}". Must be an integer without decimals (fractional raw units not allowed).`,
      );
    }

    const value = BigInt(rawValue);

    // Validate raw value is not zero
    if (value === 0n) {
      throw new Error(
        `Invalid raw units: "${input}". Must be a positive number (greater than 0).`,
      );
    }

    // Return raw value as-is (already in base units, no decimals applied)
    return value;
  }

  return parseBalance(inputStr, decimals);
}
