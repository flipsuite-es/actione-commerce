"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {
  syncWishlist,
  addWishlist,
  removeWishlist,
} from "@/app/(store)/wishlist-actions";

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
  const [userId, setUserId] = useState<string | null>(null);
  const itemsRef = useRef<WishItem[]>([]);
  itemsRef.current = items;

  // Cargar de localStorage al arrancar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // Persistir en localStorage (fuente rápida y para anónimos).
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  // Sincronizar con la cuenta: al iniciar sesión mezcla local + servidor.
  useEffect(() => {
    if (!ready) return;
    const supabase = createSupabaseBrowser();
    let mounted = true;

    async function sync(uid: string | null) {
      setUserId(uid);
      if (!uid) return;
      const merged = await syncWishlist(itemsRef.current);
      if (mounted && Array.isArray(merged)) setItems(merged);
    }

    supabase.auth.getUser().then(({ data }) => sync(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      sync(session?.user?.id ?? null),
    );
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [ready]);

  const api = useMemo<WishCtx>(
    () => ({
      items,
      count: items.length,
      has: (id) => items.some((i) => i.id === id),
      toggle: (item) =>
        setItems((prev) => {
          const exists = prev.some((i) => i.id === item.id);
          if (userId) {
            if (exists) removeWishlist(item.id);
            else addWishlist(item);
          }
          return exists
            ? prev.filter((i) => i.id !== item.id)
            : [...prev, item];
        }),
      remove: (id) =>
        setItems((prev) => {
          if (userId) removeWishlist(id);
          return prev.filter((i) => i.id !== id);
        }),
    }),
    [items, userId],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist dentro de <WishlistProvider>");
  return ctx;
}
