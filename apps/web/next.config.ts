import type { NextConfig } from 'next';
const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      ...['/verify-email','/reset-password','/invite/accept'].map(source=>({source,headers:[
        {key:'Referrer-Policy',value:'no-referrer'},
        {key:'Cache-Control',value:'no-store'},
      ]})),
    ];
  },
};
export default config;
