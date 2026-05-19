/**
 * DragDropUpload
 *
 * Sole entry point for file sending.
 * Flow:
 *   1. User drags/picks files → staged
 *   2. PeerMultiSelect appears → user ticks which peers to send to
 *   3. Send button shows "Send N files to M peers"
 *   4. On click → sendFilesToPeer() called for each selected peer in parallel
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import '../styles/dragdrop.css';
import FileCard        from './FileCard';
import PeerMultiSelect from './PeerMultiSelect';

/**
 * Props:
 *   peers           { [socketID]: 'connecting' | 'connected' }
 *   sendFilesToPeer (peerId: string, files: File[]) => void
 */
export default function DragDropUpload({ peers, sendFilesToPeer }) {
  const [dragging,       setDragging]       = useState(false);
  const [staged,         setStaged]         = useState([]);      // [{ file, id }]
  const [selectedPeers,  setSelectedPeers]  = useState([]);      // socket IDs
  const inputRef = useRef();

  const connectedPeers = Object.entries(peers).filter(([, s]) => s === 'connected');
  const hasConnected   = connectedPeers.length > 0;

  // Auto-select all connected peers whenever the staged list becomes non-empty
  // (so the user doesn't have to manually tick everyone first)
  useEffect(() => {
    if (staged.length > 0) {
      setSelectedPeers(connectedPeers.map(([id]) => id));
    }
  }, [staged.length]);  // eslint-disable-line

  // If a peer disconnects, remove them from selection
  useEffect(() => {
    const connectedIds = new Set(connectedPeers.map(([id]) => id));
    setSelectedPeers((prev) => prev.filter((id) => connectedIds.has(id)));
  }, [connectedPeers.length]);  // eslint-disable-line

  /* ── file staging ─────────────────────────────────────────────── */
  const stageFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    setStaged((prev) => {
      const existingKeys = new Set(prev.map((s) => `${s.file.name}|${s.file.size}`));
      const deduplicated = incoming.filter(
        (f) => !existingKeys.has(`${f.name}|${f.size}`)
      );
      return [
        ...prev,
        ...deduplicated.map((file) => ({
          file,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        })),
      ];
    });
  }, []);

  const removeFile = (id) => setStaged((prev) => prev.filter((f) => f.id !== id));

  /* ── drag handlers ────────────────────────────────────────────── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) stageFiles(e.dataTransfer.files);
  };

  /* ── send ─────────────────────────────────────────────────────── */
  const canSend = staged.length > 0 && selectedPeers.length > 0 && hasConnected;

  const handleSend = () => {
    if (!canSend) return;
    const files = staged.map((s) => s.file);
    // Send to each selected peer in parallel (each peer gets its own chunk stream)
    selectedPeers.forEach((peerId) => sendFilesToPeer(peerId, files));
    setStaged([]);
    setSelectedPeers([]);
  };

  /* ── button label ─────────────────────────────────────────────── */
  const sendLabel = (() => {
    if (!hasConnected)          return 'No peers connected';
    if (staged.length === 0)    return 'Select files to send';
    if (selectedPeers.length === 0) return 'Select at least one recipient';
    const f = `${staged.length} ${staged.length === 1 ? 'file' : 'files'}`;
    const p = `${selectedPeers.length} ${selectedPeers.length === 1 ? 'peer' : 'peers'}`;
    return `Send ${f} to ${p}`;
  })();

  return (
    <div>
      {/* ── Drop zone ─────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={hasConnected ? 0 : -1}
        className={[
          'pd-drop-zone',
          dragging      ? 'pd-drag-over' : '',
          !hasConnected ? 'pd-disabled'  : '',
        ].join(' ')}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => hasConnected && inputRef.current.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasConnected) {
            e.preventDefault();
            inputRef.current.click();
          }
        }}
        aria-label="Drop files here or click to browse"
      >
        <input
          ref={inputRef}
          id="file-input"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files.length) stageFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="pd-drop-inner">
          <span className="pd-drop-icon">{dragging ? '📥' : '📂'}</span>
          <p className="pd-drop-title">
            {!hasConnected
              ? 'Connect with a peer first'
              : dragging
              ? 'Release to add files!'
              : 'Drag files here, or click to browse'}
          </p>
          {hasConnected && (
            <p className="pd-drop-hint">Any file type · no size limit · multiple files</p>
          )}
        </div>
      </div>

      {/* ── Staged files + multi-select + send ─────────────────── */}
      {staged.length > 0 && (
        <div style={{ marginTop: 14 }}>

          {/* File list */}
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Files to send ({staged.length})
          </p>
          {staged.map(({ file, id }) => (
            <FileCard key={id} file={file} onRemove={() => removeFile(id)} />
          ))}

          {/* Recipient selector */}
          {hasConnected && (
            <PeerMultiSelect
              peers={peers}
              selectedPeers={selectedPeers}
              onChange={setSelectedPeers}
            />
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />

          {/* Send button */}
          <button
            id="send-files-btn"
            className="pd-send-btn"
            onClick={handleSend}
            disabled={!canSend}
          >
            {sendLabel}
          </button>

          {/* Clear staged */}
          <button
            onClick={() => { setStaged([]); setSelectedPeers([]); }}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '7px',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 7,
              color: '#475569',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
