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
  },
};

export default nextConfig;
