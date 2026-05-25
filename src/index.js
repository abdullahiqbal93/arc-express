import * as p from '@clack/prompts';
import path from 'path';
import fs from 'fs-extra';
import pc from 'picocolors';
import { printBanner, printSuccess } from './banner.js';
import { collectPrompts } from './prompts.js';
import { scaffoldProject } from './scaffold.js';

/**
 * Main entry point for the CLI.
 * @param {string[]} args - CLI arguments
 */
export async function run(args) {
  printBanner();

  p.intro(pc.bgCyan(pc.black(' create-arc-express ')));

  // Parse project name from args
  const nameArg = args[0] && !args[0].startsWith('-') ? args[0] : undefined;

  // Collect user preferences
  const context = await collectPrompts(nameArg);
  if (!context) return;

  const targetDir = path.resolve(process.cwd(), context.projectName);

  // Check if directory exists
  if (await fs.pathExists(targetDir)) {
    const files = await fs.readdir(targetDir);
    if (files.length > 0) {
      const overwrite = await p.confirm({
        message: `Directory "${context.projectName}" is not empty. Overwrite?`,
        initialValue: false,
      });

      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel('Operation cancelled.');
        return process.exit(0);
      }

      await fs.emptyDir(targetDir);
    }
  }

  // Scaffold
  const spinner = p.spinner();
  spinner.start('Scaffolding project...');

  try {
    await scaffoldProject(targetDir, context);
    spinner.stop('Project scaffolded.');
  } catch (err) {
    spinner.stop('Scaffolding failed.');
    p.log.error(pc.red(err.message));
    if (process.env.DEBUG) console.error(err);
    return process.exit(1);
  }

  p.outro(pc.green('Done!'));
  printSuccess(context.projectName, context);
}
