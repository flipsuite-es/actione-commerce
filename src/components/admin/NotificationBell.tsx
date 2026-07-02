"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell } from "@/components/icons";
import {
  loadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/admin/actions";
import type { Notification, NotificationKind } from "@/lib/types";

const ICON: Record<NotificationKind, string> = {
  ticket_new: "✉",
  ticket_reply: "↩",
  order_new: "★",
  review_new: "✎",
};

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export default function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: Notification[];
  initialUnread: number;
}) {
  const [items, setItems] = useState<Notification[]>(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const res = await loadNotifications();
      setItems(res.items);
      setUnread(res.unread);
    } catch {
      /* sesión caducada u offline: ignora */
    }
  }

  // Sondeo cada 30 s para avisos casi en tiempo real.
  useEffect(() => {
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function onOpen() {
    const next = !open;
    setOpen(next);
    if (next) refresh();
  }

  async function onItemClick(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.url) router.push(n.url);
  }

  async function onMarkAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markAllNotificationsRead().catch(() => {});
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onOpen}
        aria-label="Notificaciones"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/25 text-ink-soft transition hover:border-gold hover:text-gold-3"
      >
        <IconBell />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-grad px-1 text-[10px] font-semibold text-[#3a2d10]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[85vw] border border-gold/25 bg-ivory shadow-lift">
          <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
            <p className="font-serif text-lg">Notificaciones</p>
            {unread > 0 && (
              <button
                onClick={onMarkAll}
                className="text-[11px] uppercase tracking-[0.14em] text-gold-3 hover:text-gold"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              No hay notificaciones.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-gold/10 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => onItemClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gold/5 ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/30 text-sm text-gold-3">
                      {ICON[n.kind] ?? "•"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-gold-grad" />}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block truncate text-xs text-ink-soft">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[11px] uppercase tracking-wider text-muted">
                        {ago(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
