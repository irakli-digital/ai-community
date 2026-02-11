# Content HTML — CLAUDE.md

This folder contains **standalone HTML files** used as social media posts and PDF exports for Agentic Tribe.

## Purpose
- Each `.html` file is a self-contained content piece (post, guide, list, etc.)
- Files are designed for sharing on social media or exporting to PDF
- They are NOT part of the Next.js app — they are plain HTML with a shared CSS file

## Theme
All HTML files must use the shared `styles.css` in this folder. The CSS mirrors the main site's Claude AI-inspired warm dark palette:

| Token             | Value                  | Usage                |
|-------------------|------------------------|----------------------|
| `--bg`            | `hsl(25 8% 5%)`       | Page background      |
| `--bg-card`       | `hsl(25 7% 8%)`       | Card / section bg    |
| `--fg`            | `hsl(40 12% 90%)`     | Body text            |
| `--primary`       | `hsl(16 53% 50%)`     | Terracotta accent    |
| `--primary-fg`    | `hsl(40 20% 96%)`     | Text on primary      |
| `--muted`         | `hsl(25 5% 16%)`      | Borders, subtle bg   |
| `--muted-fg`      | `hsl(30 6% 55%)`      | Secondary text       |
| `--secondary`     | `hsl(25 6% 12%)`      | Elevated surface     |
| `--accent`        | `hsl(25 5% 21%)`      | Hover / highlight    |

## Layout
- Every content page uses **A4 proportions** with a fixed container: `width: 1080px; height: 1528px` (ratio 1:1.414)
- The container class is `.page-a4` — all elements must fit within this fixed frame with no overflow
- Use `padding: 3rem` inside the container; adjust font sizes and spacing so content fills the page without scrolling

## Rules
- Always link `styles.css` — never inline theme colors
- Use Georgian (ka) for all user-facing text
- Use semantic class names from `styles.css` (e.g., `.card`, `.badge`, `.section-title`)
- Keep each file self-contained (no external JS dependencies)
- Optimize for both screen viewing and PDF export (use `@media print` styles from the shared CSS)
- Include the Agentic Tribe branding footer in every post
- Font stack: `"BPG Nino Mtavruli", "BPG Arial", system-ui, sans-serif` for Georgian text
- To convert HTML files to PDF, run `node convert-to-pdf.js` (requires Playwright — install with `npx playwright install chromium`)
