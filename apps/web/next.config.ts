import type { NextConfig } from 'next';
const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {source: '/verify-email', headers: [
        {key: 'Referrer-Policy', value: 'no-referrer'},
        {key: 'Cache-Control', value: 'no-store'},
      ]},
      {source: '/reset-password', headers: [
        {key: 'Referrer-Policy', value: 'no-referrer'},
        {key: 'Cache-Control', value: 'no-store'},
      ]},
    ];
  },
};
export default config;
