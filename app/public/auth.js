// Google sign-in (required) and profile for the web app, shared with Gopinath's other apps: see kolam-design-system/auth.
// scripts/web-auth.mjs adds this to dist/index.html after `expo export`.
import { KolamAuth } from 'https://tgopinath.github.io/kolam-design-system/auth/kolam-auth.js'
// Profile button: next to Settings on phones, beside the farm name in the sidebar on wide screens (theme.ts WIDE = 900)
document.head.insertAdjacentHTML('beforeend', `<style>html .ka-avatar{width:36px;height:36px;top:58px;right:56px}@media (min-width:900px){html .ka-avatar{top:18px;right:auto;left:192px}}</style>`)

KolamAuth.init({
  app: 'farmmanager', appName: 'Farm Manager', icon: '/icon-192.png',
  tagline: 'Save your animals, stock and money records to your account, so they follow you between your phone and the web.',
  fields: [
    { key: 'farmName', label: 'Farm name', placeholder: 'e.g. Green Meadow Farm' },
    { key: 'location', label: 'Location', placeholder: 'e.g. Erode' },
    { key: 'animals', label: 'Animals you keep', placeholder: 'e.g. 12 cows, 30 goats' },
  ],
  sync: ['farm.demo.v2'],
})
