# ✅ Development Checklist

## Before Every Commit

Run these checks (or let Husky do it automatically):

- [ ] **Type Check:** `npm run type-check`
- [ ] **Lint Check:** `npm run lint`
- [ ] **Build Check:** `npm run build-check` (before pushing)

## Common Errors to Watch For

### ❌ Duplicate Variables
```typescript
// BAD
const params = new URLSearchParams(...);
const params = new URLSearchParams(...); // Error!

// GOOD
const params = new URLSearchParams(...);
const bypass = params.get('spin') === 'true';
```

### ❌ Missing Closing Tags
```tsx
// BAD
<div>
  <div>
    Content
  </div>
); // Missing </div>

// GOOD
<div>
  <div>
    Content
  </div>
</div>
);
```

### ❌ Type Errors
```typescript
// BAD
const id: string = 123; // Type error

// GOOD
const id: string = "123";
```

### ❌ Unused Imports
```typescript
// BAD
import { useState, useEffect } from 'react';
// useEffect never used

// GOOD
import { useState } from 'react';
```

## Quick Commands

```bash
# Run all checks
npm run validate

# Type check only
npm run type-check

# Lint only
npm run lint

# Build check only
npm run build-check
```

## VS Code Integration

The `.vscode/settings.json` file is configured to:
- ✅ Auto-fix ESLint on save
- ✅ Organize imports on save
- ✅ Format on save
- ✅ Show TypeScript errors in real-time

## Husky Hooks

Pre-commit hook automatically runs:
1. Type check
2. Lint check

Pre-push hook automatically runs:
1. Full build check

**You can't commit/push if checks fail!**

---

**Remember: Catch errors early, save time later! 🎯**
