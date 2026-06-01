/**
 * Secondary gallery thumbnails on listing detail — wide pools + scan so side images rarely match hero or each other.
 */
import { resolveListingHeroUrl } from './listingHeroImage.js';
import {
  ALL_UNIQUE_STOCK_URLS,
  hash32,
  normalizeCommonsComparable,
  pickAt,
  poolsForListing,
  uniqUrls,
} from './listingImageryPools.js';

function picsumGalleryUrl(property, slot) {
  return `https://picsum.photos/seed/uv${slot}${hash32(String(property?._id || '') + '|gal|' + slot)}/800/650`;
}

/**
 * Two distinct secondary URLs for the listing detail gallery (narrow column).
 * @param {string} [resolvedPrimaryUrl] — same hero as main image for de-dupe.
 * @returns {[string, string]}
 */
export function secondaryGalleryUrls(property, resolvedPrimaryUrl) {
  const seed = `${property?._id || ''}:${property?.title || ''}:${property?.location || ''}`;
  const h = hash32(seed);
  const primary = resolvedPrimaryUrl || resolveListingHeroUrl(property);
  const mainNorm = normalizeCommonsComparable(primary);

  const { top, bottom } = poolsForListing(property);
  const megaTop = uniqUrls([...top, ...ALL_UNIQUE_STOCK_URLS]);
  const megaBottom = uniqUrls([...bottom, ...ALL_UNIQUE_STOCK_URLS]);

  let thumbTop = null;
  for (let k = 0; k < Math.max(megaTop.length * 2, 80); k++) {
    const cand = pickAt(megaTop, h + k * 19);
    if (normalizeCommonsComparable(cand) !== mainNorm) {
      thumbTop = cand;
      break;
    }
  }
  if (!thumbTop) thumbTop = picsumGalleryUrl(property, 't');

  const topNorm = normalizeCommonsComparable(thumbTop);

  let thumbBottom = null;
  for (let k = 0; k < Math.max(megaBottom.length * 2, 80); k++) {
    const cand = pickAt(megaBottom, Math.floor(h / 11) + k * 23);
    const n = normalizeCommonsComparable(cand);
    if (n !== mainNorm && n !== topNorm) {
      thumbBottom = cand;
      break;
    }
  }
  if (!thumbBottom) thumbBottom = picsumGalleryUrl(property, 'b');

  return [thumbTop, thumbBottom];
}
