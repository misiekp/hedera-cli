/**
 * Key Utilities
 * Utilities for parsing, validating, and converting cryptographic keys
 */
import { PrivateKey } from '@hashgraph/sdk';

/**
 * Parse a private key string, trying multiple formats (ED25519, ECDSA, DER)
 * @param privateKeyString - The private key as a string
 * @returns PrivateKey object
 * @throws Error if the key cannot be parsed in any supported format
 */
export function parsePrivateKey(privateKeyString: string): PrivateKey {
  // Try ED25519 first
  try {
    return PrivateKey.fromStringED25519(privateKeyString);
  } catch (e) {
    // If ED25519 fails, try ECDSA
    try {
      return PrivateKey.fromStringECDSA(privateKeyString);
    } catch (e2) {
      // If both fail, try DER format
      try {
        return PrivateKey.fromStringDer(privateKeyString);
      } catch (e3) {
        throw new Error(
          `Invalid private key format. Key must be in ED25519, ECDSA, or DER format: ${privateKeyString.substring(0, 10)}...`,
        );
      }
    }
  }
}

/**
 * Get the public key from a private key string
 * @param privateKeyString - The private key as a string
 * @returns Public key as a string
 */
export function getPublicKeyFromPrivateKey(privateKeyString: string): string {
  const privateKey = parsePrivateKey(privateKeyString);
  return privateKey.publicKey.toStringRaw();
}
