import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, coinsAPI, attendanceAPI } from '../../api/services';
import toast from 'react-hot-toast';
import {
  User, Mail, Building2, GraduationCap, Lock,
  Save, Edit3, Flame, Zap, TrendingUp,
  CalendarCheck,
} from 'lucide-react';
import './Profile.css';

const Avatar = ({ name, size = 72 }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className="profile-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
};

const StatPill = ({ icon, label, value, color }) => (
  <div className={`profile-stat-pill profile-stat-${color}`}>
    <div className="profile-stat-icon">{icon}</div>
    <div>
      <div className="profile-stat-value">{value}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
  </div>
);

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    name: user?.name || '', department: user?.department || '', year: user?.year || 1,
  });

  const [pwForm,   setPwForm]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw,   setShowPw]  = useState(false);

  const [txSummary,     setTxSummary]     = useState(null);
  const [attendHistory, setAttendHistory] = useState([]);
  const [loadingExtra,  setLoadingExtra]  = useState(true);

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const [txRes, attRes] = await Promise.all([
          coinsAPI.getTransactions({ limit: 1 }),
          attendanceAPI.getMyHistory(),
        ]);
        setTxSummary(txRes.data.data.summary);
        setAttendHistory((attRes.data.data.attendance || []).slice(0, 5));
      } catch (_) {}
      finally { setLoadingExtra(false); }
    };
    fetchExtras();
  }, []);

  useEffect(() => {
    if (user) setForm({ name: user.name, department: user.department || '', year: user.year || 1 });
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwSaving(false); }
  };

  if (!user) return null;

  const streakDays    = user.streak?.currentStreak || 0;
  const longestStreak = user.streak?.longestStreak  || 0;
  const yearLabels    = ['', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

  return (
    <div className="profile-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and view your stats</p>
      </div>

      <div className="profile-grid">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="profile-left">

          {/* Identity card */}
          <div className="card profile-identity-card">
            <div className="profile-identity-top">
              <Avatar name={user.name} size={72} />
              <div className="profile-identity-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-email">{user.email}</div>
                <div className="profile-meta-row">
                  {user.department && (
                    <span className="badge badge-muted" style={{ fontSize: 11 }}>🏛️ {user.department}</span>
                  )}
                  {user.year && (
                    <span className="badge badge-muted" style={{ fontSize: 11 }}>📚 {yearLabels[user.year] || `Year ${user.year}`}</span>
                  )}
                  <span className={`badge ${user.role === 'admin' ? 'badge-accent' : 'badge-green'}`} style={{ fontSize: 11 }}>
                    {user.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-stats-row">
              <StatPill icon={<Zap size={14} />}        label="Coins"      value={user.coinBalance ?? 0}           color="accent" />
              <StatPill icon={<TrendingUp size={14} />}  label="Attendance" value={`${user.attendancePercentage ?? 0}%`} color="green" />
              <StatPill icon={<Flame size={14} />}       label="Streak"     value={`${streakDays}d`}                color="gold"  />
            </div>

            <div className="profile-joined">
              <CalendarCheck size={13} style={{ color: 'var(--text-muted)' }} />
              <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          {/* Streak */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 className="dash-section-title">🔥 Streak</h3>
              <span className="badge badge-gold">{streakDays} days</span>
            </div>
            <div className="profile-streak-row">
              <div className="profile-streak-item">
                <div className="profile-streak-num" style={{ color: 'var(--gold)' }}>{streakDays}</div>
                <div className="profile-streak-sub">Current</div>
              </div>
              <div className="profile-streak-divider" />
              <div className="profile-streak-item">
                <div className="profile-streak-num" style={{ color: 'var(--accent-bright)' }}>{longestStreak}</div>
                <div className="profile-streak-sub">Longest</div>
              </div>
            </div>
            <div className="profile-streak-milestones">
              {[{ days: 3, reward: 15, emoji: '🥉' }, { days: 7, reward: 40, emoji: '🥈' }, { days: 30, reward: 150, emoji: '🥇' }].map((m) => (
                <div key={m.days} className={`profile-milestone ${streakDays >= m.days ? 'achieved' : ''}`}>
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.days}-Day Milestone</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{m.reward} coins</div>
                  </div>
                  {streakDays >= m.days
                    ? <span className="badge badge-green"  style={{ fontSize: 10 }}>✓ Done</span>
                    : <span className="badge badge-muted"  style={{ fontSize: 10 }}>{m.days - streakDays}d left</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Coin summary */}
          {!loadingExtra && txSummary && (
            <div className="card">
              <h3 className="dash-section-title mb-16">💰 Coin Summary</h3>
              <div className="profile-coin-summary">
                <div className="profile-coin-row">
                  <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>Total Earned</span>
                  <span className="coin-amount">+{txSummary.totalEarned}</span>
                </div>
                <div className="profile-coin-row">
                  <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>Total Spent</span>
                  <span style={{ color: 'var(--red)', fontWeight: 700 }}>-{txSummary.totalSpent}</span>
                </div>
                <div className="profile-coin-divider" />
                <div className="profile-coin-row">
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Balance</span>
                  <span className="coin-amount" style={{ fontSize: 18 }}>{user.coinBalance ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <div className="profile-right">

          {/* Edit profile */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 className="dash-section-title">Edit Profile</h3>
              {!editing
                ? <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit3 size={14} /> Edit</button>
                : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm({ name: user.name, department: user.department || '', year: user.year || 1 }); }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}><Save size={14} />{saving ? 'Saving…' : 'Save'}</button>
                  </div>
                )
              }
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label className="form-label"><User size={13} style={{ display:'inline', marginRight:6 }} />Full Name</label>
                <input className="form-input" value={form.name} disabled={!editing}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={13} style={{ display:'inline', marginRight:6 }} />Email Address</label>
                <input className="form-input" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Email cannot be changed</span>
              </div>
              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label"><Building2 size={13} style={{ display:'inline', marginRight:6 }} />Department</label>
                  <input className="form-input" value={form.department} disabled={!editing}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="e.g. Computer Science" />
                </div>
                <div className="form-group">
                  <label className="form-label"><GraduationCap size={13} style={{ display:'inline', marginRight:6 }} />Year</label>
                  <select className="form-input" value={form.year} disabled={!editing}
                    onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}>
                    {[1,2,3,4,5].map((y) => <option key={y} value={y}>{yearLabels[y]}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* AI Access */}
          <div className="card profile-ai-card">
            <div className="flex-between">
              <div>
                <h3 className="dash-section-title">🤖 AI Learning Access</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {user.hasAIAccess
                    ? `Active · Expires ${new Date(user.aiAccessExpiry).toLocaleDateString()}`
                    : 'Unlock in the Store for 100 coins (7-day access)'}
                </p>
              </div>
              <span className={`badge ${user.hasAIAccess ? 'badge-green' : 'badge-muted'}`}>
                {user.hasAIAccess ? '✓ Active' : 'Locked'}
              </span>
            </div>
          </div>

          {/* Recent attendance */}
          {!loadingExtra && attendHistory.length > 0 && (
            <div className="card">
              <h3 className="dash-section-title mb-16">📋 Recent Attendance</h3>
              <div className="profile-attend-list">
                {attendHistory.map((a) => (
                  <div key={a._id} className="profile-attend-row">
                    <div className="profile-attend-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.event?.title || 'Event'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(a.scannedAt || a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: 10 }}>+{a.coinsEarned ?? 0} coins</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change password */}
          <div className="card">
            <div className="flex-between" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setShowPw((p) => !p)}>
              <h3 className="dash-section-title">
                <Lock size={15} style={{ display: 'inline', marginRight: 8 }} />Change Password
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{showPw ? '▲ Hide' : '▼ Show'}</span>
            </div>

            {showPw && (
              <form onSubmit={handlePasswordChange} className="profile-pw-form animate-fade-in">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Current password" />
                </div>
                <div className="profile-form-row">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-input" value={pwForm.newPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" className="form-input" value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={pwSaving} style={{ marginTop: 4 }}>
                  <Lock size={14} /> {pwSaving ? 'Changing…' : 'Change Password'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
