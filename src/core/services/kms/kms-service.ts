import { KmsService } from './kms-service.interface';
import {
  CredentialType,
  KmsCredentialRecord,
  KeyAlgorithm,
} from './kms-types.interface';
import { SupportedNetwork } from '../../types/shared.types';
import { randomBytes } from 'crypto';
import {
  PrivateKey,
  Client,
  PublicKey,
  AccountId,
  Transaction as HederaTransaction,
} from '@hashgraph/sdk';
import { LocalKmsSignerService } from './local-kms-signer.service';
import { KmsSignerService } from './kms-signer-service.interface';
import { Logger } from '../logger/logger-service.interface';
import { StateService } from '../state/state-service.interface';
import { NetworkService } from '../network/network-service.interface';
import { KmsStorageServiceInterface } from './kms-storage-service.interface';
import { KmsStorageService } from './kms-storage.service';

/**
 * @TODO: Consider reorganizing KMS folder structure
 *
 * Currently, the KMS folder contains more files than typical service folders
 * (which usually have just interface + implementation). This was discussed
 * during review and we decided not to change it now, but we should consider
 * better organization in the future.
 *
 */

export class KmsServiceImpl implements KmsService {
  private readonly logger: Logger;
  private readonly storage: KmsStorageServiceInterface;
  private readonly networkService: NetworkService;

  constructor(
    logger: Logger,
    state: StateService,
    networkService: NetworkService,
  ) {
    this.logger = logger;
    this.networkService = networkService;
    this.storage = new KmsStorageService(state);
  }

  createLocalPrivateKey(labels?: string[]): {
    keyRefId: string;
    publicKey: string;
  } {
    const keyRefId = this.generateId('kr');
    // Generate a real Hedera Ed25519 keypair
    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey.toStringRaw();
    this.storage.writeSecret(keyRefId, {
      keyAlgorithm: 'ecdsa',
      privateKey: privateKey.toStringRaw(),
      createdAt: new Date().toISOString(),
    });
    this.saveRecord({
      keyRefId,
      type: 'localPrivateKey',
      publicKey,
      labels,
      keyAlgorithm: 'ecdsa',
    });
    return { keyRefId, publicKey };
  }

  importPrivateKey(
    privateKey: string,
    labels?: string[],
  ): { keyRefId: string; publicKey: string } {
    const keyRefId = this.generateId('kr');
    // TODO: Try to parse either ED25519 or ECDSA
    const pk: PrivateKey = PrivateKey.fromStringECDSA(privateKey);
    const algo: KeyAlgorithm = 'ecdsa';
    const publicKey = pk.publicKey.toStringRaw();

    const existingKeyRefId = this.findByPublicKey(publicKey);
    if (existingKeyRefId) {
      this.logger.debug(
        `[CRED] Passed key already exist, keyRefId: ${existingKeyRefId}`,
      );
      return { keyRefId: existingKeyRefId, publicKey };
    }

    this.saveRecord({
      keyRefId,
      type: 'localPrivateKey',
      publicKey,
      labels,
      keyAlgorithm: algo,
    });
    this.storage.writeSecret(keyRefId, {
      keyAlgorithm: algo,
      privateKey,
      createdAt: new Date().toISOString(),
    });
    return { keyRefId, publicKey };
  }

  getPublicKey(keyRefId: string): string | null {
    return this.getRecord(keyRefId)?.publicKey || null;
  }

  getSignerHandle(keyRefId: string): KmsSignerService {
    const rec = this.getRecord(keyRefId);
    if (!rec) throw new Error(`Unknown keyRefId: ${keyRefId}`);

    // Directly create signer service - no provider needed
    return new LocalKmsSignerService(rec.publicKey, {
      keyRefId,
      storage: this.storage,
      keyAlgorithm: rec.keyAlgorithm || 'ed25519',
    });
  }

  findByPublicKey(publicKey: string): string | null {
    const records = this.storage.list();
    const record = records.find((r) => r.publicKey === publicKey);
    return record?.keyRefId || null;
  }

  // Plugin compatibility methods
  list(): Array<{
    keyRefId: string;
    type: CredentialType;
    publicKey: string;
    labels?: string[];
  }> {
    const records = this.storage.list();
    return records.map(({ keyRefId, type, publicKey, labels }) => ({
      keyRefId,
      type,
      publicKey,
      labels,
    }));
  }

  remove(keyRefId: string): void {
    this.storage.remove(keyRefId);
    this.logger.debug(`[CRED] Removed keyRefId=${keyRefId}`);
  }

  // Removed registerProvider - no longer needed

  setOperator(accountId: string, keyRefId: string): void {
    this.storage.setOperator({ accountId, keyRefId });
    this.logger.debug(`[CRED] Operator set: ${accountId}`);
  }

  getOperator(): { accountId: string; keyRefId: string } | null {
    return this.storage.getOperator();
  }

  ensureOperatorFromEnv(): { accountId: string; keyRefId: string } | null {
    const existing = this.getOperator();
    if (existing) return existing;
    // TODO: Improve environment variable handling to support multiple networks (not just Testnet)
    const accountId = process.env.TESTNET_OPERATOR_ID;
    const privateKey = process.env.TESTNET_OPERATOR_KEY;
    if (accountId && privateKey) {
      const { keyRefId } = this.importPrivateKey(privateKey, ['env-default']);
      this.setOperator(accountId, keyRefId);
      return { accountId, keyRefId };
    }
    return null;
  }

  createClient(network: SupportedNetwork): Client {
    const mapping = this.getOperator() || this.ensureOperatorFromEnv();
    if (!mapping) {
      throw new Error('[CRED] No operator configured');
    }

    const { accountId, keyRefId } = mapping;
    const privateKeyString = this.getPrivateKeyString(keyRefId);
    if (!privateKeyString) {
      throw new Error('[CRED] Default operator keyRef missing private key');
    }

    // Get the key algorithm from the record
    const record = this.getRecord(keyRefId);
    if (!record) {
      throw new Error('[CRED] Default operator keyRef record not found');
    }

    // Create client and set operator with credentials
    let client: Client;
    switch (network) {
      case 'mainnet':
        client = Client.forMainnet();
        break;
      case 'testnet':
        client = Client.forTestnet();
        break;
      case 'previewnet':
        client = Client.forPreviewnet();
        break;
      case 'localnet': {
        // For localnet, get configuration from NetworkService
        const localnetConfig = this.networkService.getLocalnetConfig();

        const node = {
          [localnetConfig.localNodeAddress]: AccountId.fromString(
            localnetConfig.localNodeAccountId,
          ),
        };
        client = Client.forNetwork(node);

        if (localnetConfig.localNodeMirrorAddressGRPC) {
          client.setMirrorNetwork(localnetConfig.localNodeMirrorAddressGRPC);
        }
        break;
      }
      default:
        throw new Error(`[CRED] Unsupported network: ${String(network)}`);
    }

    const accountIdObj = AccountId.fromString(accountId);

    // Use the correct PrivateKey.fromString method based on algorithm
    const privateKey =
      record.keyAlgorithm === 'ecdsa'
        ? PrivateKey.fromStringECDSA(privateKeyString)
        : PrivateKey.fromStringED25519(privateKeyString); // Default to ED25519

    // Set the operator on the client
    client.setOperator(accountIdObj, privateKey);

    return client;
  }

  async signTransaction(
    transaction: HederaTransaction,
    keyRefId: string,
  ): Promise<void> {
    const handle = this.getSignerHandle(keyRefId);
    const publicKey = PublicKey.fromString(handle.getPublicKey());

    // Use the opaque signer handle for signing
    await transaction.signWith(publicKey, async (message: Uint8Array) =>
      handle.sign(message),
    );
  }

  private getPrivateKeyString(keyRefId: string): string | null {
    const secret = this.storage.readSecret(keyRefId);
    return secret?.privateKey || null;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  private saveRecord(record: KmsCredentialRecord): void {
    this.storage.set(record.keyRefId, record);
    this.logger.debug(
      `[CRED] Saved keyRefId=${record.keyRefId} type=${record.type}`,
    );
  }

  private getRecord(keyRefId: string): KmsCredentialRecord | undefined {
    return this.storage.get(keyRefId);
  }
}
