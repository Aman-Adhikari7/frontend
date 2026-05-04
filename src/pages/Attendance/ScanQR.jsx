import React, { useState, useEffect, useRef } from 'react';
import { attendanceAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle, XCircle, Camera, Type } from 'lucide-react';
import './ScanQR.css';

// ── Manual token entry fallback ───────────────────────────────────────────────
const ManualEntry = ({ onScan }) => {
  const [token, setToken] = useState('');
  return (
    <div className="scan-manual">
      <Type size={16} style={{ color: 'var(--text-muted)' }} />
      <input
        className="form-input"
        placeholder="Paste QR token manually…"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ flex: 1 }}
      />
      <button
        className="btn btn-primary btn-sm"
        disabled={!token.trim()}
        onClick={() => { onScan(token.trim()); setToken(''); }}
      >
        Submit
      </button>
    </div>
  );
};

const ScanQR = () => {
  const { refreshUser } = useAuth();
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const [mode,       setMode]       = useState('camera'); // 'camera' | 'manual'
  const [scanning,   setScanning]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null); // { success, data }
  const [cameraErr,  setCameraErr]  = useState('');

  // ── Start camera ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'camera') return;
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setCameraErr(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Use manual entry below.'
            : 'Camera not available. Use manual entry below.'
        );
        setMode('manual');
      }
    };

    startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  // ── QR scanning loop using jsQR ─────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'camera' || scanning || result) return;

    let animFrame;
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4) {
        animFrame = requestAnimationFrame(tick);
        return;
      }

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Dynamically import jsQR to keep initial bundle small
        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setScanning(true);
          try {
            const parsed   = JSON.parse(code.data);
            const qrToken  = parsed.qrToken || code.data;
            await handleScan(qrToken);
          } catch {
            await handleScan(code.data);
          }
          return;
        }
      } catch (e) { /* keep scanning */ }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scanning, result]);

  // ── Submit scan ──────────────────────────────────────────────────────────────
  const handleScan = async (qrToken) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data } = await attendanceAPI.scan(qrToken);
      setResult({ success: true, data: data.data });
      await refreshUser();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Scan failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setScanning(false);
    setSubmitting(false);
    setMode('camera');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Scan QR</h1>
        <p className="page-subtitle">Scan the event QR code to mark attendance and earn coins</p>
      </div>

      <div className="scan-wrapper">

        {/* Result screen */}
        {result ? (
          <div className={`scan-result card animate-fade-in ${result.success ? 'scan-result-success' : 'scan-result-error'}`}>
            <div className="scan-result-icon">
              {result.success
                ? <CheckCircle size={56} color="var(--green)" />
                : <XCircle    size={56} color="var(--red)" />}
            </div>
            <h2 className="scan-result-title">
              {result.success ? '🎉 Attendance Marked!' : '❌ Scan Failed'}
            </h2>
            {result.success ? (
              <div className="scan-result-details">
                <div className="scan-result-event">{result.data.event?.title}</div>
                <div className="scan-reward">
                  <span>You earned</span>
                  <span className="coin-amount" style={{ fontSize: 24 }}>
                    {result.data.coinsEarned}
                  </span>
                  <span>coins!</span>
                </div>
                <div className="scan-new-balance">
                  New balance: <span className="coin-amount">{result.data.newBalance}</span>
                </div>
                {!result.data.wasRegistered && (
                  <div className="badge badge-gold" style={{ marginTop: 8 }}>
                    💡 Register for events early to earn bonus coins next time!
                  </div>
                )}
              </div>
            ) : (
              <p className="scan-result-error-msg">{result.message}</p>
            )}
            <button className="btn btn-primary btn-lg" onClick={handleReset} style={{ marginTop: 24 }}>
              {result.success ? '✓ Done' : '↩ Try Again'}
            </button>
          </div>
        ) : (
          <div className="scan-camera-area card">
            {/* Mode toggle */}
            <div className="scan-mode-toggle">
              <button
                className={`scan-mode-btn ${mode === 'camera' ? 'active' : ''}`}
                onClick={() => setMode('camera')}
              >
                <Camera size={14} /> Camera
              </button>
              <button
                className={`scan-mode-btn ${mode === 'manual' ? 'active' : ''}`}
                onClick={() => setMode('manual')}
              >
                <Type size={14} /> Manual
              </button>
            </div>

            {mode === 'camera' ? (
              <div className="scan-video-wrap">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="scan-video"
                />
                {/* Scanning overlay */}
                <div className="scan-overlay">
                  <div className="scan-frame">
                    <span className="scan-corner scan-corner-tl" />
                    <span className="scan-corner scan-corner-tr" />
                    <span className="scan-corner scan-corner-bl" />
                    <span className="scan-corner scan-corner-br" />
                    {(scanning || submitting) && (
                      <div className="scan-laser" />
                    )}
                  </div>
                </div>
                {cameraErr && (
                  <div className="scan-camera-err">{cameraErr}</div>
                )}
                <p className="scan-hint">
                  {submitting ? '⏳ Processing…' : 'Point camera at the QR code'}
                </p>
              </div>
            ) : (
              <div className="scan-manual-area">
                <div className="scan-manual-icon">
                  <QrCode size={48} color="var(--accent)" />
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16, textAlign: 'center', fontSize: 14 }}>
                  Enter the QR token provided by your admin
                </p>
                <ManualEntry onScan={handleScan} />
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        {!result && (
          <div className="card scan-info-card">
            <h3 style={{ marginBottom: 14, fontSize: 15, fontFamily: 'var(--font-display)' }}>
              How it works
            </h3>
            <div className="scan-steps">
              {[
                { emoji: '📋', text: 'Register for the event beforehand to be eligible for early-bird bonus' },
                { emoji: '📍', text: 'Go to the event venue and locate the QR code on screen' },
                { emoji: '📱', text: 'Tap Scan QR and point your camera at it' },
                { emoji: '🪙', text: 'Your attendance is instantly marked and coins are credited' },
              ].map((s, i) => (
                <div key={i} className="scan-step">
                  <span className="scan-step-emoji">{s.emoji}</span>
                  <span className="scan-step-text">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQR;
