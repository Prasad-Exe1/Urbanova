import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

function AdminEntry({ onAdminLogin }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? 'login' : 'register';

    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          typeof data === 'string' ? data : data.message || data.error || 'Authentication failed';
        throw new Error(errorMessage);
      }

      if (isLogin && data.role !== 'admin') {
        throw new Error('Access denied. Not an admin account.');
      }

      localStorage.setItem('adminUser', JSON.stringify(data));
      onAdminLogin(data);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-background px-margin py-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-xl shadow-2xl"
      >
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-error-container/30 text-error mb-md border border-error/30">
            <ShieldAlert size={28} />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-background m-0">Restricted access</h1>
          <p className="font-body-md text-on-surface-variant mt-sm mb-0">Authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="relative">
            <User size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              name="username"
              placeholder="Username or email (e.g. admin)"
              required
              onChange={handleChange}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-sm pl-10 pr-md text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          {!isLogin && (
            <div className="relative">
              <Mail size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                name="email"
                type="email"
                placeholder="Admin email"
                required
                onChange={handleChange}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-sm pl-10 pr-md text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          <div className="relative">
            <Lock size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              onChange={handleChange}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-sm pl-10 pr-md text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-error text-sm text-center m-0">{error}</p>}

          <button
            type="submit"
            className="w-full bg-error-container text-on-error-container font-label-sm py-md rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            {isLogin ? 'Access dashboard' : 'Register admin'}
          </button>
        </form>

        <div className="mt-lg text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="bg-transparent border-none text-on-surface-variant hover:text-primary text-sm cursor-pointer font-body-md"
          >
            {isLogin ? 'Need to register a new admin?' : 'Back to login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminEntry;
