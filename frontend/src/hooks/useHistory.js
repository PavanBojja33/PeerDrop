// Simple hook to read and write transfer history from localStorage

export function useHistory() {
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem('pd_history') || '[]');
    } catch {
      return [];
    }
  }

  function addHistory(entry) {
    const existing = getAll();
    const newEntry = { id: Date.now(), timestamp: Date.now(), ...entry };
    const updated = [newEntry, ...existing].slice(0, 50);
    localStorage.setItem('pd_history', JSON.stringify(updated));
  }

  function clearHistory() {
    localStorage.removeItem('pd_history');
  }

  return { getAll, addHistory, clearHistory };
}
