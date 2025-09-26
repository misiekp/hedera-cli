import { Command } from 'commander';
import { heading } from '../../utils/color';
import scriptUtils from '../../utils/script';
import { wrapAction } from '../shared/wrapAction';

export default (program: Command) => {
  program
    .command('list')
    .description('List all scripts')
    .action(
      wrapAction(
        () => {
          scriptUtils.listScripts();
        },
        { log: 'Listing all script names' },
      ),
    )
    .addHelpText(
      'afterAll',
      `\n${heading('Examples:')}\n  $ hedera script list\n  $ hedera script list --json`,
    );
};
