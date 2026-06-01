/**
 * Lightweight classifier: listing is treated as Hyderabad / GHMC-centric service area for geo + feeds.
 */

function normalizePin(pin) {
    return String(pin || '').replace(/\s/g, '');
}

function isHyderabadListing(property) {
    const loc = (property.location || '').toLowerCase();
    const pin = normalizePin(property.pincode);

    if (/hyderabad|secunderabad|cyberabad|ghmc|ranga\s*reddy|rangareddy|telangana|kokapet|madhapur|kondapur|banjara|jubilee|nanakramguda|gachibowli/.test(loc)) {
        return true;
    }
    /* Telangana capital region pin codes often start with 500 — coarse filter */
    if (/^50[0-9]{3}$/.test(pin)) {
        return true;
    }
    return false;
}

/** Rough bounding box around Hyderabad agglomeration — used to reject bad geocodes */
function isInsideHyderabadRegion(lat, lng) {
    if (lat == null || lng == null) return false;
    return lat >= 17.05 && lat <= 17.85 && lng >= 78.05 && lng <= 79.05;
}

module.exports = { isHyderabadListing, isInsideHyderabadRegion, normalizePin };
