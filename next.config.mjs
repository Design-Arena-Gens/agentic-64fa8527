/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["https://agentic-64fa8527.vercel.app"]
    }
  }
};

export default nextConfig;
