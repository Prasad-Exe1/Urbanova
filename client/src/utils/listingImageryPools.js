/**
 * Shared Wikimedia thumbnail URLs + rules to pick believable, listing-specific visuals from title/location/description.
 * Catalog listings (remote stock URLs) get a semantic hero; user uploads under /uploads/ stay untouched (see listingHeroImage.js).
 */

export const T = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

/** Curated Hyderabad + India Commons — all 200-checked in client where possible */
export const HYD = {
  tech: [
    `${T}/d/de/Gachibowli_flyover.jpg/1280px-Gachibowli_flyover.jpg`,
    `${T}/0/00/TCS_synergy_park.jpg/1280px-TCS_synergy_park.jpg`,
    `${T}/3/3e/Auto_rickshaw_at_Hyatt_Hyderabad_Gachibowli.jpg/1280px-Auto_rickshaw_at_Hyatt_Hyderabad_Gachibowli.jpg`,
  ],
  premium: [
    `${T}/3/35/Residential_Building%2C_Hyderabad%2C_20022015.jpg/1280px-Residential_Building%2C_Hyderabad%2C_20022015.jpg`,
    `${T}/b/b1/Charminar%2C_Hyderabad.jpg/1280px-Charminar%2C_Hyderabad.jpg`,
  ],
  towers: [
    `${T}/b/b3/Hyderabad_skyline.jpg/1280px-Hyderabad_skyline.jpg`,
    `${T}/2/2c/Diwali_celebrations_near_Marina_Skies%2C_Hyderabad.jpg/1280px-Diwali_celebrations_near_Marina_Skies%2C_Hyderabad.jpg`,
  ],
  lake: [
    `${T}/1/14/Hussain_Sagar_lake%2C_Hyderabad.jpg/1280px-Hussain_Sagar_lake%2C_Hyderabad.jpg`,
    `${T}/5/55/Sunrise_on_hussain_sagar_lake_hyderabad.jpg/1280px-Sunrise_on_hussain_sagar_lake_hyderabad.jpg`,
    `${T}/8/8c/Tank_Bund%2C_Hyderabad.jpg/1280px-Tank_Bund%2C_Hyderabad.jpg`,
  ],
  infra: [
    `${T}/d/dd/Secunderabad_Railway_Station.jpg/1280px-Secunderabad_Railway_Station.jpg`,
    `${T}/8/82/Rajiv_Gandhi_International_Airport.jpg/1280px-Rajiv_Gandhi_International_Airport.jpg`,
  ],
  plot: [`${T}/9/95/Agricultural_land_in_India.jpg/1280px-Agricultural_land_in_India.jpg`],
  green: [`${T}/c/c2/NTR_garden._Hyderabad.jpg/960px-NTR_garden._Hyderabad.jpg`],
};

export const INTERIORS = [
  `${T}/1/1e/Living_room%2C_1900s_house_%287966462010%29.jpg/1280px-Living_room%2C_1900s_house_%287966462010%29.jpg`,
  `${T}/a/a0/Living_room%2C_1960s_house_%287966533996%29.jpg/1280px-Living_room%2C_1960s_house_%287966533996%29.jpg`,
  `${T}/4/45/Gordon_House_living_room_interior_2007-12-23_16-02-26_0108.jpeg/1280px-Gordon_House_living_room_interior_2007-12-23_16-02-26_0108.jpeg`,
];

/** More Hyderabad-area landmarks — widens global de-dupe (heroes + gallery) so repeats stay rare */
export const EXTENDED_DIVERSE_STOCK = [
  `${T}/1/19/Golkonda_Fort_1.jpg/1280px-Golkonda_Fort_1.jpg`,
  `${T}/4/41/Birla_Mandir_in_Hyderabad.jpg/1280px-Birla_Mandir_in_Hyderabad.jpg`,
  `${T}/d/df/Mecca_Masjid%2C_Hyderabad.jpg/1280px-Mecca_Masjid%2C_Hyderabad.jpg`,
  `${T}/b/b7/Qutb_Shahi_Tombs.jpg/1280px-Qutb_Shahi_Tombs.jpg`,
];

export function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function uniqUrls(urls) {
  const seen = new Set();
  return urls.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

export const ALL_UNIQUE_STOCK_URLS = uniqUrls([
  ...Object.values(HYD).flat(),
  ...INTERIORS,
  ...EXTENDED_DIVERSE_STOCK,
]);

export function normalizeCommonsComparable(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = url.split('?')[0].toLowerCase();
    const i = u.indexOf('/commons/thumb/');
    const j = u.indexOf('/commons/');
    if (i >= 0) return u.slice(Math.max(i, j));
    if (j >= 0) return u.slice(j);
    return u.replace(/^https:\/\//, '');
  } catch {
    return url;
  }
}

export function pickAt(arr, ix) {
  if (!arr.length) return HYD.lake[0];
  return arr[((ix % arr.length) + arr.length) % arr.length];
}

/**
 * Primary card / detail hero — one URL per listing, strongest keyword match first.
 */
export function heroPoolForListing(p) {
  const blob = `${p?.title || ''} ${p?.location || ''} ${p?.description || ''}`.toLowerCase();

  if (/\b(penthouse|sky villa)\b/i.test(blob) || /^sky\s+/i.test(p?.title || '') || /\bskydeck|sky lounge\b/i.test(blob)) {
    return uniqUrls([...HYD.lake, ...HYD.towers, ...HYD.premium]);
  }

  if (/\b(under[- ]construction|new launch|towerdeck|construction)\b/i.test(blob)) {
    return uniqUrls([...HYD.towers, ...HYD.tech]);
  }

  if (/\b(investment land|larger tract|farmland|agricultural|farmhouse|phased villa)\b/i.test(blob)) {
    return uniqUrls([...HYD.plot, ...HYD.lake]);
  }

  if (/\b(commercial[- ]ready|warehouse|showroom zoning|mixed[- ]use plot)\b/i.test(blob) || /\bshamshabad\b.*\b(link|airport)/i.test(blob)) {
    return uniqUrls([...HYD.infra.slice(1), ...HYD.tech, ...HYD.plot]);
  }

  if (/\b(residential plot|corner plot|tellapur)\b/i.test(blob)) {
    return uniqUrls([...HYD.plot, ...HYD.towers, ...HYD.tech]);
  }

  if (/\b(heritage|bungalow|cantonment|colonial)\b/i.test(blob)) {
    return uniqUrls([...HYD.premium, ...HYD.infra.slice(0, 1), ...HYD.lake]);
  }

  if (/\b(duplex|g\+1|row villa|gated villa|independent house)\b/i.test(blob) || /\bvilla\b/i.test(blob)) {
    return uniqUrls([...HYD.premium, ...HYD.tech, ...HYD.green]);
  }

  if (/\b(1bhk|1\s*bhk|studio|affordable|compact)\b/i.test(blob)) {
    return uniqUrls([...HYD.towers, ...HYD.tech]);
  }

  if (/\b(miyapur|metro belt|kukatpally|high[- ]rise)\b/i.test(blob)) {
    return uniqUrls([...HYD.towers, ...HYD.lake]);
  }

  if (/\b(kokapet|financial district|hitec|hitech|gachibowli|madhapur|it corridor|coworking|concierge|pool deck)\b/i.test(blob)) {
    return uniqUrls([...HYD.tech, ...HYD.towers, ...HYD.lake]);
  }

  if (/\bkompally\b/i.test(blob) || /\b(jogging|clubhouse|courts)\b/i.test(blob)) {
    return uniqUrls([...HYD.green, ...HYD.towers]);
  }

  if (/\bjubilee\b/i.test(blob) || /\bbanjara\b/i.test(blob) || /\bluxury\b/i.test(blob)) {
    return uniqUrls([...HYD.premium, ...HYD.lake, ...HYD.towers]);
  }

  if (/\buppal\b/i.test(blob) || /\borr knot\b/i.test(blob)) {
    return uniqUrls([...HYD.lake, ...HYD.towers]);
  }

  if (/\bsecunderabad\b/i.test(blob)) {
    return uniqUrls([...HYD.infra.slice(0, 1), ...HYD.premium, ...HYD.lake]);
  }

  if (/\bshankarpally\b/i.test(blob) || /\boutskirts\b/i.test(blob) || /\branga reddy\b/i.test(blob)) {
    return uniqUrls([...HYD.lake, ...HYD.plot, ...HYD.towers]);
  }

  return uniqUrls([...HYD.towers, ...HYD.tech, ...HYD.lake, ...HYD.premium]);
}

export function heroUrlForCatalogListing(p) {
  const pool = heroPoolForListing(p);
  const h = hash32(`${p?._id || ''}|${p?.title || ''}|${p?.location || ''}|hero`);
  return pool[h % pool.length];
}

/** Gallery side column — thematic pools (top = exterior mood, bottom = interior / contrast) */
export function poolsForListing(property) {
  const blob = `${property?.title || ''} ${property?.location || ''} ${property?.description || ''}`.toLowerCase();

  const plotBio = /\b(plot|plots|investment land|open land|agricultur|tract|tellapur corridor|commercial-ready plot)\b/.test(blob);
  if (plotBio) return { top: [...HYD.plot, ...HYD.towers], bottom: [...INTERIORS, ...HYD.lake] };

  if (/shamshabad|airport|rajiv gandhi/i.test(blob)) return { top: HYD.infra, bottom: [...HYD.towers, ...INTERIORS] };
  if (/secunderabad|railway|junction|canton/.test(blob)) return { top: HYD.infra, bottom: [...HYD.premium, ...INTERIORS] };
  if (/uppal|tank bund|orr knot/.test(blob)) return { top: HYD.lake, bottom: [...HYD.towers, ...INTERIORS] };
  if (/kokapet|financial|hitec|hitech|gachibowli|madhapur|\btcs\b|tech corridor|cyberabad/.test(blob))
    return { top: HYD.tech, bottom: [...HYD.lake, ...INTERIORS] };
  if (/miyapur|kukatpally|metro belt/.test(blob)) return { top: HYD.towers, bottom: [...HYD.tech, ...INTERIORS] };
  if (/jubilee|banjara/.test(blob)) return { top: HYD.premium, bottom: [...HYD.towers, ...INTERIORS] };
  if (/kompally/.test(blob)) return { top: HYD.green, bottom: [...HYD.towers, ...INTERIORS] };
  if (/shankarpally|ranga reddy outskirts/.test(blob)) return { top: [...HYD.lake, ...HYD.plot], bottom: [...HYD.green, ...INTERIORS] };
  if (/villa|duplex|bungalow|penthouse|heritage/.test(blob)) return { top: [...HYD.premium, ...HYD.lake], bottom: [...INTERIORS, ...HYD.towers] };

  return {
    top: [...HYD.towers, ...HYD.tech, ...HYD.lake],
    bottom: [...INTERIORS, ...HYD.premium],
  };
}
