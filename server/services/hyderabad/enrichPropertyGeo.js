const supabase = require('../../config/supabase');
const { isHyderabadListing, isInsideHyderabadRegion } = require('./isHyderabadListing');
const { nominatimGeocodeAddress } = require('../geo/nominatimGeocode');
const { photonGeocodeAddress } = require('../geo/photonGeocode');
const { googleGeocodeAddress } = require('../geo/googleGeocode');
const { googlePlacesSummary } = require('../geo/googlePlacesNearby');
const { overpassSummary } = require('../geo/overpassAmenities');

function buildAddressLine(property) {
    const parts = [property.location, property.pincode, 'Telangana'].filter(Boolean);
    return parts.join(', ');
}

/**
 * Geocode: **free first** (Nominatim → Photon → optional Google if key set).
 * Amenities: Overpass (OSM) always; Google Places only when GOOGLE_MAPS_API_KEY is set.
 * Set GOOGLE_MAPS_API_KEY="" or unset to stay 100% free.
 */
async function enrichPropertyGeo(propertyId) {
    const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

    if (error || !property) {
        return { ok: false, reason: 'not_found' };
    }
    if (!isHyderabadListing(property)) {
        return { ok: false, reason: 'not_hyderabad' };
    }

    const addressLine = buildAddressLine(property);
    let lat = property.latitude;
    let lng = property.longitude;
    let geoProvider = property.geo_provider;

    if (lat == null || lng == null) {
        const googleKey = process.env.GOOGLE_MAPS_API_KEY;
        const preferGoogle = process.env.GEO_PREFER_GOOGLE === 'true';

        const tryAssign = (candidate, provider) => {
            if (!candidate || !isInsideHyderabadRegion(candidate.lat, candidate.lng)) return false;
            lat = candidate.lat;
            lng = candidate.lng;
            geoProvider = provider;
            return true;
        };

        let resolved = false;
        if (preferGoogle && googleKey) {
            const g = await googleGeocodeAddress(addressLine);
            resolved = tryAssign(g, 'google');
        }

        if (!resolved) {
            const n = await nominatimGeocodeAddress(addressLine);
            resolved = tryAssign(n, 'nominatim');
        }

        /* Nominatim policy: avoid rapid back-to-back requests */
        if (!resolved) {
            await new Promise((r) => setTimeout(r, 1100));
        }

        if (!resolved) {
            const p = await photonGeocodeAddress(addressLine);
            resolved = tryAssign(p, 'photon');
        }

        if (!resolved && googleKey && !preferGoogle) {
            const g = await googleGeocodeAddress(addressLine);
            resolved = tryAssign(g, 'google');
        }

        if (!resolved) {
            return { ok: false, reason: 'geocode_failed' };
        }
    }

    const useGooglePlaces = !!(process.env.GOOGLE_MAPS_API_KEY && process.env.DISABLE_GOOGLE_PLACES !== 'true');

    const [googleAmenities, osmAmenities] = await Promise.all([
        useGooglePlaces ? googlePlacesSummary(lat, lng) : Promise.resolve({ available: false, reason: 'free_mode_no_google_places' }),
        overpassSummary(lat, lng),
    ]);

    const amenitiesJson = {
        hyderabad: true,
        generatedAt: new Date().toISOString(),
        googlePlaces: googleAmenities,
        openStreetMap: osmAmenities,
    };

    const nowIso = new Date().toISOString();

    const { error: upErr } = await supabase
        .from('properties')
        .update({
            latitude: lat,
            longitude: lng,
            geo_provider: geoProvider,
            geo_enriched_at: nowIso,
            amenities_json: amenitiesJson,
            amenities_enriched_at: nowIso,
        })
        .eq('id', propertyId);

    if (upErr) {
        return { ok: false, reason: 'db_error', detail: upErr.message };
    }

    return {
        ok: true,
        propertyId,
        lat,
        lng,
        geoProvider,
    };
}

module.exports = { enrichPropertyGeo, buildAddressLine };
