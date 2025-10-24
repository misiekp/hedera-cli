/**
 * Create Account Command Output Schema and Template
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Create Account Command Output Schema
 */
export const CreateAccountOutputSchema = z.object({
  accountId: z.string(),
  name: z.string(),
  type: z.enum(['ECDSA', 'ED25519']),
  alias: z.string().optional(),
  network: z.string(),
  transactionId: z.string(),
  evmAddress: z.string(),
  publicKey: z.string(),
});

export type CreateAccountOutput = z.infer<typeof CreateAccountOutputSchema>;

// JSON Schema for manifest
export const CREATE_ACCOUNT_OUTPUT_SCHEMA = zodToJsonSchema(
  CreateAccountOutputSchema,
  {
    name: 'CreateAccountOutput',
    $refStrategy: 'none',
  },
);

/**
 * Human-readable template for create account output
 */
export const CREATE_ACCOUNT_TEMPLATE = `
✅ Account created successfully: {{accountId}}
   Name: {{name}}
   Type: {{type}}
{{#if alias}}
   Alias: {{alias}}
{{/if}}
   Network: {{network}}
   EVM Address: {{evmAddress}}
   Public Key: {{publicKey}}
   Transaction ID: {{transactionId}}
`.trim();
