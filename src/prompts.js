import * as p from '@clack/prompts';
import pc from 'picocolors';

/**
 * Run all interactive prompts and return the full project context.
 * @param {string|undefined} nameArg - project name from CLI args
 */
export async function collectPrompts(nameArg) {
  // ── Project name ──────────────────────────────────────────────
  const projectName = nameArg || await p.text({
    message: 'Project name:',
    placeholder: 'my-api',
    validate: (v) => {
      if (!v.trim()) return 'Project name is required';
      if (!/^[a-z0-9._-]+$/i.test(v.trim())) return 'Invalid name (use alphanumeric, -, _, .)';
    },
  });

  if (p.isCancel(projectName)) return process.exit(0);

  // ── Language ──────────────────────────────────────────────────
  const language = await p.select({
    message: 'Language:',
    options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
    ],
  });

  if (p.isCancel(language)) return process.exit(0);

  // ── Features ──────────────────────────────────────────────────
  const selectedFeatures = await p.multiselect({
    message: 'Select features:',
    options: [
      { value: 'auth',         label: 'Authentication',             hint: 'register / login / password reset' },
      { value: 'database',     label: 'Database (ORM)',             hint: 'Sequelize, Prisma, or Drizzle' },
      { value: 'oauth',        label: 'Google OAuth SSO',           hint: 'social login via Google' },
      { value: 'email',        label: 'Email (SMTP)',               hint: 'Nodemailer transactional email' },
      { value: 'fileUpload',   label: 'File Upload',                hint: 'Cloudinary + Multer' },
      { value: 'csrf',         label: 'CSRF Protection',            hint: 'double-submit cookie pattern' },
      { value: 'audit',        label: 'Audit Logging',              hint: 'track user actions in DB' },
      { value: 'docker',       label: 'Docker Compose',             hint: 'Postgres/MySQL + Redis' },
      { value: 'testing',      label: 'Testing',                    hint: 'Jest + Supertest + Testcontainers' },
      { value: 'githubActions', label: 'GitHub Actions CI',         hint: 'automated CI pipeline' },
    ],
    required: false,
  });

  if (p.isCancel(selectedFeatures)) return process.exit(0);

  const features = {
    auth: selectedFeatures.includes('auth'),
    database: selectedFeatures.includes('database'),
    oauth: selectedFeatures.includes('oauth'),
    email: selectedFeatures.includes('email'),
    fileUpload: selectedFeatures.includes('fileUpload'),
    csrf: selectedFeatures.includes('csrf'),
    audit: selectedFeatures.includes('audit'),
    docker: selectedFeatures.includes('docker'),
    testing: selectedFeatures.includes('testing'),
    githubActions: selectedFeatures.includes('githubActions'),
  };

  // ── Auto-enable database if auth or audit is selected ─────────
  if ((features.auth || features.audit) && !features.database) {
    p.log.info(pc.dim('Auth/Audit requires a database — auto-enabling Database.'));
    features.database = true;
  }

  // ── Auth strategy ─────────────────────────────────────────────
  let authStrategy = 'session';
  if (features.auth) {
    authStrategy = await p.select({
      message: 'Auth strategy:',
      options: [
        { value: 'session', label: 'Session-based', hint: 'express-session + DB store (recommended)' },
        { value: 'jwt',     label: 'JWT',           hint: 'stateless JSON Web Tokens' },
      ],
    });
    if (p.isCancel(authStrategy)) return process.exit(0);
  }

  // ── ORM ───────────────────────────────────────────────────────
  let orm = 'sequelize';
  if (features.database) {
    orm = await p.select({
      message: 'ORM:',
      options: [
        { value: 'sequelize', label: 'Sequelize', hint: 'mature, feature-rich' },
        { value: 'prisma',    label: 'Prisma',    hint: 'modern, type-safe' },
        { value: 'drizzle',   label: 'Drizzle',   hint: 'lightweight, SQL-like' },
      ],
    });
    if (p.isCancel(orm)) return process.exit(0);
  }

  // ── Database ──────────────────────────────────────────────────
  let database = 'postgresql';
  if (features.database) {
    database = await p.select({
      message: 'Database:',
      options: [
        { value: 'postgresql', label: 'PostgreSQL', hint: 'recommended' },
        { value: 'mysql',      label: 'MySQL' },
      ],
    });
    if (p.isCancel(database)) return process.exit(0);
  }

  return {
    projectName: String(projectName).trim(),
    language,
    features,
    authStrategy,
    orm,
    database,
  };
}
