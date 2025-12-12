
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // Use seu Project ID live; pode deixar fixo ou pegar do env
    const projectId =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-170657449-62ce2";
    const hostBase = `${projectId}.firebaseapp.com`;

    return [
      // Permite que /__/firebase/init.json funcione no dev
      {
        source: "/__/firebase/:path*",
        destination: `https://${hostBase}/__/firebase/:path*`,
      },
      // Faz o callback /__/auth/handler funcionar no dev
      {
        source: "/__/auth/:path*",
        destination: `https://${hostBase}/__/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/dashboard/migrate',
        headers: [
          {
            key: 'Authorization',
            value: 'Bearer ' // Este valor será preenchido pelo cliente
          }
        ]
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
