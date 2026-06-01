/**
 * Whether a listing counts as RERA for badges + "RERA Only" filter.
 * Prefer DB flag `rera_registered`; includes demo fallbacks when the column is missing / not seeded yet.
 */

const DEMO_RERA_EXTERNAL_IDS = new Set(['urbanova-default-hyd-008', 'urbanova-default-hyd-009']);

/** Matches upserts (`seed:hyderabad`) and wipe seed (`seedTelangana`) titles — Kokapet + Nanakramguda / Tellapur pair only */
function isDemoReraListing(p) {
  const ext = String(p.external_id ?? p.externalId ?? '').trim();
  if (DEMO_RERA_EXTERNAL_IDS.has(ext)) return true;

  const t = String(p.title ?? '');
  if (t.includes('Nanakramguda') && t.includes('Skyline Towers')) return true;
  if (t.includes('Kokapet') && t.includes('Financial District')) return true;
  if (t.includes('Tellapur') && t.includes('Growth Corridor')) return true;
  return false;
}

export function listingMentionsRera(p) {
  if (!p) return false;
  if (p.rera_registered === true || p.reraRegistered === true) return true;
  if (p.rera_registered === false || p.reraRegistered === false) return false;

  if (isDemoReraListing(p)) return true;

  const reg = p.rera_registration ?? p.reraRegistration ?? p.rera_reg_no ?? '';
  if (reg != null && String(reg).trim() !== '') return true;

  const blob = `${p.title ?? ''} ${p.description ?? ''}`;
  const lower = blob.toLowerCase();
  if (lower.includes('ts-rera')) return true;
  return /\brera\b/i.test(blob);
}
