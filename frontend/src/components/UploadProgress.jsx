import '../styles/dragdrop.css';
import { formatBytes, formatSpeed, formatETA } from '../utils/formatBytes';

function shortId(id = '') { return id.slice(-6).toUpperCase(); }

function fileEmoji(type = '') {
  if (type.startsWith('image')) return '🖼️';
  if (type.startsWith('video')) return '🎬';
  if (type.startsWith('audio')) return '🎵';
  if (type.includes('pdf'))    return '📄';
  if (type.match(/zip|rar|7z|tar|gz/)) return '🗜️';
  return '📁';
}

export default function UploadProgress({ transfers, cancelTransfer }) {
  const entries = Object.entries(transfers);
  if (entries.length === 0) return null;

  return (
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
        ⚡ Active Transfers ({entries.length})
      </p>
      {entries.map(([fileId, t]) => {
        const isSend = t.direction === 'send';
        return (
          <div key={fileId} className={`pd-progress-item ${isSend ? 'pd-send' : 'pd-receive'}`}>
            <div className="pd-progress-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="pd-progress-filename">
                  {isSend ? '↑' : '↓'} {fileEmoji(t.fileType)} {t.fileName}
                </p>
                <p className="pd-progress-meta">
                  {isSend ? `→ Peer ${shortId(t.peerId)}` : `← Peer ${shortId(t.peerId)}`}
                  {' · '}{formatBytes(t.fileSize)}
                </p>
              </div>
              {isSend && (
                <button className="pd-cancel-btn" onClick={() => cancelTransfer(fileId)}>
                  Cancel
                </button>
              )}
            </div>

            <div className="pd-progress-bar-bg">
              <div
                className={`pd-progress-bar-fill ${isSend ? 'pd-send' : 'pd-receive'}`}
                style={{ width: `${Math.min(100, Math.max(0, t.progress || 0))}%` }}
              />
            </div>

            <div className="pd-progress-footer">
              <span>{formatSpeed(t.speed || 0)}</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {t.eta != null && <span>⏱ {formatETA(t.eta)}</span>}
                <span className={`pd-pct ${isSend ? 'pd-send' : 'pd-receive'}`}>
                  {Math.round(t.progress || 0)}%
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
