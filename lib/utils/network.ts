/**
 * Check if a hostname resolves to a private/reserved IP range.
 * Used for SSRF protection when fetching external URLs.
 */
export function isPrivateIP(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  }
  if (hostname === 'localhost' || hostname === '::1') return true;
  return false;
}
