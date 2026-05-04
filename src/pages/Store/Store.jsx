import React, { useState, useEffect, useCallback } from 'react';
import { coinsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ShoppingBag, Lock, CheckCircle, Plus, BookOpen, Zap, BrainCircuit, Filter } from 'lucide-react';
import './Store.css';

// ── Add Material Modal (admin) ────────────────────────────────────────────────
const AddMaterialModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ title: '', description: '', subject: '', type: 'notes', fileUrl: '', content: '', coinCost: 50 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.coinCost) return toast.error('Title and cost are required');
    setLoading(true);
    try {
      await coinsAPI.addMaterial(form);
      toast.success('Material added to store!');
      onAdded(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Study Material</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Data Structures Notes" />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="notes">Notes</option>
                <option value="crash_pack">Crash Pack</option>
                <option value="ai_access">AI Access</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Coin Cost</label>
              <input type="number" className="form-input" value={form.coinCost} min={1} onChange={(e) => setForm(p => ({ ...p, coinCost: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="form-input" value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Computer Science" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What's included?" />
          </div>
          <div className="form-group">
            <label className="form-label">File URL (optional)</label>
            <input className="form-input" value={form.fileUrl} onChange={(e) => setForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="https://drive.google.com/..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Store Item Card ───────────────────────────────────────────────────────────
const StoreCard = ({ item, userBalance, onBuy }) => {
  const [buying, setBuying] = useState(false);
  const canAfford = userBalance >= item.coinCost;

  const typeConfig = {
    notes:      { icon: <BookOpen size={18} />,    color: 'accent',  label: 'Notes' },
    crash_pack: { icon: <Zap size={18} />,          color: 'gold',    label: 'Crash Pack' },
    ai_access:  { icon: <BrainCircuit size={18} />, color: 'green',   label: 'AI Access' },
    other:      { icon: <BookOpen size={18} />,    color: 'muted',   label: 'Material' },
  };
  const config = typeConfig[item.type] || typeConfig.other;

  const handleBuy = async () => {
    if (!canAfford) return toast.error(`You need ${item.coinCost - userBalance} more coins`);
    setBuying(true);
    try {
      await onBuy(item);
    } finally { setBuying(false); }
  };

  return (
    <div className={`store-card card ${item.isUnlocked ? 'store-card-owned' : ''}`}>
      <div className="store-card-header">
        <div className={`store-card-icon badge-${config.color}`} style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `var(--${config.color === 'accent' ? 'accent-glow' : config.color === 'gold' ? 'gold-dim' : config.color === 'green' ? 'green-dim' : 'bg-elevated'})`, color: `var(--${config.color === 'accent' ? 'accent-bright' : config.color})` }}>
          {config.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="store-card-title">{item.title}</h3>
          {item.subject && <span className="badge badge-muted" style={{ fontSize: 10 }}>{item.subject}</span>}
        </div>
        {item.isUnlocked && <CheckCircle size={18} color="var(--green)" />}
      </div>

      {item.description && (
        <p className="store-card-desc">{item.description}</p>
      )}

      <div className="store-card-footer">
        <div className="store-card-cost">
          {item.isUnlocked ? (
            <span className="badge badge-green">✓ Owned</span>
          ) : (
            <span className="coin-amount">{item.coinCost}</span>
          )}
        </div>
        {item.isUnlocked ? (
          item.fileUrl ? (
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              Open ↗
            </a>
          ) : (
            <span className="badge badge-muted" style={{ fontSize: 11 }}>No file attached</span>
          )
        ) : (
          <button
            className={`btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleBuy}
            disabled={buying}
          >
            {buying ? '…' : canAfford ? 'Unlock' : <><Lock size={12} /> Need {item.coinCost - userBalance} more</>}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Store Page ───────────────────────────────────────────────────────────
const Store = () => {
  const { user, isAdmin, refreshUser } = useAuth();
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [balance,    setBalance]    = useState(user?.coinBalance ?? 0);

  const loadStore = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await coinsAPI.getStore(typeFilter ? { type: typeFilter } : {});
      setItems(data.data.items);
      setBalance(data.data.userBalance);
    } catch (err) { toast.error('Failed to load store'); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { loadStore(); }, [loadStore]);

  const handleBuy = async (item) => {
    try {
      let res;
      if (item.type === 'crash_pack') res = await coinsAPI.unlockCrashPack(item._id);
      else res = await coinsAPI.unlockNotes(item._id);
      toast.success(`🎉 "${item.title}" unlocked!`);
      await refreshUser();
      loadStore();
    } catch (err) { toast.error(err.response?.data?.message || 'Purchase failed'); }
  };

  const types = ['', 'notes', 'crash_pack', 'ai_access', 'other'];
  const typeLabels = { '': 'All', notes: '📚 Notes', crash_pack: '⚡ Crash Packs', ai_access: '🤖 AI Access', other: 'Other' };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Store</h1>
          <p className="page-subtitle">Spend your coins on study materials and access</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="store-balance">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your balance</span>
            <span className="coin-amount" style={{ fontSize: 18 }}>{balance}</span>
          </div>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Material
            </button>
          )}
        </div>
      </div>

      {/* AI Access Banner */}
      <div className="store-ai-banner card" onClick={() => !user?.hasAIAccess && coinsAPI.unlockAI().then(() => { toast.success('AI access unlocked for 7 days!'); refreshUser(); }).catch((e) => toast.error(e.response?.data?.message || 'Failed'))}>
        <div className="store-ai-banner-icon"><BrainCircuit size={24} /></div>
        <div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>AI Micro-Learning Access</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Unlock 7 days of unlimited AI-powered learning for just <span className="coin-amount">80</span> coins
          </div>
        </div>
        {user?.hasAIAccess ? (
          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>✓ Active</span>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const { data } = await coinsAPI.unlockAI();
                toast.success(data.data.message);
                await refreshUser();
              } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
            }}
          >
            Unlock — 80 coins
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="store-filters">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {types.map((t) => (
          <button key={t} className={`events-filter-btn ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
            {typeLabels[t]}
          </button>
        ))}
        <span className="events-count">{items.length} items</span>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingBag size={40} /></div>
          <div className="empty-state-title">No items in store</div>
          <div className="empty-state-text">{isAdmin ? 'Add study materials above' : 'Check back later'}</div>
        </div>
      ) : (
        <div className="store-grid">
          {items.map((item) => (
            <StoreCard key={item._id} item={item} userBalance={balance} onBuy={handleBuy} />
          ))}
        </div>
      )}

      {showAdd && <AddMaterialModal onClose={() => setShowAdd(false)} onAdded={loadStore} />}
    </div>
  );
};

export default Store;
