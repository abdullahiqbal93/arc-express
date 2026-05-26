# create-arc-express

Scaffold production-ready Express.js backends with an interactive CLI.

```bash
npx create-arc-express@latest my-api
```

`create-arc-express` generates a ready-to-run Express API with optional authentication, database tooling, testing, Docker Compose, TypeScript, and CI setup.

## Requirements

- Node.js 18 or newer
- npm 9 or newer recommended

## Quick Start

```bash
npx create-arc-express@latest my-api
cd my-api
cp .env.example .env
npm run dev
```

You can also use npm's initializer form:

```bash
npm create arc-express@latest my-api
```

The CLI prompts for:

- Project name
- JavaScript or TypeScript
- Optional features
- Authentication strategy: session-based or JWT
- ORM: Sequelize, Prisma, or Drizzle
- Database: PostgreSQL or MySQL
- Dependency installation and git initialization

## Features

Every feature is optional unless another selected feature depends on it.

| Feature | Description |
| --- | --- |
| Authentication | Register, login, password reset, route guards, rate limiting |
| Database | Sequelize, Prisma, or Drizzle with PostgreSQL or MySQL |
| Google OAuth | Google OAuth 2.0 login flow |
| Email | Nodemailer SMTP utility for transactional email |
| File Upload | Cloudinary and Multer integration |
| CSRF Protection | Double-submit cookie CSRF protection |
| Audit Logging | Database-backed user action logs |
| Docker Compose | PostgreSQL/MySQL and Redis services |
| Testing | Vitest, Supertest, coverage, and test setup helpers |
| GitHub Actions | Node.js CI matrix for install, lint, typecheck, and tests |
| TypeScript | Strict TypeScript setup with `tsx` |

## Generated Project

A generated app includes a modular API layout, centralized configuration, standardized response helpers, request validation, sanitization, logging, and optional feature-specific infrastructure.

Representative structure:

```text
my-api/
|-- src/
|   |-- app.js
|   |-- api/
|   |   |-- index.js
|   |   |-- status/
|   |   `-- auth/
|   |-- db/
|   `-- lib/
|       |-- config.js
|       |-- server.js
|       |-- logger/
|       |-- middlewares/
|       |-- services/
|       `-- utils/
|-- .env.example
|-- package.json
|-- docker-compose.yml
|-- vitest.config.js
`-- README.md
```

## Common Generated Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with reload/watch mode |
| `npm start` | Start the server |
| `npm run lint` | Lint generated source files |
| `npm run format` | Format generated source files |
| `npm run typecheck` | Type-check TypeScript projects |
| `npm run db:migrate` | Run database migrations when a database is selected |
| `npm run db:seed` | Seed the database when a database is selected |
| `npm test` | Run tests when testing is selected |
| `npm run test:coverage` | Run tests with coverage when testing is selected |

## Local Development

Clone this repository when you want to work on the generator itself.

```bash
git clone https://github.com/abdullahiqbal93/arc-express.git
cd arc-express
npm install
npm run dev -- test-project
```

Run the generator test suites:

```bash
npm test
npm run test:render-matrix
npm run test:combos
```

`npm run test:combos` scaffolds, installs, type-checks, and boots multiple generated project combinations. It can take several minutes.

## Package Contents

The published npm package includes:

- `bin/` - CLI executable
- `src/` - prompt, scaffold, dependency, and output logic
- `templates/` - generated project templates
- `README.md`
- `LICENSE`

## License

MIT
