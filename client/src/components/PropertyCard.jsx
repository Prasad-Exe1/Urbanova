import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { resolveListingHeroUrl } from '../utils/listingHeroImage.js';

function PropertyCard({ property }) {
    const handleImageError = (e) => {
        e.target.src =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Charminar%2C_Hyderabad.jpg/960px-Charminar%2C_Hyderabad.jpg';
    };

    return (
        <Link to={`/property/${property._id}`} className="card liquid-glass" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
            <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                <img
                    src={resolveListingHeroUrl(property)}
                    alt={property.title}
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '20px', boxSizing: 'border-box' }}>
                    <p className="price" style={{ marginBottom: 0 }}>₹{property.price.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <div className="card-content">
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.title}</h3>
                <p className="location" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <MapPin size={14} color="var(--accent)" /> {property.location}
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
                        View Details <ArrowRight size={14} />
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default PropertyCard;
