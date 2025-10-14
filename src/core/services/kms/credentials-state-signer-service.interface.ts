export interface CredentialsStateSignerService {
  sign(bytes: Uint8Array): Promise<Uint8Array>;
  getPublicKey(): string;
}
