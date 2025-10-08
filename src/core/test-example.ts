/**
 * Test example to validate the Core API architecture
 * This demonstrates how plugins would use the Core API
 */
import { createCoreAPI } from './core-api/core-api';
import type { AccountData } from '../plugins/account/schema';

async function testCoreAPI() {
  console.log('🚀 Testing Core API Architecture...\n');

  // Create Core API instance
  const api = createCoreAPI();

  // Test 1: Account Transactions
  console.log('📝 Test 1: Account Transactions');
  const transaction = await api.accountTransactions.createAccount({
    balance: 10, // 10 HBAR for initial account balance
    name: 'test-account',
    maxAutoAssociations: 1000,
  });
  console.log('✅ Account transaction created\n');

  // Test 2: Signing Service
  console.log('🔐 Test 2: Signing Service');
  const result = await api.signing.signAndExecute(transaction.transaction);
  console.log(`✅ Transaction executed: ${result.transactionId}\n`);

  // Test 3: State Management
  console.log('💾 Test 3: State Management');
  api.state.set('accounts', 'test-account', {
    name: 'test-account',
    accountId: '0.0.123456',
    type: 'ECDSA',
    publicKey: 'mock-public-key',
    evmAddress: '0x1234567890abcdef',
    solidityAddress: '0x1234567890abcdef',
    solidityAddressFull: '0x1234567890abcdef',
    privateKey: 'mock-private-key',
    network: 'testnet',
  });
  const account = api.state.get<AccountData>('accounts', 'test-account');
  console.log(`✅ Account stored and retrieved: ${account?.name}\n`);

  // Test 4: Mirror Node Service
  console.log('🔍 Test 4: Mirror Node Service');
  const accountInfo = await api.mirror.getAccount('0.0.123456');
  console.log(`✅ Account info retrieved: ${accountInfo.accountId}\n`);

  // Test 5: Network Service
  console.log('🌐 Test 5: Network Service');
  const currentNetwork = api.network.getCurrentNetwork();
  const networkConfig = api.network.getNetworkConfig(currentNetwork);
  console.log(
    `✅ Current network: ${currentNetwork}, RPC: ${networkConfig.rpcUrl}\n`,
  );

  // Test 6: Config Service
  console.log('⚙️ Test 6: Config Service');
  const operatorId = api.config.getOperatorId();
  console.log(`✅ Operator ID: ${operatorId}\n`);

  // Test 7: Logger Service
  console.log('📝 Test 7: Logger Service');
  api.logger.log('Test message from Core API');
  api.logger.verbose('Verbose message');
  api.logger.error('Error message');
  console.log('✅ Logger service working\n');

  // Test 8: Token Transactions
  console.log('🪙 Test 8: Token Transactions');
  // Use the operator's private key from environment (or the account we just created)
  const treasuryKey =
    process.env.TESTNET_OPERATOR_KEY || transaction.privateKey;
  const treasuryAccountId =
    process.env.TESTNET_OPERATOR_ID || result.accountId || '0.0.5970025';

  const tokenTransaction = await api.tokenTransactions.createTokenTransaction({
    name: 'Test Token',
    symbol: 'TST',
    treasuryId: treasuryAccountId,
    decimals: 2,
    initialSupply: 1000000,
    supplyType: 'INFINITE',
    adminKey: treasuryKey,
    treasuryKey: treasuryKey,
  });
  console.log(
    `✅ Token creation transaction created: ${tokenTransaction.constructor.name}\n`,
  );

  console.log(
    '🎉 All Core API tests passed! Architecture is working correctly.',
  );
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCoreAPI()
    .then(() => {
      console.log('\n✨ Test completed successfully. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testCoreAPI };
