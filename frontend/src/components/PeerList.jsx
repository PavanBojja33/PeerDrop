/**
 * PeerList – display-only component.
 * Shows all peers in the room with connection status.
 * File sending happens exclusively from DragDropUpload.
 */
import '../styles/dragdrop.css';

function shortId(id = '') { return id.slice(-6).toUpperCase(); }

function PeerCard({ peerId, state }) {
  const connected = state === 'connected';
  return (
    <div className={`pd-peer-card ${connected ? 'pd-connected' : ''}`}>
      <div className="pd-peer-avatar">
        👤
        <span
          className="pd-status-dot"
          style={{ background: connected ? '#22c55e' : '#f59e0b' }}
        />
      </div>
      <p className="pd-peer-label">Peer {shortId(peerId)}</p>
      <p className="pd-peer-status" style={{ color: connected ? '#818cf8' : '#f59e0b' }}>
        {connected ? 'Connected' : 'Connecting…'}
      </p>
    </div>
  );
}

export default function PeerList({ peers }) {
  const entries = Object.entries(peers);
  if (entries.length === 0) return null;

  const connectedCount = entries.filter(([, s]) => s === 'connected').length;

  return (
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
        👥 Peers ({connectedCount} connected)
      </p>
      <div className="pd-peer-grid">
        {entries.map(([id, state]) => (
          <PeerCard key={id} peerId={id} state={state} />
        ))}
      </div>
    </div>
  );
}
