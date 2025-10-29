import { z } from 'zod';

const HEDERA_ACCOUNT_ID_REGEX = /^0\.0\.\d+$/;

const accountIdSchema = z.string().regex(HEDERA_ACCOUNT_ID_REGEX, {
  message: 'Invalid account ID format. Expected: 0.0.123456',
});

export function validateAccountId(accountId: string): void {
  accountIdSchema.parse(accountId);
}
