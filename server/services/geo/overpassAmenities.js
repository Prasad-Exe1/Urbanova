/**
 * OpenStreetMap via Overpass — free (please keep radius modest and cache server-side).
 * Returns summarized POIs near lat/lng.
 */

function buildQuery(lat, lng, radiusM) {
    return `
[out:json][timeout:25];
(
  node["amenity"="school"](around:${radiusM},${lat},${lng});
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
  node["railway"="station"](around:${radiusM},${lat},${lng});
  node["amenity"="fuel"](around:${radiusM},${lat},${lng});
);
out body 70;
`;
}

async function overpassSummary(lat, lng, radiusM = 1500) {
    const endpoint = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
    const q = buildQuery(lat, lng, radiusM);
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(q)}`,
    });
    if (!res.ok) {
        return { available: false, error: `http_${res.status}` };
    }
    const data = await res.json();
    const elems = Array.isArray(data.elements) ? data.elements : [];

    const byKind = {
        school: [],
        hospital: [],
        pharmacy: [],
        railway_station: [],
        fuel: [],
    };

    for (const el of elems) {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || 'unknown';
        if (tags.amenity === 'school') byKind.school.push(name);
        if (tags.amenity === 'hospital') byKind.hospital.push(name);
        if (tags.amenity === 'pharmacy') byKind.pharmacy.push(name);
        if (tags.railway === 'station') byKind.railway_station.push(name);
        if (tags.amenity === 'fuel') byKind.fuel.push(name);
    }

    return {
        available: true,
        radiusM,
        counts: {
            school: byKind.school.length,
            hospital: byKind.hospital.length,
            pharmacy: byKind.pharmacy.length,
            railway_station: byKind.railway_station.length,
            fuel: byKind.fuel.length,
        },
        samples: {
            school: byKind.school.slice(0, 5),
            hospital: byKind.hospital.slice(0, 5),
            pharmacy: byKind.pharmacy.slice(0, 5),
            railway_station: byKind.railway_station.slice(0, 5),
            fuel: byKind.fuel.slice(0, 5),
        },
    };
}

module.exports = { overpassSummary };
