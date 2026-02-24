import remarkGithubAlerts from 'remark-github-alerts';

// Empty SVG placeholder — the PROMO alert title+icon is hidden via CSS
const PROMO_ICON =
  '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16"></svg>';

export const remarkGithubAlertsConfig = [
  remarkGithubAlerts,
  {
    markers: ['TIP', 'NOTE', 'IMPORTANT', 'WARNING', 'CAUTION', 'PROMO'],
    icons: { promo: PROMO_ICON },
  },
] as [typeof remarkGithubAlerts, { markers: string[]; icons: Record<string, string> }];
