import React, { useState, useEffect, useRef } from 'react';
import { usePeer } from '../context/PeerContext.jsx';

export default function TextChatPanel() {
  const { messages, sendMessage, peerDeviceName, localDeviceName } = usePeer();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 flex flex-col h-[460px]">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 shrink-0">
        Chat
        {peerDeviceName && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">with {peerDeviceName}</span>
        )}
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.from === 'me' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3.5 py-2 rounded-2xl text-sm max-w-xs break-words ${
                msg.from === 'me'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 px-1">
                {msg.from === 'me' ? (localDeviceName || 'You') : (peerDeviceName || 'Peer')} ·{' '}
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <textarea
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none outline-none focus:border-indigo-500"
          rows={2}
          placeholder="Type a message... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg self-end"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
