import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
    image: "/images/fallback.png",
    audio: "/audio/silence.mp3",
    video: "/video/fallback.mp4",
    font: "/fonts/fallback.woff2"
  },
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(png|jpe?g|webp|svg|gif|tiff|js|css)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 * 30 // 30 дней
        }
      }
    },
    {
      urlPattern: /^https?.*\/api\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 минут
        }
      }
    },
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 часа
        }
      }
    }
  ]
});

const nextConfig = {
  // Оптимизация производительности
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns']
  },
  
  // Webpack оптимизации
  webpack: (config, { isServer }) => {
    // Разделение кода
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          },
          markdown: {
            test: /[\\/]node_modules[\\/](react-markdown|remark|rehype)[\\/]/,
            name: 'markdown',
            priority: 10,
            chunks: 'all'
          }
        }
      };
    }
    
    return config;
  },
  
  // Compression
  compress: true,
  
  // Images optimization
  images: {
    formats: ['image/webp', 'image/avif']
  }
};

export default withPWA(nextConfig);
