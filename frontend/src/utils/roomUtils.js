/**
 * Generate an invite link from a room code.
 * @param {string} roomCode
 */
export function generateInviteLink(roomCode) {
  const base = window.location.origin;
  return `${base}/join/${roomCode}`;
}

/**
 * Extract a room code from the current URL if it matches /join/:code
 * @returns {string|null}
 */
export function getRoomCodeFromURL() {
  const match = window.location.pathname.match(/^\/join\/(\d{6})$/);
  return match ? match[1] : null;
}

/**
 * Copy text to clipboard and return success boolean.
 * @param {string} text
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Read text from clipboard.
 * @returns {Promise<string|null>}
 */
export async function readFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    return text || null;
  } catch {
    return null;
  }
}
