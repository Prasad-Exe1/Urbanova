/**
 * Hero image for property cards & detail page: user uploads win; catalog rows use themed stock + catalog-wide de-duplication.
 */
import { uploadUrl } from './uploadUrl.js';
import {
  ALL_UNIQUE_STOCK_URLS,
  hash32,
  heroPoolForListing,
  heroUrlForCatalogListing,
  uniqUrls,
} from './listingImageryPools.js';

export function isUserUploadedImage(image) {
  if (image == null || image === '') return false;
  const s = String(image).trim();
  if (!/^https?:\/\//i.test(s)) return true;
  if (/\/uploads\//i.test(s)) return true;
  if (/\b\/api\/.*upload/i.test(s)) return true;
  return false;
}

/** Deterministic unique photo when Commons pool is exhausted (different id ⇒ different image). */
function picsumPlaceholderUrl(property, slot = 'h') {
  return `https://picsum.photos/seed/uv${slot}${hash32(String(property?._id || '') + '|' + slot)}/1200/800`;
}

/**
 * @returns {string} Always a usable URL when property has standard fields; catalog listings get semantic stock imagery.
 */
export function resolveListingHeroUrl(property) {
  if (!property) return '';
  if (isUserUploadedImage(property.image)) return uploadUrl(property.image);
  return heroUrlForCatalogListing(property);
}

/**
 * Assigns a **unique** hero URL to every catalog listing in one sort-stable pass: prefers images from each listing's thematic pool,
 * then spills into the global stock set so neighbours on `/properties` do not reuse the same thumbnail.
 */
export function assignUniqueCatalogHeroes(listings) {
  const map = new Map();
  if (!Array.isArray(listings) || !listings.length) return map;

  const used = new Set();
  const sorted = [...listings].sort((a, b) => String(a._id).localeCompare(String(b._id)));

  for (const p of sorted) {
    if (isUserUploadedImage(p.image)) {
      const u = uploadUrl(p.image);
      map.set(p._id, u);
      used.add(u);
      continue;
    }

    const themed = heroPoolForListing(p);
    const merged = uniqUrls([...themed, ...ALL_UNIQUE_STOCK_URLS]);
    let chosen = null;
    for (const u of merged) {
      if (!used.has(u)) {
        chosen = u;
        break;
      }
    }
    if (!chosen) {
      for (const u of ALL_UNIQUE_STOCK_URLS) {
        if (!used.has(u)) {
          chosen = u;
          break;
        }
      }
    }
    if (!chosen) {
      chosen = picsumPlaceholderUrl(p, 'hero');
    }
    used.add(chosen);
    map.set(p._id, chosen);
  }

  return map;
}
