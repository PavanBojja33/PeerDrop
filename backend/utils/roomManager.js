'use strict';

// ── Room Manager ──
// Pure in-memory store. No database. Rooms expire after 30 minutes.

const ROOM_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/** @type {Map<string, {hostId:string, peers:Set<string>, createdAt:number, timer:NodeJS.Timeout}>} */
const rooms = new Map();

/**
 * Generate a random 6-digit room code that doesn't collide with existing rooms.
 */
function generateCode() {
  let code;
  let attempts = 0;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
    attempts++;
    if (attempts > 1000) throw new Error('Cannot generate unique room code');
  } while (rooms.has(code));
  return code;
}

/**
 * Create a new room for a host socket.
 * @param {string} hostId - socket.id of host
 * @returns {string} 6-digit room code
 */
function createRoom(hostId) {
  const code = generateCode();
  const timer = setTimeout(() => {
    console.log(`[Room] ${code} expired`);
    rooms.delete(code);
  }, ROOM_EXPIRY_MS);

  rooms.set(code, {
    hostId,
    peers: new Set([hostId]),
    createdAt: Date.now(),
    timer,
  });

  return code;
}

/**
 * Attempt to join an existing room.
 * @param {string} code - room code
 * @param {string} peerId - socket.id of joiner
 * @returns {{ success: boolean, hostId?: string, error?: string }}
 */
function joinRoom(code, peerId) {
  const room = rooms.get(code);
  if (!room) return { success: false, error: 'Room not found or has expired' };
  if (room.peers.size >= 2) return { success: false, error: 'Room is full (max 2 peers)' };
  if (room.peers.has(peerId)) return { success: false, error: 'Already in this room' };

  room.peers.add(peerId);
  return { success: true, hostId: room.hostId };
}

/**
 * Remove a peer from any room they are in.
 * @param {string} peerId
 * @returns {{ code: string, wasHost: boolean, otherId: string|null } | null}
 */
function leaveRoom(peerId) {
  for (const [code, room] of rooms.entries()) {
    if (!room.peers.has(peerId)) continue;

    room.peers.delete(peerId);

    // Find the remaining peer (if any)
    let otherId = null;
    for (const id of room.peers) {
      otherId = id;
      break;
    }

    const wasHost = room.hostId === peerId;

    // If room is now empty OR host left, clean up
    if (room.peers.size === 0 || wasHost) {
      clearTimeout(room.timer);
      rooms.delete(code);
    }

    return { code, wasHost, otherId };
  }
  return null;
}

/**
 * Get room info by peer id.
 * @param {string} peerId
 * @returns {{ code: string, room: object } | null}
 */
function getRoomByPeer(peerId) {
  for (const [code, room] of rooms.entries()) {
    if (room.peers.has(peerId)) return { code, room };
  }
  return null;
}

/** Active room count (for health checks). */
function roomCount() {
  return rooms.size;
}

module.exports = { createRoom, joinRoom, leaveRoom, getRoomByPeer, roomCount };
