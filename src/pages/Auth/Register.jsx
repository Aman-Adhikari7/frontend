import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff, User, BookOpen, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics',
  'Mechanical', 'Civil', 'Chemical', 'Mathematics', 'Physics',
  'Business Administration', 'Other',
];

const Register = () => {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', year: '1',
  });
  const [showPass,     setShowPass]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [step,         setStep]         = useState(1); // 2-step form

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validateStep1 = () => {
    if (!form.name.trim())  return toast.error('Name is required'), false;
    if (!form.email.trim()) return toast.error('Email is required'), false;
    if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error('Enter a valid email'), false;
    return true;
  };

  const validateStep2 = () => {
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters'), false;
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match'), false;
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await register({
        name:       form.name.trim(),
        email:      form.email.trim(),
        password:   form.password,
        department: form.department,
        year:       parseInt(form.year),
      });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join and start earning coins from day one</p>

        {/* Step indicator */}
        <div className="auth-steps">
          <div className={`auth-step ${step >= 1 ? 'active' : ''}`}>
            <div className="auth-step-dot">1</div>
            <span>Profile</span>
          </div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step >= 2 ? 'active' : ''}`}>
            <div className="auth-step-dot">2</div>
            <span>Security</span>
          </div>
        </div>

        {/* Step 1: Name, Email, Department, Year */}
        {step === 1 && (
          <form onSubmit={handleNext} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="auth-input-wrap">
                <User size={15} className="auth-input-icon" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="form-input auth-input"
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <div className="auth-input-wrap">
                  <BookOpen size={15} className="auth-input-icon" />
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="form-input auth-input auth-select"
                  >
                    <option value="">Select dept.</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Year</label>
                <div className="auth-input-wrap">
                  <select
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    className="form-input auth-input auth-select"
                    style={{ paddingLeft: 14 }}
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full auth-submit">
              Continue <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="form-input auth-input auth-input-pass"
                />
                <button type="button" className="auth-eye" onClick={() => setShowPass((v) => !v)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="form-input auth-input auth-input-pass"
                />
                <button type="button" className="auth-eye" onClick={() => setShowConfirm((v) => !v)}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            <PasswordStrength password={form.password} />

            <div className="auth-welcome-bonus">
              🎉 You'll receive <strong>20 welcome coins</strong> on signup!
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading
                  ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating…</>
                  : <>Create Account <ArrowRight size={16} /></>
                }
              </button>
            </div>
          </form>
        )}

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
};

// ── Password strength sub-component ──────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6)  score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Weak',   color: 'var(--red)' };
    if (score <= 3) return { score, label: 'Fair',   color: 'var(--gold)' };
    return               { score, label: 'Strong', color: 'var(--green)' };
  };

  const { score, label, color } = getStrength();
  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="password-strength-bar"
            style={{ background: i <= score ? color : 'var(--bg-elevated)' }}
          />
        ))}
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 600 }}>{label}</span>
    </div>
  );
};

export default Register;
