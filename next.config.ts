import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/aida-public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [50, 75, 90, 100], // Required in Next.js 16 for security
    minimumCacheTTL: 2678400, // 31 days - reduces revalidations and improves caching
  },
  experimental: {
    // Transforms barrel-file imports into direct file imports at build time.
    // No code changes required elsewhere — keeps ergonomic `import { X } from 'lucide-react'`
    // while eliminating the cost of loading thousands of unused modules.
    // Impact: 15-70% faster dev boot, 28% faster builds, 40% faster cold starts.
    optimizePackageImports: [
      'lucide-react',
      'radix-ui',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'sonner',
      'embla-carousel-react',
      '@react-email/components',
      'react-day-picker',
    ],
  },
};

export default nextConfig;
