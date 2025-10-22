export type CredentialType =
  | 'localPrivateKey'
  | 'mnemonic'
  | 'hardware'
  | 'kms';

export interface KmsCredentialRecord {
  keyRefId: string;
  type: CredentialType;
  publicKey: string;
  labels?: string[];
  keyAlgorithm?: 'ed25519' | 'ecdsa';
}

export type KeyAlgorithm = 'ed25519' | 'ecdsa';

export interface KmsCredentialSecret {
  keyAlgorithm: KeyAlgorithm;
  privateKey?: string; // raw, temporary until encryption/KMS
  mnemonic?: string; // optional seed
  derivationPath?: string; // when mnemonic present
  providerHandle?: string; // HMS/KMS/hardware handle
  createdAt: string; // ISO timestamp
}
