import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// The manifest needs real colour values, and they come from the same place as
// everything else. This is why @pristine/tokens builds before the app does.
import { accent, surface } from '@pristine/tokens';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Pristine',
        short_name: 'Pristine',
        description: 'Prepare photos and video for WhatsApp Status without losing detail.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: surface[0],
        theme_color: accent.base,
        // Generated from the tokens by scripts/build-icons.mjs. "any" size
        // because they are vector, so one file covers every density.
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The fonts are self-hosted and immutable, so precache them: the app
        // has to render correctly on the first offline launch.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
