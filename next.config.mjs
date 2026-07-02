/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase Storage sirve las imágenes de producto. Se dejan sin optimizar
    // para no tener que registrar el host (el proyecto Supabase varía por usuario).
    unoptimized: true,
  },
};

export default nextConfig;
