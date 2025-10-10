/**
 * Implementation of Topic Transaction Service
 * Handles topic creation and message submission
 */
import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  PrivateKey,
} from '@hashgraph/sdk';
import {
  TopicTransactionService,
  CreateTopicParams,
  TopicCreateResult,
  SubmitMessageParams,
  MessageSubmitResult,
} from './topic-transaction-service.interface';

export class HederaTopicTransactionService implements TopicTransactionService {
  createTopic(params: CreateTopicParams): TopicCreateResult {
    // Create the topic creation transaction
    const topicCreateTx = new TopicCreateTransaction();

    // Set memo if provided
    if (params.memo) {
      topicCreateTx.setTopicMemo(params.memo);
    }

    let adminPrivateKey: string | undefined;
    let submitPrivateKey: string | undefined;

    if (params.adminKey) {
      const adminKey = PrivateKey.fromStringDer(params.adminKey);
      topicCreateTx.setAdminKey(adminKey);
    }

    if (params.submitKey) {
      const submitKey = PrivateKey.fromStringDer(params.submitKey);
      topicCreateTx.setSubmitKey(submitKey);
    }

    const resultResponse: TopicCreateResult = {
      transaction: topicCreateTx,
    };

    if (adminPrivateKey) {
      resultResponse.adminPrivateKey = adminPrivateKey;
    }

    if (submitPrivateKey) {
      resultResponse.submitPrivateKey = submitPrivateKey;
    }

    return resultResponse;
  }

  submitMessage(params: SubmitMessageParams): MessageSubmitResult {
    // Create the message submission transaction
    const submitMessageTx = new TopicMessageSubmitTransaction({
      topicId: params.topicId,
      message: params.message,
    });

    return {
      transaction: submitMessageTx,
    };
  }
}
