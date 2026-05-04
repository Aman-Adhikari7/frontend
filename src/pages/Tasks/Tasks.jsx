import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import './Tasks.css';

// ── Create Task Modal (admin) ─────────────────────────────────────────────────
const CreateTaskModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', type: 'coding', coinsReward: 50, deadline: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.coinsReward) return toast.error('Fill required fields');
    setLoading(true);
    try {
      await tasksAPI.create({ ...form, deadline: form.deadline || null });
      toast.success('Task created!');
      onCreated(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Build a REST API" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What should students build or do?" />
          </div>
          <div className="grid-3" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                {['coding', 'project', 'assignment', 'quiz', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reward (coins)</label>
              <input type="number" className="form-input" value={form.coinsReward} min={1} onChange={(e) => setForm(p => ({ ...p, coinsReward: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="datetime-local" className="form-input" value={form.deadline} onChange={(e) => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Submit Task Modal (student) ───────────────────────────────────────────────
const SubmitModal = ({ task, onClose, onSubmitted }) => {
  const [form, setForm] = useState({ link: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await tasksAPI.submit(task._id, form);
      toast.success(`Submitted! Awaiting review. 🎯`);
      onSubmitted(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Submit Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="submit-task-info">
            <div style={{ fontWeight: 700 }}>{task.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              You'll earn <span className="coin-amount">{task.coinsReward}</span> coins on approval
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Submission Link (GitHub, Drive, etc.)</label>
            <input className="form-input" value={form.link} onChange={(e) => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://github.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes for the reviewer…" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Review Modal (admin) ──────────────────────────────────────────────────────
const ReviewModal = ({ task, submission, onClose, onReviewed }) => {
  const [feedback, setFeedback] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleReview = async (status) => {
    setLoading(true);
    try {
      await tasksAPI.review(task._id, submission._id, { status, feedback });
      toast.success(`Submission ${status}!`);
      onReviewed(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Review failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Review Submission</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="submit-task-info">
            <div style={{ fontWeight: 700 }}>{submission.user?.name || 'Student'}</div>
            {submission.link && (
              <a href={submission.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
                View submission ↗
              </a>
            )}
            {submission.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{submission.notes}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Feedback (optional)</label>
            <textarea className="form-input" rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Great work! / Needs improvement in…" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-danger" onClick={() => handleReview('rejected')} disabled={loading}>
              <XCircle size={14} /> Reject
            </button>
            <button className="btn btn-primary" onClick={() => handleReview('approved')} disabled={loading}>
              <CheckCircle size={14} /> Approve + Award {task.coinsReward} coins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, isAdmin, onRefresh }) => {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewSub,  setReviewSub]  = useState(null);
  const [expanded,   setExpanded]   = useState(false);

  const typeColors = { coding: 'accent', project: 'green', assignment: 'blue', quiz: 'gold', other: 'muted' };
  const color = typeColors[task.type] || 'muted';
  const isPastDeadline = task.deadline && new Date() > new Date(task.deadline);
  const mySubmission = task.mySubmission;
  const pendingSubmissions = isAdmin ? (task.submissions || []).filter(s => s.status === 'pending') : [];

  return (
    <>
      <div className={`task-card card ${isPastDeadline && !mySubmission ? 'task-card-expired' : ''}`}>
        <div className="task-card-header">
          <div>
            <div className="flex" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className={`badge badge-${color}`}>{task.type}</span>
              {isPastDeadline && <span className="badge badge-red">Expired</span>}
              {mySubmission && (
                <span className={`badge badge-${mySubmission.status === 'approved' ? 'green' : mySubmission.status === 'rejected' ? 'red' : 'muted'}`}>
                  {mySubmission.status === 'approved' ? '✓ Approved' : mySubmission.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                </span>
              )}
              {isAdmin && pendingSubmissions.length > 0 && (
                <span className="badge badge-gold">{pendingSubmissions.length} pending review</span>
              )}
            </div>
            <h3 className="task-title">{task.title}</h3>
          </div>
          <div className="task-reward">
            <span className="coin-amount" style={{ fontSize: 18 }}>{task.coinsReward}</span>
          </div>
        </div>

        {task.deadline && (
          <div className="task-deadline">
            <Clock size={12} />
            <span>Due: {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {expanded && (
          <p className="task-desc animate-fade-in">{task.description}</p>
        )}

        <div className="task-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(v => !v)}>
            <Eye size={13} /> {expanded ? 'Less' : 'Details'}
          </button>
          {!isAdmin && !mySubmission && !isPastDeadline && (
            <button className="btn btn-primary btn-sm" onClick={() => setSubmitOpen(true)}>
              Submit Task
            </button>
          )}
          {mySubmission?.link && (
            <a href={mySubmission.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              Your submission ↗
            </a>
          )}
          {isAdmin && pendingSubmissions.length > 0 && (
            <button className="btn btn-gold btn-sm" onClick={() => setReviewSub(pendingSubmissions[0])}>
              Review ({pendingSubmissions.length})
            </button>
          )}
        </div>
      </div>

      {submitOpen && <SubmitModal task={task} onClose={() => setSubmitOpen(false)} onSubmitted={onRefresh} />}
      {reviewSub  && <ReviewModal task={task} submission={reviewSub} onClose={() => setReviewSub(null)} onReviewed={onRefresh} />}
    </>
  );
};

// ── Main Tasks Page ───────────────────────────────────────────────────────────
const Tasks = () => {
  const { isAdmin } = useAuth();
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { active: true, ...(typeFilter && { type: typeFilter }) };
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.data.tasks);
    } catch (err) { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const types = ['', 'coding', 'project', 'assignment', 'quiz', 'other'];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Complete tasks to earn coins</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Create Task
          </button>
        )}
      </div>

      <div className="events-filters">
        {types.map(t => (
          <button key={t} className={`events-filter-btn ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
            {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
          </button>
        ))}
        <span className="events-count">{tasks.length} tasks</span>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ClipboardList size={40} /></div>
          <div className="empty-state-title">No tasks yet</div>
          <div className="empty-state-text">{isAdmin ? 'Create your first task above' : 'Check back soon'}</div>
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map(task => <TaskCard key={task._id} task={task} isAdmin={isAdmin} onRefresh={loadTasks} />)}
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={loadTasks} />}
    </div>
  );
};

export default Tasks;
