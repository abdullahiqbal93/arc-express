import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Scaffold the project by composing base + feature templates.
 * @param {string} targetDir - Absolute path to the output directory
 * @param {object} context   - The full project context
 */
export async function scaffoldProject(targetDir, context) {
  await fs.ensureDir(targetDir);

  // 1. Always copy base template
  await copyTemplate('base', targetDir, context);

  // 2. Copy feature templates
  if (context.features.database) {
    await copyTemplate(`database/${context.orm}`, targetDir, context);
  }

  if (context.features.auth) {
    await copyTemplate('auth', targetDir, context);
    if (context.orm !== 'sequelize') {
      await fs.remove(path.join(targetDir, 'src', 'db', 'models'));
    }
  }

  if (context.features.oauth) {
    await copyTemplate('oauth', targetDir, context);
  }

  if (context.features.email) {
    await copyTemplate('email', targetDir, context);
  }

  if (context.features.fileUpload) {
    await copyTemplate('file-upload', targetDir, context);
  }

  if (context.features.csrf) {
    await copyTemplate('csrf', targetDir, context);
  }

  if (context.features.audit) {
    await copyTemplate('audit', targetDir, context);
  }

  if (context.features.docker) {
    await copyTemplate('docker', targetDir, context);
  }

  if (context.features.testing) {
    await copyTemplate('testing', targetDir, context);
  }

  if (context.features.githubActions) {
    await copyTemplate('github-actions', targetDir, context);
  }

  if (context.language === 'typescript') {
    await copyTemplate('typescript', targetDir, context);
  }

  // 3. Generate dynamic files
  await generatePackageJson(targetDir, context);
  await generateEnvExample(targetDir, context);
  await generateReadme(targetDir, context);
}

/**
 * Recursively copy a template directory, rendering .ejs files.
 */
async function copyTemplate(templateName, targetDir, context) {
  const srcDir = path.join(TEMPLATES_DIR, templateName);
  if (!await fs.pathExists(srcDir)) return;

  const files = await getAllFiles(srcDir);

  for (const filePath of files) {
    let relativePath = path.relative(srcDir, filePath);
    let outputRelPath = relativePath;

    // Rename _gitignore → .gitignore (npm strips .gitignore from packages)
    outputRelPath = outputRelPath.replace(/(?:^|[\\/])_gitignore$/, '.gitignore');

    // Skip JS-only config files when TypeScript is selected
    const basename = path.basename(filePath);
    if (context.language === 'typescript') {
      if (basename === 'jsconfig.json' || basename === 'nodemon.json') continue;
    }

    // Render EJS templates
    if (filePath.endsWith('.ejs')) {
      outputRelPath = relativePath.slice(0, -4); // strip .ejs
      const template = await fs.readFile(filePath, 'utf-8');
      const rendered = ejs.render(template, context, { filename: filePath });

      // Swap .js → .ts if TypeScript
      if (context.language === 'typescript' && outputRelPath.endsWith('.js')) {
        outputRelPath = outputRelPath.slice(0, -3) + '.ts';
      }

      const outputPath = path.join(targetDir, outputRelPath);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, rendered, 'utf-8');
    } else {
      // Swap .js → .ts if TypeScript
      if (context.language === 'typescript' && outputRelPath.endsWith('.js')) {
        outputRelPath = outputRelPath.slice(0, -3) + '.ts';
      }

      const outputPath = path.join(targetDir, outputRelPath);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.copy(filePath, outputPath, { overwrite: true });
    }
  }
}

/**
 * Recursively list all files in a directory.
 */
async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Generate package.json programmatically.
 */
async function generatePackageJson(targetDir, context) {
  const { resolveDependencies } = await import('./dependencies.js');
  const { dependencies, devDependencies } = resolveDependencies(context);

  const ext = context.language === 'typescript' ? 'ts' : 'js';
  const runner = context.language === 'typescript' ? 'tsx' : 'node';

  const pkg = {
    name: context.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: context.language === 'typescript'
        ? 'tsx watch src/app.ts'
        : 'nodemon src/app.js',
      start: `${runner} src/app.${ext}`,
      prepare: 'husky || true',
    },
    engines: { node: '>=18.0.0' },
    dependencies,
    devDependencies,
    overrides: {
      uuid: "^11.0.0"
    },
  };

  // Add DB scripts
  if (context.features.database) {
    if (context.orm === 'sequelize') {
      pkg.scripts['db:migrate'] = `${runner} src/db/migrate.${ext} up`;
      pkg.scripts['db:migrate:down'] = `${runner} src/db/migrate.${ext} down`;
      pkg.scripts['db:seed'] = `${runner} src/db/seed.${ext}`;
    } else if (context.orm === 'prisma') {
      pkg.scripts['db:migrate'] = 'npx prisma migrate dev';
      pkg.scripts['db:generate'] = 'npx prisma generate';
      pkg.scripts['db:seed'] = `${runner} src/db/seed.${ext}`;
      pkg.scripts['db:studio'] = 'npx prisma studio';
    } else if (context.orm === 'drizzle') {
      pkg.scripts['db:generate'] = 'npx drizzle-kit generate';
      pkg.scripts['db:migrate'] = 'npx drizzle-kit migrate';
      pkg.scripts['db:seed'] = `${runner} src/db/seed.${ext}`;
      pkg.scripts['db:studio'] = 'npx drizzle-kit studio';
    }
  }

  // Testing scripts
  if (context.features.testing) {
    pkg.scripts.test = 'vitest run';
    pkg.scripts['test:watch'] = 'vitest';
    pkg.scripts['test:coverage'] = 'vitest run --coverage';
  }

  await fs.writeJSON(path.join(targetDir, 'package.json'), pkg, { spaces: 2 });
}

/**
 * Generate .env.example based on selected features.
 */
async function generateEnvExample(targetDir, context) {
  const lines = [
    '# ══════════════════════════════════════════',
    '# Server',
    '# ══════════════════════════════════════════',
    'NODE_ENV=development',
    'PORT=3000',
    'CLIENT_BASE_URL=http://localhost:5173',
    'API_BASE_URL=http://localhost:3000/api/v1',
    '',
  ];

  if (context.features.database) {
    lines.push('# ══════════════════════════════════════════');
    lines.push('# Database');
    lines.push('# ══════════════════════════════════════════');
    if (context.database === 'postgresql') {
      lines.push('DATABASE_URL=postgres://postgres:password@localhost:5432/mydb');
    } else {
      lines.push('DATABASE_URL=mysql://root:password@localhost:3306/mydb');
    }
    lines.push('');
  }

  if (context.features.auth) {
    if (context.authStrategy === 'session') {
      lines.push('# ══════════════════════════════════════════');
      lines.push('# Session');
      lines.push('# ══════════════════════════════════════════');
      lines.push('SESSION_SECRET=change-me-to-a-random-64-char-string');
    } else {
      lines.push('# ══════════════════════════════════════════');
      lines.push('# JWT');
      lines.push('# ══════════════════════════════════════════');
      lines.push('JWT_SECRET=change-me-to-a-random-64-char-string');
      lines.push('JWT_EXPIRES_IN=7d');
    }
    lines.push('SALT_FACTOR=10');
    lines.push('');
  }

  if (context.features.email) {
    lines.push('# ══════════════════════════════════════════');
    lines.push('# Email (SMTP)');
    lines.push('# ══════════════════════════════════════════');
    lines.push('SMTP_HOST=smtp.gmail.com');
    lines.push('SMTP_PORT=587');
    lines.push('SMTP_SECURE=false');
    lines.push('SMTP_USER=yourname@gmail.com');
    lines.push('SMTP_PASSWORD=xxxx xxxx xxxx xxxx');
    lines.push('EMAIL_FROM="App" <yourname@gmail.com>');
    lines.push('');
  }

  if (context.features.oauth) {
    lines.push('# ══════════════════════════════════════════');
    lines.push('# Google OAuth');
    lines.push('# ══════════════════════════════════════════');
    lines.push('GOOGLE_CLIENT_ID=');
    lines.push('GOOGLE_CLIENT_SECRET=');
    lines.push('GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback');
    lines.push('');
  }

  if (context.features.fileUpload) {
    lines.push('# ══════════════════════════════════════════');
    lines.push('# Cloudinary');
    lines.push('# ══════════════════════════════════════════');
    lines.push('CLOUDINARY_CLOUD_NAME=');
    lines.push('CLOUDINARY_API_KEY=');
    lines.push('CLOUDINARY_API_SECRET=');
    lines.push('');
  }

  lines.push('# ══════════════════════════════════════════');
  lines.push('# Misc');
  lines.push('# ══════════════════════════════════════════');
  lines.push('LOG_LEVEL=debug');
  lines.push('');

  await fs.writeFile(path.join(targetDir, '.env.example'), lines.join('\n'), 'utf-8');
}

/**
 * Generate README.md for the project.
 */
async function generateReadme(targetDir, context) {
  const lines = [
    `# ${context.projectName}`,
    '',
    `> Scaffolded with [create-arc-express](https://github.com/abdullahiqbal93/arc-express)`,
    '',
    '## Quick Start',
    '',
    '```bash',
    'npm install',
    'cp .env.example .env    # edit with your values',
  ];

  if (context.orm === 'prisma') {
    lines.push('npx prisma generate');
    lines.push('npx prisma migrate dev');
  }

  lines.push('npm run dev');
  lines.push('```');
  lines.push('');

  // Features section
  lines.push('## Features');
  lines.push('');
  const featureList = {
    auth: `- ✅ **Authentication** (${context.authStrategy === 'jwt' ? 'JWT' : 'Session-based'})`,
    database: `- ✅ **Database** (${context.orm} + ${context.database})`,
    oauth: '- ✅ **Google OAuth SSO**',
    email: '- ✅ **Email** (Nodemailer SMTP)',
    fileUpload: '- ✅ **File Upload** (Cloudinary + Multer)',
    csrf: '- ✅ **CSRF Protection**',
    audit: '- ✅ **Audit Logging**',
    docker: '- ✅ **Docker Compose**',
    testing: '- ✅ **Testing** (Jest + Supertest)',
    githubActions: '- ✅ **GitHub Actions CI**',
  };
  for (const [key, label] of Object.entries(featureList)) {
    if (context.features[key]) lines.push(label);
  }
  lines.push('');

  // Scripts
  lines.push('## Scripts');
  lines.push('');
  lines.push('| Command | Description |');
  lines.push('|---------|-------------|');
  lines.push('| `npm run dev` | Start development server with hot-reload |');
  lines.push('| `npm start` | Start production server |');
  if (context.features.database) {
    lines.push('| `npm run db:migrate` | Run database migrations |');
    lines.push('| `npm run db:seed` | Seed the database |');
  }
  if (context.features.testing) {
    lines.push('| `npm test` | Run test suite |');
    lines.push('| `npm run test:coverage` | Run tests with coverage report |');
  }
  lines.push('');

  // Structure
  lines.push('## Project Structure');
  lines.push('');
  lines.push('```');
  lines.push('src/');
  lines.push('├── api/              # Route handlers (controller + schema + tests)');
  lines.push('│   └── status/       # Health check endpoint');
  lines.push('├── db/               # Models, migrations, seeds');
  lines.push('└── lib/              # Shared infrastructure');
  lines.push('    ├── config.js     # Environment variables');
  lines.push('    ├── server.js     # Express app factory');
  lines.push('    ├── logger/       # Winston + Morgan logging');
  lines.push('    ├── middlewares/  # Auth, validation, CSRF, etc.');
  lines.push('    ├── services/     # Error/success response helpers');
  lines.push('    └── utils/        # Reusable utilities');
  lines.push('```');
  lines.push('');
  lines.push('## License');
  lines.push('');
  lines.push('MIT');
  lines.push('');

  await fs.writeFile(path.join(targetDir, 'README.md'), lines.join('\n'), 'utf-8');
}
