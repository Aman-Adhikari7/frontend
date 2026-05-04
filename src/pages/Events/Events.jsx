import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventsAPI } from '../../api/services';
import toast from 'react-hot-toast';
import {
  CalendarDays, MapPin, Users, Plus, QrCode,
  Clock, ChevronDown, ChevronUp, Filter,
} from 'lucide-react';
import './Events.css';

// ── Admin: Create Event Modal ─────────────────────────────────────────────────
const CreateEventModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', date: '', venue: '',
    coins: { attendance: 10, participation: 20, win: 50 },
    earlyRegistrationDeadline: '',
    earlyRegistrationBonus: 10,
    maxParticipants: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('coins.')) {
      const key = name.split('.')[1];
      setForm((p) => ({ ...p, coins: { ...p.coins, [key]: Number(value) } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date)
      return toast.error('Title, description and date are required');

    setLoading(true);
    try {
      await eventsAPI.create({
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
        earlyRegistrationDeadline: form.earlyRegistrationDeadline || null,
      });
      toast.success('Event created!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Event</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input name="title" value={form.title} onChange={handleChange}
              className="form-input" placeholder="Hackathon 2025" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              className="form-input" rows={3} placeholder="What's this event about?" />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input type="datetime-local" name="date" value={form.date} onChange={handleChange}
                className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Venue</label>
              <input name="venue" value={form.venue} onChange={handleChange}
                className="form-input" placeholder="Main Auditorium" />
            </div>
          </div>

          {/* Coin rewards */}
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Coin Rewards</label>
            <div className="grid-3" style={{ gap: 10 }}>
              {['attendance', 'participation', 'win'].map((key) => (
                <div key={key} className="form-group">
                  <label className="form-label" style={{ textTransform: 'capitalize' }}>{key}</label>
                  <input type="number" name={`coins.${key}`} value={form.coins[key]}
                    onChange={handleChange} className="form-input" min={0} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Early Reg. Deadline</label>
              <input type="datetime-local" name="earlyRegistrationDeadline"
                value={form.earlyRegistrationDeadline} onChange={handleChange}
                className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Early Bonus Coins</label>
              <input type="number" name="earlyRegistrationBonus"
                value={form.earlyRegistrationBonus} onChange={handleChange}
                className="form-input" min={0} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Max Participants (leave blank for unlimited)</label>
            <input type="number" name="maxParticipants" value={form.maxParticipants}
              onChange={handleChange} className="form-input" placeholder="e.g. 100" min={1} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Creating…</> : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── QR Modal ──────────────────────────────────────────────────────────────────
const QRModal = ({ event, onClose }) => {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsAPI.getQR(event._id)
      .then(({ data }) => setQr(data.data))
      .catch(() => toast.error('Failed to load QR'))
      .finally(() => setLoading(false));
  }, [event._id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">QR Code — {event.title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          {loading ? (
            <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : qr ? (
            <>
              <img src={qr.qrCode} alt="QR Code" style={{ width: 220, margin: '0 auto 16px', borderRadius: 12 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Display this at the venue for students to scan
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--red)' }}>Failed to load QR code</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Event Card ────────────────────────────────────────────────────────────────
const EventCard = ({ event, isAdmin, onRefresh }) => {
  const [expanded,     setExpanded]     = useState(false);
  const [registering,  setRegistering]  = useState(false);
  const [showQR,       setShowQR]       = useState(false);

  const isRegistered = event.registeredStudents?.some(
    (r) => r.user === event._currentUserId
  );

  const isUpcoming  = event.status === 'upcoming';
  const isOngoing   = event.status === 'ongoing';
  const isPast      = event.status === 'completed' || event.status === 'cancelled';

  const statusColor = {
    upcoming:  'badge-accent',
    ongoing:   'badge-green',
    completed: 'badge-muted',
    cancelled: 'badge-red',
  }[event.status] || 'badge-muted';

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const { data } = await eventsAPI.register(event._id);
      toast.success(data.data.message);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await eventsAPI.updateStatus(event._id, status);
      toast.success(`Event marked as ${status}`);
      onRefresh();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <>
      <div className={`event-card card ${isPast ? 'event-card-past' : ''}`}>
        {/* Header */}
        <div className="event-card-header">
          <div className="event-date-block">
            <div className="event-day">{new Date(event.date).getDate()}</div>
            <div className="event-month">
              {new Date(event.date).toLocaleString('default', { month: 'short' })}
            </div>
          </div>
          <div className="event-meta">
            <div className="flex-between">
              <h3 className="event-title">{event.title}</h3>
              <span className={`badge ${statusColor}`}>{event.status}</span>
            </div>
            <div className="event-details">
              {event.venue && (
                <span className="event-detail"><MapPin size={12} /> {event.venue}</span>
              )}
              <span className="event-detail">
                <Clock size={12} />
                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="event-detail">
                <Users size={12} />
                {event.registeredStudents?.length ?? 0} registered
              </span>
            </div>
          </div>
        </div>

        {/* Coin rewards */}
        <div className="event-coins">
          <div className="event-coin-item">
            <span className="event-coin-label">Attend</span>
            <span className="coin-amount" style={{ fontSize: 13 }}>{event.coins?.attendance}</span>
          </div>
          <div className="event-coin-item">
            <span className="event-coin-label">Participate</span>
            <span className="coin-amount" style={{ fontSize: 13 }}>{event.coins?.participation}</span>
          </div>
          <div className="event-coin-item">
            <span className="event-coin-label">Win</span>
            <span className="coin-amount" style={{ fontSize: 13 }}>{event.coins?.win}</span>
          </div>
          {event.earlyRegistrationDeadline && isUpcoming && (
            <div className="event-coin-item">
              <span className="event-coin-label">Early Bird</span>
              <span className="coin-amount" style={{ fontSize: 13 }}>{event.earlyRegistrationBonus}</span>
            </div>
          )}
        </div>

        {/* Description toggle */}
        {event.description && (
          <>
            <button
              className="event-expand-btn"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> Details</>}
            </button>
            {expanded && (
              <p className="event-description animate-fade-in">{event.description}</p>
            )}
          </>
        )}

        {/* Actions */}
        <div className="event-actions">
          {!isAdmin && isUpcoming && !isRegistered && (
            <button className="btn btn-primary btn-sm" onClick={handleRegister} disabled={registering}>
              {registering ? 'Registering…' : '📋 Register'}
            </button>
          )}
          {!isAdmin && isRegistered && (
            <span className="badge badge-green">✓ Registered</span>
          )}
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowQR(true)}>
                <QrCode size={13} /> QR Code
              </button>
              {isUpcoming && (
                <button className="btn btn-gold btn-sm" onClick={() => handleStatusChange('ongoing')}>
                  Start Event
                </button>
              )}
              {isOngoing && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('completed')}>
                  End Event
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showQR && <QRModal event={event} onClose={() => setShowQR(false)} />}
    </>
  );
};

// ── Main Events Page ──────────────────────────────────────────────────────────
const Events = () => {
  const { isAdmin, user } = useAuth();
  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('upcoming');
  const [showCreate,  setShowCreate]  = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await eventsAPI.getAll(params);
      // Attach current user id for registration check
      const enriched = data.data.events.map((e) => ({ ...e, _currentUserId: user?._id }));
      setEvents(enriched);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [filter, user?._id]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filters = ['upcoming', 'ongoing', 'completed', 'all'];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Register early to earn bonus coins</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Create Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="events-filters">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {filters.map((f) => (
          <button
            key={f}
            className={`events-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="events-count">{events.length} events</span>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CalendarDays size={40} /></div>
          <div className="empty-state-title">No {filter} events</div>
          <div className="empty-state-text">
            {isAdmin ? 'Create your first event above' : 'Check back later for new events'}
          </div>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((ev) => (
            <EventCard
              key={ev._id}
              event={ev}
              isAdmin={isAdmin}
              onRefresh={loadEvents}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreated={loadEvents} />
      )}
    </div>
  );
};

export default Events;
