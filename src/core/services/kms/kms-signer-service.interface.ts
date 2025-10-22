export interface KmsSignerService {
  sign(bytes: Uint8Array): Promise<Uint8Array>;
  getPublicKey(): string;
}
