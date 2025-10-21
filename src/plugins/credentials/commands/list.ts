/**
 * List Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function listHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;

  logger.log('🔐 Network Operators:');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const operators = api.kms.listOperators();
    const credentials = api.kms.list();

    if (operators.length === 0) {
      logger.log('   No network operators configured');
      logger.log(
        '   Use "credentials set" to add operators for specific networks',
      );
    } else {
      // Group operators by network
      const operatorsByNetwork = operators.reduce(
        (acc, op) => {
          if (!acc[op.network]) {
            acc[op.network] = [];
          }
          acc[op.network].push(op);
          return acc;
        },
        {} as Record<string, typeof operators>,
      );

      // Display operators grouped by network
      Object.entries(operatorsByNetwork).forEach(
        ([network, networkOperators]) => {
          logger.log(`   ${network}:`);
          networkOperators.forEach((op) => {
            const credential = credentials.find(
              (c) => c.keyRefId === op.keyRefId,
            );

            if (!credential) {
              logger.log(
                `     ${op.accountId} (key: MISSING - ${op.keyRefId})`,
              );
            } else {
              const keyType = credential.type;
              const publicKeyShort =
                credential.publicKey.substring(0, 12) + '...';
              logger.log(
                `     ${op.accountId} (key: ${keyType}_${publicKeyShort})`,
              );
            }
          });
        },
      );
    }

    logger.log('');
    logger.log('Available Keys:');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (credentials.length === 0) {
      logger.log('   No keys stored');
      logger.log('   Use "credentials set" to add keys');
    } else {
      credentials.forEach((cred) => {
        const keyType =
          cred.type === 'localPrivateKey' ? 'ECDSA' : cred.type.toUpperCase();
        const publicKeyShort = cred.publicKey.substring(0, 12) + '...';
        logger.log(`   ${publicKeyShort} | ${keyType} | ${cred.keyRefId}`);
      });
    }
  } catch (error) {
    logger.error(formatError('❌ Failed to list credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default listHandler;
