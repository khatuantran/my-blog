import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastItem, type ToastType } from '@/hooks/use-toast';

const AUTO_DISMISS_MS = 2500;

const VARIANT_CLASS: Record<ToastType, string> = {
  success: 'border-grn/40 bg-grn/10 text-grn',
  error: 'border-red/40 bg-red/10 text-red',
  info: 'border-cyan/40 bg-cyan/10 text-cyan',
};

const VARIANT_ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

type Props = {
  children: ReactNode;
};

// ToastProvider — wrap AppLayout. Renders toast stack bottom-right.
// Hook `useToast()` returns showToast(msg, type?).
export function ToastProvider({ children }: Props) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-11 right-5 z-[200] flex flex-col gap-2"
        data-testid="toast-stack"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            data-testid={`toast-${t.type}`}
            className={`flex items-center gap-2 rounded-md border px-4 py-2.5 font-mono text-mono-md animate-slide-down ${VARIANT_CLASS[t.type]}`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}
          >
            <span aria-hidden="true">{VARIANT_ICON[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
