import Checkout from "@/components/Checkout";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cesta · Oucy Studios" };

export default async function CarritoPage() {
  const settings = await getSettings();
  return (
    <Checkout
      freeShipThreshold={settings.free_ship_threshold}
      shippingFlat={settings.shipping_flat}
    />
  );
}
