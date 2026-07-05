import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePeer } from '../context/PeerContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const { status, roomCode, disconnect } = usePeer();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';

  const statusText = {
    idle: 'Not connected',
    connecting: 'Connecting...',
    connected: roomCode ? `Room: ${roomCode}` : 'Connected',
    disconnected: 'Disconnected',
  };

  const statusColor = {
    idle: 'bg-gray-400',
    connecting: 'bg-yellow-400',
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="text-xl">🪂</span>
          <span className="font-bold text-gray-900 dark:text-white">PeerDrop</span>
        </button>

        {isDashboard && (
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${statusColor[status] || 'bg-gray-400'}`}></span>
            <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">
              {statusText[status] || 'Unknown'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isDashboard && status === 'connected' && (
            <button
              onClick={disconnect}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg"
            >
              Disconnect
            </button>
          )}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {!isDashboard && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg"
            >
              Open App
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
