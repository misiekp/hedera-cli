/**
 * Set Credentials Command Output Schema and Template
 */
import { z } from 'zod';
import {
  EntityIdSchema,
  NetworkSchema,
  PublicKeySchema,
} from '../../../../core/schemas/common-schemas';

/**
 * Set Credentials Command Output Schema
 */
export const SetCredentialsOutputSchema = z.object({
  accountId: EntityIdSchema,
  network: NetworkSchema,
  keyRefId: z.string().describe('Key reference ID for stored private key'),
  publicKey: PublicKeySchema,
  success: z
    .boolean()
    .describe('Whether the credentials were set successfully'),
});

export type SetCredentialsOutput = z.infer<typeof SetCredentialsOutputSchema>;

/**
 * Human-readable template for set credentials output
 */
export const SET_CREDENTIALS_TEMPLATE = `
✅ Operator credentials set successfully
   Account ID: {{accountId}}
   Network: {{network}}
   Key Reference ID: {{keyRefId}}
   Public Key: {{publicKey}}
`.trim();
