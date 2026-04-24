#!/usr/bin/env node

/**
 * Script to install git hooks from .githooks to .git/hooks
 * Works cross-platform (Windows, Linux, macOS)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHOOKS_DIR = path.join(__dirname, '..', '.githooks');
const GIT_HOOKS_DIR = path.join(__dirname, '..', '.git', 'hooks');

console.log('Installing git hooks...');

// Create .git/hooks directory if it doesn't exist
if (!fs.existsSync(GIT_HOOKS_DIR)) {
  fs.mkdirSync(GIT_HOOKS_DIR, { recursive: true });
}

// Check if .githooks directory exists
if (!fs.existsSync(GITHOOKS_DIR)) {
  console.log('⚠️  .githooks directory not found. Skipping hook installation.');
  process.exit(0);
}

// Read all files from .githooks
const hooks = fs.readdirSync(GITHOOKS_DIR);

if (hooks.length === 0) {
  console.log('⚠️  No hooks found in .githooks directory.');
  process.exit(0);
}

// Copy each hook to .git/hooks
hooks.forEach((hook) => {
  const hookPath = path.join(GITHOOKS_DIR, hook);
  const stat = fs.statSync(hookPath);

  if (stat.isFile()) {
    const targetPath = path.join(GIT_HOOKS_DIR, hook);
    fs.copyFileSync(hookPath, targetPath);

    // Make executable (Unix-like systems)
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(targetPath, '755');
      } catch (err) {
        // Ignore chmod errors on Windows
      }
    } else {
      // On Windows, try to make executable via git
      try {
        execSync(`git update-index --chmod=+x "${targetPath}"`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore if git command fails
      }
    }

    console.log(`✅ Installed hook: ${hook}`);
  }
});

console.log('🎉 All git hooks installed successfully!');

