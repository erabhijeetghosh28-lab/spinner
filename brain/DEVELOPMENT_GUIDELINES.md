# 🛠️ Development Guidelines

**For**: Senior Developer (Cursor)  
**Purpose**: Ensure code quality and catch errors early in the development cycle

---

## ⚠️ TypeScript Error Checking

### **CRITICAL RULE**: Check TypeScript Errors During Development, NOT Deployment

**Why**: 
- TypeScript errors caught during development are easier to fix
- Prevents breaking changes from reaching production
- Saves time and reduces deployment failures
- Maintains code quality and type safety

### When to Check TypeScript Errors

1. **After Every Code Change**
   - Run `npm run build` or `npx tsc --noEmit` after making changes
   - Check IDE/editor for red squiggles and error indicators
   - Fix errors immediately before committing

2. **Before Committing Code**
   - Always run TypeScript check: `npx tsc --noEmit`
   - Ensure no type errors exist
   - Verify all imports are correct

3. **During Code Reviews**
   - Review TypeScript errors as part of the review process
   - Ensure type safety is maintained

### How to Check TypeScript Errors

#### Option 1: Using TypeScript Compiler
```bash
npx tsc --noEmit
```
This will check all TypeScript files without generating output files.

#### Option 2: Using Next.js Build
```bash
npm run build
```
Next.js will show TypeScript errors during the build process.

#### Option 3: IDE Integration
- **VS Code**: Errors show automatically in the Problems panel
- **Cursor**: Check the error panel and fix issues as you code
- Enable TypeScript error checking in real-time

#### Option 4: Pre-commit Hook (Recommended)
Add to `package.json`:
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "precommit": "npm run type-check"
  }
}
```

### Common TypeScript Errors to Watch For

1. **Type Mismatches**
   - Function parameter types
   - Return type mismatches
   - Property type errors

2. **Missing Types**
   - `any` types (should be avoided)
   - Missing type annotations
   - Implicit any errors

3. **Import/Export Errors**
   - Missing exports
   - Incorrect import paths
   - Circular dependencies

4. **Null/Undefined Checks**
   - Optional chaining needed
   - Non-null assertions
   - Type guards required

### Development Workflow

1. **Write Code** → Make changes
2. **Check Types** → Run `npx tsc --noEmit`
3. **Fix Errors** → Address all TypeScript errors
4. **Test Locally** → Ensure application runs
5. **Commit** → Only commit when all errors are resolved

### Integration with Current Project

For this Next.js project:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Or use Next.js build (shows TS errors)
npm run build

# Development with type checking
npm run dev  # TypeScript errors show in terminal
```

### Best Practices

1. ✅ **DO**: Fix TypeScript errors immediately when they appear
2. ✅ **DO**: Use strict TypeScript configuration
3. ✅ **DO**: Enable TypeScript in your IDE
4. ✅ **DO**: Run type checks before pushing code
5. ❌ **DON'T**: Ignore TypeScript errors
6. ❌ **DON'T**: Use `@ts-ignore` unless absolutely necessary
7. ❌ **DON'T**: Deploy code with TypeScript errors
8. ❌ **DON'T**: Rely on runtime error checking alone

---

## 📋 Checklist Before Deployment

- [ ] All TypeScript errors resolved (`npx tsc --noEmit` passes)
- [ ] No `any` types in new code
- [ ] All imports are correct
- [ ] Type definitions are accurate
- [ ] Application builds successfully (`npm run build`)
- [ ] No console errors in development
- [ ] All API routes have proper types

---

## 🔧 Quick Commands

```bash
# Type check only
npx tsc --noEmit

# Build with type checking
npm run build

# Development with auto-reload
npm run dev

# Lint and type check
npm run lint && npx tsc --noEmit
```

---

**Remember**: TypeScript is your friend during development. Use it to catch errors early, not during deployment! 🚀

---

**Last Updated**: 2025-01-20  
**Maintained By**: Development Team
