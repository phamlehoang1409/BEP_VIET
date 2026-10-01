import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  // Generate 404.html
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml);

  // Generate vercel.json in distDir for SPA rewrites
  const vercelConfig = {
    cleanUrls: true,
    rewrites: [
      { source: '/(.*)', destination: '/index.html' }
    ]
  };
  fs.writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));

  // Generate static entrypoint for every client route
  const routes = [
    'admin',
    'admin/login',
    'admin/foods',
    'admin/orders',
    'admin/coupons',
    'admin/chat',
    'admin/reviews',
    'chu-quan-1409',
    'bepviet-secret-1409',
    'menu',
    'checkout',
    'orders',
    'order-success'
  ];

  for (const route of routes) {
    const routeDir = path.join(distDir, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml);
    fs.writeFileSync(path.join(distDir, `${route}.html`), indexHtml);
  }

  console.log('✅ Generated static entrypoint files for all routes:', routes);
}
