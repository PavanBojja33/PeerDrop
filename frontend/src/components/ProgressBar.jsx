import { motion } from 'framer-motion';

export default function ProgressBar({ progress = 0, label = '', showPercent = true, color = 'brand', size = 'md' }) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const gradients = {
    brand: 'from-brand-400 via-brand-500 to-neon-purple',
    green: 'from-emerald-400 to-teal-500',
    red: 'from-rose-400 to-red-500',
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || showPercent) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-slate-400 truncate max-w-[70%]">{label}</span>}
          {showPercent && (
            <span className="text-xs font-semibold text-brand-400 ml-auto">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${heights[size]} bg-slate-800 rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradients[color]}`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
