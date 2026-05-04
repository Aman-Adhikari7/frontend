import React, { useState, useEffect, useCallback } from 'react';
import { coinsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Wallet as WalletIcon, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownLeft, Filter, RefreshCw,
} from 'lucide-react';
import './Wallet.css';

// ── Redeem Attendance Modal ───────────────────────────────────────────────────
const RedeemModal = ({ balance, currentAttendance, onClose, onSuccess }) => {
  const [percent, setPercent] = useState(1);
  const [loading, setLoading] = useState(false);
  const COST_PER_PERCENT = 100;
  const totalCost = percent * COST_PER_PERCENT;
  const canAfford = balance >= totalCost;

  const handleRedeem = async () => {
    setLoading(true);
    try {
      const { data } = await coinsAPI.redeemAttendance({ percentage: percent });
      toast.success(data.data.message);
      onSuccess(data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Redeem Attendance</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="redeem-current">
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Current attendance</span>
            <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 18 }}>
              {currentAttendance}%
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Percentage to redeem: {percent}%</label>
            <input
              type="range"
              min={1} max={10}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="wallet-range"
            />
            <div className="flex-between" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span>1%</span><span>10%</span>
            </div>
          </div>

          <div className="redeem-summary">
            <div className="redeem-row">
              <span>Cost</span>
              <span className="coin-amount">{totalCost}</span>
            </div>
            <div className="redeem-row">
              <span>New attendance</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                {Math.min(100, currentAttendance + percent)}%
              </span>
            </div>
            <div className="redeem-row">
              <span>Remaining balance</span>
              <span className="coin-amount">{balance - totalCost}</span>
            </div>
          </div>

          {!canAfford && (
            <div className="badge badge-red" style={{ display: 'block', textAlign: 'center', padding: '8px' }}>
              Insufficient coins — need {totalCost - balance} more
            </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleRedeem}
              disabled={!canAfford || loading}
            >
              {loading ? 'Redeeming…' : `Redeem ${percent}%`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Transaction row ───────────────────────────────────────────────────────────
const TxnRow = ({ tx }) => {
  const isEarn = tx.type === 'earn';
  const sourceEmojis = {
    attendance: '✅', participation: '🎯', win: '🏆',
    early_registration: '⚡', task_completion: '📋',
    spin_wheel: '🎡', streak_bonus: '🔥', mystery_box: '🎁',
    redeem_attendance: '📈', unlock_notes: '📚',
    unlock_ai: '🤖', crash_pack: '⚡',
    admin_grant: '👑', admin_deduct: '⚠️',
  };
  const emoji = sourceEmojis[tx.source] || '🪙';

  return (
    <div className="txn-row">
      <div className="txn-icon" style={{ background: isEarn ? 'var(--green-dim)' : 'var(--red-dim)' }}>
        {isEarn
          ? <ArrowUpRight size={14} color="var(--green)" />
          : <ArrowDownLeft size={14} color="var(--red)" />}
      </div>
      <div className="txn-info">
        <div className="txn-desc">
          <span className="txn-emoji">{emoji}</span>
          {tx.description || tx.source.replace(/_/g, ' ')}
        </div>
        <div className="txn-meta">
          <span>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {tx.relatedEvent?.title && (
            <span className="badge badge-muted" style={{ fontSize: 10 }}>{tx.relatedEvent.title}</span>
          )}
        </div>
      </div>
      <div className="txn-right">
        <div className="txn-amount" style={{ color: isEarn ? 'var(--green)' : 'var(--red)' }}>
          {isEarn ? '+' : '-'}{tx.amount}
        </div>
        <div className="txn-balance">→ {tx.balanceAfter}</div>
      </div>
    </div>
  );
};

// ── Main Wallet Page ──────────────────────────────────────────────────────────
const Wallet = () => {
  const { user, refreshUser } = useAuth();

  const [balance,      setBalance]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary,      setSummary]      = useState({ totalEarned: 0, totalSpent: 0 });
  const [pagination,   setPagination]   = useState({ page: 1, pages: 1, total: 0 });
  const [loading,      setLoading]      = useState(true);
  const [txLoading,    setTxLoading]    = useState(false);
  const [typeFilter,   setTypeFilter]   = useState('');
  const [showRedeem,   setShowRedeem]   = useState(false);
  const [page,         setPage]         = useState(1);

  const loadBalance = useCallback(async () => {
    try {
      const { data } = await coinsAPI.getBalance();
      setBalance(data.data);
    } catch (err) {
      toast.error('Failed to load balance');
    }
  }, []);

  const loadTransactions = useCallback(async (p = 1, type = '') => {
    setTxLoading(true);
    try {
      const { data } = await coinsAPI.getTransactions({ page: p, limit: 15, type });
      setTransactions(data.data.transactions);
      setSummary(data.data.summary);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadBalance(), loadTransactions(1, typeFilter)]);
      setLoading(false);
    };
    init();
  }, [loadBalance, loadTransactions, typeFilter]);

  const handleRedeemSuccess = async (data) => {
    await refreshUser();
    await loadBalance();
    await loadTransactions(1, typeFilter);
  };

  const handleFilterChange = (type) => {
    setTypeFilter(type);
    setPage(1);
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const earned = summary.totalEarned;
  const spent  = summary.totalSpent;
  const net    = earned - spent;

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Wallet</h1>
          <p className="page-subtitle">Your coins, transactions and attendance</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { loadBalance(); loadTransactions(page, typeFilter); }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Balance cards ─────────────────────────────────────────────────── */}
      <div className="wallet-top">
        {/* Main balance */}
        <div className="wallet-balance-card card">
          <div className="wallet-balance-icon">
            <WalletIcon size={22} />
          </div>
          <div className="wallet-balance-label">Current Balance</div>
          <div className="wallet-balance-amount coin-amount" style={{ fontSize: 40 }}>
            {balance?.coinBalance ?? user?.coinBalance ?? 0}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => setShowRedeem(true)}
          >
            📈 Redeem Attendance
          </button>
        </div>

        {/* Stats */}
        <div className="wallet-stats">
          <div className="wallet-stat-card card">
            <div className="wallet-stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
              <TrendingUp size={16} />
            </div>
            <div className="wallet-stat-value" style={{ color: 'var(--green)' }}>+{earned}</div>
            <div className="wallet-stat-label">Total Earned</div>
          </div>
          <div className="wallet-stat-card card">
            <div className="wallet-stat-icon" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
              <TrendingDown size={16} />
            </div>
            <div className="wallet-stat-value" style={{ color: 'var(--red)' }}>-{spent}</div>
            <div className="wallet-stat-label">Total Spent</div>
          </div>
          <div className="wallet-stat-card card">
            <div className="wallet-stat-icon" style={{ background: net >= 0 ? 'var(--green-dim)' : 'var(--red-dim)', color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              <WalletIcon size={16} />
            </div>
            <div className="wallet-stat-value" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {net >= 0 ? '+' : ''}{net}
            </div>
            <div className="wallet-stat-label">Net</div>
          </div>
          <div className="wallet-stat-card card" style={{ cursor: 'default' }}>
            <div className="wallet-stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-bright)' }}>
              <TrendingUp size={16} />
            </div>
            <div className="wallet-stat-value" style={{ color: 'var(--accent-bright)' }}>
              {balance?.attendancePercentage ?? user?.attendancePercentage ?? 0}%
            </div>
            <div className="wallet-stat-label">Attendance</div>
          </div>
        </div>
      </div>

      {/* ── AI Access Banner ─────────────────────────────────────────────── */}
      {balance?.hasAIAccess && (
        <div className="wallet-ai-banner animate-fade-in">
          <span>🤖</span>
          <span>AI Micro-Learning access active until{' '}
            <strong>{new Date(balance.aiAccessExpiry).toLocaleDateString()}</strong>
          </span>
        </div>
      )}

      {/* ── Transaction history ───────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="flex-between mb-16">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Transaction History
            <span className="badge badge-muted" style={{ marginLeft: 8, fontSize: 11 }}>
              {pagination.total}
            </span>
          </h3>
          <div className="wallet-filters">
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            {['', 'earn', 'spend'].map((t) => (
              <button
                key={t}
                className={`wallet-filter-btn ${typeFilter === t ? 'active' : ''}`}
                onClick={() => handleFilterChange(t)}
              >
                {t === '' ? 'All' : t === 'earn' ? '↑ Earned' : '↓ Spent'}
              </button>
            ))}
          </div>
        </div>

        {txLoading ? (
          <div className="page-loader" style={{ minHeight: 120 }}><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-text">Attend events and complete tasks to earn coins</div>
          </div>
        ) : (
          <>
            <div className="txn-list">
              {transactions.map((tx) => <TxnRow key={tx._id} tx={tx} />)}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="wallet-pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => { const p = page - 1; setPage(p); loadTransactions(p, typeFilter); }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === pagination.pages}
                  onClick={() => { const p = page + 1; setPage(p); loadTransactions(p, typeFilter); }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showRedeem && (
        <RedeemModal
          balance={balance?.coinBalance ?? user?.coinBalance ?? 0}
          currentAttendance={balance?.attendancePercentage ?? user?.attendancePercentage ?? 0}
          onClose={() => setShowRedeem(false)}
          onSuccess={handleRedeemSuccess}
        />
      )}
    </div>
  );
};

export default Wallet;
