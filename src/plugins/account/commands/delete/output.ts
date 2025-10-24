/**
 * Delete Account Command Output Schema and Template
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Delete Account Command Output Schema
 */
export const DeleteAccountOutputSchema = z.object({
  deletedAccount: z.object({
    name: z.string(),
    accountId: z.string(),
  }),
  removedAliases: z.array(z.string()).optional(),
});

export type DeleteAccountOutput = z.infer<typeof DeleteAccountOutputSchema>;

// JSON Schema for manifest
export const DELETE_ACCOUNT_OUTPUT_SCHEMA = zodToJsonSchema(
  DeleteAccountOutputSchema,
  {
    name: 'DeleteAccountOutput',
    $refStrategy: 'none',
  },
);

/**
 * Human-readable template for delete account output
 */
export const DELETE_ACCOUNT_TEMPLATE = `
✅ Account deleted successfully: {{deletedAccount.name}} ({{deletedAccount.accountId}})
{{#if removedAliases}}
🧹 Removed {{removedAliases.length}} alias(es):
{{#each removedAliases}}
   - {{this}}
{{/each}}
{{/if}}
`.trim();
