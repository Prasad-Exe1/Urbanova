const CONTACT = process.env.NOMINATIM_CONTACT_EMAIL || 'urbanova-dev@localhost';

/**
 * Nominatim usage policy: identify app + reasonable rate limits.
 * https://operations.osmfoundation.org/policies/nominatim/
 *
 * Returns { lat, lng, displayName } or null
 */
async function nominatimGeocodeAddress(addressLine) {
    if (!addressLine) return null;
    const q = encodeURIComponent(`${addressLine}, Hyderabad, Telangana, India`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': `UrbanovaHY/1.0 (${CONTACT})`,
            Accept: 'application/json',
        },
    });
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || !arr.length) return null;
    const hit = arr[0];
    return {
        lat: parseFloat(hit.lat),
        lng: parseFloat(hit.lon),
        displayName: hit.display_name,
    };
}

module.exports = { nominatimGeocodeAddress };
