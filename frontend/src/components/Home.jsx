import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomID } from '../utils/generateRoomID';
import QRScanner from './QRScanner';
import toast from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();
  const [joinID,      setJoinID]      = useState('');
  const [newRoomID,   setNewRoomID]   = useState('');
  const [copied,      setCopied]      = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [tab,         setTab]         = useState('join'); // 'join' | 'create'

  const handleCreate = () => {
    const id = generateRoomID();
    setNewRoomID(id);
    setTab('create');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const id = joinID.trim().toUpperCase();
    if (!id) { toast.error('Enter a room ID'); return; }
    navigate(`/room/${id}`);
  };

  const handleEnterCreated = () => {
    if (!newRoomID) { toast.error('Generate a room first'); return; }
    navigate(`/room/${newRoomID}`);
  };

  const copyID = useCallback(() => {
    navigator.clipboard.writeText(newRoomID).then(() => {
      setCopied(true);
      toast.success('Room ID copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [newRoomID]);

  const handleScanResult = (roomID) => {
    setShowScanner(false);
    if (roomID) navigate(`/room/${roomID}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', paddingTop: 80 }}>
      {showScanner && <QRScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 16px' }}>

        {/* ── Hero ──────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              ⚡
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, color: '#f1f5f9' }}>PeerDrop</span>
          </div>
          <h1 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
            Share files directly<br />
            <span style={{ color: '#818cf8' }}>browser to browser</span>
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            No uploads. No cloud. Files transfer directly between browsers using WebRTC.
          </p>
        </div>

        {/* ── Tab Card ──────────────────────────────────── */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['join', 'create'].map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => { setTab(t); if (t === 'create' && !newRoomID) handleCreate(); }}
                style={{
                  flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 14,
                  background: tab === t ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: tab === t ? '#818cf8' : '#64748b',
                  borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'join' ? 'Join Room' : '+ Create Room'}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* ── Join tab ────────────────────────────────── */}
            {tab === 'join' && (
              <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={labelStyle}>Room ID</label>
                <input
                  id="join-room-input"
                  value={joinID}
                  onChange={(e) => setJoinID(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCD-1234"
                  maxLength={9}
                  style={inputStyle}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button id="join-room-btn" type="submit" style={primaryBtn}>
                  Join Room →
                </button>
                <div style={{ textAlign: 'center', margin: '4px 0' }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>or</span>
                </div>
                <button
                  type="button"
                  id="scan-qr-btn"
                  onClick={() => setShowScanner(true)}
                  style={secondaryBtn}
                >
                  📷  Scan QR Code
                </button>
              </form>
            )}

            {/* ── Create tab ──────────────────────────────── */}
            {tab === 'create' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={labelStyle}>Your Room ID</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ ...inputStyle, flex: 1, color: '#818cf8', fontWeight: 700, letterSpacing: 3, fontSize: 18, textAlign: 'center', userSelect: 'all' }}>
                    {newRoomID || '—'}
                  </div>
                  <button id="copy-room-id-btn" onClick={copyID} style={{ ...secondaryBtn, width: 'auto', padding: '0 14px' }}>
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
                <button id="enter-room-btn" onClick={handleEnterCreated} style={primaryBtn}>
                  Enter Room →
                </button>
                <button id="new-room-btn" onClick={handleCreate} style={secondaryBtn}>
                  Generate new ID
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ── Features strip ────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
          {[
            { icon: '🔒', label: 'E2E Encrypted' },
            { icon: '🚀', label: 'No Size Limit' },
            { icon: '📡', label: 'Zero Server Storage' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
              <span>{icon}</span> {label}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────
const labelStyle = { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

const inputStyle = {
  background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '12px 14px', color: '#f1f5f9',
  fontSize: 14, fontFamily: 'monospace', outline: 'none',
  transition: 'border-color 0.15s',
};

const primaryBtn = {
  padding: '12px', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
  transition: 'opacity 0.15s',
};

const secondaryBtn = {
  padding: '11px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8',
  transition: 'background 0.15s',
};
