"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/lib/types";

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "oucy_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const api = useMemo<CartCtx>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
    return {
      items,
      count,
      subtotal,
      open,
      setOpen,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found)
            return prev.map((p) =>
              p.id === item.id ? { ...p, qty: p.qty + qty } : p,
            );
          return [...prev, { ...item, qty }];
        }),
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          prev
            .map((p) => (p.id === id ? { ...p, qty: Math.max(1, qty) } : p))
            .filter((p) => p.qty > 0),
        ),
      clear: () => setItems([]),
    };
  }, [items, open]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
