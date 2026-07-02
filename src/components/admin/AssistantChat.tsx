"use client";

import { useRef, useState } from "react";
import { askAssistant } from "@/app/admin/actions";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Qué me falta por hacer antes de lanzar?",
  "¿Qué productos tengo que reponer y a qué proveedor?",
  "Resúmeme el estado de la tienda.",
  "Escríbeme un correo a Smile Joyas para pedir novedades.",
];

export default function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setError("");
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await askAssistant(next);
      if (!r.ok) setError(r.error);
      else setMessages([...next, { role: "assistant", content: r.text }]);
    } catch (err: any) {
      setError(err?.message || "No se pudo obtener respuesta.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  return (
    <div className="mt-6 flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-4">
        {messages.length === 0 && (
          <div className="card p-6">
            <p className="text-sm text-muted">
              Pregúntame por el estado de la tienda, qué priorizar, o pídeme que te
              redacte un correo. Consulto tus datos del panel; no cambio nada por mi
              cuenta.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="btn-outline text-left text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-gold/15 text-ink"
                  : "card text-ink-soft"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="card px-4 py-3 text-sm text-muted">Pensando…</div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 mt-4 flex gap-2 bg-ivory py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="input flex-1"
          disabled={loading}
        />
        <button type="submit" className="btn-gold disabled:opacity-50" disabled={loading}>
          Enviar
        </button>
      </form>
    </div>
  );
}
