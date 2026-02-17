/**
 * Detect if the current browser is an in-app WebView (LinkedIn, Instagram, Facebook, etc.)
 * Google blocks OAuth from these embedded browsers (error: disallowed_useragent).
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  return /LinkedIn|FBAN|FBAV|Instagram|Twitter|Snapchat|Line\/|MicroMessenger|BytedanceWebview|TikTok/i.test(ua);
}
