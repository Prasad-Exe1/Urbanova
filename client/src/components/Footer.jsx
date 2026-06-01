import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-auto shrink-0 border-t border-white/[0.06] bg-[#141418]">
      <div className="w-full px-margin md:px-margin-page py-14 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="text-[12px] font-semibold tracking-[0.12em] uppercase text-white">Urbanova</div>
          <p className="text-[14px] leading-relaxed text-white/55 max-w-md m-0">
            Metro-focused residential and commercial listings in Greater Hyderabad. Filters, maps, and disclosures are
            organised for serious search — not scroll-bait.
          </p>
          <p className="text-[11px] text-white/35 m-0">&copy; {new Date().getFullYear()} Urbanova. All rights reserved.</p>
        </div>
        <div className="md:col-span-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">Navigate</div>
          <ul className="space-y-3 list-none m-0 p-0 text-[14px]">
            <li>
              <Link to="/properties" className="text-white/60 hover:text-white transition-colors">
                Listings
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-white/60 hover:text-white transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">Compliance</div>
          <p className="text-[12px] leading-relaxed text-white/45 m-0">
            RERA and local registration numbers belong on each listing and in your sale documentation. Urbanova does not
            replace legal due diligence; verify all project and promoter details with official records.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
