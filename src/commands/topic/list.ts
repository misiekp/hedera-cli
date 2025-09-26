import { Command } from 'commander';
import { exitOnError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import topicUtils from '../../utils/topic';

const logger = Logger.getInstance();

export default (program: Command) => {
  program
    .command('list')
    .description('List all topics')
    .action(
      exitOnError(() => {
        logger.verbose(`Listing all topic IDs and if they contain keys`);
        topicUtils.list();
      }),
    )
    .addHelpText(
      'after',
      `\nExamples:\n  $ hedera-cli topic list\n  $ hedera-cli --json topic list\n`,
    );
};
