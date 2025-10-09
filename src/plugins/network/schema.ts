/**
 * Network Plugin Schema
 * Validation schema for network configuration
 */
import { z } from 'zod';

// Zod schema for runtime validation of network configuration
export const NetworkConfigSchema = z.object({
  mirrorNodeUrl: z
    .string()
    .url('Mirror Node URL must be a valid URL')
    .regex(
      /^https?:\/\//,
      'Mirror Node URL must start with http:// or https://',
    ),

  rpcUrl: z
    .string()
    .url('RPC URL must be a valid URL')
    .regex(/^https?:\/\//, 'RPC URL must start with http:// or https://'),

  operatorId: z
    .string()
    .regex(/^0\.0\.[0-9]+$/, 'Operator ID must be in format 0.0.123456')
    .or(z.literal(''))
    .optional()
    .default(''),

  operatorKey: z.string().default(''),

  hexKey: z.string().default(''),
});

// TypeScript type inferred from Zod schema
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;

/**
 * Validate network config data using Zod schema
 */
export function validateNetworkConfig(data: unknown): data is NetworkConfig {
  try {
    NetworkConfigSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate network config with detailed error messages
 */
export function parseNetworkConfig(data: unknown): NetworkConfig {
  return NetworkConfigSchema.parse(data);
}

/**
 * Safe parse network config (returns success/error instead of throwing)
 */
export function safeParseNetworkConfig(data: unknown) {
  return NetworkConfigSchema.safeParse(data);
}
