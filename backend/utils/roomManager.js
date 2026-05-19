/**
 * RoomManager – no user limit. Tracks rooms and their members.
 */

class RoomManager {
  constructor() {
    // Map<roomID, Set<socketID>>
    this.rooms = new Map();
  }

  /**
   * Add a socket to a room (idempotent – rejoining returns current peers).
   * Returns { users: string[] }  (other members)
   */
  joinRoom(roomID, socketID) {
    if (!this.rooms.has(roomID)) {
      this.rooms.set(roomID, new Set());
    }
    const room = this.rooms.get(roomID);
    room.add(socketID); // Set.add is idempotent
    const users = Array.from(room).filter((id) => id !== socketID);
    return { users };
  }

  /**
   * Remove a socket from all rooms.
   * Returns list of { roomID, remaining[] } for each affected room.
   */
  leaveAllRooms(socketID) {
    const affected = [];
    for (const [roomID, members] of this.rooms.entries()) {
      if (members.has(socketID)) {
        members.delete(socketID);
        affected.push({ roomID, remaining: Array.from(members) });
        if (members.size === 0) this.rooms.delete(roomID);
      }
    }
    return affected;
  }

  getRoomMembers(roomID) {
    return this.rooms.has(roomID) ? Array.from(this.rooms.get(roomID)) : [];
  }

  getRoomCount() {
    return this.rooms.size;
  }
}

module.exports = new RoomManager();
