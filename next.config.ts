import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "./"),

  // 번들 분석 활성화 (ANALYZE=true npm run build)
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      // 번들 분석을 위한 설정
    },
  }),

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // 성능 최적화
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
