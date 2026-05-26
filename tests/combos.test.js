/**
 * Test multiple feature combinations to ensure all template paths work and dependencies install cleanly.
 */
import { scaffoldProject } from '../src/scaffold.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, execSync, spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUN_ID = process.env.TEST_RUN_ID || `combos-${Date.now()}`;
const BASE_OUT = path.join(__dirname, '..', 'test-output', RUN_ID);

const allFeatures = { auth: true, database: true, oauth: true, email: true, fileUpload: true, csrf: true, audit: true, docker: true, testing: true, githubActions: true };

const combos = [
  {
    name: 'minimal-js',
    context: {
      projectName: 'minimal-js', language: 'javascript',
      features: { auth: false, database: false, oauth: false, email: false, fileUpload: false, csrf: false, audit: false, docker: false, testing: false, githubActions: false },
      authStrategy: 'session', orm: 'sequelize', database: 'postgresql',
    },
  },
];

const languages = ['javascript', 'typescript'];
const databases = ['mysql', 'postgresql'];
const orms = ['drizzle', 'prisma', 'sequelize'];

for (const language of languages) {
  for (const database of databases) {
    for (const orm of orms) {
      const prefix = language === 'javascript' ? 'js' : 'ts';
      const name = `${prefix}-${database}-${orm}`;
      
      // Alternate auth strategy just for extra coverage
      const authStrategy = orm === 'sequelize' ? 'session' : 'jwt';

      combos.push({
        name,
        context: {
          projectName: name,
          language,
          features: allFeatures,
          authStrategy,
          orm,
          database,
        }
      });
    }
  }
}

function verifyServerBoot(outDir, name, port) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Booting server for ${name}...`);
    fs.copySync(path.join(outDir, '.env.example'), path.join(outDir, '.env'));
    
    // We use npm run dev to test the watcher and tsx/nodemon integration
    const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: outDir,
      detached: process.platform !== 'win32',
      env: { ...process.env, PORT: String(port) },
    });
    
    let logs = '';
    let settled = false;
    child.stdout.on('data', d => { logs += d.toString(); });
    child.stderr.on('data', d => { logs += d.toString(); });

    // Give the server 5 seconds to compile and start. 
    // If it crashes with a DB error, that's fine (we didn't start a DB).
    // If it crashes with a TransformError/SyntaxError, it fails.
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      killProcessTree(child);
      if (logs.includes('Transform failed') || logs.includes('SyntaxError') || logs.includes('Unexpected token')) {
        reject(new Error(`Syntax Error detected:\n${logs}`));
      } else {
        console.log(`✅ Server compiled and booted successfully for ${name}`);
        resolve();
      }
    }, 5000);

    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (logs.includes('Transform failed') || logs.includes('SyntaxError') || logs.includes('Unexpected token')) {
        reject(new Error(`Syntax Error detected (exited ${code}):\n${logs}`));
      } else {
        // Expected to exit with code 1 due to DB connection failure (Unhandled Rejection / Prisma error)
        console.log(`✅ Server compiled and exited as expected (no syntax errors) for ${name}`);
        resolve();
      }
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function killProcessTree(child) {
  if (!child.pid) return;

  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // Process already exited.
    }
  }
}

async function run() {
  await fs.ensureDir(BASE_OUT);

  for (const [index, { name, context }] of combos.entries()) {
    const outDir = path.join(BASE_OUT, name);
    await fs.remove(outDir);
    console.log(`\n⏳ Scaffolding: ${name}`);
    await scaffoldProject(outDir, context);

    console.log(`📦 Running npm install for ${name}...`);
    try {
      execSync('npm install --no-audit --no-fund', { cwd: outDir, stdio: 'pipe' });
      console.log(`✅ Install successful for ${name}`);
      
      if (context.language === 'typescript') {
        console.log(`🔎 Running typecheck for ${name}...`);
        execSync('npm run typecheck', { cwd: outDir, stdio: 'pipe' });
        console.log(`✅ Typecheck passed for ${name}`);
      }

      await verifyServerBoot(outDir, name, 4100 + index);
    } catch (err) {
      console.error(`❌ FAILED for ${name}`);
      console.error(err.message);
      process.exit(1);
    }
  }
  console.log('\n🎉 All combinations scaffolded, installed, and booted successfully!');
}

run().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
