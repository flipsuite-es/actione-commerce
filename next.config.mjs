/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase Storage sirve las imágenes de producto. Se dejan sin optimizar
    // para no tener que registrar el host (el proyecto Supabase varía por usuario).
    unoptimized: true,
  },
  // `sharp` (procesado de imágenes al subir) es un módulo nativo: se deja fuera
  // del bundle del servidor para que Vercel use su binario correcto.
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
    // Las fotos de móvil superan el límite por defecto (1 MB) del body de las
    // server actions; sin esto, subir una foto grande falla con error opaco.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
