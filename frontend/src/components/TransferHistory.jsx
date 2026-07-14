import React, { useState } from 'react';
import { useHistory } from '../hooks/useHistory.js';
import { formatBytes, getFileIcon } from '../utils/fileUtils.js';
import {
  FiImage,
  FiVideo,
  FiMusic,
  FiFileText,
  FiArchive,
  FiFile,
  FiTrash2,
  FiInbox,
} from 'react-icons/fi';

const iconMap = {
  image: FiImage,
  video: FiVideo,
  audio: FiMusic,
  pdf: FiFileText,
  zip: FiArchive,
  text: FiFileText,
  file: FiFile,
};

function FileIcon({ type, className }) {
  const IconComponent = iconMap[type] || FiFile;
  return <IconComponent className={className} />;
}

export default function TransferHistory() {
  const { getAll, clearHistory } = useHistory();
  const [history, setHistory] = useState(() => getAll());
  const [tab, setTab] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    clearHistory();
    setHistory([]);
    setConfirmClear(false);
  }

  const filtered = history.filter(e => {
    if (tab === 'all') return true;
    return e.direction === tab;
  });

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Transfer History</h3>
        {history.length > 0 && (
          <button
            onClick={() => setConfirmClear(!confirmClear)}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
          >
            <FiTrash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {confirmClear && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">Clear all history?</p>
          <div className="flex gap-2">
            <button onClick={handleClear} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg">Yes, Clear</button>
            <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border border-gray-200 dark:border-slate-600 rounded-lg p-1">
        {['all', 'sent', 'received'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1 rounded-md text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {t === 'all' ? 'All' : t === 'sent' ? 'Sent' : 'Received'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
          <div className="flex justify-center mb-2">
            <FiInbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm">No transfers yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {filtered.map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-600 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileIcon type={getFileIcon(entry.mimeType)} className="w-5 h-5 text-gray-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{entry.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.direction === 'sent' ? 'Sent' : 'Received'} · {formatBytes(entry.size)} · {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                entry.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {entry.status === 'done' ? 'Done' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
