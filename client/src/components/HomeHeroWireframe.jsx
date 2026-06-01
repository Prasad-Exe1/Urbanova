import { useId } from 'react';

/**
 * Evenly spaced parallel gold beams — full-height rails, halo + crisp layer.
 */
export default function HomeHeroWireframe() {
  const uid = useId().replace(/:/g, '');
  const gGrad = `uv-beam-${uid}`;
  const warm = `uv-warm-${uid}`;
  const bloomFilter = `uv-bloom-${uid}`;

  const LINE_COUNT = 24;
  const GUTTER = 3;
  const span = 100 - 2 * GUTTER;
  const xs = Array.from({ length: LINE_COUNT }, (_, i) => GUTTER + (span * i) / (LINE_COUNT - 1));

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none
        [mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_100%)]
        [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_100%)]"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 100 140"
      >
        <defs>
          <linearGradient id={gGrad} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff8ed" stopOpacity="0.98" />
            <stop offset="28%" stopColor="#fad56d" stopOpacity="0.9" />
            <stop offset="62%" stopColor="#d9a924" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#5e4710" stopOpacity="0.28" />
          </linearGradient>
          <radialGradient id={warm} cx="50%" cy="4%" r="80%">
            <stop offset="0%" stopColor="#3a2e14" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#111014" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#07070c" stopOpacity="0" />
          </radialGradient>
          <filter
            id={bloomFilter}
            x="-8"
            y="-6"
            width="116"
            height="152"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="B" />
            <feMerge>
              <feMergeNode in="B" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100" height="140" fill="#050508" />
        <rect width="100" height="140" fill={`url(#${warm})`} />

        {/* Soft column wash — identical x for even glow */}
        <g stroke={`url(#${gGrad})`} strokeLinecap="round" opacity={0.9}>
          {xs.map((x, i) => (
            <line key={`wash-${i}`} x1={x} y1="-0.5" x2={x} y2="140.5" strokeWidth="0.42" opacity="0.14" />
          ))}
        </g>

        {/* Crisp rails — every 5th slightly brighter */}
        <g stroke={`url(#${gGrad})`} strokeLinecap="round" filter={`url(#${bloomFilter})`}>
          {xs.map((x, i) => {
            const accent = i % 5 === 0;
            return (
              <line
                key={`rail-${i}`}
                x1={x}
                y1="-0.5"
                x2={x}
                y2="140.5"
                strokeWidth={accent ? 0.12 : 0.085}
                opacity={accent ? 0.58 : 0.38}
              />
            );
          })}
        </g>
      </svg>

      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(255,251,238,0.6) 1px, transparent 1.06px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_92%_85%_at_50%_32%,transparent_38%,rgba(0,0,0,0.52)_100%)]" />
    </div>
  );
}
