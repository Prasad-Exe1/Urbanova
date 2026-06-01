const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Returns { lat, lng, formattedAddress } or null
 */
async function googleGeocodeAddress(addressLine) {
    if (!GOOGLE_KEY || !addressLine) return null;
    const q = encodeURIComponent(`${addressLine}, India`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${GOOGLE_KEY}&region=in`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;
    const loc = data.results[0].geometry?.location;
    if (!loc) return null;
    return {
        lat: loc.lat,
        lng: loc.lng,
        formattedAddress: data.results[0].formatted_address,
    };
}

module.exports = { googleGeocodeAddress };
