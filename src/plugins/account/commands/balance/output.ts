/**
 * Account Balance Command Output Schema and Template
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Account Balance Command Output Schema
 */
export const AccountBalanceOutputSchema = z.object({
  accountId: z.string(),
  hbarBalance: z.string(),
  tokenBalances: z
    .array(
      z.object({
        tokenId: z.string(),
        balance: z.string(),
      }),
    )
    .optional(),
});

export type AccountBalanceOutput = z.infer<typeof AccountBalanceOutputSchema>;

// JSON Schema for manifest
export const ACCOUNT_BALANCE_OUTPUT_SCHEMA = zodToJsonSchema(
  AccountBalanceOutputSchema,
  {
    name: 'AccountBalanceOutput',
    $refStrategy: 'none',
  },
);

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
