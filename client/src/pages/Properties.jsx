import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropertiesLeafletMap from '../components/PropertiesLeafletMap.jsx';
import { listingMentionsRera } from '../utils/listingRera.js';
import { effectiveListingBhk, listingMatchesBhkPref } from '../utils/listingBhk.js';
import { assignUniqueCatalogHeroes, resolveListingHeroUrl } from '../utils/listingHeroImage.js';

/** Public catalogue sort controls (matches admin listing sorts where applicable). */
const LISTING_SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-desc', label: 'Price — High to Low' },
  { value: 'price-asc', label: 'Price — Low to High' },
  { value: 'title', label: 'Title (A–Z)' },
];

const MAP_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCYbJg6g5dIwt6kLf7orq3GZ4ntOp_BPRfEyN9MmZqsLmf1wgNWF0QLxF59IEknhe-zzQLuqitQrg-rkpDjKwEX9PY__eKsz_w_x9P3Vqk8383gDGGzAPwqYfhnzLscrqvfaaHxsK8woMCrXRt2C2Eql5wOdrAxUBC-xkh5GF_h1e9WZ9hmMWmAaajKX_4qUIj0sPzgkA23rt0WkPiTeiZ1i2gdGUyVD7w7Qk-kvUavHTHG1wkpj2SpeFhJBuiF0s1u4Xe1HXxasHk';

/** Stitch refine presets — locality keywords */
const HOOD_PRESETS = [
  { label: 'Jubilee Hills', needle: 'jubilee' },
  { label: 'Gachibowli', needle: 'gachibowli' },
  { label: 'Financial District', needle: 'financial' },
  { label: 'Banjara Hills', needle: 'banjara' },
];

/** Slider at this value means no extra max-budget cap (illustrative refine). */
const BUDGET_MAX_CR = 50;

function formatListingPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatBudgetSliderLabel(cr) {
  if (!Number.isFinite(cr)) return '—';
  if (cr >= BUDGET_MAX_CR) return `Up to ₹${BUDGET_MAX_CR} Cr+`;
  return `Up to ₹${cr % 1 === 0 ? cr : cr.toFixed(1)} Cr`;
}

function chipFor(p) {
  const s = `${p.availabilityStatus || p.status || ''}`.toLowerCase();
  if (s.includes('ready')) return { label: 'Ready to Move', pulse: true };
  if (s.includes('under') || s.includes('construct')) return { label: 'Under Construction', pulse: false };
  if (listingMentionsRera(p)) return { label: 'RERA Verified', pulse: true };
  return { label: 'Listed', pulse: false };
}

function Properties() {
  const [searchParams] = useSearchParams();

  function mapHeroCorridor(q) {
    if (!q || q === 'Corridor') return 'Corridor';
    const x = String(q).toLowerCase();
    if (x === 'ghmc') return 'GHMC Core';
    if (x === 'cyberabad') return 'West Tech Belt';
    if (x === 'orr') return 'ORR Growth Corridor';
    if (x === 'secunderabad') return 'GHMC Core';
    return 'Corridor';
  }

  function mapHeroType(q) {
    if (!q || q === 'Property Type') return 'Property Type';
    const cap = String(q).charAt(0).toUpperCase() + String(q).slice(1).toLowerCase();
    const opts = ['Apartment', 'Villa', 'Commercial', 'Plot'];
    return opts.includes(cap) ? cap : 'Property Type';
  }

  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [corridor, setCorridor] = useState(() => mapHeroCorridor(searchParams.get('corridor')));
  const [ptype, setPtype] = useState(() => mapHeroType(searchParams.get('type')));
  const [reraOnly, setReraOnly] = useState(false);
  const [bhkPref, setBhkPref] = useState(null);
  /** Max budget in ₹ Cr; at {@link BUDGET_MAX_CR} the sidebar does not cap price. */
  const [budgetMaxCr, setBudgetMaxCr] = useState(BUDGET_MAX_CR);
  /** relevance = API order; price sorts applied after filters */
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch properties');
        return res.json();
      })
      .then((data) => {
        setProperties(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err));
  }, []);

  const filteredProperties = useMemo(() => {
    let result = properties;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(lowerTerm) ||
          (p.location || '').toLowerCase().includes(lowerTerm)
      );
    }

    if (priceRange !== 'all') {
      const parts = priceRange.split('-').map(Number);
      const min = parts[0];
      const max = parts[1];
      if (max) {
        result = result.filter((p) => p.price >= min && p.price <= max);
      } else {
        result = result.filter((p) => p.price >= min);
      }
    }

    if (budgetMaxCr < BUDGET_MAX_CR) {
      const maxRupees = budgetMaxCr * 1e7;
      result = result.filter((p) => {
        const pr = Number(p.price);
        return Number.isFinite(pr) && pr <= maxRupees;
      });
    }

    if (corridor && corridor !== 'Corridor') {
      const k = corridor.toLowerCase();
      result = result.filter((p) => {
        const blob = `${p.location || ''} ${p.title || ''} ${p.description || ''}`.toLowerCase();
        if (k.includes('tech')) return blob.includes('tech') || blob.includes('hitec') || blob.includes('gachibowli');
        if (k.includes('ghmc')) return blob.includes('ghmc') || blob.includes('hyderabad');
        if (k.includes('orr')) return blob.includes('orr') || blob.includes('outer');
        return blob.includes(k);
      });
    }

    if (ptype && ptype !== 'Property Type') {
      const k = ptype.toLowerCase();
      result = result.filter((p) => {
        const blob = `${p.title || ''} ${p.description || ''}`.toLowerCase();
        return blob.includes(k);
      });
    }

    if (reraOnly) {
      result = result.filter((p) => listingMentionsRera(p));
    }

    if (bhkPref != null) {
      result = result.filter((p) => listingMatchesBhkPref(p, bhkPref));
    }

    return result;
  }, [searchTerm, priceRange, budgetMaxCr, corridor, ptype, reraOnly, bhkPref, properties]);

  const heroById = useMemo(() => assignUniqueCatalogHeroes(properties), [properties]);

  function imgSrc(p) {
    const fromMap = heroById.get(p._id);
    return fromMap || resolveListingHeroUrl(p) || MAP_IMG;
  }

  const sortedFilteredProperties = useMemo(() => {
    const list = [...filteredProperties];
    const pa = (p) => {
      const n = Number(p.price);
      return Number.isFinite(n) ? n : 0;
    };
    switch (sortBy) {
      case 'price-desc':
        list.sort((a, b) => pa(b) - pa(a));
        break;
      case 'price-asc':
        list.sort((a, b) => pa(a) - pa(b));
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        break;
      case 'title':
        list.sort((a, b) =>
          String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' })
        );
        break;
      default:
        break;
    }
    return list;
  }, [filteredProperties, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setPriceRange('all');
    setCorridor('Corridor');
    setPtype('Property Type');
    setReraOnly(false);
    setBhkPref(null);
    setBudgetMaxCr(BUDGET_MAX_CR);
    setSortBy('relevance');
  };

  const hoodRowActive = (needle) => searchTerm.toLowerCase().includes(needle);

  return (
    <div className="flex flex-col h-[calc(100vh-3.75rem)] md:h-[calc(100vh-3.75rem)] min-h-0 bg-background overflow-hidden">
      <div className="bg-[#141418] border-b border-white/[0.06] z-40 relative shrink-0">
        <div className="max-w-max-width mx-auto px-margin py-3.5 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-md items-center w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search locality or landmark"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-[#101012] border border-white/[0.08] rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 w-full md:w-72 text-[13px]"
              />
            </div>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="bg-[#101012] border border-white/[0.08] rounded-md px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-[13px] min-w-[140px]"
            >
              <option value="all">Price Range</option>
              <option value="0-10000000">Under ₹1 Cr</option>
              <option value="10000000-20000000">₹1 Cr - ₹2 Cr</option>
              <option value="20000000-999999999999">Above ₹2 Cr</option>
            </select>
            <select
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
              className="bg-[#101012] border border-white/[0.08] rounded-md px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-[13px] min-w-[160px]"
            >
              <option>Corridor</option>
              <option>West Tech Belt</option>
              <option>GHMC Core</option>
              <option>ORR Growth Corridor</option>
            </select>
            <select
              value={ptype}
              onChange={(e) => setPtype(e.target.value)}
              className="bg-[#101012] border border-white/[0.08] rounded-md px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-[13px] min-w-[140px]"
            >
              <option>Property Type</option>
              <option>Apartment</option>
              <option>Villa</option>
              <option>Plot</option>
            </select>
          </div>
          <div className="flex items-center gap-sm mt-md md:mt-0">
            <span className="text-white/50 text-[13px] font-medium">RERA only</span>
            <button
              type="button"
              role="switch"
              aria-checked={reraOnly}
              onClick={() => setReraOnly(!reraOnly)}
              className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${reraOnly ? 'bg-primary-container' : 'bg-surface-variant'}`}
            >
              <div
                className={`w-4 h-4 bg-on-primary rounded-full absolute top-0.5 shadow-sm transition-all ${reraOnly ? 'right-0.5' : 'left-0.5'}`}
              />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden w-full max-w-[1800px] mx-auto min-h-0">
        <aside className="hidden xl:flex w-[min(20rem,100%)] shrink-0 flex-col border-r border-white/[0.06] bg-[#101012] overflow-y-auto custom-scrollbar">
          <div className="border border-white/[0.07] bg-[#141418] rounded-lg p-6 m-3 sticky top-3">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/[0.06]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Refine</span>
            </div>
            <div className="mb-8">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-3">Area</label>
              <div className="space-y-3">
                {HOOD_PRESETS.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onClick={() => setSearchTerm(h.label)}
                    className={`w-full flex items-center justify-between p-3 rounded-md border text-left text-[13px] transition-colors ${
                      hoodRowActive(h.needle)
                        ? 'bg-white/[0.05] border-white/12 text-white'
                        : 'border-white/[0.06] text-white/55 hover:border-white/15 hover:text-white/80'
                    }`}
                  >
                    <span>{h.label}</span>
                    {hoodRowActive(h.needle) ? (
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label
                htmlFor="refine-budget-cr"
                className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-2"
              >
                Budget (illustrative)
              </label>
              <p className="text-[12px] text-white/55 mb-3 m-0 tabular-nums">{formatBudgetSliderLabel(budgetMaxCr)}</p>
              <input
                id="refine-budget-cr"
                type="range"
                min={1}
                max={BUDGET_MAX_CR}
                step={1}
                value={budgetMaxCr}
                onChange={(e) => setBudgetMaxCr(Number(e.target.value))}
                className="block w-full h-2 mb-2 accent-[#e8c547] cursor-pointer"
                aria-valuemin={1}
                aria-valuemax={BUDGET_MAX_CR}
                aria-valuenow={budgetMaxCr}
              />
              <div className="flex justify-between text-white/40 text-[11px]">
                <span>₹0 Cr</span>
                <span>₹{BUDGET_MAX_CR} Cr+</span>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-3">Bedrooms</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, '5+'].map((b) => {
                  const v = b === '5+' ? '5+' : b;
                  const active = bhkPref === v;
                  return (
                    <button
                      key={String(b)}
                      type="button"
                      onClick={() => setBhkPref(active ? null : v)}
                      className={`h-9 rounded-md flex items-center justify-center text-[13px] border transition-colors ${
                        active ? 'bg-white/[0.07] border-primary/50 text-primary' : 'border-white/[0.08] text-white/50 hover:border-white/20'
                      }`}
                    >
                      {b === '5+' ? '5+' : b}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full border border-white/20 text-white text-[11px] font-semibold py-2.5 rounded-md hover:bg-white/[0.06] transition-colors uppercase tracking-wide"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="w-full md:w-[380px] lg:w-[420px] bg-[#101012] border-r border-white/[0.06] flex flex-col h-full z-10 flex-shrink-0 min-h-0">
          <div className="px-4 py-3.5 border-b border-white/[0.06] flex justify-between items-center gap-3 shrink-0 flex-wrap">
            <h2 className="text-[15px] font-semibold text-white m-0 tabular-nums">
              {sortedFilteredProperties.length}{' '}
              <span className="text-white/45 font-normal">{sortedFilteredProperties.length === 1 ? 'listing' : 'listings'}</span>
            </h2>
            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0 min-w-0">
              <span className="sr-only">Sort listings</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="box-border h-9 max-w-[calc(100vw-8rem)] md:max-w-none bg-[#141418] border border-white/[0.1] rounded-md pl-2.5 pr-8 py-0 text-white text-[12px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/25 min-w-[11rem] leading-normal"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.35rem center',
                  backgroundSize: '1rem',
                }}
                aria-label="Sort listings"
              >
                {LISTING_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#141418] text-white">
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 min-h-0">
            {sortedFilteredProperties.map((p) => {
              const chip = chipFor(p);
              return (
                <Link key={p._id} to={`/property/${p._id}`} className="block group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                  <article className="rounded-lg overflow-hidden bg-[#141418] border border-white/[0.07] hover:border-white/[0.14] cursor-pointer transition-[border-color,box-shadow] duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
                    <div className="relative h-52 sm:h-60 overflow-hidden bg-black/40">
                      <img
                        alt=""
                        src={imgSrc(p)}
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.dataset.fallback === '1') return;
                          el.dataset.fallback = '1';
                          el.src = MAP_IMG;
                        }}
                      />
                      {listingMentionsRera(p) ? (
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded border border-white/10 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-white">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                          </span>
                          RERA Verified
                        </div>
                      ) : (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-white/10 text-[10px] font-medium text-white/90">
                          {chip.label}
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <div className="text-lg sm:text-xl leading-none font-semibold tabular-nums text-primary tracking-tight drop-shadow-md">
                          {formatListingPrice(p.price)}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-5">
                      <div className="mb-4">
                          <h3 className="text-[17px] font-semibold text-white mb-2 line-clamp-2 leading-snug tracking-tight">
                            {p.title}
                          </h3>
                          <p className="text-[13px] text-white/50 flex items-start gap-1.5 m-0">
                            <span className="material-symbols-outlined text-white/35 text-[16px] shrink-0 mt-0.5">location_on</span>
                            <span className="truncate">
                              {p.location}
                              {p.pincode ? `, ${p.pincode}` : ''}
                            </span>
                          </p>
                        </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 py-4 border-y border-white/[0.06] mb-4 text-[13px] text-white/70">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-white/35 text-[16px]">bed</span>
                          {(() => {
                            const b = effectiveListingBhk(p);
                            return b != null ? `${b} BHK` : '—';
                          })()}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-white/35 text-[16px]">straighten</span>
                          {p.areaSqft ? `${p.areaSqft.toLocaleString('en-IN')} Sft` : '—'}
                        </span>
                      </div>
                      <span className="flex w-full justify-center py-2.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.08em] text-on-primary bg-primary hover:brightness-105 active:brightness-95 transition-all">
                        View listing
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}

            {sortedFilteredProperties.length === 0 && (
              <div className="text-center py-12 px-4 text-on-surface-variant text-sm space-y-4">
                <p>No listings match this search.</p>
                {properties.length === 0 && (
                  <>
                    <p className="max-w-md mx-auto leading-relaxed">
                      In Supabase (same project as <code className="text-primary">server/.env</code>), run{' '}
                      <code className="text-primary">sql/bootstrap_estate_dev.sql</code> once, then from repo root run{' '}
                      <code className="text-primary">npm run seed:hyderabad</code>.
                    </p>
                    <Link to="/add" className="inline-block text-primary font-label-sm hover:text-primary-fixed">
                      Create listing →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 relative bg-[#1a1a1f] min-h-0 min-w-0 flex-col border-l border-white/[0.04]">
          <PropertiesLeafletMap listings={sortedFilteredProperties} />
        </div>
        </div>
      </main>
    </div>
  );
}

export default Properties;
