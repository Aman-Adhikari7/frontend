import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dopamineAPI, eventsAPI, leaderboardAPI, coinsAPI } from '../../api/services';
import toast from 'react-hot-toast';
import {
  Zap, Trophy, CalendarDays, TrendingUp, Gift,
  RotateCcw, Flame, BrainCircuit, ArrowRight, Star,
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [dopamine,       setDopamine]       = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [leaderboard,    setLeaderboard]    = useState([]);
  const [recentTxns,     setRecentTxns]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [spinning,       setSpinning]       = useState(false);
  const [spinResult,     setSpinResult]     = useState(null);
  const [openingBox,     setOpeningBox]     = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [dopRes, evRes, lbRes, txRes] = await Promise.all([
        dopamineAPI.getSummary(),
        eventsAPI.getAll({ upcoming: true }),
        leaderboardAPI.getCoins({ limit: 5 }),
        coinsAPI.getTransactions({ limit: 5 }),
      ]);
      setDopamine(dopRes.data.data);
      setUpcomingEvents(evRes.data.data.events.slice(0, 3));
      setLeaderboard(lbRes.data.data.leaderboard);
      setRecentTxns(txRes.data.data.transactions);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Spin wheel ──────────────────────────────────────────────────────────────
  const handleSpin = async () => {
    if (!dopamine?.spin?.canSpin) return;
    setSpinning(true);
    setSpinResult(null);
    try {
      const { data } = await dopamineAPI.spin();
      setSpinResult(data.data);
      setDopamine((p) => ({ ...p, spin: { canSpin: false, hoursLeft: 24 }, coinBalance: data.data.newBalance }));
      await refreshUser();
      if (data.data.prize.coins > 0) {
        toast.success(`${data.data.prize.emoji} You won ${data.data.prize.label}!`, { duration: 4000 });
      } else {
        toast('😅 Better luck tomorrow!', { duration: 3000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Spin failed');
    } finally {
      setSpinning(false);
    }
  };

  // ── Mystery box ─────────────────────────────────────────────────────────────
  const handleMysteryBox = async () => {
    if (!dopamine?.mysteryBox?.canAfford) return;
    setOpeningBox(true);
    try {
      const { data } = await dopamineAPI.openMysteryBox();
      await refreshUser();
      toast.success(`${data.data.prize.emoji} ${data.message}`, { duration: 4000 });
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open box');
    } finally {
      setOpeningBox(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  const streakDays = dopamine?.streak?.current ?? 0;
  const nextMilestone = streakDays < 3 ? 3 : streakDays < 7 ? 7 : streakDays < 30 ? 30 : null;
  const streakProgress = nextMilestone
    ? Math.round((streakDays / nextMilestone) * 100)
    : 100;

  return (
    <div className="dashboard animate-fade-in">
      {/* ── Greeting ─────────────────────────────────────────────────────────── */}
      <div className="dash-greeting">
        <div>
          <h1 className="dash-greeting-title">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="dash-greeting-sub">
            {streakDays > 0
              ? `🔥 You're on a ${streakDays}-day streak. Keep it going!`
              : 'Welcome back! Log in daily to build your streak.'}
          </p>
        </div>
        <div className="dash-balance-pill">
          <span className="coin-amount" style={{ fontSize: 20 }}>{user?.coinBalance ?? 0}</span>
          <span className="dash-balance-label">coins</span>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className="dash-stats">
        <StatCard
          icon={<Zap size={18} />}
          label="Coin Balance"
          value={user?.coinBalance ?? 0}
          suffix="coins"
          color="accent"
          onClick={() => navigate('/wallet')}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Attendance"
          value={`${user?.attendancePercentage ?? 0}%`}
          color="green"
          onClick={() => navigate('/wallet')}
        />
        <StatCard
          icon={<Flame size={18} />}
          label="Day Streak"
          value={streakDays}
          suffix="days"
          color="gold"
          onClick={() => navigate('/wallet')}
        />
        <StatCard
          icon={<BrainCircuit size={18} />}
          label="AI Access"
          value={dopamine?.ai?.hasAccess ? 'Active' : 'Locked'}
          color={dopamine?.ai?.hasAccess ? 'green' : 'muted'}
          onClick={() => navigate('/ai')}
        />
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="dash-grid">

        {/* Left column */}
        <div className="dash-col-left">

          {/* Spin wheel card */}
          <div className="card dash-spin-card">
            <div className="flex-between mb-16">
              <div>
                <h3 className="dash-section-title">Daily Spin</h3>
                <p className="dash-section-sub">
                  {dopamine?.spin?.canSpin
                    ? 'Your free spin is ready!'
                    : `Next spin in ${dopamine?.spin?.hoursLeft}h`}
                </p>
              </div>
              <RotateCcw size={20} style={{ color: 'var(--accent)' }} />
            </div>

            <div className="dash-spin-wheel">
              {(dopamine?.spin?.wheelPrizes || []).map((p, i) => (
                <div
                  key={i}
                  className={`dash-spin-slice ${spinResult?.prize?.index === i ? 'winner' : ''}`}
                  style={{ '--slice-i': i, '--total': 8 }}
                >
                  <span>{p.emoji}</span>
                </div>
              ))}
              <div className="dash-spin-center" onClick={handleSpin}>
                {spinning
                  ? <div className="spinner" />
                  : dopamine?.spin?.canSpin
                  ? <span>SPIN</span>
                  : <span>⏳</span>}
              </div>
            </div>

            {spinResult && (
              <div className="dash-spin-result animate-fade-in">
                <span style={{ fontSize: 24 }}>{spinResult.prize.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {spinResult.prize.label}
                  </div>
                  {spinResult.prize.coins > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      New balance: <span className="coin-amount">{spinResult.newBalance}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              className={`btn w-full ${dopamine?.spin?.canSpin ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleSpin}
              disabled={!dopamine?.spin?.canSpin || spinning}
              style={{ marginTop: 12 }}
            >
              {spinning ? 'Spinning…' : dopamine?.spin?.canSpin ? '🎡 Spin Now!' : `Come back in ${dopamine?.spin?.hoursLeft}h`}
            </button>
          </div>

          {/* Mystery box */}
          <div className="card dash-mystery-card">
            <div className="flex-between mb-16">
              <div>
                <h3 className="dash-section-title">Mystery Box</h3>
                <p className="dash-section-sub">Pay 30 coins, win up to 500!</p>
              </div>
              <Gift size={20} style={{ color: 'var(--gold)' }} />
            </div>

            <div className="dash-mystery-prizes">
              {['5🎲','10💰','25🎁','50💫','75🌈','150🔥','500🎰'].map((p) => (
                <span key={p} className="badge badge-muted" style={{ fontSize: 11 }}>{p}</span>
              ))}
            </div>

            <div className="dash-mystery-cost">
              <span className="coin-amount">30</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to open</span>
              {!dopamine?.mysteryBox?.canAfford && (
                <span className="badge badge-red" style={{ marginLeft: 'auto' }}>
                  Need {dopamine?.mysteryBox?.coinsNeeded} more
                </span>
              )}
            </div>

            <button
              className={`btn w-full ${dopamine?.mysteryBox?.canAfford ? 'btn-gold' : 'btn-secondary'}`}
              onClick={handleMysteryBox}
              disabled={!dopamine?.mysteryBox?.canAfford || openingBox}
              style={{ marginTop: 12 }}
            >
              {openingBox ? '✨ Opening…' : '🎁 Open Mystery Box'}
            </button>
          </div>

          {/* Streak card */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 className="dash-section-title">🔥 Streak Progress</h3>
              <span className="badge badge-gold">{streakDays} days</span>
            </div>

            <div className="dash-streak-milestones">
              {[
                { days: 3,  reward: 15,  emoji: '🥉' },
                { days: 7,  reward: 40,  emoji: '🥈' },
                { days: 30, reward: 150, emoji: '🥇' },
              ].map((m) => (
                <div
                  key={m.days}
                  className={`dash-streak-milestone ${streakDays >= m.days ? 'achieved' : ''}`}
                >
                  <span className="dash-milestone-emoji">{m.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.days} Days</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{m.reward} coins</div>
                  </div>
                  {streakDays >= m.days && (
                    <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: 10 }}>✓ Done</span>
                  )}
                </div>
              ))}
            </div>

            {nextMilestone && (
              <div style={{ marginTop: 16 }}>
                <div className="flex-between mb-8" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>Progress to {nextMilestone}-day milestone</span>
                  <span>{streakDays}/{nextMilestone}</span>
                </div>
                <div className="dash-progress-bar">
                  <div className="dash-progress-fill" style={{ width: `${streakProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="dash-col-right">

          {/* Leaderboard preview */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 className="dash-section-title">🏆 Leaderboard</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leaderboard')}>
                View all <ArrowRight size={13} />
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏆</div>
                <div className="empty-state-title">No data yet</div>
              </div>
            ) : (
              <div className="dash-leaderboard">
                {leaderboard.map((entry) => (
                  <div
                    key={entry._id}
                    className={`dash-lb-row ${entry._id === user?._id ? 'mine' : ''}`}
                  >
                    <span className="dash-lb-rank">
                      {entry.medal || `#${entry.rank}`}
                    </span>
                    <div className="dash-lb-avatar">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="dash-lb-info">
                      <div className="dash-lb-name">
                        {entry.name}
                        {entry._id === user?._id && <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 6 }}>You</span>}
                      </div>
                      <div className="dash-lb-dept">{entry.department || 'Student'}</div>
                    </div>
                    <span className="coin-amount">{entry.coinBalance}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming events */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 className="dash-section-title">📅 Upcoming Events</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')}>
                View all <ArrowRight size={13} />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">No upcoming events</div>
              </div>
            ) : (
              <div className="dash-events">
                {upcomingEvents.map((ev) => (
                  <div key={ev._id} className="dash-event-row">
                    <div className="dash-event-date-block">
                      <div className="dash-event-day">
                        {new Date(ev.date).getDate()}
                      </div>
                      <div className="dash-event-month">
                        {new Date(ev.date).toLocaleString('default', { month: 'short' })}
                      </div>
                    </div>
                    <div className="dash-event-info">
                      <div className="dash-event-title">{ev.title}</div>
                      <div className="dash-event-meta">
                        <span className="coin-amount" style={{ fontSize: 12 }}>{ev.coins?.attendance}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>on attend</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate('/events')}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 className="dash-section-title">💳 Recent Activity</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/wallet')}>
                View all <ArrowRight size={13} />
              </button>
            </div>

            {recentTxns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💳</div>
                <div className="empty-state-title">No transactions yet</div>
              </div>
            ) : (
              <div className="dash-txns">
                {recentTxns.map((tx) => (
                  <div key={tx._id} className="dash-txn-row">
                    <div className={`dash-txn-dot ${tx.type}`} />
                    <div className="dash-txn-info">
                      <div className="dash-txn-desc">{tx.description || tx.source}</div>
                      <div className="dash-txn-time">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className="dash-txn-amount"
                      style={{ color: tx.type === 'earn' ? 'var(--green)' : 'var(--red)' }}
                    >
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Stat card component ───────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, suffix, color, onClick }) => {
  const colorMap = {
    accent: { bg: 'var(--accent-glow)',  icon: 'var(--accent-bright)', text: 'var(--accent-bright)' },
    green:  { bg: 'var(--green-dim)',    icon: 'var(--green)',         text: 'var(--green)' },
    gold:   { bg: 'var(--gold-dim)',     icon: 'var(--gold)',          text: 'var(--gold)' },
    muted:  { bg: 'var(--bg-elevated)', icon: 'var(--text-muted)',    text: 'var(--text-secondary)' },
  };
  const c = colorMap[color] || colorMap.muted;

  return (
    <div className="dash-stat-card card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="dash-stat-icon" style={{ background: c.bg, color: c.icon }}>
        {icon}
      </div>
      <div className="dash-stat-value" style={{ color: c.text }}>
        {value}
        {suffix && <span className="dash-stat-suffix">{suffix}</span>}
      </div>
      <div className="dash-stat-label">{label}</div>
    </div>
  );
};

export default Dashboard;
