/**
 * Token Create From File Command Handler
 * Handles token creation from JSON file definitions using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData } from '../schema';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

// Import the token file schema from the original commands
const accountIdRegex = /^\d+\.\d+\.\d+$/;

const keysSchema = z
  .object({
    adminKey: z.string(),
    supplyKey: z.string(),
    wipeKey: z.string(),
    kycKey: z.string(),
    freezeKey: z.string(),
    pauseKey: z.string(),
    feeScheduleKey: z.string(),
    treasuryKey: z
      .string()
      .min(1, 'treasuryKey is required (can reference <name:...>)'),
  })
  .strict();

const fixedFeeSchema = z
  .object({
    type: z.literal('fixed'),
    amount: z.number().int().positive(),
    unitType: z.string(),
    denom: z.string().optional(),
    collectorId: z
      .string()
      .regex(accountIdRegex, 'collectorId must be a valid account id')
      .optional(),
    exempt: z.boolean().optional(),
  })
  .strict();

const fractionalFeeSchema = z
  .object({
    type: z.literal('fractional'),
    numerator: z.number().int().positive(),
    denominator: z.number().int().positive(),
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative().optional(),
    collectorId: z
      .string()
      .regex(accountIdRegex, 'collectorId must be a valid account id')
      .optional(),
    exempt: z.boolean().optional(),
  })
  .strict();

const customFeeSchema = z.union([fixedFeeSchema, fractionalFeeSchema]);

const tokenFileSchema = z
  .object({
    name: z.string().min(1).max(100),
    symbol: z.string().min(1).max(20),
    decimals: z.number().int().min(0).max(18),
    supplyType: z.union([z.literal('finite'), z.literal('infinite')]),
    initialSupply: z.number().int().nonnegative(),
    maxSupply: z.number().int().nonnegative().default(0),
    keys: keysSchema,
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

    // 2. Create token transaction using Core API
    const tokenCreateTransaction =
      await api.tokenTransactions.createTokenTransaction({
        name: tokenDefinition.name,
        symbol: tokenDefinition.symbol,
        treasuryId: '', // Will be resolved from treasury key
        decimals: tokenDefinition.decimals,
        initialSupply: tokenDefinition.initialSupply,
        supplyType: tokenDefinition.supplyType.toUpperCase() as
          | 'FINITE'
          | 'INFINITE',
        adminKey: tokenDefinition.keys.adminKey,
        treasuryKey: tokenDefinition.keys.treasuryKey,
      });

    // 3. Sign and execute transaction
    // Note: In a real implementation, you'd need proper key management
    // For now, we'll use a placeholder signing process
    const result = await api.signing.signAndExecute(tokenCreateTransaction);

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

      // 4. Store token in state
      const tokenData: TokenData = {
        tokenId: result.tokenId,
        name: tokenDefinition.name,
        symbol: tokenDefinition.symbol,
        treasuryId: '', // Will be resolved later
        decimals: tokenDefinition.decimals,
        initialSupply: tokenDefinition.initialSupply,
        supplyType: tokenDefinition.supplyType.toUpperCase() as
          | 'FINITE'
          | 'INFINITE',
        maxSupply: tokenDefinition.maxSupply,
        keys: {
          adminKey: tokenDefinition.keys.adminKey,
          supplyKey: tokenDefinition.keys.supplyKey,
          wipeKey: tokenDefinition.keys.wipeKey,
          kycKey: tokenDefinition.keys.kycKey,
          freezeKey: tokenDefinition.keys.freezeKey,
          pauseKey: tokenDefinition.keys.pauseKey,
          feeScheduleKey: tokenDefinition.keys.feeScheduleKey,
          treasuryKey: tokenDefinition.keys.treasuryKey,
        },
        network: api.network.getCurrentNetwork() as
          | 'mainnet'
          | 'testnet'
          | 'previewnet',
        associations: [],
        customFees: tokenDefinition.customFees.map((fee) => ({
          type: fee.type,
          amount: fee.type === 'fixed' ? fee.amount : undefined,
          unitType: fee.type === 'fixed' ? fee.unitType : undefined,
          denom: fee.type === 'fixed' ? fee.denom : undefined,
          numerator: fee.type === 'fractional' ? fee.numerator : undefined,
          denominator: fee.type === 'fractional' ? fee.denominator : undefined,
          min: fee.type === 'fractional' ? fee.min : undefined,
          max: fee.type === 'fractional' ? fee.max : undefined,
          collectorId: fee.collectorId,
          exempt: fee.exempt,
        })),
      };

      await tokenState.saveToken(result.tokenId, tokenData);
      logger.log(`   Token data saved to state`);

      // 5. Store script arguments if provided
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
