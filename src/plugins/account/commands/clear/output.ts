/**
 * Clear Accounts Command Output Schema and Template
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Clear Accounts Command Output Schema
 */
export const ClearAccountsOutputSchema = z.object({
  clearedCount: z.number(),
});

export type ClearAccountsOutput = z.infer<typeof ClearAccountsOutputSchema>;

// JSON Schema for manifest
export const CLEAR_ACCOUNTS_OUTPUT_SCHEMA = zodToJsonSchema(
  ClearAccountsOutputSchema,
  {
    name: 'ClearAccountsOutput',
    $refStrategy: 'none',
  },
);

/**
 * Human-readable template for clear accounts output
 */
export const CLEAR_ACCOUNTS_TEMPLATE = `
✅ Cleared {{clearedCount}} account(s) from the address book
`.trim();
