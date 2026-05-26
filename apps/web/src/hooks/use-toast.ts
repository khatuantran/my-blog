import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

export type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}
