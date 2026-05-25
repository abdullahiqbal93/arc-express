/**
 * Test multiple feature combinations to ensure all template paths work.
 */
import { scaffoldProject } from '../src/scaffold.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_OUT = path.join(__dirname, '..', 'test-output');

const combos = [
  {
    name: 'minimal-js',
    context: {
      projectName: 'minimal-js',
      language: 'javascript',
      features: { auth: false, database: false, oauth: false, email: false, fileUpload: false, csrf: false, audit: false, docker: false, testing: false, githubActions: false },
      authStrategy: 'session', orm: 'sequelize', database: 'postgresql',
    },
  },
  {
    name: 'prisma-jwt-ts',
    context: {
      projectName: 'prisma-jwt-ts',
      language: 'typescript',
      features: { auth: true, database: true, oauth: false, email: true, fileUpload: false, csrf: false, audit: false, docker: true, testing: false, githubActions: false },
      authStrategy: 'jwt', orm: 'prisma', database: 'postgresql',
    },
  },
  {
    name: 'drizzle-mysql',
    context: {
      projectName: 'drizzle-mysql',
      language: 'javascript',
      features: { auth: true, database: true, oauth: true, email: false, fileUpload: true, csrf: false, audit: true, docker: true, testing: true, githubActions: true },
      authStrategy: 'session', orm: 'drizzle', database: 'mysql',
    },
  },
];

async function run() {
  for (const { name, context } of combos) {
    const outDir = path.join(BASE_OUT, name);
    await fs.remove(outDir);
    console.log(`\n⏳ Testing: ${name}`);
    await scaffoldProject(outDir, context);

    const files = await getAllFiles(outDir);
    const pkg = await fs.readJSON(path.join(outDir, 'package.json'));
    console.log(`   ✅ ${files.length} files, ${Object.keys(pkg.dependencies).length} deps, ${Object.keys(pkg.devDependencies).length} devDeps`);
  }
  console.log('\n🎉 All combinations passed!');
}

async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await getAllFiles(full));
    else files.push(full);
  }
  return files;
}

run().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
