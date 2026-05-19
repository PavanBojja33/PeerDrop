import { useState, useCallback } from 'react';
import { formatBytes } from '../utils/formatBytes';

export default function FileUpload({ onSend, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [staged,   setStaged]   = useState([]);

  const addFiles = useCallback((files) => {
    setStaged((s) => [
      ...s,
      ...Array.from(files).map((f) => ({ file: f, id: `${Date.now()}-${Math.random()}` })),
    ]);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleSend = () => {
    if (!staged.length || disabled) return;
    onSend(staged.map((s) => s.file));
    setStaged([]);
  };

  return (
    <div>
      {/* Drop zone */}
      <label
        htmlFor="file-input"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 8, padding: '28px 20px',
          borderRadius: 10,
          border: `2px dashed ${dragging ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
          background: dragging ? 'rgba(99,102,241,0.07)' : 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <input
          id="file-input" type="file" multiple
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; }}
          disabled={disabled}
        />
        <span style={{ fontSize: 28 }}>📂</span>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
          {dragging ? 'Drop files here!' : 'Drag & drop or click to choose files'}
        </p>
        {disabled && <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>Wait for peer to connect first</p>}
      </label>

      {/* Staged files */}
      {staged.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {staged.map(({ file, id }) => (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', marginBottom: 6,
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={() => setStaged((s) => s.filter((f) => f.id !== id))}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, padding: '0 4px', flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          ))}

          <button
            id="send-files-btn"
            onClick={handleSend}
            disabled={disabled}
            style={{
              width: '100%', marginTop: 8, padding: '10px', borderRadius: 8,
              border: 'none',
              background: disabled ? '#1e293b' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: disabled ? '#475569' : '#fff',
              fontWeight: 700, fontSize: 14,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Send {staged.length} {staged.length === 1 ? 'file' : 'files'}
          </button>
        </div>
      )}
    </div>
  );
}
