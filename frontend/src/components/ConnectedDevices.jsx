import React, { useState } from 'react';
import { usePeer } from '../context/PeerContext.jsx';
import { FiMonitor, FiSmartphone, FiEdit2 } from 'react-icons/fi';

export default function ConnectedDevices() {
  const { status, localDeviceName, peerDeviceName, setLocalDeviceName } = usePeer();

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(localDeviceName);

  function handleSave(e) {
    e.preventDefault();
    if (nameInput.trim().length < 2) return;
    setLocalDeviceName(nameInput);
    setEditing(false);
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Devices</h2>

      {/* My device */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">This Device</p>

        {editing ? (
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg">✕</button>
          </form>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-600">
            <div className="flex items-center gap-3">
              <FiMonitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">{localDeviceName || 'My Device'}</p>
                <p className="text-xs text-green-600 dark:text-green-400">● You</p>
              </div>
            </div>
            <button
              onClick={() => { setEditing(true); setNameInput(localDeviceName); }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <FiEdit2 className="w-3 h-3" /> Edit
            </button>
          </div>
        )}
      </div>

      {/* Peer device */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">Peer Device</p>

        {status === 'connected' && peerDeviceName ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <FiSmartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-white">{peerDeviceName}</p>
              <p className="text-xs text-green-600 dark:text-green-400">● Online</p>
            </div>
          </div>
        ) : status === 'connecting' ? (
          <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for peer...</p>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-dashed border-gray-200 dark:border-slate-600">
            <p className="text-sm text-gray-400 dark:text-gray-500">No peer connected</p>
          </div>
        )}
      </div>
    </div>
  );
}
