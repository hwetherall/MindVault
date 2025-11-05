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
  // Specify page extensions for App Router
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        canvas: false,
      };
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

    // Ignore canvas bindings - handle both direct and nested imports
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Ignore canvas module completely in client builds
    if (!isServer) {
      config.module.rules.push({
        test: /node_modules[\\/]canvas[\\/]/,
        use: 'null-loader',
      });
    }

    return config
  },
};

export default nextConfig; 