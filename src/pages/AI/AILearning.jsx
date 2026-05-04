import React, { useState, useEffect } from 'react';
import { aiAPI, coinsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BrainCircuit, Send, CheckCircle, Circle, Zap, Lock } from 'lucide-react';
import './AILearning.css';

// ── Quiz component ────────────────────────────────────────────────────────────
const Quiz = ({ questions }) => {
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (qi, oi) => {
    if (submitted) return;
    setAnswers((p) => ({ ...p, [qi]: oi }));
  };

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <div className="ai-quiz">
      <h4 className="ai-quiz-title">🧠 Quick Quiz</h4>
      {questions.map((q, qi) => (
        <div key={qi} className="ai-question">
          <p className="ai-question-text">{qi + 1}. {q.question}</p>
          <div className="ai-options">
            {q.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi;
              const isCorrect  = q.answer === oi;
              let cls = 'ai-option';
              if (submitted) {
                if (isCorrect)                cls += ' ai-option-correct';
                else if (isSelected && !isCorrect) cls += ' ai-option-wrong';
              } else if (isSelected)          cls += ' ai-option-selected';

              return (
                <button key={oi} className={cls} onClick={() => handleAnswer(qi, oi)}>
                  {submitted
                    ? (isCorrect
                      ? <CheckCircle size={14} color="var(--green)" />
                      : <Circle size={14} color="var(--text-muted)" />)
                    : <Circle size={14} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
                  }
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
        >
          Submit Answers
        </button>
      ) : (
        <div className={`ai-quiz-result ${score === questions.length ? 'perfect' : ''}`}>
          {score === questions.length ? '🎉' : '📊'} {score}/{questions.length} correct
          {score === questions.length && ' — Perfect score!'}
        </div>
      )}
    </div>
  );
};

// ── Learning Card ─────────────────────────────────────────────────────────────
const LearningCard = ({ content }) => (
  <div className="ai-result animate-fade-in">
    {/* Header */}
    <div className="ai-result-header">
      <div className="ai-result-badges">
        <span className="badge badge-accent">{content.difficulty}</span>
        <span className="badge badge-muted">⏱ {content.estimatedReadTime}</span>
      </div>
      <h2 className="ai-result-title">{content.title}</h2>
      <p className="ai-result-summary">{content.summary}</p>
    </div>

    {/* Key points */}
    <div className="ai-section card">
      <h4 className="ai-section-title">📌 Key Points</h4>
      <ul className="ai-key-points">
        {content.keyPoints?.map((pt, i) => (
          <li key={i} className="ai-key-point">
            <span className="ai-key-point-num">{i + 1}</span>
            {pt}
          </li>
        ))}
      </ul>
    </div>

    {/* Real world example */}
    <div className="ai-section card ai-example-card">
      <h4 className="ai-section-title">🌍 Real-World Example</h4>
      <p className="ai-example-text">{content.realWorldExample}</p>
    </div>

    {/* Quiz */}
    {content.questions?.length > 0 && (
      <div className="ai-section card">
        <Quiz questions={content.questions} />
      </div>
    )}

    {/* Recommended video */}
    {content.recommendedVideo && (
      <div className="ai-section card ai-video-card">
        <h4 className="ai-section-title">
          🎬 Recommended Video
        </h4>
        <p className="ai-video-title">{content.recommendedVideo.title}</p>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(content.recommendedVideo.searchQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 8 }}
        >
          Search on YouTube ↗
        </a>
      </div>
    )}

    {/* Motivational line */}
    {content.motivationalLine && (
      <div className="ai-motivational">
        <Zap size={16} color="var(--gold)" />
        <em>{content.motivationalLine}</em>
      </div>
    )}
  </div>
);

// ── Main AI Learning Page ─────────────────────────────────────────────────────
const AILearning = () => {
  const { user, refreshUser } = useAuth();
  const [topic,      setTopic]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [aiStatus,   setAiStatus]   = useState(null);
  const [statusLoad, setStatusLoad] = useState(true);

  useEffect(() => {
    aiAPI.getAccessStatus()
      .then(({ data }) => setAiStatus(data.data))
      .catch(() => {})
      .finally(() => setStatusLoad(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error('Enter a topic first');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiAPI.getMicroLearning(topic.trim());
      setResult(data.data.content);
      if (!data.data.usedSubscription) {
        await refreshUser();
        toast.success(`-${data.data.coinsUsed} coins used. New balance: ${data.data.newBalance}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Binary Search Trees', 'REST vs GraphQL', 'SQL Joins',
    'Big O Notation', 'React Hooks', 'Machine Learning basics',
    'Recursion', 'Design Patterns', 'HTTP vs HTTPS',
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">AI Micro-Learning</h1>
        <p className="page-subtitle">Enter any topic and get a full learning module instantly</p>
      </div>

      {/* Access status */}
      {!statusLoad && aiStatus && (
        <div className={`ai-access-banner card ${aiStatus.hasSubscription ? 'ai-access-active' : 'ai-access-pay'}`}>
          <BrainCircuit size={20} />
          <div style={{ flex: 1 }}>
            {aiStatus.hasSubscription ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  ✓ Subscription active — {aiStatus.daysRemaining} day{aiStatus.daysRemaining !== 1 ? 's' : ''} remaining
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Unlimited AI learning until {new Date(aiStatus.aiAccessExpiry).toLocaleDateString()}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Pay-per-use mode</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Each query costs <span className="coin-amount">5</span> coins. You have{' '}
                  <span className="coin-amount">{user?.coinBalance ?? 0}</span>.{' '}
                  Unlock 7-day subscription for <span className="coin-amount">80</span> coins.
                </div>
              </>
            )}
          </div>
          {!aiStatus.hasSubscription && user?.coinBalance >= 80 && (
            <button className="btn btn-primary btn-sm"
              onClick={async () => {
                try {
                  const { data } = await coinsAPI.unlockAI();
                  toast.success(data.data.message);
                  await refreshUser();
                  const { data: s } = await aiAPI.getAccessStatus();
                  setAiStatus(s.data);
                } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
              }}
            >
              Unlock — 80 coins
            </button>
          )}
        </div>
      )}

      {/* Search form */}
      <div className="card ai-search-card">
        <form onSubmit={handleSubmit} className="ai-search-form">
          <div className="ai-search-wrap">
            <BrainCircuit size={18} className="ai-search-icon" />
            <input
              className="form-input ai-search-input"
              placeholder="What do you want to learn? e.g. Binary Search Trees"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !topic.trim()}>
              {loading
                ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Generating…</>
                : <><Send size={14} /> Learn</>}
            </button>
          </div>
        </form>

        {/* Suggestions */}
        {!result && !loading && (
          <div className="ai-suggestions">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                className="ai-suggestion-chip"
                onClick={() => setTopic(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="ai-loading card animate-fade-in">
          <div className="ai-loading-animation">
            <div className="ai-loading-ring" />
            <BrainCircuit size={28} color="var(--accent)" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            Building your learning module…
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Generating key points, quiz questions, and a real-world example for <strong>"{topic}"</strong>
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && <LearningCard content={result} />}
    </div>
  );
};

export default AILearning;
