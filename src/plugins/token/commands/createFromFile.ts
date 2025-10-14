/**
 * Token Create From File Command Handler
 * Handles token creation from JSON file definitions using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData, resolveTreasuryParameter } from '../schema';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

// Import the token file schema from the original commands
const accountIdRegex = /^\d+\.\d+\.\d+$/;

const keysSchema = z
  .object({
    adminKey: z.string().min(1, 'adminKey is required'),
    supplyKey: z.string().min(1).optional(),
    wipeKey: z.string().min(1).optional(),
    kycKey: z.string().min(1).optional(),
    freezeKey: z.string().min(1).optional(),
    pauseKey: z.string().min(1).optional(),
    feeScheduleKey: z.string().min(1).optional(),
  })
  .strict();

const fixedFeeSchema = z
  .object({
    type: z.literal('fixed'),
    amount: z.number().int().positive('Amount must be positive'),
    unitType: z.literal('HBAR').optional().default('HBAR'),
    collectorId: z
      .string()
      .regex(accountIdRegex, 'collectorId must be a valid account id')
      .optional(),
    exempt: z.boolean().optional(),
  })
  .strict();

const customFeeSchema = fixedFeeSchema; // Only fixed fees supported

const accountSchema = z
  .object({
    accountId: z
      .string()
      .regex(accountIdRegex, 'accountId must be a valid account id'),
    key: z.string().min(1, 'account key is required'),
  })
  .strict();

// Treasury can be either:
// 1. A string (alias or treasury-id:treasury-key)
// 2. An object with accountId and key (legacy format)
const treasurySchema = z.union([
  z
    .string()
    .min(1, 'Treasury is required (either alias or treasury-id:treasury-key)'),
  accountSchema,
]);

const tokenFileSchema = z
  .object({
    name: z.string().min(1).max(100),
    symbol: z.string().min(1).max(20),
    decimals: z.number().int().min(0).max(18),
    supplyType: z.union([z.literal('finite'), z.literal('infinite')]),
    initialSupply: z.number().int().nonnegative(),
    maxSupply: z.number().int().nonnegative().default(0),
    treasury: treasurySchema,
    keys: keysSchema,
    associations: z.array(accountSchema).default([]),
    customFees: z.array(customFeeSchema).default([]),
    memo: z.string().max(100).optional().default(''),
  })
  .strict();

type TokenFileDefinition = z.infer<typeof tokenFileSchema>;

interface TokenValidationResult {
  valid: boolean;
  errors?: string[];
  data?: TokenFileDefinition;
}

function validateTokenFile(raw: unknown): TokenValidationResult {
  const parsed = tokenFileSchema.safeParse(raw);
  if (parsed.success) return { valid: true, data: parsed.data };
  return {
    valid: false,
    errors: parsed.error.issues.map(
      (i) => `${i.path.join('.') || '<root>'}: ${i.message}`,
    ),
  };
}

function resolveTokenFilePath(filename: string): string {
  const overrideDir = process.env.HCLI_TOKEN_INPUT_DIR;
  if (overrideDir && overrideDir.trim() !== '') {
    return path.join(overrideDir, `token.${filename}.json`);
  }
  return path.join(process.cwd(), 'src', 'input', `token.${filename}.json`);
}

export async function createTokenFromFileHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize token state helper
  const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Extract command arguments
  const filename = args.args['file'] as string;
  const scriptArgs = (args.args['args'] as string[]) || [];

  logger.log(`Creating token from file: ${filename}`);

  try {
    // 1. Read and validate the token file
    const filepath = resolveTokenFilePath(filename);
    logger.debug(`Reading token file from: ${filepath}`);

    const fileContent = await fs.readFile(filepath, 'utf-8');
    const raw = JSON.parse(fileContent) as unknown;

    const validated = validateTokenFile(raw);
    if (!validated.valid || !validated.data) {
      logger.error('Token file validation failed');
      if (validated.errors && validated.errors.length) {
        validated.errors.forEach((e) => logger.error(e));
      }
      throw new Error('Invalid token definition file');
    }

    const tokenDefinition = validated.data;

    // 2. Resolve treasury parameter
    const network = api.network.getCurrentNetwork() as
      | 'mainnet'
      | 'testnet'
      | 'previewnet';
    let treasuryId: string;
    let treasuryKeyRefId: string;
    let treasuryPublicKey: string;

    if (typeof tokenDefinition.treasury === 'string') {
      // New format: alias or treasury-id:treasury-key
      const resolvedTreasury = await resolveTreasuryParameter(
        tokenDefinition.treasury,
        api,
        network,
      );

      if (!resolvedTreasury) {
        throw new Error('Treasury parameter is required');
      }

      treasuryId = resolvedTreasury.treasuryId;
      treasuryKeyRefId = resolvedTreasury.treasuryKeyRefId;
      treasuryPublicKey = resolvedTreasury.treasuryPublicKey;

      logger.log(`🏦 Using treasury: ${treasuryId}`);
    } else {
      // Legacy format: object with accountId and key
      treasuryId = tokenDefinition.treasury.accountId;

      // Import the treasury key
      const imported = api.credentialsState.importPrivateKey(
        tokenDefinition.treasury.key,
      );
      treasuryKeyRefId = imported.keyRefId;
      treasuryPublicKey = imported.publicKey;

      logger.log(`🏦 Using treasury (legacy format): ${treasuryId}`);
    }

    // 3. Create token transaction using Core API
    const tokenCreateTransaction = await api.tokens.createTokenTransaction({
      name: tokenDefinition.name,
      symbol: tokenDefinition.symbol,
      treasuryId: treasuryId,
      decimals: tokenDefinition.decimals,
      initialSupply: tokenDefinition.initialSupply,
      supplyType: tokenDefinition.supplyType.toUpperCase() as
        | 'FINITE'
        | 'INFINITE',
      maxSupply: tokenDefinition.maxSupply,
      adminKey: tokenDefinition.keys.adminKey,
      customFees: tokenDefinition.customFees.map((fee) => ({
        type: fee.type,
        amount: fee.amount,
        unitType: fee.unitType,
        collectorId: fee.collectorId,
        exempt: fee.exempt,
      })),
    });

    // 4. Sign and execute transaction using the treasury key
    logger.log(`🔑 Using treasury key for signing transaction`);
    const result = await api.signing.signAndExecuteWith(
      tokenCreateTransaction,
      { keyRefId: treasuryKeyRefId },
    );

    if (result.success && result.tokenId) {
      logger.log(`✅ Token created successfully from file!`);
      logger.log(`   Token ID: ${result.tokenId}`);
      logger.log(`   Name: ${tokenDefinition.name}`);
      logger.log(`   Symbol: ${tokenDefinition.symbol}`);
      logger.log(`   Decimals: ${tokenDefinition.decimals}`);
      logger.log(`   Initial Supply: ${tokenDefinition.initialSupply}`);
      logger.log(`   Supply Type: ${tokenDefinition.supplyType}`);
      logger.log(`   Max Supply: ${tokenDefinition.maxSupply}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 5. Store token in state
      const tokenData: TokenData = {
        tokenId: result.tokenId,
        name: tokenDefinition.name,
        symbol: tokenDefinition.symbol,
        treasuryId: treasuryId,
        decimals: tokenDefinition.decimals,
        initialSupply: tokenDefinition.initialSupply,
        supplyType: tokenDefinition.supplyType.toUpperCase() as
          | 'FINITE'
          | 'INFINITE',
        maxSupply: tokenDefinition.maxSupply,
        keys: {
          adminKey: tokenDefinition.keys.adminKey,
          supplyKey: tokenDefinition.keys.supplyKey || '',
          wipeKey: tokenDefinition.keys.wipeKey || '',
          kycKey: tokenDefinition.keys.kycKey || '',
          freezeKey: tokenDefinition.keys.freezeKey || '',
          pauseKey: tokenDefinition.keys.pauseKey || '',
          feeScheduleKey: tokenDefinition.keys.feeScheduleKey || '',
          treasuryKey: treasuryPublicKey,
        },
        network: api.network.getCurrentNetwork() as
          | 'mainnet'
          | 'testnet'
          | 'previewnet',
        associations: [],
        customFees: tokenDefinition.customFees.map((fee) => ({
          type: fee.type,
          amount: fee.amount,
          unitType: fee.unitType,
          collectorId: fee.collectorId,
          exempt: fee.exempt,
        })),
      };

      // 6. Create associations if specified
      if (tokenDefinition.associations.length > 0) {
        logger.log(
          `   Creating ${tokenDefinition.associations.length} token associations...`,
        );

        for (const association of tokenDefinition.associations) {
          try {
            // Create association transaction
            const associateTransaction =
              await api.tokens.createTokenAssociationTransaction({
                tokenId: result.tokenId,
                accountId: association.accountId,
              });

            // Sign and execute with the account's key
            const associationImported = api.credentialsState.importPrivateKey(
              association.key,
            );
            const associateResult = await api.signing.signAndExecuteWith(
              associateTransaction,
              { keyRefId: associationImported.keyRefId },
            );

            if (associateResult.success) {
              logger.log(
                `   ✅ Associated account ${association.accountId} with token`,
              );
              // Add to token data associations
              tokenData.associations.push({
                name: association.accountId, // Using accountId as name for now
                accountId: association.accountId,
              });
            } else {
              logger.warn(
                `   ⚠️  Failed to associate account ${association.accountId}`,
              );
            }
          } catch (error) {
            logger.warn(
              `   ⚠️  Failed to associate account ${association.accountId}: ${error}`,
            );
          }
        }
      }

      await tokenState.saveToken(result.tokenId, tokenData);
      logger.log(`   Token data saved to state`);

      // 7. Store script arguments if provided
      if (scriptArgs.length > 0) {
        logger.debug(`Storing script arguments: ${scriptArgs.join(', ')}`);
        // Note: In a full implementation, you'd store these in the state or dynamic variables system
      }

      process.exit(0);
    } else {
      throw new Error('Token creation failed - no token ID returned');
    }
  } catch (error) {
    logger.error(`❌ Failed to create token from file: ${error}`);
    process.exit(1);
  }
}

export default createTokenFromFileHandler;
