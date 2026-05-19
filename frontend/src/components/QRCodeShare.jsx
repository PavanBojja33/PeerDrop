import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeShare({ roomID, shareUrl }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  return (
    <>
      <button
        id="qr-code-btn"
        onClick={() => setOpen(true)}
        style={triggerBtn}
      >
        QR Code
      </button>

      {open && (
        <div style={overlay} onClick={() => setOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Share Room</h3>
              <button onClick={() => setOpen(false)} style={closeBtn}>✕</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
                <QRCodeSVG value={shareUrl} size={200} level="H" />
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', margin: '8px 0 16px' }}>
              Scan this QR code to join the room
            </p>

            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#818cf8', letterSpacing: 3 }}>
                {roomID}
              </span>
              <button onClick={copy} style={{ ...closeBtn, color: copied ? '#34d399' : '#94a3b8' }}>
                {copied ? '✓ Copied' : 'Copy ID'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const triggerBtn = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#94a3b8', borderRadius: 7, padding: '5px 12px',
  cursor: 'pointer', fontSize: 13,
};
const overlay = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
};
const modal = {
  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14, padding: 24, width: '100%', maxWidth: 360,
};
const closeBtn = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#94a3b8', borderRadius: 6, padding: '4px 12px',
  cursor: 'pointer', fontSize: 13,
};
