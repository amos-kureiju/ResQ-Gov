import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertOctagon, X } from 'lucide-react';
import type { ActionResult } from '../types';

interface Toast { id: number; ok: boolean; text: string }

const ToastCtx = createContext<(r: ActionResult) => boolean>(() => false);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /** Tampilkan hasil aksi. Mengembalikan true bila sukses. */
  const show = useCallback((r: ActionResult) => {
    const id = Date.now() + Math.random();
    const text = r.ok ? r.message ?? 'Berhasil disimpan.' : r.error;
    setToasts((t) => [...t, { id, ok: r.ok, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), r.ok ? 3500 : 6500);
    return r.ok;
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.ok ? 'toast-ok' : 'toast-err'}`}>
            {t.ok ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
            <span>{t.text}</span>
            <button className="icon-btn" aria-label="Tutup" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export const useToast = () => useContext(ToastCtx);
