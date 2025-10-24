/**
 * View Account Command Output Schema and Template
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * View Account Command Output Schema
 */
export const ViewAccountOutputSchema = z.object({
  accountId: z.string(),
  balance: z.string(),
  evmAddress: z.string().optional(),
  publicKey: z.string().optional(),
  balanceTimestamp: z.string(),
});

export type ViewAccountOutput = z.infer<typeof ViewAccountOutputSchema>;

// JSON Schema for manifest
export const VIEW_ACCOUNT_OUTPUT_SCHEMA = zodToJsonSchema(
  ViewAccountOutputSchema,
  {
    name: 'ViewAccountOutput',
    $refStrategy: 'none',
  },
);

/**
 * Human-readable template for view account output
 */
export const VIEW_ACCOUNT_TEMPLATE = `
📋 Account Details:
   Account ID: {{accountId}}
   Balance: {{balance}} tinybars
   EVM Address: {{#if evmAddress}}{{evmAddress}}{{else}}N/A{{/if}}
   Public Key: {{#if publicKey}}{{publicKey}}{{else}}N/A{{/if}}
   Balance Timestamp: {{balanceTimestamp}}
`.trim();
