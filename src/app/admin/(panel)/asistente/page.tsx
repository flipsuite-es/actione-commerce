import AssistantChat from "@/components/admin/AssistantChat";
import { aiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default function AssistantPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Asistente</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Tu copiloto interno: conoce el estado de tu tienda y te ayuda a decidir,
        priorizar y redactar. Solo consulta tus datos; no cambia nada por su cuenta.
      </p>

      {!aiConfigured() && (
        <div className="mt-6 rounded border border-gold/30 bg-gold/5 p-4 text-sm text-ink-soft">
          Añade <code>ANTHROPIC_API_KEY</code> en Vercel (Settings → Environment
          Variables) para activar el asistente.
        </div>
      )}

      <AssistantChat />
    </div>
  );
}
