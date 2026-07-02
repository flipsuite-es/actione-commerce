"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface Toast {
  id: number;
  text: string;
}
interface ToastCtx {
  toast: (text: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((text: string) => {
    setItems((prev) => {
      const id = (prev[prev.length - 1]?.id ?? 0) + 1;
      const next = [...prev, { id, text }];
      setTimeout(() => {
        setItems((cur) => cur.filter((t) => t.id !== id));
      }, 2600);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto flex items-center gap-2 border border-gold/30 bg-ivory/95 px-5 py-3 text-sm text-ink shadow-lift backdrop-blur"
          >
            <span className="gold-text font-serif text-lg leading-none">✦</span>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  return ctx ?? { toast: () => {} };
}
