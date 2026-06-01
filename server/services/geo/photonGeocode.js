/**
 * Photon (Komoot) — OSM-based geocoder, no API key.
 * https://photon.komoot.io
 * Use as fallback when Nominatim is rate-limited or misses.
 */

async function photonGeocodeAddress(addressLine) {
    if (!addressLine) return null;
    const q = encodeURIComponent(`${addressLine}, Telangana, India`);
    const url = `https://photon.komoot.io/api/?q=${q}&limit=1`;
    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    if (!feat?.geometry?.coordinates) return null;
    const [lng, lat] = feat.geometry.coordinates;
    if (lat == null || lng == null) return null;
    return {
        lat,
        lng,
        label: feat.properties?.name || feat.properties?.street || addressLine,
    };
}

module.exports = { photonGeocodeAddress };
