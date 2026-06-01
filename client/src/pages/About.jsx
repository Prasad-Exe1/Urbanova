import { Link } from 'react-router-dom';

const SITE_FEATURES = [
  {
    icon: 'location_on',
    title: 'Hyderabad‑metro catalogue',
    body:
      'Public listings are scoped to Greater Hyderabad and nearby belts — GHMC, Cyberabad, ORR micro-markets, and selected 500 / 501 pin corridors — with clear, INR-first pricing.',
  },
  {
    icon: 'map',
    title: 'Map + list in one flow',
    body: 'Explore inventory on an interactive map alongside filters and cards, so you can compare locality and commute context without leaving the page.',
  },
  {
    icon: 'hotel_class',
    title: 'Livability score',
    body:
      'A Livability lens scores each listing against everyday quality-of-life signals — locality fit, openness and greenbelt proxies where data allows, connectivity to jobs and corridors, infra access, noise and bustle heuristics, and how well the asset matches declared bedrooms and use — so INR price is weighed against habitability, not hype.',
  },
  {
    icon: 'design_services',
    title: 'Mandatory 2D plan block on every property',
    body:
      'Urbanova does not parcel listings as photo-only thumbnails: every listing detail page carries a compulsory structured 2D plan section — a standardized illustrative floor / site diagram derived from bedrooms, baths, area, asset type, and copy so layouts stay comparable end-to-end. It is illustrative (not sanctioned CAD); the rule is catalogue consistency.',
  },
  {
    icon: 'verified',
    title: 'RERA signals where supplied',
    body: 'Listings can highlight RERA registration when sellers provide it. Always cross-check project and agent registration on official Telangana / RERA portals.',
  },
  {
    icon: 'campaign',
    title: 'Featured sites (promoted)',
    body:
      'Spotlight placements on the home page help sellers and agents stand out — a paid-promotion pattern you can extend with billing and moderation as you grow.',
  },
  {
    icon: 'auto_awesome',
    title: 'AI property assistant',
    body: 'The floating assistant answers in the context of the live catalogue — useful for quick scans, comparisons, and “what fits my budget?” style questions.',
  },
  {
    icon: 'calculate',
    title: 'Mortgage & negotiation helpers',
    body: 'Listing pages include tools to approximate EMI scenarios and draft negotiation talking points grounded in the property you are viewing.',
  },
  {
    icon: 'photo_library',
    title: 'Richer listing presentation',
    body: 'Themed hero imagery and text-aware BHK/context hints sit alongside that mandatory plan scaffold so dense inventory scans faster than a generic photo carousel.',
  },
  {
    icon: 'dashboard',
    title: 'Roles that match your workflow',
    body: 'Buyers browse freely; sellers and agents get dashboards to manage listings. Admin tooling supports broader ops when you need it.',
  },
];

function About() {
  return (
    <main className="max-w-max-width mx-auto px-margin py-xl pb-24 flex flex-col gap-xl">
      <div className="glass-panel rounded-stitch border border-outline-variant/35 p-xl md:p-2xl text-center shadow-stitch-sm">
        <p className="font-label-sm text-primary uppercase tracking-widest mb-md">About</p>
        <h1 className="font-display-xl text-display-xl text-on-background mb-lg m-0">About Urbanova</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-xl">
          Urbanova is a Hyderabad-first property discovery platform — built for genuine metro inventory across GHMC belts, the
          Cyberabad corridor, Outer Ring neighbourhoods, and selected peri-urban corridors in Ranga Reddy, Medchal, and Sangareddy.
          We optimise for INR-native pricing clarity, locality-aware search, and transparent seller flows as you scale toward live feed
          & verification.
        </p>
        <div className="flex flex-wrap gap-md justify-center">
          <Link
            to="/properties"
            className="inline-flex items-center gap-sm bg-primary text-on-primary font-label-sm px-lg py-sm rounded-lg hover:bg-primary-fixed transition-colors"
          >
            Browse listings
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-sm border border-white/20 text-on-background font-label-sm px-lg py-sm rounded-lg hover:bg-white/5 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-stitch border border-outline-variant/35 p-xl md:p-2xl shadow-stitch-sm">
        <div className="text-center max-w-2xl mx-auto mb-xl">
          <p className="font-label-sm text-primary uppercase tracking-widest mb-md m-0">Features</p>
          <h2 className="font-display-xl text-[clamp(1.35rem,3.4vw,1.75rem)] text-on-background m-0 mb-md tracking-tight">
            What makes this site different
          </h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed m-0">
            Built for serious search in one metro — not a generic national scroll feed. Here is what you get today on Urbanova.
          </p>
        </div>
        <ul className="grid sm:grid-cols-2 gap-4 md:gap-5 list-none m-0 p-0" role="list">
          {SITE_FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex gap-md p-md md:p-lg rounded-xl border border-white/[0.08] bg-white/[0.02] text-left hover:border-primary/25 transition-colors"
            >
              <span
                className="material-symbols-outlined shrink-0 text-primary !text-[26px] leading-none mt-0.5"
                aria-hidden
              >
                {f.icon}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-on-background text-[15px] m-0 mb-1 tracking-tight">{f.title}</h3>
                <p className="text-on-surface-variant text-[13px] md:text-[14px] leading-relaxed m-0">
                  {f.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default About;
