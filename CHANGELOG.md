# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-26

### Added
- **Swagger CSRF Integration:** Fully resolved CSRF issues in Swagger UI. Includes automatic CSRF token injection via custom request interceptors and a new "Generate CSRF Token" button directly in the Swagger Auth modal.
- **Testing Templates:** Added comprehensive authentication integration testing templates and checks.
- **CLI Enhancements:** Added helpful keyboard instructions to the multi-select feature prompt `(Press <Space> to select, <Enter> to submit)`.
- **Production Hardening:** Implemented phase 2 of production security hardening.

### Changed
- **Documentation:** Updated the generated `README.md` to properly include Sequelize and Drizzle database setup and migration commands.
- **TypeScript:** Enforced stricter TypeScript linting and updated testing configurations.
- **Internal:** Renamed the `.npmrc` template and updated relevant tests.

### Fixed
- **Database (MySQL):** Resolved the "Specified key was too long" error during migrations by splitting composite indexes in the Prisma and Sequelize audit log templates.
- **Database (Sequelize):** Fixed the Umzug migration logger outputting `[object Object]` to the terminal by correctly formatting JSON payloads for Winston.
- **Security:** Set Helmet `referrerPolicy` to `same-origin` to allow Swagger CSRF bypass to work properly.

## [1.0.0] - 2026-05-25

### Added
- Initial Release! Scaffold production-ready Express.js backends with interactive feature selection.
- Support for Auth, Sequelize/Prisma/Drizzle, OAuth, Nodemailer, Cloudinary, CSRF, Audit Logs, Docker, Vitest, and GitHub Actions.
