/**
 * Resolve uploaded file paths for <img src>, links, etc.
 * Absolute http(s) URLs pass through. Relative paths become root-relative
 * (e.g. `uploads/x.jpg` → `/uploads/x.jpg`) so Vite dev proxy can reach the API.
 */
export function uploadUrl(pathOrUrl) {
  if (pathOrUrl == null || pathOrUrl === '') return '';
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const normalized = s.replace(/^\/+/, '');
  return `/${normalized}`;
}
