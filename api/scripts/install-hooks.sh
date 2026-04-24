#!/bin/bash

# Script to install git hooks from .githooks to .git/hooks

echo "Installing git hooks..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy all hooks from .githooks to .git/hooks
if [ -d ".githooks" ]; then
  for hook in .githooks/*; do
    if [ -f "$hook" ]; then
      hook_name=$(basename "$hook")
      cp "$hook" ".git/hooks/$hook_name"
      chmod +x ".git/hooks/$hook_name"
      echo "✅ Installed hook: $hook_name"
    fi
  done
  echo "🎉 All git hooks installed successfully!"
else
  echo "⚠️  .githooks directory not found. Skipping hook installation."
fi

