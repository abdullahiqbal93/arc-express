/**
 * Test multiple feature combinations to ensure all template paths work and dependencies install cleanly.
 */
import { scaffoldProject } from '../src/scaffold.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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
    } catch (err) {
      console.error(`❌ Install FAILED for ${name}`);
      console.error(err.stderr ? err.stderr.toString() : err.message);
      process.exit(1);
    }
  }
  console.log('\n🎉 All combinations scaffolded and installed successfully!');
}

run().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
