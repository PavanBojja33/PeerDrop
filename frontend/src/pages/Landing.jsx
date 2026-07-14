import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { FiSun, FiMoon, FiShare2, FiZap, FiLock, FiCpu } from 'react-icons/fi';

const steps = [
  { n: '1', title: 'Enter Your Name', desc: 'No account needed. Just type a name so your peer knows who you are.' },
  { n: '2', title: 'Create or Join a Room', desc: 'Share a 6-digit code or scan a QR code to pair your devices.' },
  { n: '3', title: 'Share Everything', desc: 'Drop files, paste clipboard text, or chat — all peer-to-peer.' },
];

const advantages = [
  { icon: FiCpu, title: 'Zero Setup', desc: 'Runs directly in your browser. No downloads, installations, or registration required.' },
  { icon: FiLock, title: 'Privacy First', desc: 'Files never touch a server. Direct WebRTC transfers are secured with peer-to-peer encryption.' },
  { icon: FiZap, title: 'Fast Direct Transfer', desc: 'Transfer speed is only limited by your local network capability.' },
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
            <FiShare2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold">PeerDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
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
            Start Sharing — It's Free
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-900"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 max-w-6xl mx-auto px-4 border-t border-gray-100 dark:border-slate-900" id="how-it-works">
        <h2 className="text-2xl font-bold text-center mb-2">How it works</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Three simple steps to start sharing</p>
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
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Direct, secure, and fast communication</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {advantages.map(a => {
              const Icon = a.icon;
              return (
                <div key={a.title} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 text-center shadow-sm">
                  <div className="flex justify-center mb-4">
                    <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white">{a.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{a.desc}</p>
                </div>
              );
            })}
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
          Open PeerDrop App
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FiShare2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-gray-900 dark:text-white">PeerDrop</span>
        </div>
        <p>No tracking · No ads · Files never leave your browser</p>
      </footer>

    </div>
  );
}
