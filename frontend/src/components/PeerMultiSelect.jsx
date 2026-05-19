/**
 * PeerMultiSelect – checkbox-style peer recipient selector.
 *
 * Props:
 *   peers          { [socketID]: 'connecting' | 'connected' }
 *   selectedPeers  string[]   – socket IDs currently selected
 *   onChange       (ids: string[]) => void
 */
import '../styles/dragdrop.css';

function shortId(id = '') { return id.slice(-6).toUpperCase(); }

export default function PeerMultiSelect({ peers, selectedPeers, onChange }) {
  const connected = Object.entries(peers).filter(([, s]) => s === 'connected');
  if (connected.length === 0) return null;

  const allSelected = connected.every(([id]) => selectedPeers.includes(id));

  const toggle = (id) => {
    if (selectedPeers.includes(id)) {
      onChange(selectedPeers.filter((p) => p !== id));
    } else {
      onChange([...selectedPeers, id]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(connected.map(([id]) => id));
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Recipients
        </span>
        <button
          onClick={toggleAll}
          style={selectAllBtn}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Peer checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {connected.map(([id]) => {
          const checked = selectedPeers.includes(id);
          return (
            <label
              key={id}
              htmlFor={`peer-check-${id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: checked ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${checked ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`,
                transition: 'background 0.15s, border-color 0.15s',
                userSelect: 'none',
              }}
            >
              {/* Custom checkbox */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `2px solid ${checked ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                  background: checked ? '#6366f1' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {checked && (
                  <span style={{ color: '#fff', fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>
                )}
              </div>

              {/* Hidden native checkbox for accessibility */}
              <input
                id={`peer-check-${id}`}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(id)}
                style={{ display: 'none' }}
              />

              {/* Peer info */}
              <span style={{ fontSize: 14, lineHeight: 1 }}>👤</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: 'monospace' }}>
                  Peer {shortId(id)}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#22c55e' }}>● online</span>
            </label>
          );
        })}
      </div>

      {/* Selection count */}
      {selectedPeers.length > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', textAlign: 'right' }}>
          {selectedPeers.length} of {connected.length} peer{connected.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

const selectAllBtn = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#64748b',
  fontSize: 12,
  padding: '3px 10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'color 0.15s, border-color 0.15s',
};
