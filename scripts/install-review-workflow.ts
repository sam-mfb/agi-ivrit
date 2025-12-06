#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { log } from './utils/logger.js';

/**
 * Install the GitHub Pages review app workflow into a translation repo
 */

const workflowContent = `name: Deploy Review App

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout translation repo
        uses: actions/checkout@v4

      - name: Checkout agi-ivrit
        uses: actions/checkout@v4
        with:
          repository: sam-mfb/agi-ivrit
          path: agi-ivrit

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: agi-ivrit/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: agi-ivrit

      - name: Copy translation files
        run: |
          mkdir -p agi-ivrit/active-translation
          cp *.json agi-ivrit/active-translation/

      - name: Build review app
        run: npm run review:build
        working-directory: agi-ivrit
        env:
          VITE_BASE: /\${{ github.event.repository.name }}/

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: agi-ivrit/translation-review/dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

const translationName = process.argv[2];

if (!translationName) {
  log.error('Usage: npm run install-review-workflow <name>');
  log.error('Example: npm run install-review-workflow sq2');
  process.exit(1);
}

const targetDir = join('translations', translationName);

if (!existsSync(targetDir)) {
  log.error(`Translation directory not found: ${targetDir}`);
  log.info('Run npm run fetch-translation first to fetch the translation.');
  process.exit(1);
}

const workflowDir = join(targetDir, '.github', 'workflows');
const workflowPath = join(workflowDir, 'deploy-review.yml');

// Check if already exists
if (existsSync(workflowPath)) {
  log.error(`Workflow already exists: ${workflowPath}`);
  log.info('Delete it first if you want to reinstall.');
  process.exit(1);
}

// Create directory and write file
mkdirSync(workflowDir, { recursive: true });
writeFileSync(workflowPath, workflowContent, 'utf-8');

log.success(`Installed workflow to: ${workflowPath}`);
log.newline();
log.info('Next steps:');
log.info(`1. cd ${targetDir}`);
log.info('2. git add .github/');
log.info('3. git commit -m "Add review app deployment workflow"');
log.info('4. git push');
log.info('5. Go to your repo on GitHub → Settings → Pages');
log.info('6. Under "Build and deployment", set Source to "GitHub Actions"');
log.newline();
log.info('Once configured, the review app will deploy automatically on each push.');
