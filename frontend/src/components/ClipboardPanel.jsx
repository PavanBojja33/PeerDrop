import React, { useState } from 'react';
import { usePeer } from '../context/PeerContext.jsx';

export default function ClipboardPanel() {
  const { sendClipboard, receivedClipboard } = usePeer();

  const [manualText, setManualText] = useState('');
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function readAndSend() {
    setError('');
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setError('Clipboard is empty');
        return;
      }
      sendClipboard(text);
      setStatus('Clipboard sent!');
      setTimeout(() => setStatus(''), 2500);
    } catch (e) {
      setError('Could not read clipboard. Try using the text box below instead.');
    }
  }

  function sendManual() {
    if (!manualText.trim()) return;
    sendClipboard(manualText);
    setManualText('');
    setStatus('Text sent!');
    setTimeout(() => setStatus(''), 2500);
  }

  function copyReceived() {
    if (!receivedClipboard) return;
    navigator.clipboard.writeText(receivedClipboard.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const card = "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5";

  return (
    <div className="space-y-4">

      <div className={card}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Send Clipboard</h3>

        <button
          onClick={readAndSend}
          className="w-full py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 mb-4"
        >
          Read & Send My Clipboard
        </button>

        {error && <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">{error}</p>}

        <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or type/paste text to send
          </label>
          <textarea
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none mb-3 outline-none focus:border-indigo-500"
            rows={4}
            placeholder="Paste a URL, code snippet, or any text..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
          <button
            onClick={sendManual}
            disabled={!manualText.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            Send Text
          </button>
        </div>

        {status && <p className="text-xs text-green-600 dark:text-green-400 mt-3 text-center">{status}</p>}
      </div>

      {/* Received clipboard */}
      <div className={card}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Received Clipboard</h3>

        {receivedClipboard ? (
          <div>
            <div className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-600 rounded-lg text-sm font-mono break-all whitespace-pre-wrap max-h-48 overflow-y-auto mb-3 text-gray-900 dark:text-white">
              {receivedClipboard.content}
            </div>
            <button
              onClick={copyReceived}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              {copied ? 'Copied!' : ' Copy to Clipboard'}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Received at {new Date(receivedClipboard.time).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <p className="text-sm">No clipboard received yet</p>
          </div>
        )}
      </div>

    </div>
  );
}
