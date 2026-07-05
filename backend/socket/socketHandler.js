'use strict';

const { createRoom, joinRoom, leaveRoom, getRoomByPeer } = require('../utils/roomManager');

/**
 * Register all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[+] ${socket.id} connected`);

    // ── Create Room ─────────────────────────────────────────────────────
    socket.on('create-room', ({ deviceName } = {}, callback) => {
      try {
        // Clean up any existing room for this socket
        const existing = getRoomByPeer(socket.id);
        if (existing) {
          leaveRoom(socket.id);
          socket.leave(existing.code);
        }

        const code = createRoom(socket.id);
        socket.join(code);
        socket.data.deviceName = deviceName || 'Unknown Device';
        socket.data.roomCode = code;
        socket.data.isHost = true;

        console.log(`[Room] Created ${code} by ${socket.id} (${socket.data.deviceName})`);
        if (typeof callback === 'function') {
          callback({ success: true, roomCode: code });
        }
      } catch (err) {
        console.error('[create-room error]', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Server error creating room' });
        }
      }
    });

    // ── Join Room ────────────────────────────────────────────────────────
    socket.on('join-room', ({ roomCode, deviceName } = {}, callback) => {
      try {
        if (!roomCode || typeof roomCode !== 'string') {
          return callback?.({ success: false, error: 'Invalid room code' });
        }

        const sanitizedCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const normalizedCode = sanitizedCode.replace(/\D/g, '').padStart(6, '0').slice(-6);

        const result = joinRoom(normalizedCode, socket.id);
        if (!result.success) {
          return callback?.({ success: false, error: result.error });
        }

        socket.join(normalizedCode);
        socket.data.deviceName = deviceName || 'Unknown Device';
        socket.data.roomCode = normalizedCode;
        socket.data.isHost = false;

        // Get host's device name to send back
        const hostSocket = io.sockets.sockets.get(result.hostId);
        const hostDeviceName = hostSocket?.data?.deviceName || 'Host Device';

        // Notify host that a peer joined
        io.to(result.hostId).emit('peer-joined', {
          peerId: socket.id,
          deviceName: socket.data.deviceName,
        });

        console.log(`[Room] ${socket.id} (${socket.data.deviceName}) joined ${normalizedCode}`);
        callback?.({
          success: true,
          hostId: result.hostId,
          hostDeviceName,
        });
      } catch (err) {
        console.error('[join-room error]', err.message);
        callback?.({ success: false, error: 'Server error joining room' });
      }
    });

    // ── WebRTC Signaling ─────────────────────────────────────────────────
    socket.on('webrtc-offer', ({ targetId, offer }) => {
      if (!targetId || !offer) return;
      io.to(targetId).emit('webrtc-offer', { offer, fromId: socket.id });
    });

    socket.on('webrtc-answer', ({ targetId, answer }) => {
      if (!targetId || !answer) return;
      io.to(targetId).emit('webrtc-answer', { answer, fromId: socket.id });
    });

    socket.on('ice-candidate', ({ targetId, candidate }) => {
      if (!targetId || !candidate) return;
      io.to(targetId).emit('ice-candidate', { candidate, fromId: socket.id });
    });

    // ── Explicit Leave ───────────────────────────────────────────────────
    socket.on('leave-room', () => {
      const result = leaveRoom(socket.id);
      if (result) {
        if (result.otherId) {
          io.to(result.otherId).emit('peer-disconnected', {
            peerId: socket.id,
            wasHost: result.wasHost,
          });
        }
        socket.leave(result.code);
        console.log(`[Room] ${socket.id} left ${result.code}`);
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const result = leaveRoom(socket.id);
      if (result && result.otherId) {
        io.to(result.otherId).emit('peer-disconnected', {
          peerId: socket.id,
          wasHost: result.wasHost,
        });
        console.log(`[Room] ${socket.id} disconnected from ${result.code} (${reason})`);
      }
      console.log(`[-] ${socket.id} disconnected`);
    });
  });
};
