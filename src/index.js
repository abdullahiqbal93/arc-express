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

  const { execSync } = await import('child_process');

  const shouldInstall = await p.confirm({
    message: 'Would you like to install dependencies now? (npm install)',
    initialValue: true,
  });

  if (p.isCancel(shouldInstall)) {
    p.cancel('Operation cancelled.');
    return process.exit(0);
  }

  if (shouldInstall) {
    const installSpinner = p.spinner();
    installSpinner.start('Installing dependencies...');
    try {
      execSync('npm install', { cwd: targetDir, stdio: 'ignore' });
      installSpinner.stop('Dependencies installed.');
    } catch (err) {
      installSpinner.stop('Failed to install dependencies.');
      p.log.error(pc.red('You can install them manually later using `npm install`.'));
    }
  }

  const shouldGit = await p.confirm({
    message: 'Would you like to initialize a new git repository?',
    initialValue: true,
  });

  if (p.isCancel(shouldGit)) {
    p.cancel('Operation cancelled.');
    return process.exit(0);
  }

  if (shouldGit) {
    try {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      execSync('git add .', { cwd: targetDir, stdio: 'ignore' });
      execSync('git commit -m "Initial commit from create-arc-express"', { cwd: targetDir, stdio: 'ignore' });
      p.log.success('Initialized a git repository.');
    } catch (err) {
      p.log.error(pc.red('Failed to initialize git repository. Is git installed?'));
    }
  }

  p.outro(pc.green('Done!'));
  printSuccess(context.projectName, context);
}
