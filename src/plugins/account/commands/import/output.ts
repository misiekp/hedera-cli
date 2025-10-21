/**
 * Import Account Command Output Schema and Template
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Import Account Command Output Schema
 */
export const ImportAccountOutputSchema = z.object({
  accountId: z.string(),
  name: z.string(),
  type: z.enum(['ECDSA', 'ED25519']),
  alias: z.string().optional(),
  network: z.string(),
  balance: z.string(),
  evmAddress: z.string(),
});

export type ImportAccountOutput = z.infer<typeof ImportAccountOutputSchema>;

// JSON Schema for manifest
export const IMPORT_ACCOUNT_OUTPUT_SCHEMA = zodToJsonSchema(
  ImportAccountOutputSchema,
  {
    name: 'ImportAccountOutput',
    $refStrategy: 'none',
  },
);

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
