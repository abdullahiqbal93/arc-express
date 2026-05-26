import * as p from '@clack/prompts';
import path from 'path';
import fs from 'fs-extra';
import pc from 'picocolors';
import { spawn, execSync } from 'child_process';
import { printBanner, printSuccess } from './banner.js';
import { collectPrompts } from './prompts.js';
import { scaffoldProject } from './scaffold.js';

/**
 * Run npm install with a live-updating spinner.
 * Parses npm output to show meaningful progress (e.g. "added 312 packages").
 */
function runInstallWithSpinner(cwd) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const installSpinner = p.spinner();
    installSpinner.start('Installing packages...');

    const child = spawn('npm', ['install', '--no-fund'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWin,
    });

    let lastMeaningfulLine = '';
    let packageCount = 0;
    const errors = [];

    const parseLine = (line) => {
      // Pick up "added N packages" or "changed N packages"
      const match = line.match(/(?:added|changed|removed|updated)\s+(\d+)\s+packages?/i);
      if (match) {
        packageCount = parseInt(match[1], 10);
        installSpinner.message(`Installing packages... ${pc.dim(`(${packageCount} packages so far)`)}`);
        return;
      }

      // Show the current package being resolved as subtle progress
      const resolving = line.match(/^npm warn deprecated (.+?):/i);
      if (resolving) return; // skip deprecated warnings from progress updates

      // Show short meaningful progress lines
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('npm warn') && !trimmed.startsWith('npm notice')) {
        lastMeaningfulLine = trimmed.slice(0, 60);
        installSpinner.message(`Installing packages... ${pc.dim(lastMeaningfulLine)}`);
      }
    };

    child.stdout.on('data', (d) => {
      d.toString().split('\n').forEach(parseLine);
    });

    child.stderr.on('data', (d) => {
      const text = d.toString();
      // Filter out internal Node.js & husky noise
      if (
        text.includes('DeprecationWarning') ||
        text.includes('[DEP') ||
        text.includes(".git can't be found")
      ) return;

      // Collect real npm errors
      const lines = text.split('\n').filter(l => l.includes('npm error') || l.includes('ERR!'));
      errors.push(...lines);
    });

    child.on('close', (code) => {
      if (code === 0) {
        const summary = packageCount > 0
          ? `${pc.green('✓')} ${pc.bold(packageCount + ' packages')} installed`
          : 'Dependencies installed';
        installSpinner.stop(`Packages installed. ${pc.dim(summary)}`);
        resolve();
      } else {
        installSpinner.stop(pc.red('Installation failed.'));
        reject(new Error(errors.join('\n') || `npm install exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      installSpinner.stop(pc.red('Installation failed.'));
      reject(err);
    });
  });
}

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

  // Check if directory exists and is non-empty
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

  // Scaffold the project files
  const spinner = p.spinner();
  spinner.start('Scaffolding project...');

  try {
    await scaffoldProject(targetDir, context);
    spinner.stop('Project scaffolded successfully.');
  } catch (err) {
    spinner.stop('Scaffolding failed.');
    p.log.error(pc.red(err.message));
    if (process.env.DEBUG) console.error(err);
    return process.exit(1);
  }

  // ── Install dependencies ────────────────────────────────────────────────
  const shouldInstall = await p.confirm({
    message: 'Would you like to install dependencies now? (npm install)',
    initialValue: true,
  });

  if (p.isCancel(shouldInstall)) {
    p.cancel('Operation cancelled.');
    return process.exit(0);
  }

  if (shouldInstall) {
    try {
      await runInstallWithSpinner(targetDir);
    } catch (err) {
      p.log.error(pc.red(`Install failed: ${err.message}`));
      p.log.warn(pc.yellow('You can install them manually later using `npm install`.'));
    }
  }

  // ── Git init ────────────────────────────────────────────────────────────
  const shouldGit = await p.confirm({
    message: 'Would you like to initialize a new git repository?',
    initialValue: true,
  });

  if (p.isCancel(shouldGit)) {
    p.cancel('Operation cancelled.');
    return process.exit(0);
  }

  if (shouldGit) {
    const gitSpinner = p.spinner();
    gitSpinner.start('Initializing git repository...');
    try {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      execSync('git add .', { cwd: targetDir, stdio: 'ignore' });
      execSync('git commit -m "Initial commit from create-arc-express"', { cwd: targetDir, stdio: 'ignore' });
      gitSpinner.stop('Git repository initialized.');
    } catch {
      gitSpinner.stop(pc.red('Failed to initialize git repository.'));
      p.log.warn(pc.yellow('Is git installed? You can run `git init` manually.'));
    }
  }

  p.outro(pc.green('Done!'));
  printSuccess(context.projectName, context);
}
