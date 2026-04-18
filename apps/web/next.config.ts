import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['lightningcss', 'lightningcss-win32-x64-msvc'],
};

export default nextConfig;
