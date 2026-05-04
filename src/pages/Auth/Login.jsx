import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return toast.error('Please fill in all fields');

    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={22} /></div>
          <span className="auth-logo-text">Campus XP</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to continue earning coins &amp; climbing ranks</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                className="form-input auth-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input auth-input auth-input-pass"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full auth-submit"
            disabled={loading}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Logging in…</>
              : <>Log in <ArrowRight size={16} /></>
            }
          </button>
        </form>

        <div className="auth-stats">
          <div className="auth-stat"><span>🎓</span> Earn coins</div>
          <div className="auth-stat-divider" />
          <div className="auth-stat"><span>🏆</span> Leaderboard</div>
          <div className="auth-stat-divider" />
          <div className="auth-stat"><span>🤖</span> AI Learning</div>
        </div>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
