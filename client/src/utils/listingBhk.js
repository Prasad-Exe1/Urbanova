/**
 * Infers BHK from listing fields — DB often omits `bedrooms`; copy usually has "2BHK", "Studio", etc.
 */

export function parseBhkFromListingText(title, description) {
  const combined = `${title || ''} ${description || ''}`;
  if (!combined.trim()) return null;
  const m =
    combined.match(/(\d+)\s*BHK\b/i) ||
    combined.match(/(\d+)BHK\b/i) ||
    combined.match(/(\d+)\s*bed(?:room)?s?\b/i);
  if (m) return Math.min(12, Math.max(0, parseInt(m[1], 10)));
  if (/\bstudio\b/i.test(combined)) return 1;
  return null;
}

/** Canonical BHK for filters & display — number or null when not inferable */
export function effectiveListingBhk(p) {
  if (!p) return null;
  const raw = Number(p.bedrooms);
  if (Number.isFinite(raw) && raw >= 1) return Math.min(12, Math.round(raw));
  return parseBhkFromListingText(p.title, p.description);
}

/** @param {unknown} bhkPref — number or '5+' */
export function listingMatchesBhkPref(p, bhkPref) {
  if (bhkPref == null) return true;
  const n = effectiveListingBhk(p);
  if (bhkPref === '5+') return (n ?? 0) >= 5;
  return n === bhkPref;
}
