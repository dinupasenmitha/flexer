import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'frontend',
  publicDir: false,
  base: '/build/',
  build: {
    outDir: '../public/build',
    emptyOutDir: false,
    manifest: true,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'frontend/home.html'),
        shop: resolve(import.meta.dirname, 'frontend/shop.html'),
        product: resolve(import.meta.dirname, 'frontend/product.html'),
        checkout: resolve(import.meta.dirname, 'frontend/checkout.html'),
        content: resolve(import.meta.dirname, 'frontend/content.html'),
        account: resolve(import.meta.dirname, 'frontend/account.html'),
        notFound: resolve(import.meta.dirname, 'frontend/not-found.html'),
        about: resolve(import.meta.dirname, 'frontend/about.html'),
        contact: resolve(import.meta.dirname, 'frontend/contact.html'),
        shipping: resolve(import.meta.dirname, 'frontend/shipping.html'),
        returns: resolve(import.meta.dirname, 'frontend/returns.html'),
        warranty: resolve(import.meta.dirname, 'frontend/warranty.html'),
        privacy: resolve(import.meta.dirname, 'frontend/privacy.html'),
        terms: resolve(import.meta.dirname, 'frontend/terms.html'),
        admin: resolve(import.meta.dirname, 'frontend/admin.html')
      }
    }
  }
});
