import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 빌드 산출물에만 CSP <meta>를 주입한다(개발 서버 HMR을 깨지 않도록 build 전용).
// 모든 리소스는 동일 출처. sql.js WASM 인스턴스화를 위해 'wasm-unsafe-eval'만 허용한다.
function cspMeta(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'golftrack-csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

// GolfTrack — 완전 오프라인 PWA. 서비스워커가 앱 셸과 sql.js WASM까지 프리캐시한다.
// GitHub Pages 프로젝트 사이트는 /<repo>/ 서브경로로 서빙되므로 그 빌드에서만 base를 바꾼다.
// (dev 서버와 일반 빌드는 루트 '/' 유지 → 로컬/다른 호스트 배포에 영향 없음)
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/golftrack/' : '/',
  plugins: [
    cspMeta(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'GolfTrack — 골프 스코어 기록',
        short_name: 'GolfTrack',
        description: '라운딩 중 샷을 기록하는 오프라인 골프 스코어 앱',
        lang: 'ko',
        theme_color: '#166534',
        background_color: '#0b3d1f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // sql.js WASM(.wasm)까지 프리캐시해야 오프라인에서 DB가 뜬다.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        // 개발 중에도 SW를 등록해 오프라인 동작을 확인할 수 있게 한다.
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    host: true, // 같은 WiFi의 폰에서 LAN IP로 접속 가능
  },
})
