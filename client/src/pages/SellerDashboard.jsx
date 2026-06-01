import { useState, useEffect } from 'react';
import { Eye, Plus } from 'lucide-react';
import '../index.css';
import { Link, useNavigate } from 'react-router-dom';
import { uploadUrl } from '../utils/uploadUrl.js';

function SellerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    properties: [],
  });
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  });
  const [verifyFile, setVerifyFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;

        const userRes = await fetch('/api/users/me', {
          headers: { token: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          const updatedUser = { ...user, ...userData };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        const res = await fetch('/api/properties/user/stats', {
          headers: { token: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch seller stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `user` merges in-effect; full `user` dep would loop
  }, [user?.token]);

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verifyFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('document', verifyFile);

    try {
      const res = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { token: `Bearer ${user.token}` },
        body: formData,
      });
      if (res.ok) {
        const updatedUser = await res.json();
        const newUser = { ...user, ...updatedUser };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        setVerifyFile(null);
      }
    } catch (err) {
      console.error('Verification upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-max-width mx-auto px-margin py-24 text-center text-on-surface-variant font-body-md">
        Loading dashboard…
      </div>
    );
  }

  const displayName = user.username || user.name || 'Seller';

  return (
    <main className="flex-grow w-full max-w-max-width mx-auto px-margin py-xl flex flex-col gap-xl pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <h1 className="font-display-xl text-display-xl text-on-background mb-xs">Welcome back, {displayName}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Here is an overview of your property portfolio in Hyderabad.
          </p>
        </div>
        <Link
          to="/add"
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-sm flex items-center gap-sm hover:bg-primary-fixed-dim transition-colors shadow-primary-glow"
        >
          <Plus size={18} />
          List New Property
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {[
          {
            label: 'Total Listings',
            value: stats.totalListings,
            sub: `${stats.properties?.length || 0} live`,
            icon: 'real_estate_agent',
          },
          {
            label: 'Total Views',
            value: stats.totalViews?.toLocaleString?.('en-IN') ?? stats.totalViews,
            sub: 'Portfolio reach',
            icon: 'visibility',
          },
          {
            label: 'Active Inquiries',
            value: '—',
            sub: 'Coming soon',
            icon: 'chat_bubble',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-low/50 backdrop-blur-[12px] border border-outline-variant/30 rounded-xl p-lg relative overflow-hidden group"
          >
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none">
              <span className="material-symbols-outlined text-[100px] text-primary">{card.icon}</span>
            </div>
            <div className="relative z-10">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-sm uppercase tracking-wider">{card.label}</p>
              <p className="font-display-xl text-display-xl text-primary">{card.value}</p>
              <p className="font-body-md text-body-md text-on-surface-variant mt-sm">{card.sub}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="glass-panel rounded-xl p-lg border border-outline-variant/30">
        <h3 className="font-headline-md text-headline-md text-on-background mt-0 mb-md">Account Verification</h3>
        {user.verificationStatus === 'verified' && (
          <div className="text-primary font-label-sm font-semibold flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">verified</span> You are a verified seller.
          </div>
        )}
        {user.verificationStatus === 'pending' && (
          <div className="text-tertiary font-body-md">Your verification document is pending admin review.</div>
        )}
        {(!user.verificationStatus || user.verificationStatus === 'unverified' || user.verificationStatus === 'rejected') && (
          <div>
            {user.verificationStatus === 'rejected' && (
              <p className="text-error font-body-md mb-md">Previous verification was rejected. Please upload a valid document.</p>
            )}
            <p className="text-on-surface-variant font-body-md mb-md">
              Upload a government ID or ownership document to unlock verified seller status.
            </p>
            <form onSubmit={handleVerificationSubmit} className="flex flex-wrap gap-md items-center">
              <input type="file" onChange={(e) => setVerifyFile(e.target.files?.[0])} required className="text-sm text-on-surface-variant" />
              <button
                type="submit"
                disabled={uploading}
                className="bg-primary text-on-primary font-label-sm px-md py-sm rounded-lg hover:bg-primary-fixed disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Submit Document'}
              </button>
            </form>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-md">
        <div className="flex justify-between items-center mb-md flex-wrap gap-md">
          <h2 className="font-headline-md text-headline-md text-on-background m-0">Your Properties</h2>
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="font-label-sm text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-xs"
          >
            Browse market <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto bg-surface-container-low/40 rounded-xl border border-outline-variant/30">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="p-md font-label-sm text-on-surface-variant">Property</th>
                <th className="p-md font-label-sm text-on-surface-variant">Price</th>
                <th className="p-md font-label-sm text-on-surface-variant">Location</th>
                <th className="p-md font-label-sm text-on-surface-variant">Views</th>
                <th className="p-md font-label-sm text-on-surface-variant">Posted</th>
              </tr>
            </thead>
            <tbody>
              {stats.properties.length > 0 ? (
                stats.properties.map((property) => (
                  <tr
                    key={property._id}
                    className="border-b border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors"
                    onClick={() => navigate(`/property/${property._id}`)}
                  >
                    <td className="p-md">
                      <div className="flex items-center gap-md">
                        <div className="w-[50px] h-[50px] rounded-md overflow-hidden bg-surface-variant shrink-0">
                          {property.image && (
                            <img
                              src={uploadUrl(property.image)}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-on-background">{property.title}</span>
                      </div>
                    </td>
                    <td className="p-md text-on-background">₹{Number(property.price).toLocaleString('en-IN')}</td>
                    <td className="p-md text-on-surface-variant">{property.location}</td>
                    <td className="p-md">
                      <div className="flex items-center gap-sm text-on-surface-variant">
                        <Eye size={16} />
                        {property.views || 0}
                      </div>
                    </td>
                    <td className="p-md text-on-surface-variant">{new Date(property.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-xl text-center text-on-surface-variant font-body-md">
                    You haven&apos;t listed any properties yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default SellerDashboard;
