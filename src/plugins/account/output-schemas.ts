/**
 * Account Plugin Output Schemas
 * Defines output schemas for account commands following ADR-003
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * List Accounts Command Output Schema
 */
export const ListAccountsOutputSchema = z.object({
  accounts: z.array(
    z.object({
      name: z.string(),
      accountId: z.string(),
      type: z.enum(['ECDSA', 'ED25519']),
      network: z.string(),
      evmAddress: z.string(),
      keyRefId: z.string().optional(), // Only included when --private flag is used
    }),
  ),
  totalCount: z.number(),
});

export type ListAccountsOutput = z.infer<typeof ListAccountsOutputSchema>;

// JSON Schema for manifest
export const LIST_ACCOUNTS_OUTPUT_JSON_SCHEMA = zodToJsonSchema(
  ListAccountsOutputSchema,
  {
    name: 'ListAccountsOutput',
    $refStrategy: 'none',
  },
);

/**
 * Human-readable template for list accounts output
 */
export const LIST_ACCOUNTS_TEMPLATE = `
{{#if (eq totalCount 0)}}
📝 No accounts found in the address book
{{else}}
📝 Found {{totalCount}} account(s):

{{#each accounts}}
{{@index}}. Name: {{name}}
   Account ID: {{accountId}}
   Type: {{type}}
   Network: {{network}}
   EVM Address: {{evmAddress}}
{{#if keyRefId}}
   Key Reference ID: {{keyRefId}}
{{/if}}

{{/each}}
{{/if}}
`.trim();
