const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function nearbyType(lat, lng, radiusM, placeType) {
    if (!GOOGLE_KEY) return [];
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(radiusM));
    url.searchParams.set('type', placeType);
    url.searchParams.set('key', GOOGLE_KEY);

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return [];
    return data.results.slice(0, 10).map((r) => ({
        name: r.name,
        types: r.types,
        vicinity: r.vicinity,
    }));
}

/**
 * Lightweight samples for schools, hospitals, shopping — keeps quota low (3 parallel calls).
 */
async function googlePlacesSummary(lat, lng) {
    if (!GOOGLE_KEY) return { available: false, reason: 'no_google_key' };

    const radiusM = 1800;
    const [schools, hospitals, shopping] = await Promise.all([
        nearbyType(lat, lng, radiusM, 'school'),
        nearbyType(lat, lng, radiusM, 'hospital'),
        nearbyType(lat, lng, radiusM, 'shopping_mall'),
    ]);

    return {
        available: true,
        radiusM,
        counts: {
            school: schools.length,
            hospital: hospitals.length,
            shopping_mall: shopping.length,
        },
        samples: {
            school: schools.slice(0, 3),
            hospital: hospitals.slice(0, 3),
            shopping_mall: shopping.slice(0, 3),
        },
    };
}

module.exports = { googlePlacesSummary };
