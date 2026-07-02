import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oucystudios.com";

export const viewport: Viewport = {
  themeColor: "#fbf8f1",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Oucy Studios · Joyas que duran, no se oxidan",
    template: "%s · Oucy Studios",
  },
  description:
    "Joyas doradas de acero, elegantes y atemporales que no se oxidan. Para llevar cada día y para regalar.",
  openGraph: {
    title: "Oucy Studios",
    description: "Joyas doradas que no se oxidan. Elegantes y atemporales.",
    type: "website",
    locale: "es_ES",
    images: ["/logo.png"],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans text-ink">{children}</body>
    </html>
  );
}
