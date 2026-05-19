/**
 * usePeerConnection – full mesh WebRTC hook.
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────
 * • peersRef  = { [socketID]: SimplePeer }   (one per remote peer)
 * • peers     = { [socketID]: 'connecting' | 'connected' }  (React state for UI)
 *
 * Connection lifecycle (per peer):
 *   buildPeer(initiator, targetSocketID)
 *     ├─ guard: skip if already creating/created for this target
 *     ├─ create SimplePeer
 *     ├─ on signal  → emit sending-signal / returning-signal
 *     ├─ on connect → mark peer 'connected' in state
 *     ├─ on data    → route to handleDataRef (includes fromPeer id)
 *     ├─ on error   → log only (transient ICE errors are normal)
 *     └─ on close   → remove from map, update state
 *
 * Session guard: sessionRef increments each time the effect re-runs.
 * All async callbacks check sessionRef.current === session before touching state.
 * This neutralises React StrictMode double-invoke and stale closures.
 *
 * Transfers:
 *   activeTransfers = { [fileId]: { peerId, direction, fileName, fileSize,
 *                                   progress, speed, eta, status } }
 *   receivingFiles  = { [fileId]: (in-progress buffer) }   (ref only)
 *   receivedFiles   = [completed]  (state)
 *   sentFiles       = [completed]  (state)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from '../services/socketService';

// ─── ICE servers ────────────────────────────────────────────────────────────
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

const CHUNK_SIZE = 16 * 1024; // 16 KB – safe for base64-encoded DataChannel messages

// ─── Binary helpers ─────────────────────────────────────────────────────────
function ab2b64(buffer) {
  let bin = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b642ab(b64) {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return buf;
}

function log(tag, ...args) {
  console.log(`[PeerDrop][${tag}]`, ...args);
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export default function usePeerConnection(roomID) {
  const socket = getSocket();

  // ── Refs (survive renders, no re-run side-effects) ────────────────────────
  const peersRef        = useRef({});          // { [socketID]: SimplePeer }
  const creatingRef     = useRef(new Set());   // socketIDs currently in ICE setup
  const connectedRef    = useRef(new Set());   // socketIDs that reached 'connected'
  const sessionRef      = useRef(0);           // incremented per effect run
  const cancelledRef    = useRef(new Set());   // fileIds cancelled by user
  const receivingBuf    = useRef({});          // { [fileId]: { fromPeer, meta, chunks[], received } }
  const handleDataRef   = useRef(null);        // updated every render (see below)

  // ── React state (drives UI) ───────────────────────────────────────────────
  const [peers,           setPeers]           = useState({});  // { [socketID]: 'connecting'|'connected' }
  const [activeTransfers, setActiveTransfers] = useState({});  // { [fileId]: transfer obj }
  const [sentFiles,       setSentFiles]       = useState([]);
  const [receivedFiles,   setReceivedFiles]   = useState([]);

  // ── handleData – always points to latest version ─────────────────────────
  handleDataRef.current = (raw, fromPeer) => {
    let msg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
    } catch {
      log('data', 'Parse error – ignoring');
      return;
    }

    switch (msg.type) {
      case 'FILE_META': {
        log('recv', `FILE_META from ${fromPeer}: ${msg.fileName} (${msg.fileSize}B)`);
        receivingBuf.current[msg.fileId] = {
          fromPeer,
          meta: msg,
          chunks: new Array(msg.totalChunks),
          received: 0,
          startTime: Date.now(),
        };
        setActiveTransfers((p) => ({
          ...p,
          [msg.fileId]: {
            peerId:    fromPeer,
            direction: 'receive',
            fileName:  msg.fileName,
            fileSize:  msg.fileSize,
            fileType:  msg.fileType,
            progress:  0,
            speed:     0,
            eta:       null,
            status:    'active',
          },
        }));
        break;
      }

      case 'FILE_CHUNK': {
        const entry = receivingBuf.current[msg.fileId];
        if (!entry) return;
        const buf = b642ab(msg.data);
        entry.chunks[msg.index] = buf;
        entry.received += buf.byteLength;
        const pct   = (entry.received / entry.meta.fileSize) * 100;
        const sec   = Math.max(0.001, (Date.now() - entry.startTime) / 1000);
        const speed = entry.received / sec;
        const eta   = speed > 0 ? (entry.meta.fileSize - entry.received) / speed : null;
        setActiveTransfers((p) =>
          p[msg.fileId]
            ? { ...p, [msg.fileId]: { ...p[msg.fileId], progress: pct, speed, eta } }
            : p
        );
        break;
      }

      case 'FILE_DONE': {
        const entry = receivingBuf.current[msg.fileId];
        if (!entry) return;
        log('recv', `FILE_DONE ${msg.fileId}`);
        const blob  = new Blob(entry.chunks, { type: entry.meta.fileType || 'application/octet-stream' });
        const url   = URL.createObjectURL(blob);
        const sec   = Math.max(0.001, (Date.now() - entry.startTime) / 1000);
        const speed = entry.meta.fileSize / sec;

        const done = {
          fileId:     msg.fileId,
          fromPeer,
          fileName:   entry.meta.fileName,
          fileSize:   entry.meta.fileSize,
          fileType:   entry.meta.fileType,
          url,
          speed,
          receivedAt: new Date().toLocaleTimeString(),
        };
        setReceivedFiles((p) => [done, ...p]);
        setActiveTransfers((p) => { const n = { ...p }; delete n[msg.fileId]; return n; });

        // Auto-download
        const a = document.createElement('a');
        a.href = url; a.download = entry.meta.fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);

        delete receivingBuf.current[msg.fileId];
        break;
      }

      case 'FILE_CANCEL': {
        log('recv', `FILE_CANCEL ${msg.fileId}`);
        delete receivingBuf.current[msg.fileId];
        setActiveTransfers((p) => { const n = { ...p }; delete n[msg.fileId]; return n; });
        break;
      }

      default: break;
    }
  };

  // ── Socket signaling effect ──────────────────────────────────────────────
  useEffect(() => {
    if (!roomID) return;

    const session = ++sessionRef.current;
    log('room', `Joining ${roomID} (session ${session})`);

    socket.emit('join-room', roomID);

    // ── buildPeer – called inside this effect (captures `session`) ─────────
    function buildPeer(initiator, targetSocketID) {
      // Guard: don't create duplicate
      if (creatingRef.current.has(targetSocketID)) {
        log('peer', `Already creating peer for ${targetSocketID} – skip`);
        return null;
      }
      const existing = peersRef.current[targetSocketID];
      if (existing && !existing.destroyed) {
        log('peer', `Peer for ${targetSocketID} already alive – skip`);
        return null;
      }

      creatingRef.current.add(targetSocketID);
      log('peer', `Building peer (initiator=${initiator}) for ${targetSocketID}`);

      const peer = new SimplePeer({ initiator, trickle: true, config: ICE_CONFIG });
      peersRef.current[targetSocketID] = peer;
      setPeers((p) => ({ ...p, [targetSocketID]: 'connecting' }));

      peer.on('signal', (signal) => {
        if (sessionRef.current !== session) { peer.destroy(); return; }
        log('signal', `${initiator ? 'offer/candidate→' : 'answer/candidate→'} ${targetSocketID}`);
        if (initiator) {
          socket.emit('sending-signal', { userToSignal: targetSocketID, callerID: socket.id, signal });
        } else {
          socket.emit('returning-signal', { callerID: targetSocketID, signal });
        }
      });

      peer.on('connect', () => {
        if (sessionRef.current !== session) return;
        log('peer', `Connected ↔ ${targetSocketID}`);
        creatingRef.current.delete(targetSocketID);
        connectedRef.current.add(targetSocketID);
        setPeers((p) => ({ ...p, [targetSocketID]: 'connected' }));
      });

      peer.on('data', (raw) => handleDataRef.current(raw, targetSocketID));

      peer.on('error', (err) => {
        // ICE errors during gathering are normal (STUN may fail, TURN takes over)
        log('peer', `Transient error for ${targetSocketID}: ${err.message}`);
      });

      peer.on('close', () => {
        if (sessionRef.current !== session) return;
        log('peer', `Closed ↔ ${targetSocketID}`);
        creatingRef.current.delete(targetSocketID);
        connectedRef.current.delete(targetSocketID);
        delete peersRef.current[targetSocketID];
        setPeers((p) => { const n = { ...p }; delete n[targetSocketID]; return n; });
      });

      return peer;
    }

    // ── Socket event handlers ──────────────────────────────────────────────
    function onAllUsers(users) {
      if (sessionRef.current !== session) return;
      log('signal', `all-users: [${users}]`);
      // We are new – initiate to every existing peer
      users.forEach((uid) => buildPeer(true, uid));
    }

    function onUserJoined({ signal, callerID }) {
      if (sessionRef.current !== session) return;
      log('signal', `user-joined from ${callerID}`);
      // Check if we already have a peer for this user (e.g. if we are trickling candidates)
      let peer = peersRef.current[callerID];
      if (!peer || peer.destroyed) {
        peer = buildPeer(false, callerID);
      }
      if (peer) peer.signal(signal);
    }

    function onReturnedSignal({ signal, id }) {
      if (sessionRef.current !== session) return;
      log('signal', `returned-signal from ${id}`);
      const peer = peersRef.current[id];
      if (peer && !peer.destroyed) peer.signal(signal);
    }

    function onPeerDisconnected({ peerID }) {
      if (sessionRef.current !== session) return;
      log('peer', `Server notified: ${peerID} left`);
      peersRef.current[peerID]?.destroy();
      delete peersRef.current[peerID];
      creatingRef.current.delete(peerID);
      connectedRef.current.delete(peerID);
      setPeers((p) => { const n = { ...p }; delete n[peerID]; return n; });
    }

    socket.on('all-users',                  onAllUsers);
    socket.on('user-joined',                onUserJoined);
    socket.on('receiving-returned-signal',  onReturnedSignal);
    socket.on('peer-disconnected',          onPeerDisconnected);

    return () => {
      log('room', `Cleaning up session ${session}`);
      socket.off('all-users',                 onAllUsers);
      socket.off('user-joined',               onUserJoined);
      socket.off('receiving-returned-signal', onReturnedSignal);
      socket.off('peer-disconnected',         onPeerDisconnected);

      Object.values(peersRef.current).forEach((p) => p.destroy());
      peersRef.current    = {};
      creatingRef.current.clear();
      connectedRef.current.clear();
      setPeers({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID]);

  // ── Internal: send a single file to one peer ─────────────────────────────
  async function _sendFileToPeer(peerId, file, fileId) {
    const peer = peersRef.current[peerId];
    if (!peer || peer.destroyed) { log('send', `Peer ${peerId} gone – skip`); return; }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    peer.send(JSON.stringify({
      type: 'FILE_META', fileId,
      fileName: file.name, fileType: file.type,
      fileSize: file.size, totalChunks,
    }));

    setActiveTransfers((p) => ({
      ...p,
      [fileId]: {
        peerId, direction: 'send',
        fileName: file.name, fileType: file.type, fileSize: file.size,
        progress: 0, speed: 0, eta: null, status: 'active',
      },
    }));

    const t0 = Date.now();
    let bytesSent = 0;

    for (let i = 0; i < totalChunks; i++) {
      if (cancelledRef.current.has(fileId)) {
        const p2 = peersRef.current[peerId];
        if (p2 && !p2.destroyed) p2.send(JSON.stringify({ type: 'FILE_CANCEL', fileId }));
        setActiveTransfers((p) => { const n = { ...p }; delete n[fileId]; return n; });
        cancelledRef.current.delete(fileId);
        return;
      }

      const currentPeer = peersRef.current[peerId];
      if (!currentPeer || currentPeer.destroyed) {
        setActiveTransfers((p) => { const n = { ...p }; delete n[fileId]; return n; });
        return;
      }

      const slice = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const buf   = await slice.arrayBuffer();
      const b64   = ab2b64(buf);

      currentPeer.send(JSON.stringify({ type: 'FILE_CHUNK', fileId, index: i, data: b64 }));

      bytesSent += buf.byteLength;
      const sec   = Math.max(0.001, (Date.now() - t0) / 1000);
      const speed = bytesSent / sec;
      const eta   = speed > 0 ? (file.size - bytesSent) / speed : null;

      setActiveTransfers((p) =>
        p[fileId] ? { ...p, [fileId]: { ...p[fileId], progress: (bytesSent / file.size) * 100, speed, eta } } : p
      );

      if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0)); // yield every 8 chunks
    }

    const finalPeer = peersRef.current[peerId];
    if (finalPeer && !finalPeer.destroyed) {
      finalPeer.send(JSON.stringify({ type: 'FILE_DONE', fileId }));
    }

    log('send', `Done: ${file.name} → ${peerId}`);
    setActiveTransfers((p) => { const n = { ...p }; delete n[fileId]; return n; });
    setSentFiles((p) => [{
      fileId, peerId,
      fileName: file.name, fileSize: file.size, fileType: file.type,
      sentAt: new Date().toLocaleTimeString(),
    }, ...p]);
  }

  // ── Public: send files to a specific peer ────────────────────────────────
  const sendFilesToPeer = useCallback(async (peerId, files) => {
    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await _sendFileToPeer(peerId, file, fileId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public: broadcast to all connected peers ──────────────────────────────
  const sendFilesToAll = useCallback(async (files) => {
    const connected = Object.entries(peersRef.current)
      .filter(([, p]) => !p.destroyed)
      .map(([id]) => id);

    if (connected.length === 0) return;

    // Send to all peers in parallel (each gets its own fileId + chunked stream)
    await Promise.all(
      connected.map(async (peerId) => {
        for (const file of Array.from(files)) {
          const fileId = `${Date.now()}-${peerId.slice(-4)}-${Math.random().toString(36).slice(2)}`;
          await _sendFileToPeer(peerId, file, fileId);
        }
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public: cancel a specific outgoing transfer ───────────────────────────
  const cancelTransfer = useCallback((fileId) => {
    cancelledRef.current.add(fileId);
  }, []);

  return {
    peers,           // { [socketID]: 'connecting' | 'connected' }
    activeTransfers, // { [fileId]: { peerId, direction, fileName, fileSize, progress, speed, eta, status } }
    sentFiles,
    receivedFiles,
    sendFilesToPeer,
    sendFilesToAll,
    cancelTransfer,
  };
}
