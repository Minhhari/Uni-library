import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      if (data.success) navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="floating-bg">
        <span className="material-symbols-outlined book-silhouette text-8xl" style={{ top: '10%', left: '5%' }}>menu_book</span>
        <span className="material-symbols-outlined book-silhouette text-6xl" style={{ top: '70%', left: '15%' }}>auto_stories</span>
        <span className="material-symbols-outlined book-silhouette text-9xl" style={{ top: '40%', left: '80%' }}>library_books</span>
        <span className="material-symbols-outlined book-silhouette text-7xl" style={{ top: '85%', left: '75%' }}>import_contacts</span>
        <span className="material-symbols-outlined book-silhouette text-5xl" style={{ top: '20%', left: '60%' }}>book_4</span>
      </div>

      <main className="w-full max-w-md relative z-10">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-on-surface/5 relative overflow-hidden border border-surface-container-low">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

          <header className="text-center mb-10 relative">
            <div className="flex justify-center items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-4xl">menu_book</span>
              <h1 className="text-3xl font-black tracking-tighter text-on-surface">LibraFlow</h1>
            </div>
            <p className="text-on-surface-variant font-medium tracking-tight">Your campus library, reimagined</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="input-field peer"
                required
                autoComplete="email"
              />
              <label
                htmlFor="email"
                className={`input-label peer-placeholder-shown:text-base peer-placeholder-shown:text-on-surface-variant peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary ${form.email ? 'top-1 text-xs text-primary' : ''}`}
              >
                Email Address
              </label>
            </div>

            <div className="relative group">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="input-field peer pr-12"
                required
                autoComplete="current-password"
              />
              <label
                htmlFor="password"
                className={`input-label peer-placeholder-shown:text-base peer-placeholder-shown:text-on-surface-variant peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary ${form.password ? 'top-1 text-xs text-primary' : ''}`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-on-surface-variant/40 hover:text-primary focus:outline-none transition-colors"
                tabIndex="-1"
              >
                <span className="material-symbols-outlined select-none text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors">
                <input className="w-4 h-4 rounded-md border-outline-variant text-primary focus:ring-primary/20" type="checkbox" />
                Remember me
              </label>
              <Link to="#" className="text-primary font-semibold hover:underline decoration-2 underline-offset-4">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="w-full h-14 btn-primary text-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">
            <div className="h-[1px] flex-1 bg-surface-container-low"></div>
            <span>or continue with</span>
            <div className="h-[1px] flex-1 bg-surface-container-low"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed.')}
              useOneTap={false}
              shape="pill"
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <footer className="mt-8 pt-8 border-t border-surface-container-low text-center">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest font-bold">New to the platform?</p>
              <Link to="/register" className="text-sm text-on-surface font-semibold hover:text-primary transition-colors">Create a student account</Link>
            </div>
          </footer>
        </div>

        <div className="mt-8 text-center px-4">
          <p className="text-xs text-on-surface-variant/60 leading-relaxed">
            By signing in, you agree to the LibraFlow <br />
            <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Academic Integrity Policy</span>.
          </p>
        </div>
      </main>


    </div>
  );
};

export default LoginPage;
