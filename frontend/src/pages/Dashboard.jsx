import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePeer } from '../context/PeerContext.jsx';
import { FiLink, FiShare2 } from 'react-icons/fi';
import Navbar from '../components/Navbar.jsx';
import RoomPanel from '../components/RoomPanel.jsx';
import ConnectedDevices from '../components/ConnectedDevices.jsx';
import FileSharePanel from '../components/FileSharePanel.jsx';
import ClipboardPanel from '../components/ClipboardPanel.jsx';
import TextChatPanel from '../components/TextChatPanel.jsx';
import TransferHistory from '../components/TransferHistory.jsx';
import { useNotifications } from '../hooks/useNotifications.js';

export default function Dashboard() {
  const { status, localDeviceName, setLocalDeviceName } = usePeer();
  const [searchParams] = useSearchParams();
  const [nameInput, setNameInput] = useState(localDeviceName);
  const [nameSet, setNameSet] = useState(!!localDeviceName);
  const [nameError, setNameError] = useState('');
  const [activeTab, setActiveTab] = useState('files');
  const { requestPermission } = useNotifications();

  function handleSetName(e) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameError('Please enter at least 2 characters');
      return;
    }
    setLocalDeviceName(trimmed);
    setNameSet(true);
    setNameError('');
    requestPermission();
  }

  const isConnected = status === 'connected';

  // Name entry gate
  if (!nameSet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <FiShare2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome to PeerDrop</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter a name so your peer knows who's connecting</p>
            </div>
            <form onSubmit={handleSetName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Your Device Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  placeholder="e.g. Pavan's Laptop"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">

          {/* Left: Connection panels */}
          <div className="space-y-4">
            <RoomPanel joinCodeFromURL={searchParams.get('join')} />
            <ConnectedDevices />
          </div>

          {/* Right: Content panels */}
          <div className="space-y-4">

            {/* Tab bar (only shown when connected) */}
            {isConnected && (
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1.5">
                <div className="flex gap-1">
                  {[
                    { id: 'files', label: 'Files' },
                    { id: 'clipboard', label: 'Clipboard' },
                    { id: 'chat', label: 'Chat' },
                    { id: 'history', label: 'History' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Panel content */}
            {!isConnected ? (
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center">
                <div className="flex justify-center mb-4">
                  <FiLink className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Not connected</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Create or join a room on the left to start sharing.
                </p>
              </div>
            ) : (
              <>
                {activeTab === 'files' && <FileSharePanel />}
                {activeTab === 'clipboard' && <ClipboardPanel />}
                {activeTab === 'chat' && <TextChatPanel />}
                {activeTab === 'history' && <TransferHistory />}
              </>
            )}

            {/* History always visible when not connected */}
            {!isConnected && <TransferHistory />}

          </div>
        </div>
      </div>
    </div>
  );
}
