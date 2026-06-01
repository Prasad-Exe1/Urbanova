import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
};

const icons = {
  success: <CheckCircle size={20} className="text-primary" />,
  error: <AlertCircle size={20} className="text-error" />,
  info: <Info size={20} className="text-tertiary" />,
};

const borderCls = {
  success: 'border-primary',
  error: 'border-error',
  info: 'border-tertiary',
};

function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-auto z-[1200] pointer-events-none flex justify-center sm:justify-end">
      <AnimatePresence>
        {message && (
          <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`glass-panel pointer-events-auto flex items-center gap-md min-w-[280px] max-w-[400px] rounded-xl border-l-4 pr-md py-md pl-lg shadow-xl ${borderCls[type] || borderCls.info} border-y border-r border-white/10`}
          >
            <div className="shrink-0">{icons[type] || icons.info}</div>
            <div className="flex-1 font-body-md text-on-background text-sm leading-snug">{message}</div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 bg-transparent border-none text-on-surface-variant hover:text-on-background p-xs rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
