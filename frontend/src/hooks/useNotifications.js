// Simple hook to show browser notifications

export function useNotifications() {
  async function notify(title, body) {
    if (typeof Notification === 'undefined') return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      try {
        // Basic desktop notifications
        const n = new Notification(title, { body, icon: '/favicon.svg' });
        setTimeout(() => n.close(), 5000);
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  }

  async function requestPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  return { notify, requestPermission };
}
