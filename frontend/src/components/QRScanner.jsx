/**
 * QRScanner – uses html5-qrcode to scan a QR code with the device camera.
 * On success it calls onResult(text).
 */
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onResult, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError]   = useState('');
  const [ready, setReady]   = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const scannerId = 'qr-scanner-region';
    const html5qr = new Html5Qrcode(scannerId);
    scannerRef.current = html5qr;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) {
          setError('No camera found on this device.');
          return;
        }
        if (!mountedRef.current) return;
        setReady(true);
        return html5qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            // Extract room ID from a full URL or treat as plain room ID
            let roomID = decodedText.trim();
            const match = roomID.match(/\/room\/([A-Z0-9-]+)/i);
            if (match) roomID = match[1].toUpperCase();
            html5qr.stop().catch(() => {});
            onResult(roomID.toUpperCase());
          },
          () => { /* scan miss – ignore */ }
        );
      })
      .catch((err) => {
        if (mountedRef.current) setError(`Camera error: ${err?.message || err}`);
      });

    return () => {
      mountedRef.current = false;
      scannerRef.current
        ?.stop()
        .catch(() => {})
        .finally(() => scannerRef.current?.clear().catch(() => {}));
    };
  }, [onResult]);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Scan QR Code</h3>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {error ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#f87171', fontSize: 14 }}>
            {error}
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              Point your camera at a PeerDrop QR code
            </p>
            {/* html5-qrcode mounts into this div */}
            <div
              id="qr-scanner-region"
              style={{
                width: '100%',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#000',
                minHeight: 260,
              }}
            />
            {!ready && (
              <p style={{ margin: '12px 0 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Starting camera…
              </p>
            )}
          </>
        )}

        <button onClick={onClose} style={{ ...closeBtn, width: '100%', marginTop: 16, padding: '10px', borderRadius: 8, fontSize: 14 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
};
const modal = {
  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14, padding: 24, width: '100%', maxWidth: 380,
};
const closeBtn = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#94a3b8', borderRadius: 6, padding: '4px 12px',
  cursor: 'pointer', fontSize: 13,
};
