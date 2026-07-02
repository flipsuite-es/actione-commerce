import type { Metadata } from "next";
import OrderTracker from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seguimiento de tu pedido · Oucy Studios",
  description:
    "Consulta el estado de tu pedido con tu referencia y tu correo: recibido, pagado y enviado, con número de seguimiento.",
};

export default function PedidoPage() {
  return (
    <div className="container-lux py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="kicker">Tu pedido</p>
        <h1 className="heading mt-3 text-4xl sm:text-5xl">Seguimiento del pedido</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Introduce la referencia que te dimos al confirmar y tu correo para ver el
          estado de tu pedido.
        </p>
        <div className="mx-auto mt-6 hairline" />
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <OrderTracker />
      </div>
    </div>
  );
}
