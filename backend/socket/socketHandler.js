const roomManager = require('../utils/roomManager');

module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    /* ──────────────── join-room ──────────────── */
    socket.on('join-room', (roomID) => {
      if (!roomID || typeof roomID !== 'string' || !roomID.trim()) {
        socket.emit('error-event', { message: 'Invalid room ID.' });
        return;
      }

      const id = roomID.trim().toUpperCase();
      const { users } = roomManager.joinRoom(id, socket.id);

      // Idempotent Socket.IO room join
      if (!socket.rooms.has(id)) socket.join(id);
      socket.currentRoom = id;

      // Tell this socket who is already in the room
      socket.emit('all-users', users);
      console.log(`[Room] ${socket.id} joined ${id}. Others: [${users}]`);
    });

    /* ──────────────── WebRTC signaling ──────────────── */
    // Initiator → existing peer
    socket.on('sending-signal', ({ userToSignal, callerID, signal }) => {
      if (!userToSignal || !callerID || !signal) return;
      io.to(userToSignal).emit('user-joined', { signal, callerID });
    });

    // Non-initiator → back to initiator
    socket.on('returning-signal', ({ callerID, signal }) => {
      if (!callerID || !signal) return;
      io.to(callerID).emit('receiving-returned-signal', { signal, id: socket.id });
    });

    /* ──────────────── disconnect ──────────────── */
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
      const affected = roomManager.leaveAllRooms(socket.id);
      affected.forEach(({ roomID, remaining }) => {
        // Notify every remaining peer that this socket left
        remaining.forEach((peerId) => {
          io.to(peerId).emit('peer-disconnected', { peerID: socket.id });
        });
        console.log(`[Room] ${socket.id} left ${roomID}. Remaining: [${remaining}]`);
      });
    });
  });
};
