import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, coinsAPI, eventsAPI, attendanceAPI } from '../../api/services';
import toast from 'react-hot-toast';
import {
  Users, Zap, CalendarDays, ShieldCheck,
  TrendingUp, Search, ToggleLeft, ToggleRight,
  Plus, Minus, QrCode, CheckCircle, Star,
  BarChart3, RefreshCw, AlertTriangle,
} from 'lucide-react';
import './Admin.css';

// ── Tab Button ────────────────────────────────────────────────────────────────
const TabBtn = ({ label, icon: Icon, active, onClick, badge }) => (
  <button className={`admin-tab ${active ? 'active' : ''}`} onClick={onClick}>
    <Icon size={15} />
    {label}
    {badge != null && <span className="admin-tab-badge">{badge}</span>}
  </button>
);

// ── Coin Grant/Deduct Modal ───────────────────────────────────────────────────
const CoinModal = ({ user: target, mode, onClose, onDone }) => {
  const [amount,  setAmount]  = useState(10);
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount < 1) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      const payload = { userId: target._id, amount: Number(amount), reason };
      if (mode === 'grant') {
        await coinsAPI.adminGrant(payload);
        toast.success(`Granted ${amount} coins to ${target.name}`);
      } else {
        await coinsAPI.adminDeduct(payload);
        toast.success(`Deducted ${amount} coins from ${target.name}`);
      }
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'grant' ? '➕ Grant Coins' : '➖ Deduct Coins'} — {target.name}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Amount (coins)</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              min={1}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Reason (optional)</label>
            <input
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bonus for assignment, penalty, etc."
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className={`btn ${mode === 'grant' ? 'btn-primary' : 'btn-danger'}`}
              disabled={loading}
            >
              {loading ? 'Processing…' : mode === 'grant' ? 'Grant Coins' : 'Deduct Coins'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Mark Attendance Modal ─────────────────────────────────────────────────────
const AttendModal = ({ users, events, onClose, onDone }) => {
  const [userId,  setUserId]  = useState('');
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !eventId) return toast.error('Select both user and event');
    setLoading(true);
    try {
      await attendanceAPI.manualMark({ userId, eventId });
      toast.success('Attendance marked!');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📋 Mark Attendance Manually</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Student</label>
            <select className="form-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select a student…</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Event</label>
            <select className="form-input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">Select an event…</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} — {new Date(ev.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Marking…' : '✓ Mark Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── QR Code Modal ─────────────────────────────────────────────────────────────
const QRModal = ({ event, onClose }) => {
  const [qr,      setQr]      = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsAPI.getQR(event._id)
      .then(({ data }) => setQr(data.data.qrCode))
      .catch(() => toast.error('Failed to load QR'))
      .finally(() => setLoading(false));
  }, [event._id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📷 QR Code — {event.title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          {loading
            ? <div className="spinner" style={{ margin: '40px auto' }} />
            : qr
              ? <img src={qr} alt="QR Code" style={{ width: 220, height: 220, margin: '0 auto', borderRadius: 12 }} />
              : <p style={{ color: 'var(--text-muted)' }}>QR not available</p>
          }
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
            Students scan this to mark attendance for <strong>{event.title}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Admin Panel
// ─────────────────────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // ── Data ────────────────────────────────────────────────────────────────────
  const [users,   setUsers]   = useState([]);
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [coinModal,   setCoinModal]   = useState(null); // { user, mode }
  const [attendModal, setAttendModal] = useState(false);
  const [qrModal,     setQrModal]     = useState(null); // event

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, eRes] = await Promise.all([
        authAPI.getAllUsers(),
        eventsAPI.getAll(),
      ]);
      setUsers(uRes.data.data.users || []);
      setEvents(eRes.data.data.events || []);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!isAdmin) {
    return (
      <div className="page-loader">
        <AlertTriangle size={32} style={{ color: 'var(--red)' }} />
        <span style={{ color: 'var(--red)', marginTop: 12 }}>Access Denied — Admins Only</span>
      </div>
    );
  }

  // ── Toggle user active ──────────────────────────────────────────────────────
  const handleToggleUser = async (user) => {
    try {
      await authAPI.toggleUser(user._id);
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  // ── Event status change ─────────────────────────────────────────────────────
  const handleEventStatus = async (event, status) => {
    try {
      await eventsAPI.updateStatus(event._id, status);
      toast.success(`Event marked as ${status}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  // ── Stats ───────────────────────────────────────────────────────────────────
  const activeUsers    = users.filter((u) => u.isActive).length;
  const totalCoins     = users.reduce((s, u) => s + (u.coinBalance || 0), 0);
  const upcomingEvents = events.filter((e) => new Date(e.date) > new Date()).length;

  return (
    <div className="admin-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage students, events, coins and attendance</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overview stats */}
      <div className="admin-stats">
        <div className="admin-stat-card card">
          <div className="admin-stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-bright)' }}>
            <Users size={18} />
          </div>
          <div>
            <div className="admin-stat-value">{users.length}</div>
            <div className="admin-stat-label">Total Students</div>
          </div>
          <div className="admin-stat-sub">{activeUsers} active</div>
        </div>

        <div className="admin-stat-card card">
          <div className="admin-stat-icon" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
            <Zap size={18} />
          </div>
          <div>
            <div className="admin-stat-value">{totalCoins.toLocaleString()}</div>
            <div className="admin-stat-label">Coins in Circulation</div>
          </div>
          <div className="admin-stat-sub">across all students</div>
        </div>

        <div className="admin-stat-card card">
          <div className="admin-stat-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
            <CalendarDays size={18} />
          </div>
          <div>
            <div className="admin-stat-value">{events.length}</div>
            <div className="admin-stat-label">Total Events</div>
          </div>
          <div className="admin-stat-sub">{upcomingEvents} upcoming</div>
        </div>

        <div className="admin-stat-card card">
          <div className="admin-stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="admin-stat-value">
              {users.length > 0
                ? Math.round(users.reduce((s, u) => s + (u.attendancePercentage || 0), 0) / users.length)
                : 0}%
            </div>
            <div className="admin-stat-label">Avg Attendance</div>
          </div>
          <div className="admin-stat-sub">all students</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <TabBtn label="Students"  icon={Users}       active={activeTab === 'users'}  onClick={() => setActiveTab('users')}  badge={users.length} />
        <TabBtn label="Events"    icon={CalendarDays} active={activeTab === 'events'} onClick={() => setActiveTab('events')} badge={events.length} />
      </div>

      {/* Search + actions */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            className="admin-search-input"
            placeholder={activeTab === 'users' ? 'Search students…' : 'Search events…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-toolbar-actions">
          {activeTab === 'users' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setAttendModal(true)}>
              <CheckCircle size={14} /> Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* ── Students Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="card admin-table-card">
          {loading ? (
            <div className="page-loader" style={{ minHeight: 200 }}>
              <div className="spinner" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No students found</div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Department / Year</th>
                    <th style={{ textAlign: 'center' }}>Coins</th>
                    <th style={{ textAlign: 'center' }}>Attendance</th>
                    <th style={{ textAlign: 'center' }}>Streak</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{u.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="admin-user-name">{u.name}</div>
                            <div className="admin-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {u.department || '—'}
                          {u.year ? ` · Y${u.year}` : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="coin-amount">{u.coinBalance ?? 0}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: (u.attendancePercentage || 0) >= 75 ? 'var(--green)' : 'var(--gold)'
                        }}>
                          {u.attendancePercentage ?? 0}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-gold" style={{ fontSize: 11 }}>
                          🔥 {u.streak?.currentStreak ?? 0}d
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="btn btn-ghost btn-xs admin-coin-btn grant"
                            title="Grant coins"
                            onClick={() => setCoinModal({ user: u, mode: 'grant' })}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs admin-coin-btn deduct"
                            title="Deduct coins"
                            onClick={() => setCoinModal({ user: u, mode: 'deduct' })}
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            title={u.isActive ? 'Deactivate student' : 'Activate student'}
                            onClick={() => handleToggleUser(u)}
                          >
                            {u.isActive
                              ? <ToggleRight size={14} style={{ color: 'var(--green)' }} />
                              : <ToggleLeft  size={14} style={{ color: 'var(--text-muted)' }} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Events Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <div className="admin-events-list">
          {loading ? (
            <div className="page-loader" style={{ minHeight: 200 }}>
              <div className="spinner" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">No events found</div>
                <div className="empty-state-sub">Create events from the Events page</div>
              </div>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isPast     = new Date(ev.date) < new Date();
              const isOngoing  = ev.status === 'ongoing';
              const isComplete = ev.status === 'completed';
              return (
                <div key={ev._id} className="card admin-event-card">
                  <div className="admin-event-top">
                    <div>
                      <div className="admin-event-title">{ev.title}</div>
                      <div className="admin-event-meta">
                        <span>📅 {new Date(ev.date).toLocaleString()}</span>
                        {ev.venue && <span>📍 {ev.venue}</span>}
                        <span style={{ color: 'var(--text-muted)' }}>
                          Created by {ev.createdBy?.name || 'Admin'}
                        </span>
                      </div>
                    </div>
                    <div className="admin-event-badges">
                      <span className={`badge ${
                        isComplete ? 'badge-muted'
                        : isOngoing ? 'badge-green'
                        : isPast    ? 'badge-red'
                        : 'badge-accent'
                      }`}>
                        {isComplete ? 'Completed' : isOngoing ? '🔴 Live' : isPast ? 'Past' : 'Upcoming'}
                      </span>
                    </div>
                  </div>

                  <div className="admin-event-coins">
                    {[
                      { label: 'Attend',       val: ev.coins?.attendance    ?? 10, color: 'var(--accent-bright)' },
                      { label: 'Participate',  val: ev.coins?.participation ?? 20, color: 'var(--green)' },
                      { label: 'Win',          val: ev.coins?.win           ?? 50, color: 'var(--gold)' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="admin-event-coin-pill">
                        <span className="coin-amount" style={{ color, fontSize: 14 }}>{val}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="admin-event-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setQrModal(ev)}
                    >
                      <QrCode size={14} /> Show QR
                    </button>
                    {!isComplete && !isOngoing && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEventStatus(ev, 'ongoing')}
                      >
                        🔴 Start Event
                      </button>
                    )}
                    {isOngoing && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEventStatus(ev, 'completed')}
                      >
                        <CheckCircle size={14} /> Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {coinModal && (
        <CoinModal
          user={coinModal.user}
          mode={coinModal.mode}
          onClose={() => setCoinModal(null)}
          onDone={loadData}
        />
      )}
      {attendModal && (
        <AttendModal
          users={users}
          events={events}
          onClose={() => setAttendModal(false)}
          onDone={loadData}
        />
      )}
      {qrModal && (
        <QRModal
          event={qrModal}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;