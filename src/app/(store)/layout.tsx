import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { ToastProvider } from "@/lib/toast";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CartDrawer from "@/components/CartDrawer";
import { getSettings, getPages } from "@/lib/data";
import { ACCESS_COOKIE, ACCESS_VALUE } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, pages] = await Promise.all([getSettings(), getPages()]);

  if (settings.prelaunch_enabled) {
    const granted = cookies().get(ACCESS_COOKIE)?.value === ACCESS_VALUE;
    if (!granted) redirect("/acceso");
  }

  return (
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>
          <AnnouncementBar text={settings.announcement || undefined} />
          <SiteHeader />
          <main className="min-h-[60vh]">{children}</main>
          <SiteFooter settings={settings} pages={pages} />
          <CartDrawer
            freeShipThreshold={settings.free_ship_threshold}
            shippingFlat={settings.shipping_flat}
          />
        </CartProvider>
      </WishlistProvider>
    </ToastProvider>
  );
}
