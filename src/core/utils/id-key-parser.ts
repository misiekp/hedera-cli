export interface ParsedIdKey {
  accountId: string;
  privateKey: string;
}

/**
 * Parse id:key format string into accountId and privateKey
 * @param idKeyPair - String in format "accountId:privateKey"
 * @returns Parsed accountId and privateKey
 * @throws Error if format is invalid
 */
export function parseIdKeyPair(idKeyPair: string): ParsedIdKey {
  const parts = idKeyPair.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid format. Expected id:key');
  }

  const [accountId, privateKey] = parts;

  return {
    accountId,
    privateKey,
  };
}
