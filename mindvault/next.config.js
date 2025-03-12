/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  },
  images: {
    domains: ['zxgjzlwzukjkhcoyqedd.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        canvas: false,
      }
    }

    // Handle binary files and workers
    config.module.rules.push(
      {
        test: /\.node$/,
        loader: 'null-loader',
      },
      {
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[name].[hash][ext]'
        }
      }
    );

    return config
  },
};

export default nextConfig; 