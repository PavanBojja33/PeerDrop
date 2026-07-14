import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePeer } from '../context/PeerContext.jsx';
import { useNotifications } from '../hooks/useNotifications.js';
import QRScanner from './QRScanner.jsx';
import {
  FiCopy,
  FiLink,
  FiCamera,
  FiAlertTriangle,
  FiCheck,
  FiLogOut,
} from 'react-icons/fi';

export default function RoomPanel({ joinCodeFromURL = null }) {
  const { status, roomCode, localDeviceName, createRoom, joinRoom, disconnect } = usePeer();
  const { requestPermission } = useNotifications();

  const [mode, setMode] = useState('create');
  const [codeInput, setCodeInput] = useState(joinCodeFromURL || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  async function handleCreate() {
    requestPermission();
    setLoading(true);
    setError('');
    try {
      await createRoom(localDeviceName);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleJoin(code = codeInput) {
    const clean = String(code).trim().replace(/\s/g, '');
    if (!/^\d{6}$/.test(clean)) {
      setError('Please enter a 6-digit room code');
      return;
    }
    requestPermission();
    setLoading(true);
    setError('');
    try {
      await joinRoom(clean, localDeviceName);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Auto-join if URL has a code
  useEffect(() => {
    if (joinCodeFromURL && localDeviceName && status === 'idle') {
      setMode('join');
      handleJoin(joinCodeFromURL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScan(data) {
    setIsScanning(false);
    // Parse if it's a URL
    const match = data.match(/\/join\/(\d{6})/);
    if (match) {
      setCodeInput(match[1]);
      handleJoin(match[1]);
    } else if (/^\d{6}$/.test(data.trim())) {
      setCodeInput(data.trim());
      handleJoin(data.trim());
    } else {
      setError('Invalid QR Code. Please scan a valid PeerDrop code.');
    }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  const inviteLink = roomCode ? `${window.location.origin}/join/${roomCode}` : '';

  // ── Already connected ──────────────────────────────────────────────────
  if (status === 'connected') {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Room</h2>
          <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Connected
          </span>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">
            {roomCode}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Room code</p>
        </div>
      </div>
    );
  }

  // ── Waiting for peer (host) ────────────────────────────────────────────
  if (status === 'connecting' && roomCode) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Room</h2>
          <span className="text-xs text-yellow-600 dark:text-yellow-400">Waiting for peer...</span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">Share this code</p>
        <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-widest text-center mb-4">
          {roomCode}
        </div>

        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 mb-3"
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>

        {showQR && (
          <div className="flex justify-center p-3 bg-white rounded-lg mb-3">
            <QRCodeSVG value={inviteLink} size={150} fgColor="#4338ca" />
          </div>
        )}

        <button
          onClick={() => copyText(roomCode, 'code')}
          className="w-full py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 mb-2"
        >
          {copied === 'code' ? (
            <span className="flex items-center justify-center gap-1.5"><FiCheck className="w-4 h-4 text-green-500" /> Copied!</span>
          ) : (
            <span className="flex items-center justify-center gap-1.5"><FiCopy className="w-4 h-4" /> Copy Code</span>
          )}
        </button>

        <button
          onClick={() => copyText(inviteLink, 'link')}
          className="w-full py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 mb-3"
        >
          {copied === 'link' ? (
            <span className="flex items-center justify-center gap-1.5"><FiCheck className="w-4 h-4 text-green-500" /> Copied!</span>
          ) : (
            <span className="flex items-center justify-center gap-1.5"><FiLink className="w-4 h-4" /> Copy Invite Link</span>
          )}
        </button>

        <button
          onClick={disconnect}
          className="w-full text-sm text-red-500 hover:text-red-600 py-1"
        >
          Cancel
        </button>
      </div>
    );
  }

  // ── Idle: create or join ───────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Connect Devices</h2>

      <div className="flex rounded-lg border border-gray-200 dark:border-slate-600 p-1 mb-5">
        <button
          onClick={() => { setMode('create'); setError(''); }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === 'create' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Create Room
        </button>
        <button
          onClick={() => { setMode('join'); setError(''); }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === 'join' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Join Room
        </button>
      </div>

      {mode === 'create' ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Generate a room code and share it with the other device.
          </p>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      ) : isScanning ? (
        <div className="mb-4">
          <QRScanner onScan={handleScan} onCancel={() => setIsScanning(false)} />
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Enter the 6-digit code or scan the host's QR code.
          </p>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={6}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-center text-xl font-mono tracking-widest bg-white dark:bg-slate-900 text-gray-900 dark:text-white mb-3 outline-none focus:border-indigo-500"
            placeholder="000000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleJoin()}
              disabled={loading || codeInput.length !== 6}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
            <button
              onClick={() => setIsScanning(true)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-600 flex items-center justify-center gap-1.5"
              title="Scan QR Code"
            >
              <FiCamera className="w-4 h-4" /> Scan
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {status === 'disconnected' && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
          <FiAlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" /> Peer disconnected. Create or join a new room.
        </div>
      )}
    </div>
  );
}
