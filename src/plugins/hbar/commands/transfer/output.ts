import { z } from 'zod';
import {
  EntityIdSchema,
  NetworkSchema,
  TinybarSchema,
  TransactionIdSchema,
} from '../../../../core/schemas/common-schemas';

export const TransferInputSchema = z.object({
  balance: z
    .number()
    .positive()
    .int()
    .describe('Amount of tinybars to transfer'),
  toIdOrNameOrAlias: z
    .string()
    .min(1)
    .describe('Account ID, name, or alias to transfer to'),
  fromIdOrNameOrAlias: z
    .string()
    .optional()
    .describe('Account ID, name, or alias to transfer from'),
  memo: z.string().optional().describe('Memo for the transfer'),
});

export const TransferOutputSchema = z.object({
  transactionId: TransactionIdSchema,
  fromAccountId: EntityIdSchema,
  toAccountId: EntityIdSchema,
  amountTinybar: TinybarSchema,
  network: NetworkSchema,
  memo: z.string().optional(),
  status: z.string().optional().describe('Transaction status if available'),
});

export type TransferInput = z.infer<typeof TransferInputSchema>;
export type TransferOutput = z.infer<typeof TransferOutputSchema>;

export const TRANSFER_TEMPLATE = `
✅ HBAR transfer submitted successfully

Transaction ID: {{transactionId}}
From: {{fromAccountId}}
To: {{toAccountId}}
Amount: {{amountTinybar}} tinybars
Network: {{network}}
{{#if memo}}
Memo: {{memo}}
{{/if}}
{{#if status}}
Status: {{status}}
{{/if}}
`.trim();
