import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Canlı sunucuda build boyutunu küçültür ve deployment'ı kolaylaştırır
  // output: 'standalone', // Disabled to fix asset serving issues on Windows IIS

  // Devre dışı bırakılan geliştirici göstergeleri
  devIndicators: false,
  
  // Resim optimizasyonu ayarları
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Dış kaynaklı test resimlerine izin vermek için (Gerekirse kısıtlayın)
      },
    ],
    unoptimized: true, // Sunucu performansını artırmak için optimizasyonu kapattık
  },
  
  // Deneysel özellikler (gerekirse)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Yükleme limitini artır (Default 1mb)
    },
  },
};

export default nextConfig;
