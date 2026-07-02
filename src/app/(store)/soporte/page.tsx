import type { Metadata } from "next";
import SupportCenter from "@/components/SupportCenter";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Soporte y contacto",
  description:
    "¿Necesitas ayuda con tu pedido o tienes una duda? Abre un ticket de soporte y te respondemos lo antes posible.",
};

export default async function SoportePage() {
  const settings = await getSettings();

  return (
    <div className="container-lux py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="kicker">Estamos para ayudarte</p>
        <h1 className="heading mt-3 text-4xl sm:text-5xl">Soporte y contacto</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Abre un ticket con tu duda o incidencia y te respondemos por correo.
          Guarda tu referencia para seguir la conversación cuando quieras.
        </p>
        <div className="mx-auto mt-6 hairline" />
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <SupportCenter contactEmail={settings.contact_email || undefined} />
      </div>
    </div>
  );
}
