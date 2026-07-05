import React, { useEffect } from 'react';
import { formatBytes } from '../utils/fileUtils.js';

export default function FilePreviewModal({ file, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function renderContent() {
    const { mimeType, url, name } = file;

    if (mimeType.startsWith('image/')) {
      return <img src={url} alt={name} className="max-w-full max-h-96 object-contain rounded-lg" />;
    }
    if (mimeType.startsWith('video/')) {
      return <video src={url} controls className="max-w-full max-h-96 rounded-lg" />;
    }
    if (mimeType.startsWith('audio/')) {
      return (
        <div className="text-center py-8">
          <p className="text-5xl mb-4">🎵</p>
          <p className="font-medium mb-4 text-gray-900 dark:text-white">{name}</p>
          <audio src={url} controls className="w-full" />
        </div>
      );
    }
    if (mimeType === 'application/pdf') {
      return <iframe src={url} title={name} className="w-full rounded-lg" style={{ height: '60vh' }} />;
    }
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-5xl mb-3">📄</p>
        <p className="text-sm">Preview not available</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-3xl shadow-2xl">

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{file.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-xl p-4 mb-4">
          {renderContent()}
        </div>

        <a
          href={file.url}
          download={file.name}
          className="block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
        >
          ⬇️ Download {file.name}
        </a>

      </div>
    </div>
  );
}
