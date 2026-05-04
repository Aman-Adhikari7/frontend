import React, { useState, useEffect, useCallback } from 'react';
import { pollsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart3, Plus, CheckCircle } from 'lucide-react';
import './Polls.css';

// ── Create Poll Modal (admin) ─────────────────────────────────────────────────
const CreatePollModal = ({ onClose, onCreated }) => {
  const [question, setQuestion] = useState('');
  const [options,  setOptions]  = useState(['', '']);
  const [loading,  setLoading]  = useState(false);

  const addOption    = () => options.length < 6 && setOptions(p => [...p, '']);
  const removeOption = (i) => options.length > 2 && setOptions(p => p.filter((_, idx) => idx !== i));
  const updateOption = (i, v) => setOptions(p => p.map((o, idx) => idx === i ? v : o));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = options.filter(o => o.trim());
    if (!question.trim()) return toast.error('Question is required');
    if (filled.length < 2) return toast.error('At least 2 options required');
    setLoading(true);
    try {
      await pollsAPI.create({ question, options: filled });
      toast.success('Poll created!');
      onCreated(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Poll</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Question</label>
            <input className="form-input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What do you think about…?" />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} style={{ flex: 1 }} />
                  {options.length > 2 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOption(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={addOption}>
                + Add Option
              </button>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Poll Card ─────────────────────────────────────────────────────────────────
const PollCard = ({ poll, isAdmin, onRefresh }) => {
  const [voting,   setVoting]   = useState(false);
  const [results,  setResults]  = useState(null);
  const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);

  const handleVote = async (index) => {
    if (poll.hasVoted) return;
    setVoting(true);
    try {
      const { data } = await pollsAPI.vote(poll._id, index);
      toast.success('Vote recorded! 🗳️');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Vote failed'); }
    finally { setVoting(false); }
  };

  const loadResults = async () => {
    try {
      const { data } = await pollsAPI.getResults(poll._id);
      setResults(data.data);
    } catch (err) { toast.error('Could not load results'); }
  };

  return (
    <div className={`poll-card card ${!poll.isActive ? 'poll-card-closed' : ''}`}>
      <div className="poll-card-header">
        <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
          <span className={`badge ${poll.isActive ? 'badge-green' : 'badge-muted'}`}>
            {poll.isActive ? 'Open' : 'Closed'}
          </span>
          <span className="badge badge-muted">🔒 Anonymous</span>
          <span className="badge badge-muted">{totalVotes} votes</span>
        </div>
        <h3 className="poll-question">{poll.question}</h3>
      </div>

      <div className="poll-options">
        {poll.options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
          const canVote = poll.isActive && !poll.hasVoted;

          return (
            <button
              key={i}
              className={`poll-option ${poll.hasVoted ? 'poll-option-voted' : 'poll-option-active'}`}
              onClick={() => canVote && handleVote(i)}
              disabled={!canVote || voting}
            >
              <div className="poll-option-bar" style={{ width: poll.hasVoted ? `${pct}%` : '0%' }} />
              <div className="poll-option-content">
                <span className="poll-option-text">{opt.text}</span>
                {poll.hasVoted && (
                  <span className="poll-option-pct">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {poll.hasVoted && (
        <div className="poll-voted-badge">
          <CheckCircle size={13} color="var(--green)" /> You've voted
        </div>
      )}

      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadResults}>
            📊 Full Results
          </button>
          <button className="btn btn-ghost btn-sm" onClick={async () => {
            await pollsAPI.toggle(poll._id);
            toast.success(`Poll ${poll.isActive ? 'closed' : 'opened'}`);
            onRefresh();
          }}>
            {poll.isActive ? 'Close Poll' : 'Reopen Poll'}
          </button>
        </div>
      )}

      {/* Admin results panel */}
      {results && (
        <div className="poll-results animate-fade-in">
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 13, marginBottom: 10 }}>
            Full Results — {results.totalVotes} total votes
          </h4>
          {results.results.map((r) => (
            <div key={r.index} className="poll-result-row">
              <span className="poll-result-text">{r.text}</span>
              <div className="poll-result-bar-wrap">
                <div className="poll-result-bar" style={{ width: `${r.percentage}%` }} />
              </div>
              <span className="poll-result-pct">{r.percentage}%</span>
              <span className="poll-result-count">({r.voteCount})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Polls Page ───────────────────────────────────────────────────────────
const Polls = () => {
  const { isAdmin } = useAuth();
  const [polls,      setPolls]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter,     setFilter]     = useState('active');

  const loadPolls = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await pollsAPI.getAll(filter === 'active' ? { active: true } : {});
      setPolls(data.data.polls);
    } catch (err) { toast.error('Failed to load polls'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadPolls(); }, [loadPolls]);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Polls</h1>
          <p className="page-subtitle">Anonymous polls — your identity is never revealed</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Create Poll
          </button>
        )}
      </div>

      <div className="events-filters" style={{ marginBottom: 24 }}>
        {['active', 'all'].map(f => (
          <button key={f} className={`events-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'active' ? '🟢 Active' : 'All Polls'}
          </button>
        ))}
        <span className="events-count">{polls.length} polls</span>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : polls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BarChart3 size={40} /></div>
          <div className="empty-state-title">No polls yet</div>
          <div className="empty-state-text">{isAdmin ? 'Create your first poll above' : 'No active polls right now'}</div>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map(poll => <PollCard key={poll._id} poll={poll} isAdmin={isAdmin} onRefresh={loadPolls} />)}
        </div>
      )}

      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} onCreated={loadPolls} />}
    </div>
  );
};

export default Polls;
