/**
 * Quick smoke test — scaffolds a project non-interactively to verify templates render.
 */
import { scaffoldProject } from '../src/scaffold.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'test-output', 'test-api');

const context = {
  projectName: 'test-api',
  language: 'javascript',
  features: {
    auth: true,
    database: true,
    oauth: true,
    email: true,
    fileUpload: true,
    csrf: true,
    audit: true,
    docker: true,
    testing: true,
    githubActions: true,
  },
  authStrategy: 'session',
  orm: 'sequelize',
  database: 'postgresql',
};

async function run() {
  console.log('Cleaning output directory...');
  await fs.remove(OUT_DIR);

  console.log('Scaffolding with ALL features (Sequelize + PostgreSQL + Session)...');
  await scaffoldProject(OUT_DIR, context);

  // List generated files
  const files = await getAllFiles(OUT_DIR);
  const rel = files.map(f => path.relative(OUT_DIR, f));
  console.log(`\n✅ Generated ${rel.length} files:\n`);
  rel.sort().forEach(f => console.log(`  ${f}`));

  // Quick sanity checks
  const pkg = await fs.readJSON(path.join(OUT_DIR, 'package.json'));
  console.log(`\n📦 package.json name: ${pkg.name}`);
  console.log(`   dependencies: ${Object.keys(pkg.dependencies).length}`);
  console.log(`   devDependencies: ${Object.keys(pkg.devDependencies).length}`);
  console.log(`   scripts: ${Object.keys(pkg.scripts).join(', ')}`);

  const envExample = await fs.readFile(path.join(OUT_DIR, '.env.example'), 'utf-8');
  console.log(`\n📄 .env.example sections: ${(envExample.match(/^#\s*═/gm) || []).length}`);

  console.log('\n🎉 Smoke test passed!');
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

run().catch(err => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
