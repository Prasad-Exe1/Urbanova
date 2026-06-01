import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Properties from './pages/Properties';
import ListingDetails from './pages/ListingDetails';
import AddListing from './pages/AddListing';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdminEntry from './pages/AdminEntry';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';

import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import ApiTester from './pages/ApiTester';
import AIChat from './components/AIChat';

function App() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authConfig, setAuthConfig] = useState({ view: 'login', role: 'buyer' });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        const storedAdmin = localStorage.getItem('adminUser');
        if (storedAdmin) {
          setAdminUser(JSON.parse(storedAdmin));
        }
      } catch (err) {
        console.error('Auth Error:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('adminUser');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-outline-variant border-t-primary animate-spin" aria-hidden />
      </div>
    );
  }

  const openAuth = (view = 'login', role = 'buyer') => {
    setAuthConfig({ view, role });
    setShowAuthModal(true);
  };

  const handleLogin = (userData) => {
    if (userData.role === 'admin') {
      localStorage.removeItem('user');
      localStorage.setItem('adminUser', JSON.stringify(userData));
      setUser(null);
      setAdminUser(userData);
      setShowAuthModal(false);
      window.location.href = '/admin';
    } else {
      setUser(userData);
      setShowAuthModal(false);
    }
  };

  const handleAdminLogin = (adminData) => {
    setAdminUser(adminData);
  };

  const isAdminView = location.pathname === '/bvy-estate' || location.pathname.startsWith('/admin');

  const handleLogout = () => {
    if (isAdminView) {
      localStorage.removeItem('adminUser');
      setAdminUser(null);
    } else {
      localStorage.removeItem('user');
      setUser(null);
      setShowAuthModal(true);
    }
  };

  const path = location.pathname;
  const searchActive = path.startsWith('/properties') || path.startsWith('/property/');
  const sellerActive = path.startsWith('/seller');
  const homeActive = path === '/';

  const mainNav = (active) =>
    [
      'text-[14px] font-medium tracking-wide transition-colors border-b-[1.5px] pb-[2px] -mb-[1px]',
      active
        ? 'text-white border-primary'
        : 'text-white/55 border-transparent hover:text-white hover:border-white/25',
    ].join(' ');

  const adminNav = (active) =>
    [
      'font-body-md text-body-md px-4 py-2 rounded-full transition-colors duration-200',
      active
        ? 'bg-primary/15 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(242,202,80,0.35)]'
        : 'text-on-surface-variant hover:text-primary hover:bg-primary/10',
    ].join(' ');

  const mobileLink = (active) =>
    [
      'block rounded-lg px-md py-md text-[14px] font-medium transition-colors',
      active ? 'bg-white/[0.07] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
    ].join(' ');

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md text-body-md antialiased selection:bg-primary/30 selection:text-primary">
      {!isAdminView && (
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#101012]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#101012]/90">
          <div className="flex items-center justify-between w-full min-h-[3.75rem] py-2.5 px-margin md:px-margin-page gap-6 md:gap-10">
            <Link
              to="/"
              className="flex flex-col shrink-0 text-white no-underline hover:opacity-90 transition-opacity"
              onClick={() => setMobileNavOpen(false)}
            >
              <span className="text-[14px] font-semibold tracking-[0.06em] uppercase leading-tight">
                Urbanova
              </span>
              <span className="text-[11px] text-white/40 tracking-[0.12em] uppercase mt-0.5 hidden sm:block">
                Hyderabad Metropolitan
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-x-11">
              <Link to="/" className={mainNav(homeActive)}>
                Home
              </Link>
              <Link to="/properties" className={mainNav(searchActive)}>
                Listings
              </Link>
              <Link to="/about" className={mainNav(path.startsWith('/about'))}>
                About
              </Link>
              <Link to="/contact" className={mainNav(path.startsWith('/contact'))}>
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-sm md:gap-md shrink-0">
              {user && (user.role === 'seller' || user.role === 'agent') ? (
                <Link
                  to="/add"
                  className="hidden sm:inline-flex text-[11px] font-semibold tracking-wide text-white border border-white/25 px-4 py-2 rounded-md hover:border-white/40 hover:bg-white/[0.03] transition-all"
                >
                  List property
                </Link>
              ) : null}
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex text-[12px] font-medium text-white/60 hover:text-white px-2 py-1.5 rounded transition-colors"
                >
                  {user.username}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuth('login', 'buyer')}
                  className="hidden sm:inline-flex text-[11px] font-semibold tracking-[0.09em] uppercase text-on-primary bg-primary px-5 py-2 rounded-md hover:brightness-105 active:brightness-95 transition-all"
                >
                  Sign in
                </button>
              )}
              <button
                type="button"
                className="md:hidden flex items-center justify-center rounded-md border border-white/15 bg-[#141418] p-2 text-white hover:bg-[#1c1c22] transition-colors"
                aria-expanded={mobileNavOpen}
                aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileNavOpen((o) => !o)}
              >
                <span className="material-symbols-outlined !text-[26px]">{mobileNavOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {!isAdminView && mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm md:hidden"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed inset-y-0 right-0 z-[70] flex w-[min(100%,19rem)] flex-col md:hidden bg-[#16161c] border-l border-white/[0.06] shadow-[0_0_48px_rgba(0,0,0,0.45)] animate-slide-in-right"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-md py-md">
              <span className="text-[12px] font-semibold tracking-[0.06em] uppercase text-white">Urbanova</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-white/[0.06]"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined !text-[24px]">close</span>
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-md">
              <Link to="/" className={mobileLink(homeActive)} onClick={() => setMobileNavOpen(false)}>
                Home
              </Link>
              <Link to="/properties" className={mobileLink(searchActive)} onClick={() => setMobileNavOpen(false)}>
                Listings
              </Link>
              <Link to="/about" className={mobileLink(path.startsWith('/about'))} onClick={() => setMobileNavOpen(false)}>
                About
              </Link>
              <Link to="/contact" className={mobileLink(path.startsWith('/contact'))} onClick={() => setMobileNavOpen(false)}>
                Contact
              </Link>
              <Link to="/seller" className={mobileLink(sellerActive)} onClick={() => setMobileNavOpen(false)}>
                Seller Portal
              </Link>
              {user && (user.role === 'seller' || user.role === 'agent') ? (
                <Link
                  to="/add"
                  className="mt-sm inline-flex items-center justify-center gap-sm rounded-md bg-primary px-md py-md text-[11px] font-semibold uppercase tracking-wide text-on-primary hover:brightness-105 transition-all"
                  onClick={() => setMobileNavOpen(false)}
                >
                  List property
                </Link>
              ) : null}
              {!user ? (
                <button
                  type="button"
                  className="mt-sm text-left rounded-xl px-md py-md font-body-md text-on-background hover:bg-white/[0.06]"
                  onClick={() => {
                    setMobileNavOpen(false);
                    openAuth('login', 'buyer');
                  }}
                >
                  Sign in
                </button>
              ) : (
                <button
                  type="button"
                  className="mt-sm text-left rounded-xl px-md py-md font-body-md text-on-surface-variant hover:text-primary"
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleLogout();
                  }}
                >
                  Sign out ({user.username})
                </button>
              )}
            </nav>
          </div>
        </>
      )}

      {isAdminView && (
        <header className="sticky top-0 z-50 border-b border-outline-variant/25 bg-surface/90 backdrop-blur-xl shadow-[0_1px_0_rgba(242,202,80,0.06)]">
          <div className="flex flex-wrap justify-between items-center gap-md px-margin py-md max-w-max-width mx-auto">
            <Link
              to="/admin"
              className="font-headline-lg font-bold tracking-tight bg-gradient-to-r from-primary via-primary-fixed to-primary bg-clip-text text-transparent"
            >
              Urbanova
            </Link>
            <nav className="hidden md:flex items-center gap-1 rounded-full border border-outline-variant/45 bg-surface-container-high/65 backdrop-blur-md px-1 py-1 flex-wrap">
              <Link to="/properties" className={adminNav(searchActive)}>
                Neighborhoods
              </Link>
              <Link to="/admin" className={adminNav(path.startsWith('/admin'))}>
                Admin Dashboard
              </Link>
              <Link to="/seller" className={adminNav(sellerActive)}>
                Seller Portal
              </Link>
            </nav>
            <div className="flex gap-md items-center font-label-sm">
              {adminUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-transparent border border-white/20 text-on-background px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Admin (Logout)
                </button>
              ) : null}
            </div>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home openAuth={openAuth} user={user} />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/property/:id" element={<ListingDetails user={user} />} />
        <Route path="/about" element={<About />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/add" element={user && (user.role === 'seller' || user.role === 'agent') ? <AddListing /> : <Navigate to="/" />} />
        <Route path="/seller" element={user && (user.role === 'seller' || user.role === 'agent') ? <SellerDashboard /> : <Navigate to="/" />} />
        <Route path="/admin" element={adminUser && adminUser.role === 'admin' ? <AdminDashboard /> : <Navigate to="/bvy-estate" />} />

        <Route path="/api-test" element={<ApiTester />} />

        <Route path="/bvy-estate" element={<AdminEntry onAdminLogin={handleAdminLogin} />} />
      </Routes>

      {!isAdminView && <AIChat />}

      {!isAdminView && <Footer />}

      {showAuthModal && !user && !loading && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          initialView={authConfig.view}
          defaultRole={authConfig.role}
        />
      )}
    </div>
  );
}

export default App;
