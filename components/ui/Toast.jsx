'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────────
   ToastContainer
   Props:
     toasts   — array of { id, message, type: 'success'|'error'|'warning'|'info' }
     onDismiss — (id) => void
   Usage in parent:
     const [toasts, setToasts] = useState([]);
     const addToast = useCallback((message, type = 'success', duration = 4200) => {
       const id = Date.now() + Math.random();
       setToasts(p => [...p.slice(-3), { id, message, type }]);
       setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
     }, []);
     <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(p => p.filter(t => t.id !== id))} />
───────────────────────────────────────────────────────────────────────────── */

const STYLES = {
  success: {
    border:     'rgba(34,197,94,0.28)',
    bg:         'rgba(16,44,26,0.97)',
    icon:       '✓',
    iconColor:  '#4ade80',
    iconBg:     'rgba(34,197,94,0.15)',
    textColor:  '#d1fae5',
    bar:        '#22c55e',
  },
  error: {
    border:     'rgba(239,68,68,0.28)',
    bg:         'rgba(44,10,10,0.97)',
    icon:       '✕',
    iconColor:  '#f87171',
    iconBg:     'rgba(239,68,68,0.15)',
    textColor:  '#fee2e2',
    bar:        '#ef4444',
  },
  warning: {
    border:     'rgba(245,158,11,0.28)',
    bg:         'rgba(44,30,4,0.97)',
    icon:       '⚠',
    iconColor:  '#fbbf24',
    iconBg:     'rgba(245,158,11,0.15)',
    textColor:  '#fef3c7',
    bar:        '#f59e0b',
  },
  info: {
    border:     'rgba(99,102,241,0.28)',
    bg:         'rgba(14,10,44,0.97)',
    icon:       'ℹ',
    iconColor:  '#a5b4fc',
    iconBg:     'rgba(99,102,241,0.15)',
    textColor:  '#e0e7ff',
    bar:        '#6366f1',
  },
};

function ToastItem({ toast, onDismiss }) {
  const s = STYLES[toast.type] ?? STYLES.info;
  const barRef = useRef(null);

  // Animate the progress bar draining down over the toast lifetime
  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.transition = `width ${toast.duration ?? 4200}ms linear`;
    // RAF to let layout settle before starting animation
    const id = requestAnimationFrame(() => {
      if (barRef.current) barRef.current.style.width = '0%';
    });
    return () => cancelAnimationFrame(id);
  }, [toast.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 56, scale: 0.94 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 56, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', damping: 26, stiffness: 340 }}
      style={{
        position:     'relative',
        display:      'flex',
        alignItems:   'flex-start',
        gap:          10,
        padding:      '12px 14px 14px',
        background:   s.bg,
        border:       `1px solid ${s.border}`,
        borderRadius: 14,
        backdropFilter: 'blur(20px)',
        boxShadow:    '0 8px 40px rgba(0,0,0,0.65)',
        minWidth:     260,
        maxWidth:     360,
        overflow:     'hidden',
        cursor:       'default',
      }}
    >
      {/* Accent bar left edge */}
      <div style={{
        position:   'absolute',
        top:         0,
        left:        0,
        width:       3,
        height:      '100%',
        background:  s.bar,
        borderRadius: '14px 0 0 14px',
      }} />

      {/* Icon bubble */}
      <div style={{
        width:        28,
        height:       28,
        borderRadius: 8,
        background:   s.iconBg,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     13,
        fontWeight:   700,
        color:        s.iconColor,
        flexShrink:   0,
        marginLeft:   4,
      }}>
        {s.icon}
      </div>

      {/* Message */}
      <p style={{
        flex:       1,
        fontSize:   13,
        fontWeight: 500,
        color:      s.textColor,
        lineHeight: 1.45,
        margin:     0,
        paddingTop: 4,
        wordBreak:  'break-word',
      }}>
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          color:      s.textColor,
          opacity:    0.45,
          fontSize:   14,
          padding:    '2px 4px',
          lineHeight: 1,
          flexShrink: 0,
          paddingTop: 4,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      {/* Drain progress bar at bottom */}
      <div style={{
        position:     'absolute',
        bottom:        0,
        left:          0,
        right:         0,
        height:        2,
        background:    `${s.bar}22`,
      }}>
        <div
          ref={barRef}
          style={{
            height:     '100%',
            width:      '100%',
            background: s.bar,
            opacity:    0.6,
          }}
        />
      </div>
    </motion.div>
  );
}

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position:       'fixed',
        top:             20,
        right:           20,
        zIndex:          9999,
        display:         'flex',
        flexDirection:   'column',
        gap:             10,
        pointerEvents:   'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
