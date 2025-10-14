export type CredentialType =
  | 'localPrivateKey'
  | 'mnemonic'
  | 'hardware'
  | 'kms';
// Removed CredentialsProvider - using CredentialsStateSignerService instead

export interface CredentialsRecord {
  keyRefId: string;
  type: CredentialType;
  publicKey: string;
  labels?: string[];
  keyAlgorithm?: 'ed25519' | 'ecdsa';
}

export type KeyAlgorithm = 'ed25519' | 'ecdsa';

export interface CredentialSecret {
  keyAlgorithm: KeyAlgorithm;
  privateKey?: string; // raw, temporary until encryption/KMS
  mnemonic?: string; // optional seed
  derivationPath?: string; // when mnemonic present
  providerHandle?: string; // HMS/KMS/hardware handle
  createdAt: string; // ISO timestamp
}
