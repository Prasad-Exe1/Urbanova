import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { approxCoordsForListing, jitterCoords } from '../utils/listingApproxCoords';

function formatListingPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function useMinMd() {
  const [ok, setOk] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width:768px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width:768px)');
    const fn = () => setOk(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  return ok;
}

const dotIcon = L.divIcon({
  className: 'properties-map-marker',
  html: '<div class="properties-map-marker-dot" aria-hidden="true"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/**
 * Interactive OSM map with one marker per filtered listing (DB coordinates or locality/pincode centroid).
 */
function PropertiesLeafletMap({ listings }) {
  const wideEnough = useMinMd();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!wideEnough) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
      return undefined;
    }

    const el = containerRef.current;
    if (!el) return undefined;

    if (!mapRef.current) {
      mapRef.current = L.map(el, {
        scrollWheelZoom: true,
      }).setView([17.41, 78.48], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);

      layerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();

    const latLngs = [];

    for (const p of listings) {
      const base = approxCoordsForListing(p);
      if (!base) continue;
      const [lat, lng] = jitterCoords(p._id, base[0], base[1]);
      const ll = L.latLng(lat, lng);
      latLngs.push(ll);

      const title = escapeHtml(p.title || 'Listing');
      const price = escapeHtml(formatListingPrice(p.price));
      const loc = escapeHtml(`${p.location || ''}${p.pincode ? ` · ${p.pincode}` : ''}`);
      const id = encodeURIComponent(String(p._id));

      const marker = L.marker(ll, { icon: dotIcon }).bindPopup(
        `<div class="properties-map-popup">
          <div class="properties-map-popup-price">${price}</div>
          <div class="properties-map-popup-title">${title}</div>
          <div class="properties-map-popup-loc">${loc}</div>
          <a class="properties-map-popup-link" href="/property/${id}">View listing →</a>
        </div>`,
        { minWidth: 200 }
      );
      layer.addLayer(marker);
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0], 13);
    } else if (latLngs.length > 1) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [48, 48], maxZoom: 12 });
    } else {
      map.setView([17.41, 78.48], 11);
    }

    const fixSize = () => map.invalidateSize();
    window.addEventListener('resize', fixSize);
    requestAnimationFrame(() => requestAnimationFrame(fixSize));

    return () => window.removeEventListener('resize', fixSize);
  }, [wideEnough, listings]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  if (!wideEnough) return null;

  return (
    <div className="flex-1 relative bg-surface-variant min-h-0 min-w-0 flex flex-col">
      <div ref={containerRef} className="absolute inset-0 z-0 min-h-[320px] leaflet-dark-attribution" />
      <div className="absolute bottom-0 left-0 right-0 z-[500] pointer-events-none bg-gradient-to-t from-background/90 via-background/35 to-transparent pt-12 pb-sm px-md">
        <p className="text-on-surface-variant text-[11px] leading-snug pointer-events-auto">
          Pins match current results (exact coords when available; otherwise approximate area).{' '}
          <a
            href="https://www.openstreetmap.org/#map=11/17.41/78.48"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Open full map
          </a>
        </p>
      </div>
    </div>
  );
}

export default PropertiesLeafletMap;
