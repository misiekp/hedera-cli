import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';

/**
 * Interface for Topic-related transaction operations
 * All topic transaction services must implement this interface
 */
export interface TopicService {
  /**
   * Create a new Hedera topic
   */
  createTopic(params: CreateTopicParams): TopicCreateResult;

  /**
   * Submit a message to a topic
   */
  submitMessage(params: SubmitMessageParams): MessageSubmitResult;
}

export interface TopicCreateResult {
  transaction: TopicCreateTransaction;
}

export interface MessageSubmitResult {
  transaction: TopicMessageSubmitTransaction;
  sequenceNumber?: number;
}

// Parameter types for topic operations
export interface CreateTopicParams {
  memo?: string;
  adminKey?: string;
  submitKey?: string;
}

export interface SubmitMessageParams {
  topicId: string;
  message: string;
}
