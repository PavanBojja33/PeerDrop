import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiWifi, FiWifiOff, FiLoader } from 'react-icons/fi';

const states = {
  idle: { label: 'Waiting for peer…', color: 'text-slate-400', bg: 'bg-slate-700/40', dot: 'bg-slate-500', pulse: false },
  connecting: { label: 'Connecting…', color: 'text-amber-400', bg: 'bg-amber-900/30', dot: 'bg-amber-400', pulse: true },
  connected: { label: 'Peer Connected', color: 'text-emerald-400', bg: 'bg-emerald-900/30', dot: 'bg-emerald-400', pulse: true },
  disconnected: { label: 'Peer Disconnected', color: 'text-rose-400', bg: 'bg-rose-900/30', dot: 'bg-rose-400', pulse: false },
  error: { label: 'Connection Failed', color: 'text-rose-400', bg: 'bg-rose-900/30', dot: 'bg-rose-500', pulse: false },
};

export default function ConnectionStatus({ state = 'idle' }) {
  const cfg = states[state] || states.idle;

  const Icon = state === 'connected' ? FiWifi : state === 'disconnected' || state === 'error' ? FiWifiOff : FiLoader;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full ${cfg.bg} border border-white/10 backdrop-blur-sm`}
    >
      <span className={`relative flex h-2.5 w-2.5`}>
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dot}`} />
      </span>
      <Icon className={`${cfg.color} ${state === 'connecting' ? 'animate-spin' : ''}`} size={14} />
      <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
    </motion.div>
  );
}
