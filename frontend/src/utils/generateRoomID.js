/**
 * Generates a human-friendly, URL-safe room ID.
 * Format: XXXX-XXXX (8 alphanumeric chars split by dash)
 */
export function generateRoomID() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit confusing chars
  const segment = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment(4)}-${segment(4)}`;
}
