/**
 * RegisterPage
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/api';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

function Field({ label, type = 'text', placeholder, value, error, onChange }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input
        type={type}
        className={`input ${error ? 'border-valo-red' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error && <p className="text-valo-red text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.username) e.username = 'Username required';
    else if (form.username.length < 3) e.username = 'At least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers, underscores only';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register({ username: form.username, email: form.email, password: form.password });
    if (result.success) {
      toast.success('Account created! Set up your profile to start finding duos.');
      navigate('/profile/edit');
    } else {
      toast.error(result.message);
    }
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-valo-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-valo-teal/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <polygon points="20,2 38,20 20,38 2,20" fill="#FF4655" />
              <polygon points="20,10 30,20 20,30 10,20" fill="#0F1923" />
            </svg>
          </div>
          <h1 className="font-hero text-4xl text-white uppercase">PLAYPAIR</h1>
          <p className="text-gray-600 text-sm mt-1">Find your Valorant duo</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display font-bold text-xl text-white mb-6 tracking-wide">CREATE ACCOUNT</h2>

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
            Sign up with Google
          </a>

          <div className="valo-divider text-xs text-gray-600 font-display tracking-widest uppercase">or</div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <Field label="Username" placeholder="YourGamertag" value={form.username} error={errors.username} onChange={handleChange('username')} />
            <Field label="Email" type="email" placeholder="agent@example.com" value={form.email} error={errors.email} onChange={handleChange('email')} />
            <Field label="Password" type="password" placeholder="••••••••" value={form.password} error={errors.password} onChange={handleChange('password')} />
            <Field label="Confirm Password" type="password" placeholder="••••••••" value={form.confirm} error={errors.confirm} onChange={handleChange('confirm')} />

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-valo-red hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
