#!/usr/bin/env node

/**
 * Convert Content HTML files to PDF using Playwright.
 *
 * Usage:
 *   node convert-to-pdf.js                  # convert all .html files
 *   node convert-to-pdf.js x-accounts-ai    # convert a specific file
 *
 * Prerequisites:
 *   npx playwright install chromium
 */

const path = require('path');
const fs = require('fs');

// Resolve from the parent project's node_modules (@playwright/test re-exports chromium)
const { chromium } = require(
  require.resolve('@playwright/test', { paths: [path.join(__dirname, '..')] })
);

const DIR = __dirname;
const PAGE_WIDTH = 1080;
const PAGE_HEIGHT = 1528; // A4 ratio (1:1.414)

async function convertFile(htmlFile) {
  const name = path.basename(htmlFile, '.html');
  const pdfFile = path.join(DIR, `${name}.pdf`);
  const fileUrl = `file://${path.resolve(htmlFile)}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: PAGE_WIDTH, height: PAGE_HEIGHT });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Wait for fonts to load
  await page.waitForTimeout(800);

  // Print to PDF with exact page dimensions — preserves dark backgrounds
  await page.pdf({
    path: pdfFile,
    width: `${PAGE_WIDTH}px`,
    height: `${PAGE_HEIGHT}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();
  console.log(`  ${name}.html -> ${name}.pdf`);
}

async function main() {
  const arg = process.argv[2];
  let files;

  if (arg) {
    const target = arg.endsWith('.html') ? arg : `${arg}.html`;
    const fullPath = path.join(DIR, target);
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${target}`);
      process.exit(1);
    }
    files = [fullPath];
  } else {
    files = fs.readdirSync(DIR)
      .filter(f => f.endsWith('.html'))
      .map(f => path.join(DIR, f));
  }

  if (files.length === 0) {
    console.log('No HTML files found.');
    return;
  }

  console.log(`Converting ${files.length} file(s) to PDF...\n`);

  for (const file of files) {
    await convertFile(file);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
