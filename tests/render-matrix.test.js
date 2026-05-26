/**
 * Lightweight render matrix: scaffolds every language/database/ORM combination
 * without installing dependencies in generated projects.
 */
import { scaffoldProject } from "../src/scaffold.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_OUT = path.join(__dirname, "..", "test-output", "render-matrix");

const allFeatures = {
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
};

const languages = ["javascript", "typescript"];
const databases = ["mysql", "postgresql"];
const orms = ["drizzle", "prisma", "sequelize"];

async function run() {
  await fs.remove(BASE_OUT);

  let rendered = 0;
  for (const language of languages) {
    for (const database of databases) {
      for (const orm of orms) {
        const name = `${language}-${database}-${orm}`;
        const outDir = path.join(BASE_OUT, name);
        const context = {
          projectName: name,
          language,
          database,
          orm,
          authStrategy: orm === "sequelize" ? "session" : "jwt",
          features: allFeatures,
        };

        await scaffoldProject(outDir, context);
        await assertRenderedProject(outDir, context);
        rendered += 1;
        console.log(`Rendered ${name}`);
      }
    }
  }

  assert(rendered === 12, "render matrix should cover all 12 language/database/ORM combinations");
  await assertMinimalNoDatabaseProject();
  console.log("\nRender matrix passed without generated-project dependency installs.");
}

async function assertRenderedProject(outDir, context) {
  const ext = context.language === "typescript" ? "ts" : "js";
  const files = await getAllFiles(outDir);
  const rel = files.map((file) => path.relative(outDir, file).replace(/\\/g, "/")).sort();
  const pkg = await fs.readJSON(path.join(outDir, "package.json"));
  const envExample = await fs.readFile(path.join(outDir, ".env.example"), "utf-8");

  assert(rel.includes(".npmrc"), `${context.projectName} should include generated npm config`);
  assert(rel.includes(".github/workflows/ci.yml"), `${context.projectName} should include generated GitHub Actions`);
  assert(rel.includes(`src/lib/services/audit.${ext}`), `${context.projectName} should include audit service`);
  assert(
    rel.includes(`src/api/auth/__test__/auth.integration.test.${ext}`),
    `${context.projectName} should include auth integration tests`,
  );
  assertNoEmptySourceFiles(files, outDir);
  assertDockerDatabaseUrl(envExample, context);

  const workflow = await fs.readFile(path.join(outDir, ".github", "workflows", "ci.yml"), "utf-8");
  assert(workflow.includes("npm run typecheck --if-present"), `${context.projectName} CI should run typecheck when present`);

  if (context.language === "typescript") {
    assert(pkg.scripts.typecheck, `${context.projectName} should include a typecheck script`);
    assert(!hasText(path.join(outDir, "src"), /\bany\b/), `${context.projectName} should not render explicit any in src`);
  }

  if (context.orm === "sequelize") {
    assert(rel.includes(`src/db/migrate.${ext}`), `${context.projectName} should include Sequelize migration runner`);
    assert(rel.includes(`src/db/migrations/00001-create-users.${ext}`), `${context.projectName} should include users migration`);
    assert(rel.includes(`src/db/migrations/00002-create-audit-logs.${ext}`), `${context.projectName} should include audit logs migration`);
    assert(rel.includes(`src/db/migrations/00003-create-sessions.${ext}`), `${context.projectName} should include sessions migration`);

    const server = await fs.readFile(path.join(outDir, "src", "lib", `server.${ext}`), "utf-8");
    assert(!server.includes("sessionStore.sync"), `${context.projectName} should not sync session tables at runtime`);

    const modelsIndex = await fs.readFile(path.join(outDir, "src", "db", "models", `index.${ext}`), "utf-8");
    assert(modelsIndex.includes("AuditLog"), `${context.projectName} should export the Sequelize AuditLog model`);
  } else {
    assert(!rel.includes(`src/db/models/audit-log.${ext}`), `${context.projectName} should not include empty non-Sequelize audit model files`);
  }

  if (context.orm === "prisma") {
    const schema = await fs.readFile(path.join(outDir, "src", "db", "schema.prisma"), "utf-8");
    assert(schema.includes("model AuditLog"), `${context.projectName} should include a Prisma AuditLog model`);
    assert(schema.includes("onDelete: SetNull"), `${context.projectName} should preserve audit logs when users are deleted`);
  }

  if (context.orm === "drizzle") {
    const schema = await fs.readFile(path.join(outDir, "src", "db", "schema", `index.${ext}`), "utf-8");
    assert(schema.includes("auditLogs"), `${context.projectName} should include a Drizzle auditLogs table`);
  }
}

async function assertMinimalNoDatabaseProject() {
  const outDir = path.join(BASE_OUT, "minimal-no-db");
  const context = {
    projectName: "minimal-no-db",
    language: "typescript",
    database: "postgresql",
    orm: "sequelize",
    authStrategy: "session",
    features: {
      auth: false,
      database: false,
      oauth: false,
      email: false,
      fileUpload: false,
      csrf: false,
      audit: false,
      docker: false,
      testing: false,
      githubActions: false,
    },
  };

  await scaffoldProject(outDir, context);

  const pkg = await fs.readJSON(path.join(outDir, "package.json"));
  const envExample = await fs.readFile(path.join(outDir, ".env.example"), "utf-8");
  const readme = await fs.readFile(path.join(outDir, "README.md"), "utf-8");

  assert(!pkg.scripts["db:migrate"], "minimal projects should not include database migration scripts");
  assert(!envExample.includes("DATABASE_URL="), "minimal projects should not include DATABASE_URL");
  assert(!envExample.includes("LOG_SQL="), "minimal projects should not include Sequelize logging config");
  assert(!readme.includes("db:migrate"), "minimal project README should not reference database migration scripts");
}

function assertDockerDatabaseUrl(envExample, context) {
  if (context.database === "postgresql") {
    assert(
      envExample.includes("DATABASE_URL=postgres://app_user:app_pass@localhost:5432/app_db"),
      `${context.projectName} should align PostgreSQL DATABASE_URL with docker-compose credentials`,
    );
  } else {
    assert(
      envExample.includes("DATABASE_URL=mysql://app_user:app_pass@localhost:3306/app_db"),
      `${context.projectName} should align MySQL DATABASE_URL with docker-compose credentials`,
    );
  }
}

function assertNoEmptySourceFiles(files, outDir) {
  for (const file of files) {
    const rel = path.relative(outDir, file).replace(/\\/g, "/");
    if (!rel.startsWith("src/")) continue;
    if (!/\.(js|ts)$/.test(rel)) continue;

    const contents = fs.readFileSync(file, "utf-8");
    assert(contents.trim().length > 0, `${rel} should not be empty`);
  }
}

function hasText(dir, pattern) {
  if (!fs.pathExistsSync(dir)) return false;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (hasText(full, pattern)) return true;
    } else if (/\.(ts|js)$/.test(entry.name)) {
      const contents = fs.readFileSync(full, "utf-8");
      if (pattern.test(contents)) return true;
    }
  }

  return false;
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

run().catch((err) => {
  console.error("Render matrix failed:", err);
  process.exit(1);
});
