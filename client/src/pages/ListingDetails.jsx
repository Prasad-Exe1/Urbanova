import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, X, Share2, Heart, Calculator, Home, Trash2 } from 'lucide-react';
import Toast from '../components/Toast';
import MortgageCalculator from '../components/MortgageCalculator';
import NegotiationAssistant from '../components/NegotiationAssistant';
import LiveabilityScore from '../components/LiveabilityScore';
import PropertyDualMap from '../components/PropertyDualMap.jsx';
import { listingMentionsRera } from '../utils/listingRera.js';
import FloorPlan2D from '../components/FloorPlan2D.jsx';
import { secondaryGalleryUrls } from '../utils/listingGalleryExtras.js';
import { effectiveListingBhk } from '../utils/listingBhk.js';
import { assignUniqueCatalogHeroes, resolveListingHeroUrl } from '../utils/listingHeroImage.js';

const HYDERABAD_REGION_EMBED =
  'https://www.openstreetmap.org/export/embed.html?bbox=78.20%2C17.26%2C78.72%2C17.62&layer=mapnik';

const PROXIMITY_MAP_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCj0cGUsUFzPV-nmxozvUTzAxFMkWRlWN4vqhW4Kb-teOfQP8Rz2KvL75bHXRs-G7ghiU1gDHvrS7xqsAxUSML_8N1AWKezAJ66X4a83rXBNQexPpH09jPpCGb4N5iPURPEeUbuPpnLWZtccqHhjIHEjjh8jyjN5NRKSSI17SZzxXK0eDL6cQ852tWZE6W_O2uEvD-Zn8pmKzEsKmPoDPNnyXZhkLJhGl_i1-1LdtxgsoC1eV2P5oe7TB7H_Ejyyl2SKq023YmonYU';

function toCoordNumber(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function formatListingPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function ListingDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [heroCatalogMap, setHeroCatalogMap] = useState(null);
  const [toast, setToast] = useState(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isLiveabilityOpen, setIsLiveabilityOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/properties/${id}`)
      .then((res) => res.json())
      .then((data) => setProperty(data))
      .catch((err) => console.error(err));
  }, [id]);

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => {
        setHeroCatalogMap(assignUniqueCatalogHeroes(Array.isArray(data) ? data : []));
      })
      .catch((err) => console.error(err));
  }, []);

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) navigate('/');
      else setToast({ message: 'Failed to delete property.', type: 'error' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error deleting property.', type: 'error' });
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    setScheduleSuccess(true);
  };

  const HERO_FALLBACK_IMAGE =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Charminar%2C_Hyderabad.jpg/1280px-Charminar%2C_Hyderabad.jpg';

  if (!property || !property.title) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-on-surface-variant font-body-md">
        Loading…
      </div>
    );
  }

  const mapLat = toCoordNumber(property.latitude);
  const mapLng = toCoordNumber(property.longitude);
  const addressLine = [property.location, property.pincode].filter(Boolean).join(', ');
  const googleMapsAddressUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`;
  const googleMapsPinUrl =
    mapLat != null && mapLng != null
      ? `https://www.google.com/maps/search/?api=1&query=${mapLat}%2C${mapLng}`
      : googleMapsAddressUrl;

  const primaryHero = heroCatalogMap?.get(property._id) ?? resolveListingHeroUrl(property);
  const mainImg = primaryHero || HERO_FALLBACK_IMAGE;
  const [galleryExtraA, galleryExtraB] = secondaryGalleryUrls(property, primaryHero);

  const inferredBhk = effectiveListingBhk(property);
  const sqft = Number(property.areaSqft);
  const pricePerSqft =
    Number.isFinite(sqft) && sqft > 0 && Number.isFinite(Number(property.price))
      ? Math.round(Number(property.price) / sqft)
      : null;

  const isOwner = (() => {
    if (!user || !property) return false;
    if (user.role === 'admin') return true;
    if (!property.user) return false;
    const propertyUserId = typeof property.user === 'object' ? property.user._id : property.user;
    return String(propertyUserId) === String(user._id);
  })();

  const beds =
    property.bedrooms != null && property.bedrooms !== ''
      ? property.bedrooms
      : inferredBhk != null
        ? String(inferredBhk)
        : '—';
  const baths =
    property.bathrooms != null && property.bathrooms !== ''
      ? property.bathrooms
      : property.bedrooms != null && property.bedrooms !== ''
        ? property.bedrooms
        : inferredBhk != null
          ? String(inferredBhk)
          : '—';
  const areaLabel = Number.isFinite(sqft) && sqft > 0 ? String(sqft) : '—';
  const statusLabel =
    (property.availabilityStatus || property.status || 'Ready').toString().split(' ')[0] || 'Ready';

  return (
    <div className="pb-xl bg-background">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-max-width mx-auto px-gutter md:px-margin pt-md">
        <Link
          to="/properties"
          className="inline-flex items-center gap-sm text-on-surface-variant hover:text-primary font-label-sm mb-md transition-colors"
        >
          <ArrowLeft size={16} /> Back to search
        </Link>
      </div>

      <main className="flex-grow w-full max-w-max-width mx-auto px-gutter md:px-margin py-lg flex flex-col gap-xl">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-sm h-auto md:h-[614px] rounded-xl overflow-hidden">
          <div className="md:col-span-2 relative group min-h-[280px] md:min-h-0">
            <img
              src={mainImg}
              alt={property.title}
              referrerPolicy="no-referrer"
              className="w-full h-full min-h-[280px] md:min-h-0 object-cover"
              onError={(e) => {
                e.currentTarget.src = HERO_FALLBACK_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-lg pointer-events-none">
              {listingMentionsRera(property) ? (
                <span className="bg-surface/60 backdrop-blur-md border border-white/10 px-md py-xs rounded-full font-label-sm text-label-sm text-primary flex items-center gap-xs pointer-events-auto">
                  <span className="material-symbols-outlined !text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  RERA disclosed
                </span>
              ) : null}
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-sm h-full">
            <img
              alt=""
              src={galleryExtraA}
              className="w-full h-1/2 object-cover rounded-tr-xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = mainImg !== galleryExtraA ? mainImg : HERO_FALLBACK_IMAGE;
              }}
            />
            <img
              alt=""
              src={galleryExtraB}
              className="w-full h-1/2 object-cover rounded-br-xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = mainImg !== galleryExtraB ? mainImg : HERO_FALLBACK_IMAGE;
              }}
            />
          </div>
        </section>

        <section className="w-full" aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="sr-only">
            Illustrative 2D layout
          </h2>
          <FloorPlan2D
            propertyId={property._id}
            title={property.title}
            description={property.description}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            areaSqft={property.areaSqft}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          <div className="lg:col-span-2 flex flex-col gap-xl">
            <div className="flex flex-col gap-md">
              <div className="flex justify-between items-start gap-md flex-wrap">
                <div>
                  <h1 className="font-headline-lg text-headline-lg text-on-background mb-xs">{property.title}</h1>
                  <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined !text-[18px]">location_on</span>
                    {addressLine || property.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-headline-lg text-headline-lg text-primary">{formatListingPrice(property.price)}</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {pricePerSqft != null ? `₹${pricePerSqft.toLocaleString('en-IN')} / sq.ft` : 'Price / sq.ft on request'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                {[
                  { icon: 'bed', label: 'Bedrooms', val: beds },
                  { icon: 'bathtub', label: 'Bathrooms', val: baths },
                  { icon: 'square_foot', label: 'Sq.Ft Area', val: areaLabel },
                  { icon: 'key', label: 'Status', val: statusLabel },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="glass-panel p-md rounded-lg flex flex-col items-center justify-center text-center"
                  >
                    <span className="material-symbols-outlined text-primary mb-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {s.icon}
                    </span>
                    <span className="font-headline-md text-headline-md text-on-background">{s.val}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-lg rounded-xl">
              <h2 className="font-headline-md text-headline-md text-on-background mb-md">About Property</h2>
              <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">{property.description}</p>
              {property.image_credit ? (
                <p role="note" className="mt-md pt-md border-t border-white/10 text-xs text-on-surface-variant leading-relaxed">
                  {property.image_credit}
                </p>
              ) : null}
            </div>

            <div className="glass-panel p-lg rounded-xl flex flex-col gap-md">
              <h2 className="font-headline-md text-headline-md text-on-background">Proximity &amp; Location</h2>
              <div className="relative h-64 rounded-lg overflow-hidden border border-outline-variant/30">
                {mapLat != null && mapLng != null ? (
                  <PropertyDualMap
                    lat={mapLat}
                    lng={mapLng}
                    title={property.title}
                    addressLabel={`${addressLine}\nApprox. ${mapLat.toFixed(5)}°N · ${mapLng.toFixed(5)}°E`}
                    hideLayerSwitcher
                    height={256}
                  />
                ) : (
                  <>
                    <img alt="" src={PROXIMITY_MAP_IMG} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-background/40 pointer-events-none" />
                  </>
                )}
                <div className="absolute top-md left-md bg-surface/80 backdrop-blur-md border border-white/10 p-sm rounded-lg flex flex-col gap-xs">
                  <div className="flex items-center gap-sm">
                    <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span className="font-label-sm text-label-sm text-on-background">Nearby tech belt</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span className="font-label-sm text-label-sm text-on-background">ORR access corridors</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-sm justify-center">
                <a
                  href={googleMapsPinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-xs bg-primary text-on-primary font-label-sm px-md py-sm rounded-lg hover:bg-primary-fixed transition-colors"
                >
                  <MapPin size={16} aria-hidden />
                  Open in Google Maps
                </a>
              </div>
              {mapLat == null || mapLng == null ? (
                <>
                  <iframe
                    title="Greater Hyderabad overview"
                    src={HYDERABAD_REGION_EMBED}
                    width="100%"
                    height={220}
                    className="border-0 rounded-lg mt-md"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <p className="text-xs text-on-surface-variant text-center">
                    ©{' '}
                    <a href="https://openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-primary">
                      OpenStreetMap
                    </a>
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-lg">
            <div className="glass-panel p-lg rounded-xl flex flex-col gap-md lg:sticky lg:top-24">
              <div className="flex items-center gap-md pb-md border-b border-outline-variant/30">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                  <div className="font-body-lg text-body-lg text-on-background font-semibold">Urbanova Premier</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">Verified Seller</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="w-full bg-primary text-on-primary font-body-md py-sm rounded-lg font-semibold hover:bg-primary-fixed transition-colors"
              >
                Schedule Visit
              </button>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="w-full bg-transparent border border-white/20 text-on-background font-body-md py-sm rounded-lg font-semibold hover:bg-primary/10 hover:border-primary transition-all"
              >
                Contact Agent
              </button>

              <button
                type="button"
                onClick={() => setIsNegotiationOpen(true)}
                className="w-full text-left rounded-xl border border-primary/35 bg-surface-container-low/40 backdrop-blur-sm p-md flex items-center gap-md hover:bg-primary/10 hover:border-primary/55 transition-all shadow-[0_0_12px_rgba(242,202,80,0.12)] group"
              >
                <span className="material-symbols-outlined text-primary text-[28px] shrink-0">smart_toy</span>
                <div className="flex-1 min-w-0">
                  <div className="font-body-md font-semibold text-primary">AI Negotiator</div>
                  <div className="font-label-sm text-on-surface-variant leading-snug">
                    Tap to open the negotiation workspace
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
                  chevron_right
                </span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => setIsLiveabilityOpen(true)}
                  className="w-full bg-primary/10 border border-primary/30 text-primary font-body-md py-sm rounded-lg font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-sm"
                >
                  <Home size={18} aria-hidden /> Liveability score
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
                className="w-full bg-primary/10 border border-primary/30 text-primary font-body-md py-sm rounded-lg font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-sm"
              >
                <Calculator size={18} /> Estimate Payments
              </button>

              <div className="flex gap-md pt-md border-t border-outline-variant/30">
                <button type="button" className="flex-1 flex items-center justify-center gap-sm text-on-surface-variant hover:text-primary bg-transparent border-none text-sm">
                  <Share2 size={18} /> Share
                </button>
                <button type="button" className="flex-1 flex items-center justify-center gap-sm text-on-surface-variant hover:text-primary bg-transparent border-none text-sm">
                  <Heart size={18} /> Save
                </button>
              </div>

              {isOwner && (
                <div className="flex flex-col gap-sm pt-md border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => navigate('/add', { state: { property } })}
                    className="w-full py-sm rounded-lg border border-white/15 text-on-background hover:bg-white/5 text-sm"
                  >
                    Edit Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full py-sm rounded-lg text-error text-sm opacity-90 hover:opacity-100 flex items-center justify-center gap-sm"
                  >
                    <Trash2 size={16} /> Delete Listing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="auth-modal max-w-[400px]">
            <h3 className="text-on-background">Delete Listing?</h3>
            <p className="text-on-surface-variant mb-lg">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-md justify-center">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="px-md py-sm rounded-lg border border-white/20 text-on-background">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="px-md py-sm rounded-lg bg-error-container text-on-error-container">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {(showContactModal || showScheduleModal) && (
        <div className="modal-overlay">
          <div className="auth-modal max-w-[400px]">
            <div className="flex justify-between items-start mb-md">
              <h3 className="text-on-background m-0">{showContactModal ? 'Contact Agent / Seller' : 'Schedule Viewing'}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowContactModal(false);
                  setShowScheduleModal(false);
                }}
                className="bg-transparent text-on-background p-0 border-none"
              >
                <X />
              </button>
            </div>
            <p className="text-on-surface-variant mb-lg">
              {contactSuccess || scheduleSuccess ? 'Request sent successfully!' : 'Enter your details below to connect with the agent or seller.'}
            </p>
            {!contactSuccess && !scheduleSuccess && (
              <form onSubmit={showContactModal ? handleContactSubmit : handleScheduleSubmit} className="flex flex-col gap-sm">
                <input type="text" placeholder="Your Name" required className="bg-surface border border-outline-variant rounded-lg px-md py-sm text-on-background" />
                <input type="email" placeholder="Your Email" required className="bg-surface border border-outline-variant rounded-lg px-md py-sm text-on-background" />
                {showScheduleModal && <input type="date" required className="bg-surface border border-outline-variant rounded-lg px-md py-sm text-on-background" />}
                <button type="submit" className="submit-btn mt-sm">
                  Send Request
                </button>
              </form>
            )}
            {(contactSuccess || scheduleSuccess) && (
              <button
                type="button"
                onClick={() => {
                  setShowContactModal(false);
                  setShowScheduleModal(false);
                  setContactSuccess(false);
                  setScheduleSuccess(false);
                }}
                className="submit-btn w-full"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <MortgageCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} price={property.price} />
      <NegotiationAssistant property={property} isOpen={isNegotiationOpen} onClose={() => setIsNegotiationOpen(false)} />
      <LiveabilityScore property={property} isOpen={isLiveabilityOpen} onClose={() => setIsLiveabilityOpen(false)} />
    </div>
  );
}

export default ListingDetails;
