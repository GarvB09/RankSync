/**
 * LoginPage
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import { API_URL } from '../utils/api';
import LoginAgents from '../components/JettDash';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-valo-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-valo-red/5 rounded-full blur-3xl pointer-events-none" />

      {/* Agents sliding in from both sides */}
      <LoginAgents />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <polygon points="20,2 38,20 20,38 2,20" fill="#FF4655" />
              <polygon points="20,10 30,20 20,30 10,20" fill="#0F1923" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide">RANKSYNC</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to find your perfect teammate</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display font-bold text-xl text-white mb-6 tracking-wide">SIGN IN</h2>

          {/* Google OAuth */}
          <a
            href={`${API_URL}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 bg-valo-dark-2 border border-valo-border rounded hover:border-gray-500 transition-colors text-sm font-medium text-gray-300 hover:text-white mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="valo-divider text-xs text-gray-600 font-display tracking-widest uppercase">or</div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-valo-red' : ''}`}
                placeholder="agent@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-valo-red text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                className={`input ${errors.password ? 'border-valo-red' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-valo-red text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New to RankSync?{' '}
            <Link to="/register" className="text-valo-red hover:text-white transition-colors font-medium">
              Create account
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-valo-dark-2 rounded border border-valo-border/50">
            <p className="text-xs text-gray-500 text-center">
              🎮 Demo: use any seeded account — e.g. <span className="text-valo-teal font-mono">sentinel@demo.com</span> / <span className="text-valo-teal font-mono">password123</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
