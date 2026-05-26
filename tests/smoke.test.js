/**
 * Quick smoke test — scaffolds a project non-interactively to verify templates render.
 */
import { scaffoldProject } from '../src/scaffold.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_OUT = path.join(__dirname, '..', 'test-output');

const baseContext = {
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
  const cases = [
    { projectName: 'test-api-js', language: 'javascript' },
    { projectName: 'test-api-ts', language: 'typescript' },
  ];

  for (const testCase of cases) {
    const outDir = path.join(BASE_OUT, testCase.projectName);
    const context = { ...baseContext, ...testCase };

    console.log(`Cleaning output directory for ${testCase.projectName}...`);
    await fs.remove(outDir);

    console.log(`Scaffolding ${testCase.language} with ALL features...`);
    await scaffoldProject(outDir, context);

    const files = await getAllFiles(outDir);
    const rel = files.map((f) => path.relative(outDir, f)).sort();
    console.log(`\n✅ ${testCase.projectName}: generated ${rel.length} files`);

    const pkg = await fs.readJSON(path.join(outDir, 'package.json'));
    const envExample = await fs.readFile(path.join(outDir, '.env.example'), 'utf-8');

    assert(pkg.name === testCase.projectName, 'package.json name should match project name');
    assert(!pkg.devDependencies['eslint-plugin-prettier'], 'generated lint config should not require eslint-plugin-prettier');
    assert(envExample.includes('CSRF_SECRET='), '.env.example should include CSRF_SECRET when CSRF is selected');
    assert(rel.includes('.npmrc'), 'generated projects should include the npm config template');
    assert(rel.includes(path.join('.github', 'workflows', 'ci.yml')), 'GitHub Actions workflow should be generated');

    if (testCase.language === 'typescript') {
      assert(pkg.scripts.typecheck === 'tsc --noEmit', 'TypeScript projects should include a typecheck script');
      assert(rel.includes('eslint.config.js'), 'TypeScript projects should keep eslint.config.js');
      assert(!rel.includes('eslint.config.ts'), 'TypeScript projects should not generate eslint.config.ts');
      assert(rel.includes(path.join('src', 'types', 'express.d.ts')), 'TypeScript projects should include Express request augmentation');

      const tsconfig = await fs.readJSON(path.join(outDir, 'tsconfig.json'));
      assert(tsconfig.compilerOptions.strict === true, 'TypeScript projects should keep strict mode enabled');
      assert(tsconfig.compilerOptions.noEmit === true, 'TypeScript projects should typecheck without emitting files');
      assert(tsconfig.compilerOptions.allowImportingTsExtensions === true, 'TypeScript projects should support generated .ts imports');

      const swagger = await fs.readFile(path.join(outDir, 'src', 'lib', 'swagger.ts'), 'utf-8');
      assert(!swagger.includes('&#34;'), 'TypeScript Swagger template should not HTML-escape quotes');
      assert(swagger.includes('app: Application'), 'TypeScript Swagger template should render a valid Application type');
    }

    console.log(`   dependencies: ${Object.keys(pkg.dependencies).length}`);
    console.log(`   devDependencies: ${Object.keys(pkg.devDependencies).length}`);
    console.log(`   scripts: ${Object.keys(pkg.scripts).join(', ')}`);
  }

  console.log('\n🎉 Smoke test passed!');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
