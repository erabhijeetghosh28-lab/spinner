# 🛡️ Development Protocol - Pre-Commit & Build Checks

## Problem
Build errors (like duplicate variables, TypeScript errors) are only caught during build, not during development. This causes:
- ❌ Broken builds in production
- ❌ Wasted time debugging
- ❌ Poor developer experience

## Solution: Multi-Layer Validation Protocol

---

## 📋 Protocol Checklist

### Before Every Commit

Run these checks in order:

```bash
# 1. TypeScript Check (catches type errors)
npm run type-check

# 2. Linter Check (catches code quality issues)
npm run lint

# 3. Build Check (catches build errors)
npm run build-check

# 4. Test (if tests exist)
npm test
```

**If ANY check fails → DO NOT COMMIT → Fix errors first**

---

## 🔧 Setup Instructions

### Step 1: Add Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "build-check": "next build --no-lint",
    "pre-commit": "npm run type-check && npm run lint",
    "validate": "npm run type-check && npm run lint && npm run build-check"
  }
}
```

### Step 2: Install Husky (Pre-commit Hooks)

```bash
npm install --save-dev husky lint-staged
npx husky init
```

### Step 3: Create Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Type check
echo "📝 Type checking..."
npm run type-check || {
  echo "❌ TypeScript errors found. Fix before committing."
  exit 1
}

# Lint check
echo "🔍 Linting..."
npm run lint || {
  echo "❌ Linter errors found. Fix before committing."
  exit 1
}

echo "✅ All checks passed!"
```

### Step 4: Create Pre-push Hook (Optional but Recommended)

Create `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-push checks..."

# Full build check
echo "🏗️  Building..."
npm run build-check || {
  echo "❌ Build failed. Fix errors before pushing."
  exit 1
}

echo "✅ Build successful!"
```

---

## 🎯 Development Workflow

### Daily Development

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Before Making Changes:**
   - Pull latest changes
   - Run `npm run validate` to ensure clean state

3. **While Developing:**
   - Keep dev server running
   - Watch for console errors
   - Fix TypeScript errors immediately (red squiggles)

4. **Before Committing:**
   ```bash
   npm run pre-commit
   ```
   - If fails → Fix errors
   - If passes → Commit

5. **Before Pushing:**
   ```bash
   npm run build-check
   ```
   - Ensures production build works

---

## 🚨 Common Errors to Catch

### 1. Duplicate Variable Declarations
```typescript
// ❌ BAD
const params = new URLSearchParams(...);
const params = new URLSearchParams(...); // Error!

// ✅ GOOD
const params = new URLSearchParams(...);
const bypass = params.get('spin') === 'true'; // Reuse params
```

### 2. TypeScript Type Errors
```typescript
// ❌ BAD
const id: string = 123; // Type error

// ✅ GOOD
const id: string = "123";
```

### 3. Missing Imports
```typescript
// ❌ BAD
import { useState } from 'react';
// useState used but not imported

// ✅ GOOD
import { useState } from 'react';
```

### 4. Unused Variables
```typescript
// ❌ BAD (if unused)
const unusedVar = 'test';

// ✅ GOOD
// Remove unused variables
```

---

## 🔍 Automated Checks

### VS Code Settings (Recommended)

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### ESLint Configuration

Ensure `.eslintrc.json` has strict rules:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "no-unused-vars": "error",
    "no-duplicate-variables": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

---

## 📊 Validation Script

Create `scripts/validate.sh` (or `scripts/validate.js`):

```bash
#!/bin/bash

echo "🔍 Running full validation..."

# Type check
echo "📝 Type checking..."
npm run type-check || exit 1

# Lint
echo "🔍 Linting..."
npm run lint || exit 1

# Build
echo "🏗️  Building..."
npm run build-check || exit 1

echo "✅ All checks passed! Ready to commit."
```

---

## 🎯 CI/CD Integration

### GitHub Actions (Example)

Create `.github/workflows/validate.yml`:

```yaml
name: Validate

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build-check
```

---

## 📝 Quick Reference

### Commands

| Command | Purpose | When to Run |
|---------|---------|-------------|
| `npm run type-check` | Check TypeScript errors | Before commit |
| `npm run lint` | Check code quality | Before commit |
| `npm run build-check` | Test production build | Before push |
| `npm run validate` | Run all checks | Before major commits |
| `npm run pre-commit` | Pre-commit validation | Automatic (via Husky) |

### Error Prevention

1. **Enable TypeScript strict mode** in `tsconfig.json`
2. **Use ESLint** with strict rules
3. **Run checks before committing** (manual or via Husky)
4. **Fix errors immediately** (don't accumulate)
5. **Test build regularly** during development

---

## 🚀 Quick Setup (One-Time)

Run this once to set up the protocol:

```bash
# 1. Add scripts to package.json (see above)

# 2. Install Husky
npm install --save-dev husky
npx husky init

# 3. Create pre-commit hook (see above)

# 4. Test
npm run validate
```

---

## ✅ Success Criteria

Your development protocol is working when:
- ✅ TypeScript errors caught before commit
- ✅ Linter errors caught before commit
- ✅ Build errors caught before push
- ✅ No broken builds in production
- ✅ Faster development (catch errors early)

---

## 📚 Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Next.js Build Errors](https://nextjs.org/docs/messages/build-error)

---

**Remember: Catch errors early, save time later! 🎯**
