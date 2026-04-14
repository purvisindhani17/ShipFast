import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// ── Theme Context ────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('sf_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('sf_theme', theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Toast Context ────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle className="w-4 h-4" />,
  error:   <AlertCircle className="w-4 h-4" />,
  info:    <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#ef4444' },
  info:    { bg: 'rgba(67,97,238,0.12)',  border: 'rgba(67,97,238,0.3)',  text: '#4361ee' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration || 4000);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  const c = COLORS[toast.type] || COLORS.info;

  return (
    <div
      className={exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '12px',
        border: `1px solid ${c.border}`,
        background: `color-mix(in srgb, var(--bg-surface) 85%, transparent)`,
        backdropFilter: 'blur(12px)',
        boxShadow: 'var(--shadow)',
        minWidth: '280px',
        maxWidth: '380px',
        marginBottom: '8px',
      }}
    >
      <span style={{ color: c.text, marginTop: '1px', flexShrink: 0 }}>{ICONS[toast.type]}</span>
      <div style={{ flex: 1 }}>
        {toast.title && (
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          {toast.message}
        </div>
      </div>
      <button onClick={dismiss} style={{ color: 'var(--text-dim)', flexShrink: 0, cursor: 'pointer', background: 'none', border: 'none', padding: '1px' }}>
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type, message, title, duration) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message, title, duration }]);
  }, []);

  const success = useCallback((message, title) => toast('success', message, title), [toast]);
  const error   = useCallback((message, title) => toast('error',   message, title), [toast]);
  const info    = useCallback((message, title) => toast('info',    message, title), [toast]);
  const warning = useCallback((message, title) => toast('warning', message, title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
