#!/usr/bin/env node

/**
 * Validation Script
 * Runs all checks before committing/pushing
 */

const { execSync } = require('child_process');

const checks = [
  { name: 'TypeScript Check', command: 'npm run type-check' },
  { name: 'Linter Check', command: 'npm run lint' },
  { name: 'Build Check', command: 'npm run build-check' },
];

console.log('🔍 Running full validation...\n');

let allPassed = true;

for (const check of checks) {
  try {
    console.log(`📝 ${check.name}...`);
    execSync(check.command, { stdio: 'inherit' });
    console.log(`✅ ${check.name} passed!\n`);
  } catch (error) {
    console.error(`❌ ${check.name} failed!\n`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('🎉 All checks passed! Ready to commit.');
  process.exit(0);
} else {
  console.error('❌ Some checks failed. Fix errors before committing.');
  process.exit(1);
}
