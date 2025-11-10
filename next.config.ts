import type { NextConfig } from "next";

// Get backend URL from environment variable, default to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_USER_API_BASE || 'http://localhost:8000';

const nextConfig: NextConfig = {
	async rewrites() {
		// Only use rewrites in development (when API_BASE_URL is localhost)
		// In production, the frontend will call the backend directly using NEXT_PUBLIC_* env vars
		if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
			return [
				// Proxy API calls to Laravel backend (development only)
				{
					source: '/api/:path*',
					destination: `${API_BASE_URL}/api/:path*`,
				},
			];
		}
		// In production, return empty array (no rewrites needed - direct API calls)
		return [];
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	// Experimental features
	experimental: {
		// Add any valid experimental features here when needed
	},
	// Configure React to be more tolerant of hydration mismatches
	reactStrictMode: false, // Disable strict mode to reduce hydration warnings
	// Add webpack configuration to inject hydration suppressor
	webpack: (config, { dev, isServer }) => {
		if (dev && !isServer) {
			// Inject hydration error suppression in development
			config.entry = async () => {
				const entries = await config.entry();
				if (entries['main.js'] && !entries['main.js'].includes('./hydration-fix.js')) {
					entries['main.js'].unshift('./hydration-fix.js');
				}
				return entries;
			};
		}
		return config;
	},
	// Headers for security and caching
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
					},
					{
						key: 'Pragma',
						value: 'no-cache',
					},
					{
						key: 'Expires',
						value: '0',
					},
					{
						key: 'Content-Security-Policy',
						value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https:; frame-src 'self' data: blob: http: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data: http: https:; img-src 'self' data: blob: http: https:; connect-src 'self' http: https:;",
					},
					{
						key: 'X-Frame-Options',
						value: 'SAMEORIGIN',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
				],
			},
		];
	},
};

export default nextConfig;
