import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oucy Studios · Joyas que duran, no se oxidan",
  description:
    "Joyas doradas de acero, elegantes y atemporales que no se oxidan. Para llevar cada día y para regalar.",
  openGraph: {
    title: "Oucy Studios",
    description: "Joyas doradas que no se oxidan. Elegantes y atemporales.",
    type: "website",
  },
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
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="font-sans text-ink">{children}</body>
    </html>
  );
}
