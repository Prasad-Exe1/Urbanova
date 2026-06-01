/**
 * Illustrative 2D layout derived from listing fields and title/description (not surveyed CAD).
 * Site kind (plot vs built form) and room counts drive geometry; micro-variation is deterministic from id.
 */

import { effectiveListingBhk } from '../utils/listingBhk.js';

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function parseSqftFromText(combined) {
  if (!combined) return null;
  const m =
    combined.match(/([\d,.]+)\s*sq\.?\s*ft\b/i) ||
    combined.match(/([\d,.]+)\s*(?:super\s*)?build[-\s]?up\b/i) ||
    combined.match(/([\d,.]+)\s*sft\b/i);
  if (!m) return null;
  const n = parseFloat(String(m[1]).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function inferSiteKind(title, description) {
  const t = `${title || ''} ${description || ''}`.toLowerCase();
  if (/\b(commercial|warehouse|showroom|mixed[-\s]?use)\b/.test(t) && /\b(plot|land)\b/.test(t)) return 'commercial_plot';
  if (
    /\b(plot|plots|land parcel|farmland|agricultural|investment land|open land|tract|acre|site(?! visit))\b/.test(t) ||
    (/\bland\b/.test(t) && /\b(investment|residential plot|corner plot)\b/.test(t))
  ) {
    return 'plot';
  }
  if (/\b(penthouse|sky\s+villa|duplex\s+penthouse)\b/.test(t)) return 'penthouse';
  if (/\b(villa|bungalow|independent house|g\+1|g\s*\+\s*\d|duplex(?!\s+penthouse)|heritage|row\s*villa|gated\s*villa)\b/.test(t))
    return 'villa';
  return 'apartment';
}

function isDuplexStack(title, description) {
  const t = `${title || ''} ${description || ''}`;
  return /\b(duplex|g\+1|g\s*\+\s*\d|two[- ]storey|two[- ]story|G\+1)\b/i.test(t);
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function scaleFromSqft(sqft, baseSqft = 1350) {
  if (!Number.isFinite(sqft) || sqft <= 0) return 1;
  return clamp(Math.sqrt(sqft / baseSqft), 0.72, 1.38);
}

export default function FloorPlan2D({
  propertyId,
  title,
  description,
  bedrooms,
  bathrooms,
  areaSqft: areaProp,
}) {
  const blob = `${title || ''} ${description || ''}`;
  const h = hash32(String(propertyId ?? title ?? 'plan'));
  const rnd = (mod) => (h % mod) / mod;

  const kind = inferSiteKind(title, description);
  const inferredBhkRaw = effectiveListingBhk({ bedrooms, title, description });
  let effectiveBhk = clamp(Math.max(1, inferredBhkRaw ?? 2), 1, 8);
  const isPlotLike = kind === 'plot' || kind === 'commercial_plot';
  if (isPlotLike) {
    effectiveBhk = inferredBhkRaw != null ? clamp(inferredBhkRaw, 1, 8) : 1;
  }

  const rawBath = Number(bathrooms);
  const bathCount = Number.isFinite(rawBath) && rawBath > 0 ? Math.round(rawBath) : clamp(Math.max(1, Math.min(effectiveBhk, 4)), 1, 6);

  const sqftNum = Number(areaProp);
  const parsedSqft = parseSqftFromText(blob);
  const sqft = Number.isFinite(sqftNum) && sqftNum > 0 ? sqftNum : parsedSqft;
  const scale = scaleFromSqft(sqft);

  const duplexStack =
    isDuplexStack(title, description) && (kind === 'villa' || kind === 'penthouse');
  const pid = String(propertyId ?? 'x').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 24) || 'plan';
  const gridId = `fp-grid-${pid}`;
  const northId = `fp-n-${pid}`;

  let subtitle =
    'Illustrative floor arrangement — not to scale; confirm with site visit and sanctioned drawings.';
  if (kind === 'plot' || kind === 'commercial_plot')
    subtitle = 'Illustrative site / boundary — not a registered survey map.';
  else if (duplexStack)
    subtitle = 'Illustrative floor plates — not to scale; verify stair core and headroom on site.';

  const metaParts = [kind === 'plot' || kind === 'commercial_plot' ? 'Site plan' : 'Built form'];
  if (!isPlotLike || inferredBhkRaw != null) {
    metaParts.push(`${effectiveBhk} BR`);
    metaParts.push(`${bathCount} bath`);
  } else {
    metaParts.push('No dwelling count (land)');
  }
  if (Number.isFinite(sqft)) metaParts.push(`${Math.round(sqft).toLocaleString('en-IN')} sft ref.`);
  const metaLine = metaParts.join(' · ');

  return (
    <figure className="m-0 rounded-lg border border-white/[0.08] bg-[#0c0c0e] overflow-hidden">
      <figcaption className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#111114]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            {kind === 'plot' || kind === 'commercial_plot' ? '2D site layout' : '2D floor layout'}
          </div>
          <p className="text-[12px] text-white/45 mt-1 m-0">{subtitle}</p>
          <p className="text-[11px] text-white/35 mt-2 m-0 tabular-nums">{metaLine}</p>
        </div>
        <span className="text-[10px] text-white/35 uppercase tracking-wider shrink-0 self-start">Demo render</span>
      </figcaption>
      <div className="p-4 md:p-6">
        {kind === 'plot' || kind === 'commercial_plot' ? (
          <PlotSvg
            title={title}
            commercial={kind === 'commercial_plot'}
            sqft={sqft}
            h={h}
            rnd={rnd}
            gridId={gridId}
            northId={northId}
            scale={scale}
          />
        ) : duplexStack ? (
          <DuplexSvg
            effectiveBhk={effectiveBhk}
            bathCount={bathCount}
            sqft={sqft}
            scale={scale}
            rnd={rnd}
            gridId={gridId}
            penthouse={kind === 'penthouse'}
          />
        ) : (
          <FloorPlateSvg
            kind={kind === 'penthouse' ? 'penthouse' : kind === 'villa' ? 'villa' : 'apartment'}
            effectiveBhk={effectiveBhk}
            bathCount={bathCount}
            sqft={sqft}
            scale={scale}
            h={h}
            rnd={rnd}
            gridId={gridId}
          />
        )}
      </div>
    </figure>
  );
}

function PlotSvg({ title, commercial, sqft, h, rnd, gridId, northId, scale }) {
  const w = 340 * scale;
  const d = 200 * scale;
  const ox = 200 - w / 2;
  const oy = 42;
  const roadH = 22;
  const setback = 10 + rnd(7) * 6;
  const skew = (rnd(17) - 0.5) * 8;

  const labelSqft =
    Number.isFinite(sqft) && sqft > 0 ? `Ref. ~${Math.round(sqft).toLocaleString('en-IN')} sft` : 'Dimensions illustrative';

  return (
    <svg
      viewBox="0 0 400 280"
      className="w-full h-auto max-h-[min(52vh,340px)] text-white/80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Illustrative site layout for ${title || 'land listing'}`}
    >
      <defs>
        <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        </pattern>
        <marker id={northId} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(242,202,80,0.65)" />
        </marker>
      </defs>
      <rect width="400" height="280" fill={`url(#${gridId})`} />
      <text x="24" y="26" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="system-ui,sans-serif">
        N
      </text>
      <line x1="32" y1="34" x2="32" y2="18" stroke="rgba(242,202,80,0.55)" strokeWidth="1.2" markerEnd={`url(#${northId})`} />

      <rect x="12" y="248" width="376" height={roadH} rx="2" fill="rgba(30,30,35,0.9)" stroke="rgba(255,255,255,0.08)" />
      <text x="20" y="263" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="system-ui,sans-serif">
        Road / access frontage (illustrative)
      </text>

      <polygon
        points={`${ox + skew},${oy} ${ox + w + skew * 0.3},${oy} ${ox + w},${oy + d} ${ox},${oy + d}`}
        fill="rgba(18,22,28,0.95)"
        stroke="rgba(242,202,80,0.4)"
        strokeWidth="1.5"
      />
      <rect
        x={ox + setback}
        y={oy + setback}
        width={w - 2 * setback}
        height={d - 2 * setback - 8}
        fill="none"
        stroke="rgba(34,211,238,0.25)"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      <text x={ox + 8} y={oy + 22} fill="rgba(255,255,255,0.55)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">
        {commercial ? 'Plot envelope (mixed-use potential)' : 'Plot / site outline'}
      </text>
      <text x={ox + 8} y={oy + 38} fill="rgba(34,211,238,0.55)" fontSize="9" fontFamily="system-ui,sans-serif">
        {labelSqft} · setbacks not per authority
      </text>
      <text x={ox + 8} y={oy + d - 18} fill="rgba(255,255,255,0.28)" fontSize="8" fontFamily="system-ui,sans-serif">
        Hash seed {h % 10000} — orientation symbolic
      </text>
    </svg>
  );
}

function DuplexSvg({ effectiveBhk, bathCount, sqft, scale, rnd, gridId, penthouse }) {
  const floorA = Math.ceil(effectiveBhk / 2);
  const floorB = effectiveBhk - floorA;
  return (
    <svg
      viewBox="0 0 400 300"
      className="w-full h-auto max-h-[min(56vh,380px)]"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustrative duplex floor plates"
    >
      <defs>
        <pattern id={`${gridId}-d`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill={`url(#${gridId}-d)`} />
      <rect x="14" y="12" width="372" height="128" fill="none" stroke="rgba(242,202,80,0.22)" rx="2" />
      <text x="22" y="30" fill="rgba(242,202,80,0.8)" fontSize="10" fontFamily="system-ui,sans-serif">
        Ground / parking & living
      </text>
      <FloorRooms
        x0={22}
        y0={42}
        w={356}
        h={108}
        beds={Math.max(1, floorA)}
        baths={Math.max(1, Math.ceil(bathCount / 2))}
        scale={scale}
        rnd={rnd}
        compact
      />
      <rect x="14" y="150" width="372" height="132" fill="none" stroke="rgba(242,202,80,0.22)" rx="2" />
      <text x="22" y="168" fill="rgba(242,202,80,0.8)" fontSize="10" fontFamily="system-ui,sans-serif">
        Upper — beds & terrace edge
      </text>
      <FloorRooms
        x0={22}
        y0={176}
        w={356}
        h={98}
        beds={Math.max(1, floorB || 1)}
        baths={Math.max(1, Math.floor(bathCount / 2))}
        scale={scale * 0.95}
        rnd={(mod) => rnd(mod + 3)}
        compact
      />
      {penthouse ? (
        <rect x="260" y="182" width="118" height="48" fill="rgba(22,22,26,0.6)" stroke="rgba(242,202,80,0.35)" strokeDasharray="5 4" />
      ) : null}
      {penthouse ? (
        <text x="268" y="208" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="system-ui,sans-serif">
          Terrace
        </text>
      ) : null}
      <line x1="14" y1="146" x2="386" y2="146" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />
      <text x="22" y="292" fill="rgba(255,255,255,0.28)" fontSize="8" fontFamily="system-ui,sans-serif">
        {Number.isFinite(sqft) ? `Area basis ~${Math.round(sqft).toLocaleString('en-IN')} sft` : 'Plate sizes scaled to listing context'}
      </text>
    </svg>
  );
}

function FloorPlateSvg({ kind, effectiveBhk, bathCount, sqft, scale, h, rnd, gridId }) {
  const villa = kind === 'villa';
  const pent = kind === 'penthouse';
  const vbH = pent ? 300 : 268;
  return (
    <svg
      viewBox={`0 0 400 ${vbH}`}
      className="w-full h-auto max-h-[min(52vh,360px)]"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustrative floor plate"
    >
      <defs>
        <pattern id={`${gridId}-f`} width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="400" height={vbH} fill={`url(#${gridId}-f)`} />
      <rect x="12" y="12" width="376" height={vbH - 24} fill="none" stroke="rgba(242,202,80,0.2)" strokeWidth="1.5" rx="2" />
      {pent ? (
        <>
          <rect x="20" y="18" width="360" height="44" fill="rgba(22,22,26,0.65)" stroke="rgba(242,202,80,0.4)" strokeDasharray="6 4" />
          <text x="28" y="44" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="system-ui,sans-serif">
            Private terrace / sky deck (illustrative)
          </text>
        </>
      ) : null}
      <FloorRooms
        x0={20}
        y0={pent ? 70 : 24}
        w={360}
        h={pent ? 168 : 196}
        beds={effectiveBhk}
        baths={bathCount}
        scale={scale * (villa ? 1.06 : pent ? 1.02 : 1)}
        rnd={rnd}
        compact={false}
        gardenStrip={villa}
      />
      {villa ? (
        <rect x="20" y={vbH - 48} width="360" height="32" fill="rgba(20,40,28,0.35)" stroke="rgba(74,222,128,0.35)" />
      ) : null}
      {villa ? (
        <text x="28" y={vbH - 28} fill="rgba(167,243,208,0.75)" fontSize="9" fontFamily="system-ui,sans-serif">
          Garden / setback band
        </text>
      ) : null}
      <text x="20" y={vbH - 10} fill="rgba(255,255,255,0.28)" fontSize="8" fontFamily="system-ui,sans-serif">
        {Number.isFinite(sqft) ? `Scaled to ~${Math.round(sqft).toLocaleString('en-IN')} sft footprint` : `Layout id · ${h % 100000}`}
      </text>
    </svg>
  );
}

/**
 * Shared room block: living + kitchen on top band, bed grid (width excludes bath stack), bath column, balcony.
 */
function FloorRooms({ x0, y0, w, h, beds, baths, scale, rnd, compact }) {
  const bathBlockW = clamp(52 * scale, 44, 74);
  const g = 8;
  const balconyH = 18;
  const livingH = compact ? 46 : 54;
  const rowY = y0 + (compact ? 2 : 6);
  const maxCols = compact ? 3 : 4;
  const topBandW = w - bathBlockW - g;
  const livingW = clamp(Math.floor(topBandW * 0.62), compact ? 96 : 120, compact ? 170 : 210);
  const kitW = topBandW - livingW - g;

  const n = Math.max(1, beds);
  const cols = Math.min(maxCols, n);
  const rows = Math.ceil(n / cols);
  const bedGridTop = rowY + livingH + g;
  const vertForBeds = h - (bedGridTop - y0) - balconyH - 4;
  let bedH = rows > 0 ? Math.floor((vertForBeds - Math.max(0, rows - 1) * g) / rows) : 38;
  bedH = clamp(bedH, 26, compact ? 42 : 48);

  const usableBedW = w - bathBlockW - g;
  const bedW = Math.floor((usableBedW - (cols - 1) * g) / cols);

  const bathColumnH = rows * bedH + Math.max(0, rows - 1) * g;

  return (
    <>
      <rect x={x0} y={rowY} width={livingW} height={livingH} fill="rgba(22,22,26,0.95)" stroke="rgba(255,255,255,0.12)" />
      <text x={x0 + 8} y={rowY + (compact ? 22 : 28)} fill="rgba(255,255,255,0.5)" fontSize={compact ? 9 : 10} fontFamily="system-ui,sans-serif">
        Living / dining
      </text>
      <rect
        x={x0 + livingW + g}
        y={rowY}
        width={kitW}
        height={livingH * 0.62}
        fill="rgba(22,22,26,0.95)"
        stroke="rgba(255,255,255,0.1)"
      />
      <text x={x0 + livingW + g + 6} y={rowY + 22} fill="rgba(255,255,255,0.42)" fontSize="9" fontFamily="system-ui,sans-serif">
        Kitchen
      </text>
      <rect
        x={x0 + livingW + g}
        y={rowY + livingH * 0.64}
        width={kitW}
        height={livingH * 0.36}
        fill="rgba(22,22,26,0.88)"
        stroke="rgba(255,255,255,0.08)"
      />
      <text x={x0 + livingW + g + 6} y={rowY + livingH * 0.82} fill="rgba(255,255,255,0.32)" fontSize="8" fontFamily="system-ui,sans-serif">
        Utility
      </text>

      {Array.from({ length: n }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx = x0 + col * (bedW + g);
        const by = bedGridTop + row * (bedH + g);
        return (
          <rect
            key={i}
            x={bx}
            y={by}
            width={bedW}
            height={bedH}
            fill="rgba(22,22,26,0.92)"
            stroke="rgba(242,202,80,0.2)"
          />
        );
      })}
      {Array.from({ length: n }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx = x0 + col * (bedW + g);
        const by = bedGridTop + row * (bedH + g);
        return (
          <text
            key={`t-${i}`}
            x={bx + 6}
            y={by + Math.min(bedH * 0.55, compact ? 22 : 26)}
            fill="rgba(255,255,255,0.42)"
            fontSize="8"
            fontFamily="system-ui,sans-serif"
          >
            BR {i + 1}
          </text>
        );
      })}

      <rect
        x={x0 + w - bathBlockW}
        y={bedGridTop}
        width={bathBlockW}
        height={bathColumnH}
        fill="rgba(22,22,26,0.85)"
        stroke="rgba(255,255,255,0.1)"
      />
      <text x={x0 + w - bathBlockW + 6} y={bedGridTop + 18} fill="rgba(255,255,255,0.38)" fontSize="8" fontFamily="system-ui,sans-serif">
        {baths > 1 ? `${baths} baths` : 'Bath'}
      </text>

      <rect
        x={x0}
        y={y0 + h - balconyH}
        width={w}
        height={balconyH - 2}
        fill="rgba(22,22,26,0.55)"
        stroke="rgba(242,202,80,0.25)"
        strokeDasharray="4 3"
      />
      <text x={x0 + 6} y={y0 + h - 6} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="system-ui,sans-serif">
        Balcony · sit-out
      </text>

      <path
        d={`M ${x0 + livingW * 0.45} ${rowY + livingH} A 12 12 0 0 1 ${x0 + livingW * 0.45 + 14} ${rowY + livingH}`}
        fill="none"
        stroke="rgba(242,202,80,0.35)"
        strokeWidth="1"
        opacity={0.45 + rnd(40) * 0.02}
      />
    </>
  );
}
