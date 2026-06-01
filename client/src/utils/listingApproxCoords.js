/** Approximate [lat, lng] for catalogue map pins — uses DB coords when present, else pincode/locality hints (demo accuracy). */

const PINCODE_CENTROIDS = {
  '500003': [17.4399, 78.4983],
  '500014': [17.5392, 78.5598],
  '500032': [17.4401, 78.3489],
  '500033': [17.4319, 78.4076],
  '500034': [17.4199, 78.4388],
  '500048': [17.3685, 78.4338],
  '500072': [17.4933, 78.3996],
  '500075': [17.4029, 78.3489],
  '500081': [17.4474, 78.3768],
  '500089': [17.3947, 78.3414],
  '501203': [17.074, 77.935],
  '502032': [17.5233, 78.2547],
  '503001': [18.6715, 77.9429],
  '506002': [17.9756, 79.6014],
};

/** Longest / most specific hints first */
const LOCALITY_HINTS = [
  ['kokapet financial district', [17.4029, 78.3489]],
  ['financial district', [17.4029, 78.3489]],
  ['kokapet', [17.4029, 78.3489]],
  ['nanakramguda', [17.419, 78.357]],
  ['raidurg', [17.4198, 78.3799]],
  ['narsingi', [17.3934, 78.3378]],
  ['tellapur', [17.5233, 78.2547]],
  ['manikonda', [17.3947, 78.3414]],
  ['attapur', [17.3685, 78.4338]],
  ['hitec city', [17.4474, 78.3768]],
  ['madhapur', [17.4487, 78.3908]],
  ['gachibowli', [17.4401, 78.3489]],
  ['jubilee hills', [17.4319, 78.4076]],
  ['banjara hills', [17.4199, 78.4388]],
  ['secunderabad', [17.4399, 78.4983]],
  ['kompally', [17.5392, 78.5598]],
  ['kukatpally', [17.4933, 78.3996]],
  ['shankarpally', [17.074, 77.935]],
  ['warangal urban', [17.9756, 79.6014]],
  ['warangal', [17.9756, 79.6014]],
  ['nizamabad', [18.6715, 77.9429]],
  ['hyderabad', [17.385, 78.4867]],
];

function toNum(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/** Tiny jitter so stacked listings at same centroid remain clickable */
export function jitterCoords(id, lat, lng) {
  const s = String(id ?? '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const dLat = (((h >>> 0) % 1000) / 1000 - 0.5) * 0.018;
  const dLng = (((h >>> 10) % 1000) / 1000 - 0.5) * 0.018;
  return [lat + dLat, lng + dLng];
}

export function approxCoordsForListing(p) {
  const lat = toNum(p.latitude ?? p.lat);
  const lng = toNum(p.longitude ?? p.lng);
  if (lat != null && lng != null) return [lat, lng];

  const pc = String(p.pincode ?? '')
    .trim()
    .replace(/\s/g, '');
  if (PINCODE_CENTROIDS[pc]) return [...PINCODE_CENTROIDS[pc]];

  const blob = `${p.location ?? ''} ${p.title ?? ''}`.toLowerCase();
  for (const [hint, coords] of LOCALITY_HINTS) {
    if (blob.includes(hint)) return [...coords];
  }

  return null;
}
