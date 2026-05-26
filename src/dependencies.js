/**
 * Maps feature selections to npm dependencies and devDependencies.
 */

// ── Base (always included) ─────────────────────────────────────────────
const BASE_DEPS = {
  'express':            '^4.21.2',
  'dotenv':             '^16.4.7',
  'cors':               '^2.8.5',
  'helmet':             '^8.0.0',
  'cookie-parser':      '^1.4.7',
  'morgan':             '^1.10.0',
  'winston':            '^3.17.0',
  'triple-beam':        '^1.4.1',
  'http-status-codes':  '^2.3.0',
  'zod':                '^3.24.1',
  'sanitize-html':      '^2.17.1',
  'chalk':              '^5.4.1',
  'date-fns':           '^4.1.0',
  '@date-fns/tz':       '^1.2.0',
  'swagger-ui-express': '^5.0.1',
  'swagger-jsdoc':      '^6.2.8',
};

const BASE_DEV_DEPS = {
  'nodemon':   '^3.1.9',
  'eslint':    '^9.0.0',
  'prettier':  '^3.4.2',
  'eslint-config-prettier': '^9.1.0',
  'globals':   '^15.0.0',
  'husky':     '^9.1.7',
};

// ── Feature-specific dependencies ──────────────────────────────────────

const FEATURE_DEPS = {
  auth: {
    deps: {
      'bcryptjs':           '^2.4.3',
      'express-rate-limit': '^7.5.0',
    },
    devDeps: {},
  },

  'auth-session': {
    deps: {
      'express-session': '^1.19.0',
    },
    devDeps: {},
  },

  'auth-jwt': {
    deps: {
      'jsonwebtoken': '^9.0.2',
    },
    devDeps: {},
  },

  // Session stores per ORM
  'session-store-sequelize': {
    deps: { 'connect-session-sequelize': '^8.0.5' },
    devDeps: {},
  },

  oauth: {
    deps: {},
    devDeps: {},
  },

  email: {
    deps: { 'nodemailer': '^8.0.1' },
    devDeps: {},
  },

  fileUpload: {
    deps: {
      'cloudinary': '^2.5.1',
      'multer':     '^2.1.1',
    },
    devDeps: {},
  },

  csrf: {
    deps: { 'csrf-csrf': '^4.0.3' },
    devDeps: {},
  },

  audit: {
    deps: {},
    devDeps: {},
  },

  docker: {
    deps: {},
    devDeps: {},
  },

  testing: {
    deps: {},
    devDeps: {
      'vitest':           '^3.0.0',
      '@vitest/coverage-v8': '^3.0.0',
      'supertest':        '^7.2.2',
      '@faker-js/faker':  '^10.4.0',
      'testcontainers':   '^12.0.0',
      'kill-port':        '^2.0.1',
    },
  },

  githubActions: {
    deps: {},
    devDeps: {},
  },
};

// ── ORM dependencies ──────────────────────────────────────────────────

const ORM_DEPS = {
  sequelize: {
    deps: { 'sequelize': '^6.37.7', 'umzug': '^3.8.2' },
    devDeps: {},
  },
  prisma: {
    deps: { '@prisma/client': '^6.9.0' },
    devDeps: { 'prisma': '^6.9.0' },
  },
  drizzle: {
    deps: { 'drizzle-orm': '^0.44.0' },
    devDeps: { 'drizzle-kit': '^0.31.0' },
  },
};

// ── Database driver dependencies ──────────────────────────────────────

const DB_DRIVER_DEPS = {
  'sequelize-postgresql': {
    deps: { 'pg': '^8.19.0', 'pg-hstore': '^2.3.4' },
    devDeps: {},
  },
  'sequelize-mysql': {
    deps: { 'mysql2': '^3.14.0' },
    devDeps: {},
  },
  'prisma-postgresql': { deps: {}, devDeps: {} },
  'prisma-mysql':      { deps: {}, devDeps: {} },
  'drizzle-postgresql': {
    deps: { 'postgres': '^3.4.7' },
    devDeps: {},
  },
  'drizzle-mysql': {
    deps: { 'mysql2': '^3.14.0' },
    devDeps: {},
  },
};

// ── TypeScript dependencies ───────────────────────────────────────────

const TS_DEV_DEPS = {
  'typescript':     '^5.8.0',
  'tsx':            '^4.22.3',
  'typescript-eslint': '^8.0.0',
  '@types/node':    '^22.0.0',
  '@types/express': '^5.0.0',
  '@types/cors':    '^2.8.17',
  '@types/cookie-parser': '^1.4.8',
  '@types/morgan':  '^1.9.9',
  '@types/swagger-ui-express': '^4.1.7',
  '@types/swagger-jsdoc': '^6.0.4',
};

const TS_FEATURE_DEV_DEPS = {
  auth:       { '@types/bcryptjs': '^2.4.6', '@types/express-session': '^1.18.1' },
  'auth-jwt': { '@types/jsonwebtoken': '^9.0.9' },
  email:      { '@types/nodemailer': '^6.4.17' },
  fileUpload: { '@types/multer': '^1.4.12' },
  testing:    { '@types/supertest': '^6.0.2' },
  csrf:       {},
  audit:      {},
  oauth:      {},
};

/**
 * Resolve all dependencies based on the user's selections.
 * @param {object} context - The project context from prompts
 * @returns {{ dependencies: Record<string, string>, devDependencies: Record<string, string> }}
 */
export function resolveDependencies(context) {
  const deps = { ...BASE_DEPS };
  const devDeps = { ...BASE_DEV_DEPS };

  const { features, authStrategy, orm, database, language } = context;

  // Feature deps
  for (const [feature, enabled] of Object.entries(features)) {
    if (!enabled) continue;
    const fd = FEATURE_DEPS[feature];
    if (fd) {
      Object.assign(deps, fd.deps);
      Object.assign(devDeps, fd.devDeps);
    }
  }

  // Auth strategy
  if (features.auth) {
    const stratKey = `auth-${authStrategy}`;
    const sd = FEATURE_DEPS[stratKey];
    if (sd) {
      Object.assign(deps, sd.deps);
      Object.assign(devDeps, sd.devDeps);
    }
  }

  // ORM
  if (features.database) {
    const od = ORM_DEPS[orm];
    if (od) {
      Object.assign(deps, od.deps);
      Object.assign(devDeps, od.devDeps);
    }

    // DB driver
    const driverKey = `${orm}-${database}`;
    const dd = DB_DRIVER_DEPS[driverKey];
    if (dd) {
      Object.assign(deps, dd.deps);
      Object.assign(devDeps, dd.devDeps);
    }

    // Session store
    if (features.auth && authStrategy === 'session' && orm === 'sequelize') {
      const ss = FEATURE_DEPS['session-store-sequelize'];
      if (ss) Object.assign(deps, ss.deps);
    }
  }

  // TypeScript
  if (language === 'typescript') {
    Object.assign(devDeps, TS_DEV_DEPS);

    for (const [feature, enabled] of Object.entries(features)) {
      if (!enabled) continue;
      const td = TS_FEATURE_DEV_DEPS[feature];
      if (td) Object.assign(devDeps, td);
    }

    if (features.auth && authStrategy === 'jwt') {
      Object.assign(devDeps, TS_FEATURE_DEV_DEPS['auth-jwt'] || {});
    }
  }

  // Sort alphabetically
  const sortObj = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

  return {
    dependencies: sortObj(deps),
    devDependencies: sortObj(devDeps),
  };
}
