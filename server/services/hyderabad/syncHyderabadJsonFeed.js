const { isHyderabadListing } = require('./isHyderabadListing');

/**
 * Normalizes external feed item → row for `properties` upsert.
 * Feed must use external_id for idempotent updates.
 */
function normalizeFeedItem(item) {
    const price = Number(item.price);
    if (!item.title || !item.description || !item.location || Number.isNaN(price)) {
        return null;
    }
    const row = {
        title: String(item.title).trim(),
        description: String(item.description).trim(),
        price,
        location: String(item.location).trim(),
        pincode: item.pincode ? String(item.pincode).trim() : null,
        image: item.image ? String(item.image).trim() : null,
        source: (item.source ? String(item.source) : 'hyderabad_feed').trim(),
        external_id: String(item.external_id || '').trim(),
    };
    if (!row.external_id) return null;
    if (!isHyderabadListing(row)) return null;
    return row;
}

module.exports = { normalizeFeedItem };
