import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CartProvider } from "@/lib/cart";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CartDrawer from "@/components/CartDrawer";
import { getSettings } from "@/lib/data";
import { ACCESS_COOKIE, ACCESS_VALUE } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  // Muro de pre-lanzamiento
  if (settings.prelaunch_enabled) {
    const granted = cookies().get(ACCESS_COOKIE)?.value === ACCESS_VALUE;
    if (!granted) redirect("/acceso");
  }

  return (
    <CartProvider>
      <SiteHeader announcement={settings.announcement || undefined} />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-5">{children}</main>
      <SiteFooter />
      <CartDrawer
        freeShipThreshold={settings.free_ship_threshold}
        shippingFlat={settings.shipping_flat}
      />
    </CartProvider>
  );
}
