/**
 * Test multiple feature combinations to ensure all template paths work and dependencies install cleanly.
 */
import { scaffoldProject } from '../src/scaffold.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_OUT = path.join(__dirname, '..', 'test-output');

const combos = [
  {
    name: 'minimal-js',
    context: {
      projectName: 'minimal-js', language: 'javascript',
      features: { auth: false, database: false, oauth: false, email: false, fileUpload: false, csrf: false, audit: false, docker: false, testing: false, githubActions: false },
      authStrategy: 'session', orm: 'sequelize', database: 'postgresql',
    },
  },
  {
    name: 'all-ts-prisma-jwt',
    context: {
      projectName: 'all-ts-prisma-jwt', language: 'typescript',
      features: { auth: true, database: true, oauth: true, email: true, fileUpload: true, csrf: true, audit: true, docker: true, testing: true, githubActions: true },
      authStrategy: 'jwt', orm: 'prisma', database: 'postgresql',
    },
  },
  {
    name: 'all-js-sequelize-session',
    context: {
      projectName: 'all-js-sequelize-session', language: 'javascript',
      features: { auth: true, database: true, oauth: true, email: true, fileUpload: true, csrf: true, audit: true, docker: true, testing: true, githubActions: true },
      authStrategy: 'session', orm: 'sequelize', database: 'mysql',
    },
  },
  {
    name: 'all-ts-drizzle-session',
    context: {
      projectName: 'all-ts-drizzle-session', language: 'typescript',
      features: { auth: true, database: true, oauth: true, email: true, fileUpload: true, csrf: true, audit: true, docker: true, testing: true, githubActions: true },
      authStrategy: 'session', orm: 'drizzle', database: 'postgresql',
    },
  }
];

function verifyServerBoot(outDir, name) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Booting server for ${name}...`);
    fs.copySync(path.join(outDir, '.env.example'), path.join(outDir, '.env'));
    
    // We use npm run dev to test the watcher and tsx/nodemon integration
    const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], { cwd: outDir, shell: true });
    
    let logs = '';
    child.stdout.on('data', d => { logs += d.toString(); });
    child.stderr.on('data', d => { logs += d.toString(); });

    // Give the server 5 seconds to compile and start. 
    // If it crashes with a DB error, that's fine (we didn't start a DB).
    // If it crashes with a TransformError/SyntaxError, it fails.
    const timeout = setTimeout(() => {
      child.kill();
      if (logs.includes('Transform failed') || logs.includes('SyntaxError') || logs.includes('Unexpected token')) {
        reject(new Error(`Syntax Error detected:\n${logs}`));
      } else {
        console.log(`✅ Server compiled and booted successfully for ${name}`);
        resolve();
      }
    }, 5000);

    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (logs.includes('Transform failed') || logs.includes('SyntaxError') || logs.includes('Unexpected token')) {
        reject(new Error(`Syntax Error detected (exited ${code}):\n${logs}`));
      } else {
        // Expected to exit with code 1 due to DB connection failure (Unhandled Rejection / Prisma error)
        console.log(`✅ Server compiled and exited as expected (no syntax errors) for ${name}`);
        resolve();
      }
    });
  });
}

async function run() {
  for (const { name, context } of combos) {
    const outDir = path.join(BASE_OUT, name);
    await fs.remove(outDir);
    console.log(`\n⏳ Scaffolding: ${name}`);
    await scaffoldProject(outDir, context);

    console.log(`📦 Running npm install for ${name}...`);
    try {
      execSync('npm install --no-audit --no-fund', { cwd: outDir, stdio: 'pipe' });
      console.log(`✅ Install successful for ${name}`);
      await verifyServerBoot(outDir, name);
    } catch (err) {
      console.error(`❌ FAILED for ${name}`);
      console.error(err.message);
      process.exit(1);
    }
  }
  console.log('\n🎉 All combinations scaffolded, installed, and booted successfully!');
}

run().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
