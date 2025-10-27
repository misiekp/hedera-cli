/**
 * Account Balance Command Output Schema and Template
 */
import { z } from 'zod';
import {
  EntityIdSchema,
  TinybarBalanceSchema,
  TokenAmountSchema,
} from '../../../../core/schemas/common-schemas';

/**
 * Account Balance Command Output Schema
 */
export const AccountBalanceOutputSchema = z.object({
  accountId: EntityIdSchema,
  hbarBalance: TinybarBalanceSchema,
  tokenBalances: z
    .array(
      z.object({
        tokenId: EntityIdSchema,
        balance: TokenAmountSchema,
      }),
    )
    .optional(),
});

export type AccountBalanceOutput = z.infer<typeof AccountBalanceOutputSchema>;

/**
 * Human-readable template for account balance output
 */
export const ACCOUNT_BALANCE_TEMPLATE = `
💰 Account Balance: {{hbarBalance}} tinybars
{{#if tokenBalances}}
🪙 Token Balances:
{{#each tokenBalances}}
   {{tokenId}}: {{balance}}
{{/each}}
{{else}}
   No token balances found
{{/if}}
`.trim();
