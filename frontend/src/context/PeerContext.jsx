import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socket from '../services/socket';
import { useNotifications } from '../hooks/useNotifications.js';

const PeerContext = createContext();

// STUN servers so WebRTC can work across different networks
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const CHUNK_SIZE = 65536; // 64KB per chunk

export function PeerProvider({ children }) {
  const { notify } = useNotifications();

  // Connection state
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, disconnected
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [peerDeviceName, setPeerDeviceName] = useState('');
  const [localDeviceName, setLocalDeviceNameState] = useState(
    localStorage.getItem('pd_device_name') || ''
  );

  // File transfer state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [activeTransfers, setActiveTransfers] = useState({});
  const [receivedFiles, setReceivedFiles] = useState([]);

  // Chat and clipboard
  const [messages, setMessages] = useState([]);
  const [receivedClipboard, setReceivedClipboard] = useState(null);

  // WebRTC refs (we use refs so we don't lose them between renders)
  const pc = useRef(null);           // RTCPeerConnection
  const controlCh = useRef(null);   // DataChannel for text messages (chat, clipboard, file requests)
  const binaryCh = useRef(null);    // DataChannel for file data (chunks)
  const remotePeerId = useRef('');  // The other person's socket ID

  // Track incoming file chunks: { fileId: { meta, chunks[], received } }
  const rxFiles = useRef({});

  // Track outgoing file accept/reject using simple callbacks
  const txWaiters = useRef({}); // { fileId: { resolve, reject } }

  // ─── FIX 2: Queue for ICE candidates that arrive too early ──────────────
  // The host starts sending ICE candidates immediately after creating the offer.
  // These can arrive at the joiner before setRemoteDescription() is called.
  // We store them here and apply them once the remote description is set.
  const iceCandidateQueue = useRef([]);

  // ─── Helper: send a JSON message through the control channel ────────────
  function sendControl(obj) {
    if (controlCh.current && controlCh.current.readyState === 'open') {
      controlCh.current.send(JSON.stringify(obj));
    }
  }

  // ─── Helper: assemble a fully received file ─────────────────────────────
  function assembleFile(fileId) {
    const rx = rxFiles.current[fileId];
    if (!rx) return;

    const blob = new Blob(rx.chunks, { type: rx.meta.mimeType });
    const url = URL.createObjectURL(blob);
    const fileEntry = {
      fileId,
      name: rx.meta.name,
      size: rx.meta.size,
      mimeType: rx.meta.mimeType,
      url,
    };
    setReceivedFiles(prev => [fileEntry, ...prev]);

    // Remove from active transfers
    setActiveTransfers(prev => {
      const copy = { ...prev };
      delete copy[fileId];
      return copy;
    });

    delete rxFiles.current[fileId];

    // Save to history
    saveHistory({ direction: 'received', name: rx.meta.name, size: rx.meta.size, status: 'done' });

    // Browser notification
    notify('File received!', rx.meta.name);
  }

  // ─── Handle messages on the control channel ─────────────────────────────
  function onControlMessage(event) {
    const msg = JSON.parse(event.data);

    if (msg.type === 'device-name') {
      setPeerDeviceName(msg.name);
    }

    if (msg.type === 'chat') {
      setMessages(prev => [...prev, { ...msg, from: 'peer' }]);
    }

    if (msg.type === 'clipboard') {
      setReceivedClipboard({ content: msg.content, time: Date.now() });
    }

    if (msg.type === 'file-request') {
      setIncomingRequests(prev => [...prev, msg]);
    }

    if (msg.type === 'file-accept') {
      // The other side accepted our file — start sending
      if (txWaiters.current[msg.fileId]) {
        txWaiters.current[msg.fileId].resolve();
        delete txWaiters.current[msg.fileId];
      }
    }

    if (msg.type === 'file-reject') {
      if (txWaiters.current[msg.fileId]) {
        txWaiters.current[msg.fileId].reject(new Error('File was rejected'));
        delete txWaiters.current[msg.fileId];
      }
    }

    if (msg.type === 'file-done') {
      const rx = rxFiles.current[msg.fileId];
      if (!rx) return;

      rx.doneSignalReceived = true;
      if (rx.received === rx.meta.size) {
        assembleFile(msg.fileId);
      }
    }
  }

  // ─── Handle binary file chunks ────────────────────────────────────────
  function onBinaryMessage(event) {
    const buf = event.data; // ArrayBuffer
    if (!(buf instanceof ArrayBuffer) || buf.byteLength < 8) return;

    const view = new DataView(buf);
    const fileId = view.getUint32(0, true);
    const chunkIndex = view.getUint32(4, true);
    const chunkData = buf.slice(8);

    const rx = rxFiles.current[fileId];
    if (!rx) return;

    rx.chunks[chunkIndex] = chunkData;
    rx.received += chunkData.byteLength;

    const progress = Math.round((rx.received / rx.meta.size) * 100);
    setActiveTransfers(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], progress },
    }));

    if (rx.received === rx.meta.size && rx.doneSignalReceived) {
      assembleFile(fileId);
    }
  }

  // ─── Set up both data channels after WebRTC connects ────────────────────
  function setupChannels(control, binary) {
    controlCh.current = control;
    binaryCh.current = binary;

    binary.binaryType = 'arraybuffer';
    binary.bufferedAmountLowThreshold = 65536; // 64KB threshold for stable pacing

    control.onmessage = onControlMessage;
    control.onclose = () => {
      cleanupWebRTC();
      setStatus('disconnected');
      setPeerDeviceName('');
      setMessages([]);
      setIncomingRequests([]);
      setActiveTransfers({});
    };
    binary.onmessage = onBinaryMessage;

    // ── FIX 1 ──────────────────────────────────────────────────────────────
    // On the HOST side: DataChannels are created before the connection is made,
    // so the channel starts in 'connecting' state and 'onopen' fires later. ✓
    //
    // On the JOINER side: 'ondatachannel' fires AFTER the DTLS handshake is
    // already done, so the channel arrives already in 'open' state.
    // Setting control.onopen at this point is too late — the event already fired!
    // We must check readyState and call the setup logic immediately if open.
    // ──────────────────────────────────────────────────────────────────────
    function onChannelOpen() {
      setStatus('connected');
      // Tell the other person our device name
      sendControl({ type: 'device-name', name: localStorage.getItem('pd_device_name') || 'Unknown' });
    }

    if (control.readyState === 'open') {
      // Channel is already open (joiner side) — call immediately
      onChannelOpen();
    } else {
      // Channel not open yet (host side) — wait for the open event
      control.onopen = onChannelOpen;
    }
  }

  // ─── Create RTCPeerConnection ─────────────────────────────────────────
  function createPC() {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    pc.current = peer;

    // Send our ICE candidates to the other person via the server
    peer.onicecandidate = (e) => {
      if (e.candidate && remotePeerId.current) {
        socket.emit('ice-candidate', { targetId: remotePeerId.current, candidate: e.candidate });
      }
    };

    peer.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
        cleanupWebRTC();
        setStatus('disconnected');
        setPeerDeviceName('');
        setMessages([]);
        setIncomingRequests([]);
        setActiveTransfers({});
      }
    };

    return peer;
  }

  // ─── Host: someone joined our room, start WebRTC ─────────────────────
  async function startHost(peerId) {
    remotePeerId.current = peerId;
    const peer = createPC();

    // Host creates the data channels
    const control = peer.createDataChannel('control', { ordered: true });
    const binary = peer.createDataChannel('binary', { ordered: true });
    setupChannels(control, binary);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('webrtc-offer', { targetId: peerId, offer });
  }

  // ─── Joiner: received an offer from the host ──────────────────────────
  async function startJoiner(fromId, offer) {
    remotePeerId.current = fromId;
    const peer = createPC();

    // Joiner receives channels from host via ondatachannel
    let ctrl = null;
    let bin = null;
    peer.ondatachannel = (e) => {
      if (e.channel.label === 'control') ctrl = e.channel;
      if (e.channel.label === 'binary') bin = e.channel;
      if (ctrl && bin) setupChannels(ctrl, bin);
    };

    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    // ── FIX 2: Apply any ICE candidates that arrived before this point ──────
    // The host sends ICE candidates right after setLocalDescription(offer).
    // Those candidates can arrive here before setRemoteDescription() finished.
    // We saved them in iceCandidateQueue — add them now.
    for (const candidate of iceCandidateQueue.current) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // Ignore — stale or duplicate candidate
      }
    }
    iceCandidateQueue.current = [];

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('webrtc-answer', { targetId: fromId, answer });
  }

  // ─── Socket event listeners ────────────────────────────────────────────
  useEffect(() => {
    socket.on('peer-joined', ({ peerId, deviceName }) => {
      setPeerDeviceName(deviceName);
      setStatus('connecting');
      startHost(peerId);
    });

    socket.on('webrtc-offer', ({ offer, fromId }) => {
      setStatus('connecting');
      startJoiner(fromId, offer);
    });

    socket.on('webrtc-answer', async ({ answer }) => {
      if (pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));

        // Apply any queued ICE candidates from the joiner
        for (const candidate of iceCandidateQueue.current) {
          try {
            await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        }
        iceCandidateQueue.current = [];
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (pc.current && pc.current.remoteDescription) {
        // Remote description already set — add the candidate right now
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          // Can happen during normal setup, safe to ignore
        }
      } else {
        // Remote description not set yet — save for later (Fix 2)
        iceCandidateQueue.current.push(candidate);
      }
    });

    socket.on('peer-disconnected', () => {
      cleanupWebRTC();
      setStatus('disconnected');
      setPeerDeviceName('');
      setMessages([]);
      setIncomingRequests([]);
      setActiveTransfers({});
    });

    return () => {
      socket.off('peer-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('ice-candidate');
      socket.off('peer-disconnected');
    };
  }, []);

  // ─── Save to localStorage history ─────────────────────────────────────
  function saveHistory(entry) {
    const existing = JSON.parse(localStorage.getItem('pd_history') || '[]');
    const updated = [{ id: Date.now(), timestamp: Date.now(), ...entry }, ...existing].slice(0, 50);
    localStorage.setItem('pd_history', JSON.stringify(updated));
  }

  // ─── Public methods ────────────────────────────────────────────────────

  function setLocalDeviceName(name) {
    const trimmed = name.trim().slice(0, 30);
    setLocalDeviceNameState(trimmed);
    localStorage.setItem('pd_device_name', trimmed);
  }

  function createRoom(deviceName) {
    return new Promise((resolve, reject) => {
      const doCreate = () => {
        setStatus('connecting');
        setIsHost(true);
        socket.emit('create-room', { deviceName }, (res) => {
          if (res.success) {
            setRoomCode(res.roomCode);
            resolve(res.roomCode);
          } else {
            setStatus('idle');
            reject(new Error(res.error));
          }
        });
      };

      if (socket.connected) {
        doCreate();
      } else {
        socket.connect();
        socket.once('connect', doCreate);
      }
    });
  }

  function joinRoom(code, deviceName) {
    return new Promise((resolve, reject) => {
      const doJoin = () => {
        setStatus('connecting');
        setIsHost(false);
        // Clear the ICE candidate queue for a fresh connection
        iceCandidateQueue.current = [];
        socket.emit('join-room', { roomCode: code, deviceName }, (res) => {
          if (res.success) {
            setRoomCode(code);
            setPeerDeviceName(res.hostDeviceName || 'Host');
            resolve(res);
          } else {
            setStatus('idle');
            reject(new Error(res.error));
          }
        });
      };

      if (socket.connected) {
        doJoin();
      } else {
        socket.connect();
        socket.once('connect', doJoin);
      }
    });
  }

  function cleanupWebRTC() {
    if (pc.current) {
      try {
        pc.current.close();
      } catch (e) {}
    }
    pc.current = null;
    controlCh.current = null;
    binaryCh.current = null;
    remotePeerId.current = '';
    iceCandidateQueue.current = [];
    rxFiles.current = {};
    txWaiters.current = {};
  }

  function disconnect() {
    socket.emit('leave-room');
    cleanupWebRTC();
    setStatus('idle');
    setRoomCode('');
    setPeerDeviceName('');
    setMessages([]);
    setIncomingRequests([]);
    setActiveTransfers({});
  }

  // ─── Send files ────────────────────────────────────────────────────────
  async function sendFiles(fileList) {
    for (const file of fileList) {
      // FIX 1: fileId must fit in Uint32 (Date.now() is > 32 bits and gets truncated in DataView)
      const fileId = Math.floor(Math.random() * 0xFFFFFFFF);
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // Show this file as "waiting"
      setActiveTransfers(prev => ({
        ...prev,
        [fileId]: { fileId, name: file.name, size: file.size, progress: 0, direction: 'sending', status: 'waiting' }
      }));

      // Ask the other person if they want this file
      const fileName = file.webkitRelativePath || file.name;
      sendControl({ type: 'file-request', fileId, name: fileName, size: file.size, mimeType: file.type, totalChunks });

      // Wait for them to accept or reject
      try {
        await new Promise((resolve, reject) => {
          txWaiters.current[fileId] = { resolve, reject };

          // Cancel if they don't respond in 60 seconds
          setTimeout(() => {
            if (txWaiters.current[fileId]) {
              txWaiters.current[fileId].reject(new Error('Timed out waiting for response'));
              delete txWaiters.current[fileId];
            }
          }, 60000);
        });

        // They accepted — start sending chunks
        setActiveTransfers(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'sending' } }));

        for (let i = 0; i < totalChunks; i++) {
          const offset = i * CHUNK_SIZE;
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const chunkData = await slice.arrayBuffer();

          // Build the binary message: [fileId 4 bytes][chunkIndex 4 bytes][data]
          const msg = new ArrayBuffer(8 + chunkData.byteLength);
          const view = new DataView(msg);
          view.setUint32(0, fileId, true);
          view.setUint32(4, i, true);
          new Uint8Array(msg, 8).set(new Uint8Array(chunkData));

          // FIX 2: Buffer pacing to prevent DataChannel from crashing on large files
          if (binaryCh.current) {
            // If the buffer exceeds 1MB, wait for it to drain
            if (binaryCh.current.bufferedAmount > 1024 * 1024) {
              await new Promise(resolve => {
                const onDrain = () => {
                  binaryCh.current.removeEventListener('bufferedamountlow', onDrain);
                  resolve();
                };
                binaryCh.current.addEventListener('bufferedamountlow', onDrain);
              });
            }
            if (binaryCh.current.readyState === 'open') {
              binaryCh.current.send(msg);
            }
          }

          const progress = Math.round(((i + 1) / totalChunks) * 100);
          setActiveTransfers(prev => ({ ...prev, [fileId]: { ...prev[fileId], progress } }));
        }

        // Tell the other person we're done sending
        sendControl({ type: 'file-done', fileId });

        setActiveTransfers(prev => ({ ...prev, [fileId]: { ...prev[fileId], progress: 100, status: 'done' } }));
        setTimeout(() => {
          setActiveTransfers(prev => {
            const copy = { ...prev };
            delete copy[fileId];
            return copy;
          });
        }, 3000);

        saveHistory({ direction: 'sent', name: file.name, size: file.size, status: 'done' });

      } catch (err) {
        setActiveTransfers(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'error' } }));
        setTimeout(() => {
          setActiveTransfers(prev => {
            const copy = { ...prev };
            delete copy[fileId];
            return copy;
          });
        }, 4000);
      }
    }
  }

  function acceptFile(fileId) {
    const req = incomingRequests.find(r => r.fileId === fileId);
    if (!req) return;

    rxFiles.current[fileId] = {
      meta: req,
      chunks: new Array(req.totalChunks),
      received: 0,
      doneSignalReceived: false,
    };

    setActiveTransfers(prev => ({
      ...prev,
      [fileId]: { fileId, name: req.name, size: req.size, progress: 0, direction: 'receiving', status: 'receiving' }
    }));

    setIncomingRequests(prev => prev.filter(r => r.fileId !== fileId));
    sendControl({ type: 'file-accept', fileId });
  }

  function rejectFile(fileId) {
    setIncomingRequests(prev => prev.filter(r => r.fileId !== fileId));
    sendControl({ type: 'file-reject', fileId });
  }

  function sendClipboard(text) {
    if (text && text.trim()) {
      sendControl({ type: 'clipboard', content: text });
    }
  }

  function sendMessage(content) {
    if (!content || !content.trim()) return;
    const msg = {
      id: Date.now(),
      content: content.trim(),
      from: 'me',
      timestamp: Date.now(),
    };
    sendControl({ type: 'chat', ...msg });
    setMessages(prev => [...prev, msg]);
  }

  return (
    <PeerContext.Provider value={{
      status,
      roomCode,
      isHost,
      peerDeviceName,
      localDeviceName,
      incomingRequests,
      activeTransfers,
      receivedFiles,
      messages,
      receivedClipboard,
      setLocalDeviceName,
      createRoom,
      joinRoom,
      disconnect,
      sendFiles,
      acceptFile,
      rejectFile,
      sendClipboard,
      sendMessage,
    }}>
      {children}
    </PeerContext.Provider>
  );
}

export function usePeer() {
  return useContext(PeerContext);
}
