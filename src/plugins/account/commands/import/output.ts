/**
 * Import Account Command Output Schema and Template
 */
import { z } from 'zod';
import {
  EntityIdSchema,
  KeyTypeSchema,
  NetworkSchema,
  TinybarBalanceSchema,
  EvmAddressSchema,
} from '../../../../core/schemas/common-schemas';

/**
 * Import Account Command Output Schema
 */
export const ImportAccountOutputSchema = z.object({
  accountId: EntityIdSchema,
  name: z.string().describe('Account name or alias'),
  type: KeyTypeSchema,
  alias: z.string().describe('Account alias').optional(),
  network: NetworkSchema,
  balance: TinybarBalanceSchema,
  evmAddress: EvmAddressSchema,
});

export type ImportAccountOutput = z.infer<typeof ImportAccountOutputSchema>;

/**
 * Human-readable template for import account output
 */
export const IMPORT_ACCOUNT_TEMPLATE = `
✅ Account imported successfully: {{accountId}}
   Name: {{name}}
   Type: {{type}}
   Network: {{network}}
{{#if alias}}
   Alias: {{alias}}
{{/if}}
   EVM Address: {{evmAddress}}
   Balance: {{balance}} tinybars
`.trim();
