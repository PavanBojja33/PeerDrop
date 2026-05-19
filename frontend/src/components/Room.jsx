import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import usePeerConnection from '../hooks/usePeerConnection';
import DragDropUpload  from './DragDropUpload';
import PeerList        from './PeerList';
import UploadProgress  from './UploadProgress';
import QRCodeShare     from './QRCodeShare';
import { formatBytes, formatSpeed } from '../utils/formatBytes';

function shortId(id = '') { return id.slice(-6).toUpperCase(); }

function fileEmoji(type = '') {
  if (type.startsWith('image')) return '🖼️';
  if (type.startsWith('video')) return '🎬';
  if (type.startsWith('audio')) return '🎵';
  if (type.includes('pdf'))    return '📄';
  if (type.match(/zip|rar|7z|tar|gz/)) return '🗜️';
  return '📁';
}

export default function Room() {
  const { roomID } = useParams();
  const navigate   = useNavigate();
  const shareUrl   = `${window.location.origin}/room/${roomID}`;

  const [copied, setCopied] = useState(false);
  const prevCount = useRef(0);

  const {
    peers, activeTransfers,
    sentFiles, receivedFiles,
    sendFilesToPeer, cancelTransfer,
  } = usePeerConnection(roomID);

  const connectedPeers = Object.entries(peers).filter(([, s]) => s === 'connected');

  /* ── toast on peer join/leave ────────────────────────────────── */
  useEffect(() => {
    const n = connectedPeers.length;
    if (n > prevCount.current) {
      const newId = connectedPeers[n - 1]?.[0] ?? '';
      toast.success(`Peer ${shortId(newId)} joined!`);
    } else if (n < prevCount.current) {
      toast('A peer left the room.', { icon: '⚠️' });
    }
    prevCount.current = n;
  }, [connectedPeers.length]);  // eslint-disable-line

  const copyID = useCallback(() => {
    navigator.clipboard.writeText(roomID).then(() => {
      setCopied(true);
      toast.success('Room ID copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomID]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', paddingTop: 72, paddingBottom: 60 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={ghostBtn}>← Back</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Transfer Room</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>Mesh P2P · peers connect directly to each other</p>
          </div>
        </div>

        {/* ── Room info card ───────────────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={hint}>Room ID</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#818cf8', letterSpacing: 4 }}>
                  {roomID}
                </span>
                <button id="copy-room-btn" onClick={copyID} style={ghostBtn}>
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
                <QRCodeShare roomID={roomID} shareUrl={shareUrl} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              {Object.keys(peers).length === 0
                ? 'Waiting for peers…'
                : `${connectedPeers.length} / ${Object.keys(peers).length} connected`}
            </p>
          </div>
          {Object.keys(peers).length === 0 && (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: '#334155' }}>
              ℹ️ Share the Room ID or QR code to invite others.
            </p>
          )}
        </div>

        {/* ── Peer list ────────────────────────────────────────────── */}
        {Object.keys(peers).length > 0 && (
          <div style={card}>
            <PeerList peers={peers} />
          </div>
        )}

        {/* ── Drag-drop upload ─────────────────────────────────────── */}
        <div style={card}>
          <p style={sectionLabel}>📤 Send Files</p>
          <DragDropUpload
            peers={peers}
            sendFilesToPeer={sendFilesToPeer}
          />
        </div>

        {/* ── Active transfers ─────────────────────────────────────── */}
        {Object.keys(activeTransfers).length > 0 && (
          <div style={card}>
            <UploadProgress
              transfers={activeTransfers}
              cancelTransfer={cancelTransfer}
            />
          </div>
        )}

        {/* ── History: sent + received ─────────────────────────────── */}
        {(sentFiles.length > 0 || receivedFiles.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Sent */}
            <div style={card}>
              <p style={sectionLabel}>📤 Sent ({sentFiles.length})</p>
              {sentFiles.length === 0
                ? <p style={emptyTxt}>Nothing sent yet.</p>
                : sentFiles.map((f) => (
                  <div key={f.fileId} style={historyRow}>
                    <span style={{ fontSize: 18 }}>{fileEmoji(f.fileType)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={fileName}>{f.fileName}</p>
                      <p style={fileMeta}>{formatBytes(f.fileSize)} · Peer {shortId(f.peerId)} · {f.sentAt}</p>
                    </div>
                    <span style={{ fontSize: 11, color: '#22c55e', flexShrink: 0 }}>✓</span>
                  </div>
                ))
              }
            </div>

            {/* Received */}
            <div style={card}>
              <p style={sectionLabel}>📥 Received ({receivedFiles.length})</p>
              {receivedFiles.length === 0
                ? <p style={emptyTxt}>Nothing received yet.</p>
                : receivedFiles.map((f) => (
                  <div key={f.fileId} style={historyRow}>
                    <span style={{ fontSize: 18 }}>{fileEmoji(f.fileType)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={fileName}>{f.fileName}</p>
                      <p style={fileMeta}>{formatBytes(f.fileSize)} · {formatSpeed(f.speed)} · Peer {shortId(f.fromPeer)}</p>
                    </div>
                    <a href={f.url} download={f.fileName} style={dlBtn} title="Save">↓</a>
                  </div>
                ))
              }
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────────────── */
const card        = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 };
const hint        = { margin: '0 0 4px', fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 };
const sectionLabel = { margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' };
const emptyTxt    = { fontSize: 13, color: '#475569', margin: 0 };
const ghostBtn    = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' };
const historyRow  = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const fileName    = { margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const fileMeta    = { margin: '2px 0 0', fontSize: 11, color: '#475569' };
const dlBtn       = { display: 'inline-block', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', fontSize: 14, textDecoration: 'none', flexShrink: 0 };
