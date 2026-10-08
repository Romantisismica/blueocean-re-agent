/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita que `next build` lance el prompt interactivo de ESLint (cuelga en CI/background).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
