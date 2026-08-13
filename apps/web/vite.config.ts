import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// The manifest and the head tags need real colour and real copy, and they come
// from the same place as everything else. This is why @pristine/tokens and
// @pristine/copy build before the app does, via the app's own deps script.
import { accent, surface } from '@pristine/tokens';
import { en } from '@pristine/copy';

/**
 * The deployed origin, used to make Open Graph URLs absolute.
 *
 * Scrapers do not resolve relative image paths, so a relative og:image simply
 * does not render. Vercel exposes the deployment host at build time; the
 * fallback is the production alias.
 */
const DEPLOYED_HOST = process.env['VERCEL_PROJECT_PRODUCTION_URL'];
const SITE_URL = DEPLOYED_HOST ? `https://${DEPLOYED_HOST}` : 'https://pristine-web.vercel.app';

/**
 * Injects the head tags that need a token or a copy string.
 *
 * Done here rather than in scripts/build-icons.mjs because index.html is Vite's
 * entry document, not a public asset: build-icons writes into public/, which
 * Vite copies verbatim and never transforms. This hook is the one place that
 * can put a token value into the document Vite actually emits.
 */
function headTags(): Plugin {
  return {
    name: 'pristine-head-tags',
    transformIndexHtml() {
      // Appended rather than prepended. Vite's default puts returned tags at
      // the top of head, which would push <meta charset> down; the spec wants
      // it inside the first 1024 bytes, and a parser that has to guess the
      // encoding restarts.
      const tags: { tag: string; attrs: Record<string, string> }[] = [
        // Android and desktop Chrome read the manifest, but iOS standalone
        // reads only this tag.
        { tag: 'meta', attrs: { name: 'theme-color', content: accent.base } },
        { tag: 'meta', attrs: { name: 'description', content: en['meta.description'] } },

        // iOS ignores the manifest entirely for these three.
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
        {
          tag: 'meta',
          // Pairs with viewport-fit=cover: the app paints its own background
          // behind the status bar rather than leaving an opaque strip.
          attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: en['meta.title'] } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },

        // The share target is WhatsApp, which is the product's own distribution
        // channel, so a bare text preview is a real cost.
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: en['meta.title'] } },
        { tag: 'meta', attrs: { property: 'og:title', content: en['meta.ogTitle'] } },
        { tag: 'meta', attrs: { property: 'og:description', content: en['meta.description'] } },
        { tag: 'meta', attrs: { property: 'og:url', content: SITE_URL } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${SITE_URL}/og-image.png` } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: en['meta.ogTitle'] } },

        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:title', content: en['meta.ogTitle'] } },
        { tag: 'meta', attrs: { name: 'twitter:description', content: en['meta.description'] } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${SITE_URL}/og-image.png` } },
      ];

      return tags.map((tag) => ({ ...tag, injectTo: 'head' as const }));
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    headTags(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        // Install identity. Without it Chrome derives one from start_url, and
        // changing start_url later would register as a different app.
        id: '/',
        name: en['meta.title'],
        short_name: en['meta.title'],
        description: en['meta.description'],
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: surface[0],
        theme_color: accent.base,
        // Generated from the tokens by scripts/build-icons.mjs. SVG first for
        // anything that will take it, PNG for the launchers and stores that
        // will not.
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
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
