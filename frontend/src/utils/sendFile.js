/**
 * sendFile.js – standalone chunked-transfer utility.
 *
 * Takes a SimplePeer instance directly, so it can be used
 * independently of any React hook if needed.
 *
 * The usePeerConnection hook calls _sendFileToPeer internally,
 * which replicates this same logic. This module is provided as
 * a documented, importable utility for external use / testing.
 */

const CHUNK_SIZE = 16 * 1024; // 16 KB — safe for base64 over RTCDataChannel

function ab2b64(buffer) {
  let bin = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Send a single file over an established SimplePeer connection.
 *
 * @param {SimplePeer} peer       – active SimplePeer instance
 * @param {File}       file       – File object to send
 * @param {string}     fileId     – unique transfer ID
 * @param {object}     callbacks
 *   @param {(pct, speed, eta) => void} callbacks.onProgress
 *   @param {() => void}               callbacks.onComplete
 *   @param {() => void}               [callbacks.onCancel]
 *   @param {{ current: Set<string> }} callbacks.cancelledRef – shared cancel Set
 */
export async function sendFile(peer, file, fileId, {
  onProgress   = () => {},
  onComplete   = () => {},
  onCancel     = () => {},
  cancelledRef = { current: new Set() },
} = {}) {
  if (!peer || peer.destroyed) return;

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // 1. Send metadata
  peer.send(JSON.stringify({
    type: 'FILE_META', fileId,
    fileName: file.name, fileType: file.type,
    fileSize: file.size, totalChunks,
  }));

  const t0 = Date.now();
  let bytesSent = 0;

  // 2. Send chunks
  for (let i = 0; i < totalChunks; i++) {
    // Check cancellation
    if (cancelledRef.current.has(fileId)) {
      if (!peer.destroyed) peer.send(JSON.stringify({ type: 'FILE_CANCEL', fileId }));
      cancelledRef.current.delete(fileId);
      onCancel();
      return;
    }

    if (peer.destroyed) return;

    const slice = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const buf   = await slice.arrayBuffer();
    const b64   = ab2b64(buf);

    peer.send(JSON.stringify({ type: 'FILE_CHUNK', fileId, index: i, data: b64 }));

    bytesSent += buf.byteLength;
    const sec   = Math.max(0.001, (Date.now() - t0) / 1000);
    const speed = bytesSent / sec;
    const eta   = speed > 0 ? (file.size - bytesSent) / speed : null;

    onProgress((bytesSent / file.size) * 100, speed, eta);

    // Yield every 8 chunks to keep the event loop responsive
    if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0));
  }

  // 3. Signal completion
  if (!peer.destroyed) peer.send(JSON.stringify({ type: 'FILE_DONE', fileId }));
  onComplete();
}

/**
 * Validate a file before sending (extensible).
 * Currently no restrictions — P2P transfers support any file.
 */
export function validateFile(_file) {
  return { valid: true, reason: null };
}

/**
 * Return a display category for a file MIME type.
 */
export function getFileCategory(type = '') {
  if (type.startsWith('image')) return 'image';
  if (type.startsWith('video')) return 'video';
  if (type.startsWith('audio')) return 'audio';
  if (type.includes('pdf'))     return 'document';
  if (type.match(/zip|rar|7z|tar|gz/)) return 'archive';
  return 'file';
}
