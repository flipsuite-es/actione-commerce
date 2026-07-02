import Checkout from "@/components/Checkout";
import { getSettings } from "@/lib/data";
import { getAuthUser, getMyProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cesta" };

export default async function CarritoPage() {
  const [settings, user, profile] = await Promise.all([
    getSettings(),
    getAuthUser(),
    getMyProfile(),
  ]);
  return (
    <Checkout
      freeShipThreshold={settings.free_ship_threshold}
      shippingFlat={settings.shipping_flat}
      initial={{
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: profile?.phone || "",
      }}
    />
  );
}
