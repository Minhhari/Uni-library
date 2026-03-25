import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'lecturer', label: 'Lecturer' },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập họ tên.';
    if (!form.email.trim()) return 'Vui lòng nhập email.';
    if (form.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (!/[A-Z]/.test(form.password)) return 'Mật khẩu phải có ít nhất 1 chữ in hoa.';
    if (!/[a-z]/.test(form.password)) return 'Mật khẩu phải có ít nhất 1 chữ thường.';
    if (!/[0-9]/.test(form.password)) return 'Mật khẩu phải có ít nhất 1 số.';
    if (!/[!@#$%^&*]/.test(form.password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*).';
    if (form.password !== form.confirmPassword) return 'Mật khẩu không khớp.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password, form.role);
      if (data.success) navigate('/login', { replace: true, state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
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
            <p className="text-on-surface-variant font-medium tracking-tight">Join our campus library today</p>
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
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="input-field peer"
                required
              />
              <label
                htmlFor="name"
                className={`input-label peer-placeholder-shown:text-base peer-placeholder-shown:text-on-surface-variant peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary ${form.name ? 'top-1 text-xs text-primary' : ''}`}
              >
                Full Name
              </label>
            </div>

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
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-field peer appearance-none"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <label className="input-label top-1 text-xs text-primary">Role</label>
              <span className="material-symbols-outlined absolute right-4 top-4 text-on-surface-variant/40 pointer-events-none">expand_more</span>
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
                autoComplete="new-password"
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

            <div className="relative group">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="input-field peer pr-12"
                required
                autoComplete="new-password"
              />
              <label
                htmlFor="confirmPassword"
                className={`input-label peer-placeholder-shown:text-base peer-placeholder-shown:text-on-surface-variant peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary ${form.confirmPassword ? 'top-1 text-xs text-primary' : ''}`}
              >
                Confirm Password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-4 text-on-surface-variant/40 hover:text-primary focus:outline-none transition-colors"
                tabIndex="-1"
              >
                <span className="material-symbols-outlined select-none text-xl">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-14 btn-primary text-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">how_to_reg</span>}
            </button>
          </form>

          <footer className="mt-8 pt-8 border-t border-surface-container-low text-center">
            <p className="text-sm text-on-surface-variant/60">
              Already have an account? <Link to="/login" className="text-on-surface font-semibold hover:text-primary transition-colors">Sign in instead</Link>
            </p>
          </footer>
        </div>
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 text-xs font-medium text-on-surface-variant/40 whitespace-nowrap">
        <span>v2.4.0-editorial</span>
        <span>•</span>
        <span>© 2024 LibraFlow Systems</span>
      </footer>
    </div>
  );
};

export default RegisterPage;
