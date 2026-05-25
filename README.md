# create-arc-express

> Scaffold production-ready Express.js backends with interactive feature selection.

```bash
npx create-arc-express my-api
```

## Features

Pick only what you need — every feature is optional:

| Feature | Description |
|---------|-------------|
| **Authentication** | Session-based or JWT, with register/login/password-reset |
| **Database** | Sequelize, Prisma, or Drizzle with PostgreSQL or MySQL |
| **Google OAuth** | Social login via Google OAuth 2.0 |
| **Email** | Nodemailer SMTP with password reset templates |
| **File Upload** | Cloudinary + Multer integration |
| **CSRF Protection** | Double-submit cookie pattern |
| **Audit Logging** | Track user actions in the database |
| **Docker Compose** | Pre-configured PostgreSQL/MySQL + Redis |
| **Testing** | Jest + Supertest + Testcontainers |
| **GitHub Actions** | CI pipeline with multi-version Node.js matrix |
| **TypeScript** | Full TypeScript support with tsx |

## Generated Project Structure

```
my-api/
├── src/
│   ├── app.js              # Entry point with graceful shutdown
│   ├── api/                 # Route modules
│   │   ├── index.js         # Route registry
│   │   ├── status/          # Health check
│   │   └── auth/            # Auth routes + controller + schema + tests
│   ├── db/                  # Models, migrations, seeds
│   └── lib/                 # Shared infrastructure
│       ├── config.js        # Centralized env config
│       ├── server.js        # Express app factory
│       ├── logger/          # Winston + Morgan (colorized output)
│       ├── middlewares/      # Auth, validation, CSRF, sanitize, rate-limit
│       ├── services/        # Error/success response helpers, audit
│       └── utils/           # Pagination, email, file upload, etc.
├── .env.example
├── package.json
├── docker-compose.yml       # (if Docker selected)
├── jest.config.js           # (if Testing selected)
└── README.md
```

## What's Inside

### Architecture Patterns
- **Layered structure**: `api/` → controller + schema + tests per module
- **Centralized config**: All env vars in `lib/config.js`
- **Standardized responses**: `APIResponse` class with consistent `{ success, message, data }`
- **Zod validation**: Request body/params/query validation middleware
- **XSS protection**: Automatic HTML sanitization on all request bodies
- **Production logging**: Colorized Winston + Morgan with file rotation

### Adding a New API Module

```
src/api/
└── posts/
    ├── index.js          # Route definitions
    ├── controller.js     # Business logic
    ├── schema/
    │   └── index.js      # Zod schemas
    └── __test__/
        └── posts.test.js # Tests
```

Then register it in `src/api/index.js`:

```js
import { posts } from "./posts/index.js";

export const getApiRouter = () => {
  const router = Router();
  posts(router);
  return router;
};
```

## Development

```bash
# Clone this repo
git clone https://github.com/abdullahiqbal93/arc-express.git
cd arc-express

# Install dependencies
npm install

# Test locally
node bin/index.js test-project
```

## License

MIT
