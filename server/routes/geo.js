const router = require('express').Router();
const supabase = require('../config/supabase');
const { enrichPropertyGeo } = require('../services/hyderabad/enrichPropertyGeo');
const { isHyderabadListing } = require('../services/hyderabad/isHyderabadListing');
const { normalizeFeedItem } = require('../services/hyderabad/syncHyderabadJsonFeed');

const mapCached = (property) => ({
    propertyId: property.id,
    hyderabad: isHyderabadListing(property),
    latitude: property.latitude,
    longitude: property.longitude,
    geoProvider: property.geo_provider,
    geoEnrichedAt: property.geo_enriched_at,
    amenities: property.amenities_json,
    amenitiesEnrichedAt: property.amenities_enriched_at,
});

/**
 * GET cached geo + amenities blob (no outbound API calls unless refresh=1).
 */
router.get('/hyderabad/context/:propertyId', async (req, res) => {
    try {
        const { data: property, error } = await supabase
            .from('properties')
            .select('id, location, pincode, latitude, longitude, geo_provider, geo_enriched_at, amenities_json, amenities_enriched_at')
            .eq('id', req.params.propertyId)
            .single();

        if (error || !property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        if (!isHyderabadListing(property)) {
            return res.status(400).json({ message: 'Hyderabad geo pipeline only applies to Hyderabad listings.' });
        }

        if (req.query.refresh === '1') {
            const r = await enrichPropertyGeo(property.id);
            if (!r.ok) {
                return res.status(422).json({ message: 'Enrichment failed', detail: r.reason });
            }
            const { data: fresh } = await supabase
                .from('properties')
                .select('id, location, pincode, latitude, longitude, geo_provider, geo_enriched_at, amenities_json, amenities_enriched_at')
                .eq('id', property.id)
                .single();
            return res.json({ ...mapCached(fresh), refreshed: true });
        }

        return res.json({ ...mapCached(property), refreshed: false });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

/** Manual / cron: enrich one row */
router.post('/hyderabad/enrich/:propertyId', async (req, res) => {
    try {
        const key = process.env.HYDERABAD_JOB_SECRET;
        if (key && req.get('x-hyderabad-job-key') !== key) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const r = await enrichPropertyGeo(req.params.propertyId);
        if (!r.ok) return res.status(422).json(r);
        res.json(r);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

/** Bulk backfill Hyderabad rows missing coords (respect Nominatim — run rarely). */
router.post('/hyderabad/enrich-missing', async (req, res) => {
    try {
        const key = process.env.HYDERABAD_JOB_SECRET;
        if (!key || req.get('x-hyderabad-job-key') !== key) {
            return res.status(403).json({ message: 'Forbidden — set HYDERABAD_JOB_SECRET' });
        }

        const batch = Math.min(parseInt(req.query.limit, 10) || 15, 30);
        const { data: rows, error } = await supabase.from('properties').select('id, location, pincode, latitude');

        if (error) throw error;

        const candidates = (rows || []).filter(
            (p) => isHyderabadListing(p) && (p.latitude == null || p.longitude == null),
        ).slice(0, batch);

        const results = [];
        for (const p of candidates) {
            results.push(await enrichPropertyGeo(p.id));
            await new Promise((r) => setTimeout(r, 1200));
        }
        res.json({ processed: candidates.length, results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * Pull Hyderabad-only listings from HYDERABAD_LISTINGS_FEED_URL (same machine or GitHub raw).
 * Upsert by external_id — call via cron POST with secret header.
 */
router.post('/hyderabad/sync-feed', async (req, res) => {
    try {
        const key = process.env.HYDERABAD_JOB_SECRET;
        if (!key || req.get('x-hyderabad-job-key') !== key) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const url = process.env.HYDERABAD_LISTINGS_FEED_URL;
        if (!url) {
            return res.status(400).json({ message: 'Set HYDERABAD_LISTINGS_FEED_URL' });
        }

        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!r.ok) return res.status(502).json({ message: `Feed HTTP ${r.status}` });

        const body = await r.json();
        const list = Array.isArray(body) ? body : body.listings || body.properties;
        if (!Array.isArray(list)) {
            return res.status(422).json({ message: 'Feed must be array or { listings: [] }' });
        }

        const rows = list.map(normalizeFeedItem).filter(Boolean);
        if (!rows.length) {
            return res.json({ upserted: 0, message: 'No valid Hyderabad rows with external_id' });
        }

        const chunk = 40;
        let total = 0;
        for (let i = 0; i < rows.length; i += chunk) {
            const part = rows.slice(i, i + chunk);
            const { error } = await supabase.from('properties').upsert(part, { onConflict: 'external_id' });
            if (error) throw error;
            total += part.length;
        }

        res.json({ upserted: total, source: url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
