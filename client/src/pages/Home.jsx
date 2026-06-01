import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Toast from '../components/Toast';
import { GoldFloatingPathsBackdrop } from '@/components/ui/background-paths';
import { assignUniqueCatalogHeroes } from '../utils/listingHeroImage.js';

const HERO_LINE1 = "Hyderabad's Finest";
const HERO_LINE2 = 'Urban Homes';
const TYPE_MS = 38;
const BETWEEN_LINES_MS = 280;
/** Gap between start of one full typing cycle and the next (ms). Use 30_000 or 60_000 to taste. */
const HERO_HEADLINE_CYCLE_MS = 60_000;

/** Sentence-case labels — less “marketing template”, clearer scan */
const STATS_ROWS = [
  { k: 'Metro', sub: 'Hyderabad-first catalogue' },
  { k: '500–501', sub: 'Pin corridors & peri-urban bands' },
  { k: 'Rupee tiers', sub: 'From lakhs through premium crores' },
];

/** Mirrors Hyderabad seed spotlight rows when `promoted` is not yet in the API response */
const DEMO_PROMOTED_EXTERNAL_IDS = new Set([
  'urbanova-default-hyd-001',
  'urbanova-default-hyd-002',
  'urbanova-default-hyd-004',
  'urbanova-default-hyd-007',
  'urbanova-default-hyd-008',
  'urbanova-default-hyd-013',
]);

function formatPriceInr(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

function Home({ openAuth, user }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [heroLine1, setHeroLine1] = useState('');
  const [heroLine2, setHeroLine2] = useState('');
  const [cursorOnLine1, setCursorOnLine1] = useState(true);
  const [cursorOnLine2, setCursorOnLine2] = useState(false);
  const [goldLineReady, setGoldLineReady] = useState(false);

  useEffect(() => {
    let dead = false;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const playOnce = async () => {
      setHeroLine1('');
      setHeroLine2('');
      setCursorOnLine1(true);
      setCursorOnLine2(false);
      setGoldLineReady(false);

      await sleep(180);
      if (dead) return;
      for (let i = 1; i <= HERO_LINE1.length; i++) {
        if (dead) return;
        setHeroLine1(HERO_LINE1.slice(0, i));
        await sleep(TYPE_MS);
      }
      setCursorOnLine1(false);
      setCursorOnLine2(true);
      if (dead) return;
      await sleep(BETWEEN_LINES_MS);
      if (dead) return;
      for (let j = 1; j <= HERO_LINE2.length; j++) {
        if (dead) return;
        setHeroLine2(HERO_LINE2.slice(0, j));
        await sleep(TYPE_MS);
      }
      setGoldLineReady(true);
      if (dead) return;
      await sleep(640);
      if (dead) return;
      setCursorOnLine2(false);
    };

    (async () => {
      while (!dead) {
        const t0 = performance.now();
        await playOnce();
        if (dead) return;
        const elapsed = performance.now() - t0;
        const wait = Math.max(0, HERO_HEADLINE_CYCLE_MS - elapsed);
        await sleep(wait);
      }
    })();

    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    fetch('/api/properties')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => (Array.isArray(rows) ? setCatalog(rows) : setCatalog([])))
      .catch(() => setCatalog([]));
  }, []);

  const heroById = useMemo(() => assignUniqueCatalogHeroes(catalog), [catalog]);

  const featuredSites = useMemo(() => {
    if (!catalog.length) return [];
    const f = catalog.filter(
      (p) => p.promoted === true || DEMO_PROMOTED_EXTERNAL_IDS.has(p.external_id),
    );
    return [...f].sort((a, b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 12);
  }, [catalog]);

  const goExplore = () => navigate('/properties');

  const listProperty = () => {
    if (!user) openAuth('register', 'seller');
    else if (user.role !== 'seller' && user.role !== 'agent') {
      setToast({ message: 'Register as a seller to list properties.', type: 'error' });
    } else {
      navigate('/add');
    }
  };

  return (
    <div className="relative flex flex-col flex-grow bg-[#0e0e10] text-white overflow-hidden isolate">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#101012]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_140%_100%_at_50%_-18%,#18171c_0%,#111113_52%,#0a0a0c_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_min(92%,740px)_min(78%,620px)_at_93%_40%,rgba(242,202,80,0.11),transparent_62%),radial-gradient(ellipse_95%_48%_at_50%_-6%,rgba(212,175,55,0.075),transparent_58%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-[-8%] right-0 w-[min(62%,640px)] mix-blend-soft-light opacity-[0.28]"
        style={{
          backgroundImage: `
            linear-gradient(118deg, rgba(242, 202, 80, 0.14) 0 1px, transparent 1px),
            linear-gradient(rgba(230, 200, 100, 0.08) 0 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
          WebkitMaskImage: 'linear-gradient(270deg, #000 0%, #000 min(72%,460px), transparent 100%)',
          maskImage: 'linear-gradient(270deg, #000 0%, #000 min(72%,460px), transparent 100%)',
        }}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-[100%] w-[100%] opacity-[0.09] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="urbanova-home-grain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#urbanova-home-grain)" />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_50%,transparent_42%,rgba(0,0,0,0.32)_125%)] mix-blend-multiply opacity-[0.42]"
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <main className="relative z-[1] flex-grow">
        <section className="relative w-full overflow-hidden pt-8 pb-10 md:pt-12 md:pb-14 px-margin md:px-margin-page">
          <GoldFloatingPathsBackdrop />
          <div className="relative z-10 w-full flex flex-col gap-7 md:gap-9 px-sm md:px-0">
            <div className="w-full flex flex-col items-center text-center max-w-4xl mx-auto">
              <p className="text-[12px] md:text-[13px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-3.5">
                Greater Hyderabad · resale & new launch
              </p>
              <h1
                className="font-hero-title text-[clamp(1.9rem,5.4vw,3.35rem)] leading-[1.05] tracking-[-0.035em] mb-[1.125rem] antialiased"
                aria-label={`${HERO_LINE1} ${HERO_LINE2}`}
              >
                <span className="block text-white font-medium min-h-[1.05em]">
                  {heroLine1}
                  {cursorOnLine1 ? <span className="hero-type-cursor text-white/60" aria-hidden>|</span> : null}
                </span>
                <span
                  className={`block mt-1.5 md:mt-2 font-bold min-h-[1.05em] ${
                    goldLineReady ? 'hero-title-gold' : 'text-primary'
                  } transition-colors duration-300`}
                >
                  {heroLine2}
                  {cursorOnLine2 ? (
                    <span className="hero-type-cursor text-primary/80" aria-hidden>
                      |
                    </span>
                  ) : null}
                </span>
              </h1>
              <p className="font-body-md text-[15px] md:text-[17px] text-white/72 mb-0 max-w-2xl leading-relaxed mx-auto">
                Metro-scoped inventory with locality field, INR bands, and tooling for buyers and sellers in the Telangana
                capital region.
              </p>
            </div>

            <div className="w-full rounded-lg border border-white/[0.08] bg-[#141418] shadow-[0_20px_56px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/[0.07]">
                {STATS_ROWS.map((row) => (
                  <div key={row.k} className="flex-1 px-4 py-4 md:px-6 md:py-5 text-left lg:text-center">
                    <div className="text-[16px] md:text-[17px] font-semibold text-primary tabular-nums">{row.k}</div>
                    <div className="text-[13px] md:text-[14px] leading-snug text-white/52 mt-2 max-w-[240px] lg:max-w-none lg:mx-auto">
                      {row.sub}
                    </div>
                  </div>
                ))}
                <div className="flex items-stretch lg:w-[min(100%,15rem)] shrink-0">
                  <button
                    type="button"
                    onClick={goExplore}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-4 md:py-5 lg:py-0 bg-primary text-on-primary text-[12px] md:text-[13px] font-bold uppercase tracking-[0.1em] hover:brightness-105 active:brightness-95 transition-all border-t lg:border-t-0 lg:border-l border-white/[0.08]"
                  >
                    View listings
                    <span className="material-symbols-outlined !text-[20px]" aria-hidden>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {featuredSites.length > 0 ? (
              <div className="w-full text-left">
                <div className="mb-3 md:mb-4 px-1">
                  <h2 className="text-[13px] md:text-[14px] font-bold uppercase tracking-[0.12em] text-primary">
                    Featured sites
                  </h2>
                  <p className="text-[13px] md:text-[14px] text-white/48 mt-1.5 leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-none">
                    Promoted placements on the Hyderabad catalogue — paid spotlight for verified sellers & agents (demo).
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-[#141418] shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
                  <div
                    className="featured-sites-scroller flex gap-3 md:gap-4 overflow-x-auto pb-3 pt-3 px-3 md:pb-4 md:pt-4 md:px-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] custom-scrollbar scroll-pl-3 md:scroll-pl-4"
                    role="list"
                    aria-label="Featured property listings — scroll for more"
                  >
                    {featuredSites.map((p) => (
                      <Link
                        key={p._id}
                        to={`/property/${p._id}`}
                        role="listitem"
                        className="featured-site-card snap-start shrink-0 group rounded-xl border border-white/[0.08] bg-[#101012]/85 overflow-hidden hover:border-primary/35 hover:bg-[#16161a]/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#101012]"
                      >
                        <div className="relative aspect-[5/3] bg-black/40 overflow-hidden">
                          <img
                            src={heroById.get(p._id) || ''}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          <span className="absolute left-2.5 top-2.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-black/70 text-primary border border-primary/35">
                            Promoted
                          </span>
                        </div>
                        <div className="p-3 md:p-3.5 space-y-1">
                          <p className="text-[14px] md:text-[15px] font-semibold text-white leading-snug line-clamp-2">{p.title}</p>
                          <p className="text-[12px] md:text-[13px] text-white/48 line-clamp-1">{p.location}</p>
                          <p className="text-[15px] md:text-[16px] font-semibold tabular-nums text-primary pt-0.5">
                            {formatPriceInr(p.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="relative w-full py-16 md:py-24 px-margin md:px-margin-page border-t border-white/[0.06]">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-[clamp(1.35rem,3.2vw,1.75rem)] font-semibold text-white tracking-tight">
              List with Urbanova
            </h2>
            <p className="text-[16px] md:text-[17px] text-white/62 leading-relaxed m-0">
              Reach buyers scouting Jubilee, Cyberabad, Miyapur, and ORR micro-markets — with tools that keep your listing
              coherent and easy to compare.
            </p>
            <button
              type="button"
              onClick={listProperty}
              className="mt-1 inline-flex items-center justify-center px-9 py-3.5 rounded-md border border-white/28 text-[13px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/[0.06] transition-colors"
            >
              Start a listing
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
