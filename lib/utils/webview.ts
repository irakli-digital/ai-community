/**
 * In-app webview detection.
 * Detects Facebook, Instagram, TikTok, Twitter/X, LinkedIn, Line, Snapchat, Pinterest in-app browsers.
 */

const WEBVIEW_PATTERNS = [
  /FBAN|FBAV/i, // Facebook
  /Instagram/i,
  /LinkedInApp/i, // LinkedIn
  /Line\//i,
  /Twitter|X\//i,
  /TikTok/i,
  /Snapchat/i,
  /Pinterest/i,
];

export function isInAppWebview(userAgent: string): boolean {
  return WEBVIEW_PATTERNS.some((pattern) => pattern.test(userAgent));
}
