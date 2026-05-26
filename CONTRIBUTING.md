# Contributing to create-arc-express

First off, thank you for considering contributing to `create-arc-express`! It's people like you that make open-source software such a great community to learn, inspire, and create.

## 🚀 How to Contribute

To ensure a smooth workflow and maintain the quality of the project, all contributions must go through a **Pull Request (PR)**. You cannot push directly to the `main` branch.

### 1. Fork and Clone
1. **Fork** the repository on GitHub by clicking the "Fork" button in the top right corner.
2. **Clone** your forked repository to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/arc-express.git
   cd arc-express
   ```

### 2. Create a Branch
Create a new branch for your feature or bugfix. Name it descriptively:
```bash
git checkout -b feature/adding-new-orm
# or
git checkout -b fix/auth-middleware-bug
```

### 3. Make Your Changes
Make your changes to the codebase. If you are modifying the generated project structure, you will likely be working inside the `templates/` directory.

### 4. Test Your Changes (Crucial Step!)
Because this CLI tool generates dozens of different project combinations (JavaScript vs TypeScript, Drizzle vs Prisma, etc.), you **must** ensure your changes do not break any permutations.

Before submitting a PR, run the comprehensive combo test suite:
```bash
npm run test:combos
```
This script takes several minutes and will aggressively scaffold, install, and boot all 13 supported architecture combinations. **All tests must pass for your PR to be accepted.**

### 5. Commit and Push
Commit your changes with a clear and descriptive commit message:
```bash
git add .
git commit -m "feat: added support for XYZ framework"
git push origin your-branch-name
```

### 6. Open a Pull Request
1. Go to the original `create-arc-express` repository on GitHub.
2. Click the **"Compare & pull request"** button.
3. Fill out the PR template completely. 
4. The project author will review your code. Once approved, the author will merge it into the `main` branch.

## 📜 Code Style
- We use ESLint and Prettier. Ensure your code passes standard linting (`npm run lint`).
- Keep template logic (`.ejs` files) as clean and readable as possible.
- If adding a new feature, ensure it is added as a prompt in `src/prompts.js`.

Thank you for your contribution!
