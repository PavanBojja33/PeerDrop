import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

const features = [
  { icon: '⚡', title: 'Lightning Fast', desc: 'WebRTC transfers files directly between browsers at full network speed.' },
  { icon: '🔒', title: 'Private by Design', desc: 'Files never touch a server. Your data goes directly to your peer.' },
  { icon: '📱', title: 'Cross Platform', desc: 'Works on any device with a modern browser — phone, tablet, or laptop.' },
  { icon: '🔗', title: 'Easy Pairing', desc: 'Connect with a 6-digit code, QR scan, or a shareable invite link.' },
  { icon: '📂', title: 'Any File Type', desc: 'Images, videos, PDFs, ZIPs, documents, audio — share anything.' },
  { icon: '💬', title: 'Chat & Clipboard', desc: 'Share text, URLs, and code snippets alongside your files.' },
];

const steps = [
  { n: '1', title: 'Enter Your Name', desc: 'No account needed. Just type a name so your peer knows who you are.' },
  { n: '2', title: 'Create or Join a Room', desc: 'Share a 6-digit code or scan a QR code to pair your devices.' },
  { n: '3', title: 'Share Everything', desc: 'Drop files, paste clipboard text, or chat — all peer-to-peer.' },
];

const advantages = [
  { icon: '🚫', title: 'No Installation', desc: 'Runs in the browser. Nothing to download.' },
  { icon: '🔑', title: 'No Login', desc: 'Zero accounts, zero registration.' },
  { icon: '🌐', title: 'Browser-to-Browser', desc: 'Direct WebRTC — no middleman for data.' },
  { icon: '☁️', title: 'No Cloud Storage', desc: 'Files never uploaded to any server.' },
  { icon: '💻', title: 'Cross Platform', desc: 'Chrome, Firefox, Safari, Edge.' },
  { icon: '🚀', title: 'Fast Transfers', desc: 'Limited only by your network speed.' },
  { icon: '🛡️', title: 'Privacy Focused', desc: 'WebRTC uses DTLS encryption.' },
  { icon: '📷', title: 'QR Code Pairing', desc: 'Scan and connect instantly.' },
  { icon: '🔢', title: 'Room Code Pairing', desc: 'Simple 6-digit code to connect.' },
  { icon: '🪶', title: 'Lightweight', desc: 'Minimal UI, fast loads, no bloat.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white">

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪂</span>
            <span className="font-bold">PeerDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium"
            >
              Open App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          No login · No cloud · 100% peer-to-peer
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
          Share files directly{' '}
          <span className="text-indigo-600 dark:text-indigo-400">browser to browser</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          PeerDrop uses WebRTC to transfer files, clipboard text, and messages directly between your devices. No servers. No accounts. No limits.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
          >
            🪂 Start Sharing — It's Free
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-900"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-slate-900 border-y border-gray-200 dark:border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-2">Everything you need</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Built with the web platform — no plugins needed</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 max-w-6xl mx-auto px-4" id="how-it-works">
        <h2 className="text-2xl font-bold text-center mb-2">How it works</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Three steps to start sharing</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(s => (
            <div key={s.n} className="text-center">
              <div className="text-5xl font-black text-indigo-200 dark:text-indigo-900 mb-3">{s.n}</div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advantages */}
      <section className="bg-gray-50 dark:bg-slate-900 border-y border-gray-200 dark:border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-2">Why PeerDrop?</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">10 reasons to choose peer-to-peer</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {advantages.map(a => (
              <div key={a.title} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="font-semibold text-sm mb-1">{a.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Ready to drop some files?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Open PeerDrop on two devices and connect in seconds.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
        >
          🚀 Open PeerDrop App
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🪂</span>
          <span className="font-semibold text-gray-900 dark:text-white">PeerDrop</span>
        </div>
        <p>No tracking · No ads · Files never leave your browser</p>
      </footer>

    </div>
  );
}
