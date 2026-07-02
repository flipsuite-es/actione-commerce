"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface WishItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

interface WishCtx {
  items: WishItem[];
  has: (id: string) => boolean;
  toggle: (item: WishItem) => void;
  remove: (id: string) => void;
  count: number;
}

const Ctx = createContext<WishCtx | null>(null);
const KEY = "oucy_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([]);
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

  const api = useMemo<WishCtx>(
    () => ({
      items,
      count: items.length,
      has: (id) => items.some((i) => i.id === id),
      toggle: (item) =>
        setItems((prev) =>
          prev.some((i) => i.id === item.id)
            ? prev.filter((i) => i.id !== item.id)
            : [...prev, item],
        ),
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    }),
    [items],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist dentro de <WishlistProvider>");
  return ctx;
}
