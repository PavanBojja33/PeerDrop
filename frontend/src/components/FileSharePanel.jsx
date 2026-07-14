import React, { useState, useRef } from 'react';
import { usePeer } from '../context/PeerContext.jsx';
import { formatBytes, getFileIcon, isPreviewable } from '../utils/fileUtils.js';
import FilePreviewModal from './FilePreviewModal.jsx';
import {
  FiImage,
  FiVideo,
  FiMusic,
  FiFileText,
  FiArchive,
  FiFile,
  FiFolderPlus,
  FiCheck,
  FiX,
  FiUploadCloud,
  FiEye,
  FiDownload,
  FiArrowDown,
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

export default function FileSharePanel() {
  const { sendFiles, incomingRequests, activeTransfers, receivedFiles, acceptFile, rejectFile } = usePeer();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  function addFiles(fileList) {
    const newFiles = Array.from(fileList);
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...newFiles.filter(f => !existing.has(f.name + f.size))];
    });
  }

  function removeFile(index) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  async function handleSend() {
    if (selectedFiles.length === 0 || sending) return;
    setSending(true);
    try {
      await sendFiles(selectedFiles);
      setSelectedFiles([]);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  const card = "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5";

  return (
    <div className="space-y-4">

      {/* Incoming file requests */}
      {incomingRequests.map(req => (
        <div key={req.fileId} className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon type={getFileIcon(req.mimeType)} className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">{req.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(req.size)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => acceptFile(req.fileId)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg flex items-center gap-1"
              >
                <FiCheck className="w-3.5 h-3.5" /> Accept
              </button>
              <button
                onClick={() => rejectFile(req.fileId)}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg flex items-center gap-1"
              >
                <FiX className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
            <FiArrowDown className="w-3.5 h-3.5" /> Incoming file from peer
          </p>
        </div>
      ))}

      {/* Active transfers progress */}
      {Object.values(activeTransfers).length > 0 && (
        <div className={card}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Transfers</h3>
          <div className="space-y-4">
            {Object.values(activeTransfers).map(t => (
              <div key={t.fileId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <FileIcon type={getFileIcon(t.mimeType)} className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white truncate max-w-xs">{t.name}</span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{t.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t.status === 'done' ? 'bg-green-500' : t.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.direction === 'sending' ? 'Sending' : 'Receiving'}
                  {t.status === 'waiting' ? ' — waiting for accept...' : ''}
                  {t.status === 'done' ? ' — Done' : ''}
                  {t.status === 'error' ? ' — Failed' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send files panel */}
      <div className={card}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Send Files</h3>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer mb-4 transition-colors ${
            dragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-slate-600 hover:border-indigo-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex justify-center mb-3">
            <FiUploadCloud className="w-10 h-10 text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop files here or click to browse</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Images · Videos · PDFs · ZIPs · Documents</p>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>

        {/* Folder select */}
        <button
          onClick={() => folderInputRef.current?.click()}
          className="w-full py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 mb-4 flex items-center justify-center gap-2"
        >
          <FiFolderPlus className="w-4 h-4" /> Select Folder
        </button>
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((f, i) => (
              <div key={f.name + f.size} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-600 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon type={getFileIcon(f.type)} className="w-5 h-5 text-gray-500" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(f.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500 ml-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={selectedFiles.length === 0 || sending}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {sending ? 'Sending...' : selectedFiles.length > 0 ? `Send ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Select Files to Send'}
        </button>
      </div>

      {/* Received files */}
      {receivedFiles.length > 0 && (
        <div className={card}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Received Files</h3>
          <div className="space-y-2">
            {receivedFiles.map(f => (
              <div key={f.fileId} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-600 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon type={getFileIcon(f.mimeType)} className="w-5 h-5 text-gray-500" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(f.size)}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-2 shrink-0">
                  {isPreviewable(f.mimeType) && (
                    <button onClick={() => setPreviewFile(f)} className="px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <FiEye className="w-3 h-3" /> Preview
                    </button>
                  )}
                  <a href={f.url} download={f.name} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center gap-1">
                    <FiDownload className="w-3 h-3" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
