import { useState } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';

function AuthModal({ onClose, onLogin, initialView = 'login', defaultRole = 'buyer' }) {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: defaultRole,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? 'login' : 'register';

    if (!isLogin && formData.username.toLowerCase() === 'admin') {
      setError("The username 'admin' is reserved. Please choose another.");
      return;
    }

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

      localStorage.setItem('user', JSON.stringify(data));
      onLogin(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  const tabCls = (active) =>
    `flex-1 py-sm font-label-sm transition-colors border-b-2 ${
      active ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'
    }`;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/75 backdrop-blur-md p-md">
      <div className="glass-panel relative w-full max-w-[420px] rounded-2xl border border-white/10 p-xl shadow-2xl text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-md right-md text-on-surface-variant hover:text-primary transition-colors p-xs rounded-full hover:bg-white/5"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary m-0 tracking-tight">Urbanova</h2>
          <p className="font-body-md text-on-surface-variant mt-sm mb-0">
            {isLogin ? 'Welcome back' : 'Join the community'}
          </p>
        </div>

        <div className="flex gap-sm mb-lg border-b border-white/10">
          <button type="button" className={tabCls(isLogin)} onClick={() => setIsLogin(true)}>
            Login
          </button>
          <button type="button" className={tabCls(!isLogin)} onClick={() => setIsLogin(false)}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md text-left">
          <div className="relative">
            <User size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              onChange={handleChange}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-sm pl-10 pr-md text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <Mail size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                onChange={handleChange}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-sm pl-10 pr-md text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
              />
            </div>
          )}

          <div className="relative">
            <Lock size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              onChange={handleChange}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-sm pl-10 pr-md text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
            />
          </div>

          {!isLogin && (
            <div>
              <p className="font-label-sm text-on-surface-variant mb-sm uppercase tracking-wide">I am a</p>
              <div className="grid grid-cols-3 gap-sm">
                {[
                  { value: 'buyer', label: 'Buyer' },
                  { value: 'seller', label: 'Seller' },
                  { value: 'agent', label: 'Agent' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-lg border px-sm py-md text-center font-label-sm transition-colors ${
                      formData.role === opt.value
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:border-primary/40'
                    }`}
                  >
                    <input type="radio" name="role" value={opt.value} checked={formData.role === opt.value} onChange={handleChange} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-error font-body-md text-sm m-0">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-on-primary font-label-sm py-md rounded-lg hover:bg-primary-fixed transition-colors mt-sm"
          >
            {isLogin ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
