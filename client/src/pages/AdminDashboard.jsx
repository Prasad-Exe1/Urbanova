import { useState, useEffect, useMemo } from 'react';
import { Users, Building2, Trash2, DollarSign, Edit2, X, Save, CheckCircle, Menu, LayoutDashboard, Activity, FileText, Search } from 'lucide-react';
import '../index.css';
import Toast from '../components/Toast';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminLogs from '../components/AdminLogs';
import { uploadUrl } from '../utils/uploadUrl.js';

function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, properties: 0, totalValue: 0 });
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        document.body.setAttribute('data-theme', 'dark');
    }, []);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('stats');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchStats(), fetchUsers(), fetchProperties(), fetchVerifications()]);
            } catch (err) {
                console.error("Dashboard Load Error:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot bootstrap; listing fetch fns would churn if dependency-listed
    }, []);

    const getAuthHeaders = (includeContentType = true) => {
        const adminUserStr = localStorage.getItem('adminUser');
        const userStr = localStorage.getItem('user');
        let token = null;
        if (adminUserStr) token = JSON.parse(adminUserStr).token;
        if (!token && userStr) token = JSON.parse(userStr).token;

        const headers = { 'token': `Bearer ${token}` };
        if (includeContentType) headers['Content-Type'] = 'application/json';
        return headers;
    };

    const fetchStats = async () => {
        const res = await fetch('/api/admin/stats', {
            headers: getAuthHeaders(false)
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data || { users: 0, properties: 0, totalValue: 0 });
    };

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users', {
            headers: getAuthHeaders(false)
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
    };

    const fetchProperties = async () => {
        const res = await fetch('/api/properties?scope=all', {
            headers: getAuthHeaders(false),
        });
        if (!res.ok) throw new Error('Failed to fetch properties');
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
    };

    const fetchVerifications = async () => {
        const res = await fetch('/api/admin/pending-verifications', {
            headers: getAuthHeaders(false)
        });
        if (res.ok) {
            const data = await res.json();
            setVerifications(Array.isArray(data) ? data : []);
        }
    };

    const handleVerifyStatus = async (id, status) => {
        try {
            await fetch(`/api/admin/verify-seller/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ status })
            });
            fetchVerifications();
            setToast({ message: `Seller verification ${status}.`, type: 'success' });
        } catch {
            setToast({ message: 'Failed to update verification', type: 'error' });
        }
    };

    const [selectedProperties, setSelectedProperties] = useState([]);
    const [listingSearch, setListingSearch] = useState('');
    const [listingSort, setListingSort] = useState('newest');

    const filteredSortedProperties = useMemo(() => {
        let list = [...properties];
        const q = listingSearch.trim().toLowerCase();
        if (q) {
            list = list.filter((p) => {
                const title = String(p.title ?? '').toLowerCase();
                const loc = String(p.location ?? '').toLowerCase();
                const pin = String(p.pincode ?? '').toLowerCase();
                const priceStr = String(p.price ?? '');
                return title.includes(q) || loc.includes(q) || pin.includes(q) || priceStr.includes(q);
            });
        }
        list.sort((a, b) => {
            switch (listingSort) {
                case 'oldest':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'newest':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'price-high':
                    return Number(b.price || 0) - Number(a.price || 0);
                case 'price-low':
                    return Number(a.price || 0) - Number(b.price || 0);
                case 'title':
                    return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' });
                default:
                    return 0;
            }
        });
        return list;
    }, [properties, listingSearch, listingSort]);

    const handleToggleSelectAll = () => {
        const list = filteredSortedProperties;
        if (list.length === 0) return;
        const visibleIds = list.map((p) => p._id);
        const allVisibleSelected = visibleIds.every((id) => selectedProperties.includes(id));
        if (allVisibleSelected) {
            setSelectedProperties((prev) => prev.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedProperties((prev) => [...new Set([...prev, ...visibleIds])]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedProperties.includes(id)) {
            setSelectedProperties(selectedProperties.filter(pid => pid !== id));
        } else {
            setSelectedProperties([...selectedProperties, id]);
        }
    };

    const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm, type }

    const openConfirm = (message, onConfirm, type = 'danger') => {
        setConfirmModal({ message, onConfirm, type });
    };

    const closeConfirm = () => {
        setConfirmModal(null);
    };

    const handleBulkDelete = () => {
        if (selectedProperties.length === 0) return;
        openConfirm(`Are you sure you want to delete ${selectedProperties.length} properties?`, async () => {
            setLoading(true);
            try {
                await fetch('/api/admin/properties/bulk-delete', {
                    method: 'POST',
                    headers: getAuthHeaders(true),
                    body: JSON.stringify({ ids: selectedProperties })
                });
                await fetchProperties();
                await fetchStats();
                setSelectedProperties([]);
                setToast({ message: 'Successfully deleted properties.', type: 'success' });
            } catch {
                setToast({ message: 'Failed to delete properties', type: 'error' });
            } finally {
                setLoading(false);
                closeConfirm();
            }
        });
    };

    const handleDeleteUser = (id) => {
        openConfirm('Are you sure you want to ban this user?', async () => {
            await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(false)
            });
            fetchUsers();
            fetchStats();
            closeConfirm();
            setToast({ message: 'User banned successfully.', type: 'success' });
        });
    };

    const handleDeleteProperty = (id) => {
        openConfirm('Delete this listing permanently?', async () => {
            await fetch(`/api/admin/properties/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(false)
            });
            fetchProperties();
            fetchStats();
            closeConfirm();
            setToast({ message: 'Property deleted successfully.', type: 'success' });
        });
    };

    const handleEdit = (type, item) => {
        setEditingItem({ type, data: { ...item } });
    };

    const handleEditChange = (e) => {
        setEditingItem({
            ...editingItem,
            data: { ...editingItem.data, [e.target.name]: e.target.value }
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const { type, data } = editingItem;
        const endpoint = type === 'user' ? `users/${data._id}` : `properties/${data._id}`;

        try {
            await fetch(`/api/admin/${endpoint}`, {
                method: 'PUT',
                headers: getAuthHeaders(true),
                body: JSON.stringify(data)
            });

            setEditingItem(null);
            if (type === 'user') fetchUsers();
            else fetchProperties();
            fetchStats();
            setToast({ message: 'Update successful.', type: 'success' });
        } catch {
            setToast({ message: 'Failed to update', type: 'error' });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-on-background font-body-md">Loading Dashboard...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-background text-error font-body-md px-margin text-center">{error}</div>;

    const navItems = [
        { id: 'stats', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Manage Users', icon: Users },
        { id: 'properties', label: 'Manage Listings', icon: Building2 },
        { id: 'logs', label: 'Activity Logs', icon: Activity },
        { id: 'verifications', label: 'Verifications', icon: FileText }
    ];

    return (
        <div className="flex min-h-screen bg-background text-on-background transition-colors">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Mobile Hamburger Overlay */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 100, padding: '0.5rem', background: 'var(--bg-card)', color: 'var(--text-primary)', display: window.innerWidth > 1024 ? 'none' : 'block' }}
                className="neu-outset"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sliding Sidebar */}
            <aside
                className="admin-sidebar neu-outset"
                style={{
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    padding: '2rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: window.innerWidth <= 1024 ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 90,
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    width: '80px', // Default collapsed width
                }}
                onMouseEnter={(e) => {
                    if (window.innerWidth > 1024) e.currentTarget.style.width = '280px';
                }}
                onMouseLeave={(e) => {
                    if (window.innerWidth > 1024) e.currentTarget.style.width = '80px';
                }}
            >
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
                    {/* Compact Logo */}
                    <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', flexShrink: 0 }}>
                        UA
                    </div>
                    {/* Expanded Logo Text */}
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0 1rem', letterSpacing: '-0.05em', color: 'var(--text-primary)', whiteSpace: 'nowrap', opacity: 'var(--sidebar-opacity, 0)', transition: 'opacity 0.4s ease', pointerEvents: 'none' }} className="sidebar-text">
                        Urbanova <span style={{ color: 'var(--accent)' }}>Admin</span>
                    </h2>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); window.innerWidth <= 1024 && setSidebarOpen(false); }}
                                className={isActive ? 'neu-inset' : 'neu-outset'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.25rem',
                                    padding: '1rem',
                                    width: '100%',
                                    textAlign: 'left',
                                    background: isActive ? 'var(--bg-primary)' : 'transparent',
                                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: isActive ? 600 : 500,
                                    borderRadius: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                                title={item.label} // Tooltip for collapsed state
                            >
                                <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
                                    <Icon size={22} />
                                </div>
                                <span style={{ whiteSpace: 'nowrap', opacity: 'var(--sidebar-opacity, 0)', transition: 'opacity 0.4s ease', pointerEvents: 'none' }} className="sidebar-text">
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </nav>

                {/* User Action - Logout */}
                <button
                    className="admin-logout-btn"
                    onClick={() => {
                        openConfirm(
                            "Are you sure you want to logout of the Admin Portal?",
                            () => {
                                localStorage.removeItem('adminUser');
                                window.location.href = '/bvy-estate';
                            },
                            'danger'
                        );
                    }}
                    style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        padding: '0.5rem 0.5rem 0.5rem 0.15rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: 'transparent',
                        transition: 'all 0.3s ease',
                        border: '1px solid transparent',
                        overflow: 'hidden',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                    title="Logout"
                >
                    <div style={{ minWidth: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>AD</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', whiteSpace: 'nowrap', opacity: 'var(--sidebar-opacity, 0)', transition: 'opacity 0.4s ease', pointerEvents: 'none' }} className="sidebar-text">
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Admin Portal</span>
                        <span style={{ fontSize: '0.75rem', color: '#ff6b6b', fontWeight: 500 }}>Click to logout</span>
                    </div>
                </button>
            </aside>

            {/* Global CSS for Sidebar Hover Logic & Premium Admin Theme */}
            <style>{`
                :root {
                    --admin-accent: #d4af37; /* Gold */
                }
                .admin-sidebar {
                    background: rgba(11, 12, 16, 0.95) !important;
                    border-right: 1px solid rgba(212, 175, 55, 0.2) !important;
                }
                .admin-sidebar:hover .sidebar-text {
                    opacity: 1 !important;
                }
                .admin-sidebar:hover .admin-logout-btn:hover {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: rgba(212, 175, 55, 0.2) !important;
                }
                .admin-premium-card {
                    background: rgba(20, 20, 20, 0.7);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    border-radius: 16px;
                }
                /* Override accent color for this specific page */
                h1, h2, h3 { color: #fff !important; }
                .glow-orb { background: var(--admin-accent) !important; opacity: 0.1 !important; }
            `}</style>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: window.innerWidth > 1024 ? '80px' : '0',
                padding: '2rem 3rem',
                maxWidth: '1200px',
                transition: 'margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxSizing: 'border-box'
            }}>

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', paddingTop: window.innerWidth <= 1024 ? '3rem' : '0' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: 'var(--text-primary)' }}>
                            {navItems.find(i => i.id === activeTab)?.label}
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage your real estate platform.</p>
                    </div>
                </header>

                {/* Stats View */}
                {activeTab === 'stats' && (
                    <>
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                            <div className="neu-outset" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                                <div className="glow-orb" style={{ top: '-20px', right: '-20px' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div className="neu-inset" style={{ width: 50, height: 50, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={24} color="var(--accent)" />
                                    </div>
                                    <span style={{ background: 'rgba(50, 205, 50, 0.1)', color: '#32cd32', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>+12%</span>
                                </div>
                                <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{stats.users}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
                            </div>

                            <div className="neu-outset" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                                <div className="glow-orb" style={{ top: '-20px', right: '-20px', background: '#007bff' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div className="neu-inset" style={{ width: 50, height: 50, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Building2 size={24} color="#007bff" />
                                    </div>
                                    <span style={{ background: 'rgba(50, 205, 50, 0.1)', color: '#32cd32', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>+5%</span>
                                </div>
                                <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{stats.properties}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Listings</p>
                            </div>

                            <div className="neu-outset" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                                <div className="glow-orb" style={{ top: '-20px', right: '-20px', background: '#e53935' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div className="neu-inset" style={{ width: 50, height: 50, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <DollarSign size={24} color="#e53935" />
                                    </div>
                                    <span style={{ background: 'rgba(229, 57, 53, 0.1)', color: '#e53935', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>-2%</span>
                                </div>
                                <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>₹{(stats?.totalValue || 0).toLocaleString('en-IN')}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Value</p>
                            </div>
                        </div>

                        {/* SVG Charts */}
                        <AdminAnalytics stats={stats} users={users} properties={properties} />
                    </>
                )}

                {/* Logs View */}
                {activeTab === 'logs' && (
                    <AdminLogs />
                )}

                {/* Verifications View */}
                {activeTab === 'verifications' && (
                    <div className="table-container admin-premium-card" style={{ overflowX: 'auto', padding: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.3)', textAlign: 'left' }}>
                                    <th style={{ padding: '1.5rem', color: '#d4af37' }}>Username</th>
                                    <th style={{ padding: '1.5rem', color: '#d4af37' }}>Email</th>
                                    <th style={{ padding: '1.5rem', color: '#d4af37' }}>Document</th>
                                    <th style={{ padding: '1.5rem', color: '#d4af37' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {verifications.length === 0 ? (
                                    <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#888', fontSize: '1.1rem' }}>No pending verifications</td></tr>
                                ) : verifications.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1.5rem', fontWeight: 'bold' }}>{u.username}</td>
                                        <td style={{ padding: '1.5rem', color: '#aaa' }}>{u.email}</td>
                                        <td style={{ padding: '1.5rem' }}>
                                            {u.verificationDocument ? (
                                                <a href={uploadUrl(u.verificationDocument)} target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                                    <FileText size={18} /> View Document
                                                </a>
                                            ) : (
                                                <span style={{ color: '#666' }}>N/A</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <button
                                                onClick={() => handleVerifyStatus(u._id, 'verified')}
                                                style={{ background: 'linear-gradient(to right, #38ef7d, #11998e)', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(56, 239, 125, 0.3)' }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleVerifyStatus(u._id, 'rejected')}
                                                style={{ background: 'linear-gradient(to right, #ff416c, #ff4b2b)', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(255, 65, 108, 0.3)' }}
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Users View */}
                {activeTab === 'users' && (
                    <div className="table-container" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Username</th>
                                    <th style={{ padding: '1rem' }}>Email</th>
                                    <th style={{ padding: '1rem' }}>Role</th>
                                    <th style={{ padding: '1rem' }}>Joined</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '1rem' }}>{user.username}</td>
                                        <td style={{ padding: '1rem' }}>{user.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                background: user.role === 'admin' ? 'var(--accent)' : '#333',
                                                color: user.role === 'admin' ? '#000' : '#fff',
                                                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEdit('user', user)}
                                                style={{ background: '#333', padding: '0.5rem', width: 'auto', color: '#fff' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    style={{ background: '#e53935', padding: '0.5rem', width: 'auto' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Properties View */}
                {activeTab === 'properties' && (
                    <div>
                        <div
                            className="neu-outset"
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1rem',
                                marginBottom: '2rem',
                                alignItems: 'center',
                                padding: '1.5rem',
                                borderRadius: '12px',
                            }}
                        >
                            <div
                                className="neu-inset"
                                style={{
                                    flex: '1 1 220px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    minHeight: '44px',
                                }}
                            >
                                <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                <input
                                    type="search"
                                    placeholder="Search by title, location, pincode, price…"
                                    value={listingSearch}
                                    onChange={(e) => setListingSearch(e.target.value)}
                                    aria-label="Search listings"
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <label htmlFor="listing-sort" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                    Sort
                                </label>
                                <select
                                    id="listing-sort"
                                    value={listingSort}
                                    onChange={(e) => setListingSort(e.target.value)}
                                    className="neu-inset"
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        height: '40px',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        minWidth: '160px',
                                    }}
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="price-high">Price — High to Low</option>
                                    <option value="price-low">Price — Low to High</option>
                                    <option value="title">Title (A–Z)</option>
                                </select>
                            </div>
                            {selectedProperties.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    className="neu-outset"
                                    style={{
                                        marginLeft: 'auto',
                                        color: '#e53935',
                                        padding: '0 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        height: '40px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    <Trash2 size={16} /> Delete Selected ({selectedProperties.length})
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                            <div
                                onClick={handleToggleSelectAll}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleToggleSelectAll()}
                                className={
                                    filteredSortedProperties.length > 0 &&
                                    filteredSortedProperties.every((p) => selectedProperties.includes(p._id))
                                        ? 'neu-inset'
                                        : 'neu-outset'
                                }
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: filteredSortedProperties.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: filteredSortedProperties.length === 0 ? 0.45 : 1,
                                    color:
                                        filteredSortedProperties.length > 0 &&
                                        filteredSortedProperties.every((p) => selectedProperties.includes(p._id))
                                            ? 'var(--accent)'
                                            : 'var(--text-secondary)',
                                }}
                            >
                                <CheckCircle size={18} />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                                Select all visible
                                {listingSearch.trim() ? ` (${filteredSortedProperties.length})` : ''}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {filteredSortedProperties.length === 0 ? (
                                <div className="neu-outset" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                    {properties.length === 0
                                        ? 'No listings yet.'
                                        : 'No listings match your search. Try different keywords or clear the filter.'}
                                </div>
                            ) : null}
                            {filteredSortedProperties.map(property => {
                                const isSelected = selectedProperties.includes(property._id);
                                return (
                                    <div
                                        key={property._id}
                                        className={isSelected ? 'neu-inset' : 'neu-outset'}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            borderRadius: '16px',
                                            border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {/* Selection Checkmark Area (Left Column) */}
                                        <div
                                            onClick={() => handleSelectOne(property._id)}
                                            style={{
                                                marginRight: '1.5rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                                                padding: '0.5rem'
                                            }}
                                        >
                                            <CheckCircle size={22} className={isSelected ? 'neu-inset' : ''} style={{ borderRadius: '50%', padding: isSelected ? '2px' : '0' }} />
                                        </div>

                                        {/* Image Area */}
                                        <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, marginRight: '1.5rem', background: 'var(--bg-secondary)', position: 'relative' }}>
                                            {property.image ? (
                                                <img
                                                    src={uploadUrl(property.image)}
                                                    alt={property.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No Img</div>
                                            )}
                                        </div>

                                        {/* Info Area */}
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.title}</h4>
                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.location}</p>
                                        </div>

                                        {/* Price Area */}
                                        <div style={{ padding: '0 2rem', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                                            ₹{property.price.toLocaleString('en-IN')}
                                        </div>

                                        {/* Actions Area (Right Column) */}
                                        <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
                                            <button
                                                onClick={() => handleEdit('property', property)}
                                                className="neu-outset"
                                                style={{ padding: '0.6rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}
                                                title="Edit Property"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProperty(property._id)}
                                                className="neu-outset"
                                                style={{ padding: '0.6rem', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e53935', borderRadius: '8px' }}
                                                title="Delete Property"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {confirmModal && (
                    <div className="glass-panel" style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                        borderRadius: 0, border: 'none'
                    }}>
                        <div className="neu-outset" style={{ padding: '2.5rem', width: '400px', textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
                            <div className="neu-inset" style={{ width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                                <Trash2 size={32} color="#e53935" />
                            </div>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Confirm Action</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.5 }}>{confirmModal.message}</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={closeConfirm}
                                    className="neu-outset"
                                    style={{ flex: 1, padding: '0.75rem', color: 'var(--text-primary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="neu-outset"
                                    style={{ flex: 1, padding: '0.75rem', color: '#e53935' }}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingItem && (
                    <div className="glass-panel" style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                        borderRadius: 0, border: 'none'
                    }}>
                        <div className="neu-outset" style={{ padding: '2.5rem', width: '400px', animation: 'slideUp 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Edit {editingItem.type === 'user' ? 'User' : 'Property'}</h3>
                                <button onClick={() => setEditingItem(null)} className="neu-outset" style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate}>
                                {editingItem.type === 'user' ? (
                                    <>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Username</label>
                                            <input
                                                name="username"
                                                value={editingItem.data.username}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
                                            <input
                                                name="email"
                                                value={editingItem.data.email}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Role</label>
                                            <select
                                                name="role"
                                                value={editingItem.data.role}
                                                onChange={handleEditChange}
                                            >
                                                <option value="buyer">Buyer</option>
                                                <option value="seller">Seller</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Title</label>
                                            <input
                                                name="title"
                                                value={editingItem.data.title}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Location</label>
                                            <input
                                                name="location"
                                                value={editingItem.data.location}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Price</label>
                                            <input
                                                name="price"
                                                type="number"
                                                value={editingItem.data.price}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                    </>
                                )}

                                <button type="submit" className="neu-outset" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent)', marginTop: '1rem', padding: '0.75rem', fontWeight: 'bold' }}>
                                    <Save size={18} /> Save Changes
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
