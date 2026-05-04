import React, { useState, useEffect, useCallback } from 'react';
import { leaderboardAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Flame, TrendingUp } from 'lucide-react';
import './Leaderboard.css';

const tabs = [
  { key: 'coins',      label: '🪙 Coins',      icon: <Trophy size={14} /> },
  { key: 'attendance', label: '📈 Attendance',  icon: <TrendingUp size={14} /> },
  { key: 'streaks',    label: '🔥 Streaks',     icon: <Flame size={14} /> },
];

const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState('coins');
  const [data,      setData]        = useState({ leaderboard: [], myRank: null });
  const [loading,   setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetchers = { coins: leaderboardAPI.getCoins, attendance: leaderboardAPI.getAttendance, streaks: leaderboardAPI.getStreaks };
      const { data: res } = await fetchers[activeTab]({ limit: 20 });
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const getSecondaryValue = (entry) => {
    if (activeTab === 'coins')      return <span className="coin-amount">{entry.coinBalance}</span>;
    if (activeTab === 'attendance') return <span style={{ color: 'var(--green)', fontWeight: 700 }}>{entry.attendancePercentage}%</span>;
    if (activeTab === 'streaks')    return <span style={{ color: 'var(--gold)', fontWeight: 700 }}>🔥 {entry.currentStreak} days</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">See how you stack up against your peers</p>
      </div>

      {/* My rank banner */}
      {data.myRank && (
        <div className="lb-my-rank card animate-fade-in">
          <div className="lb-my-rank-num">#{data.myRank.rank}</div>
          <div>
            <div style={{ fontWeight: 700 }}>Your Rank</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {data.myRank.name} · <span className="coin-amount">{data.myRank.coinBalance}</span>
              {data.myRank.streak > 0 && <> · 🔥 {data.myRank.streak} day streak</>}
            </div>
          </div>
          <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>You</span>
        </div>
      )}

      {/* Tabs */}
      <div className="lb-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`lb-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : (
        <>
          {/* Top 3 podium */}
          {data.leaderboard.length >= 3 && (
            <div className="lb-podium">
              {/* 2nd */}
              <div className="lb-podium-place lb-place-2">
                <div className="lb-podium-avatar">{data.leaderboard[1].name.charAt(0)}</div>
                <div className="lb-podium-name">{data.leaderboard[1].name.split(' ')[0]}</div>
                <div className="lb-podium-value">{getSecondaryValue(data.leaderboard[1])}</div>
                <div className="lb-podium-bar lb-bar-2">🥈</div>
              </div>
              {/* 1st */}
              <div className="lb-podium-place lb-place-1">
                <div className="lb-podium-crown">👑</div>
                <div className="lb-podium-avatar lb-avatar-1">{data.leaderboard[0].name.charAt(0)}</div>
                <div className="lb-podium-name">{data.leaderboard[0].name.split(' ')[0]}</div>
                <div className="lb-podium-value">{getSecondaryValue(data.leaderboard[0])}</div>
                <div className="lb-podium-bar lb-bar-1">🥇</div>
              </div>
              {/* 3rd */}
              <div className="lb-podium-place lb-place-3">
                <div className="lb-podium-avatar">{data.leaderboard[2].name.charAt(0)}</div>
                <div className="lb-podium-name">{data.leaderboard[2].name.split(' ')[0]}</div>
                <div className="lb-podium-value">{getSecondaryValue(data.leaderboard[2])}</div>
                <div className="lb-podium-bar lb-bar-3">🥉</div>
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="card lb-list">
            {data.leaderboard.map((entry, i) => (
              <div
                key={entry._id}
                className={`lb-row ${entry._id === user?._id ? 'lb-row-mine' : ''} ${i < 3 ? 'lb-row-top' : ''}`}
              >
                <div className="lb-row-rank">
                  {entry.medal || <span className="lb-rank-num">#{entry.rank}</span>}
                </div>
                <div className="lb-row-avatar" style={{ background: i === 0 ? 'var(--gold-dim)' : i === 1 ? 'var(--bg-elevated)' : i === 2 ? 'rgba(205,127,50,0.15)' : 'var(--bg-elevated)' }}>
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div className="lb-row-info">
                  <div className="lb-row-name">
                    {entry.name}
                    {entry._id === user?._id && <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 6 }}>You</span>}
                  </div>
                  <div className="lb-row-sub">
                    {entry.department || 'Student'} · Year {entry.year}
                    {activeTab === 'streaks' && entry.longestStreak > 0 && (
                      <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>
                        (best: {entry.longestStreak})
                      </span>
                    )}
                  </div>
                </div>
                <div className="lb-row-value">{getSecondaryValue(entry)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
