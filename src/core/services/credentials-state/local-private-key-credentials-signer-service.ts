import { CredentialsStateSignerService } from './credentials-state-signer-service.interface';
import { CredentialsStorageService } from './credentials-storage-service.interface';
import { PrivateKey } from '@hashgraph/sdk';

export class LocalPrivateKeyCredentialsSignerService
  implements CredentialsStateSignerService
{
  private readonly pub: string;
  private readonly keyRefId?: string;
  private readonly storage?: CredentialsStorageService;
  private readonly keyAlgorithm: 'ed25519' | 'ecdsa';

  constructor(
    publicKey: string,
    deps?: {
      keyRefId?: string;
      storage?: CredentialsStorageService;
      keyAlgorithm?: 'ed25519' | 'ecdsa';
    },
  ) {
    this.pub = publicKey;
    this.keyRefId = deps?.keyRefId;
    this.storage = deps?.storage;
    this.keyAlgorithm = deps?.keyAlgorithm || 'ed25519';
  }

  sign(bytes: Uint8Array): Promise<Uint8Array> {
    const secret =
      this.keyRefId && this.storage
        ? this.storage.readSecret(this.keyRefId)
        : null;
    if (!secret || !secret.privateKey) {
      throw new Error('Missing private key for signer');
    }
    const pk =
      this.keyAlgorithm === 'ecdsa'
        ? PrivateKey.fromStringECDSA(secret.privateKey)
        : PrivateKey.fromStringED25519(secret.privateKey);
    const sig = pk.sign(bytes);
    return new Uint8Array(sig);
  }

  getPublicKey(): string {
    return this.pub;
  }
}
