import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oucy Studios",
    short_name: "Oucy",
    description: "Joyería atemporal para llevar cada día.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f1",
    theme_color: "#1a1610",
    icons: [
      { src: "/icon-512.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
