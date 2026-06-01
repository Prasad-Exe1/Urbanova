import { useMemo, useState } from 'react';

/**
 * Free OSM embed (standard + HOT). Pass hideLayerSwitcher for a cleaner detail page.
 */
function PropertyDualMap({ lat, lng, title, addressLabel, hideLayerSwitcher = false, height = 320 }) {
    const [layer, setLayer] = useState('osm');

    const osmSrc = useMemo(() => {
        if (lat == null || lng == null) return null;
        const d = 0.02;
        const minLat = lat - d;
        const minLon = lng - d;
        const maxLat = lat + d;
        const maxLon = lng + d;
        const mapLayer = layer === 'hot' ? 'hot' : 'mapnik';
        return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=${mapLayer}&marker=${lat},${lng}`;
    }, [lat, lng, layer]);

    if (lat == null || lng == null) {
        return (
            <p style={{ color: 'var(--text-secondary)' }}>
                No coordinates yet — tap &quot;Refresh Hyderabad area data&quot; (uses free OSM geocoding on the server).
            </p>
        );
    }

    return (
        <div>
            {!hideLayerSwitcher && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => setLayer('osm')}
                        style={{
                            flex: 1,
                            minWidth: '120px',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.85rem',
                            borderRadius: '8px',
                            border: layer === 'osm' ? '1px solid var(--accent)' : '1px solid var(--border)',
                            background: layer === 'osm' ? 'rgba(251, 191, 36, 0.08)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                        }}
                    >
                        OSM — Standard
                    </button>
                    <button
                        type="button"
                        onClick={() => setLayer('hot')}
                        style={{
                            flex: 1,
                            minWidth: '120px',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.85rem',
                            borderRadius: '8px',
                            border: layer === 'hot' ? '1px solid var(--accent)' : '1px solid var(--border)',
                            background: layer === 'hot' ? 'rgba(251, 191, 36, 0.08)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                        }}
                    >
                        OSM — Humanitarian
                    </button>
                </div>
            )}
            <iframe
                title={title || 'Property map'}
                src={osmSrc}
                width="100%"
                height={height}
                style={{ border: 0, borderRadius: '12px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Map data © <a href="https://openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>OpenStreetMap contributors</a>
                . Pin marks the approximate site centroid for this listing.
            </p>
            {addressLabel && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{addressLabel}</p>
            )}
        </div>
    );
}

export default PropertyDualMap;
