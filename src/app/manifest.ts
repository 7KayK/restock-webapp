import type { MetadataRoute } from 'next'

// Makes restock.chat installable ("Add to Home screen" on Android Chrome,
// "Add to Home Screen" on iOS Safari) so testers get a full-screen, app-like
// Restock before the native Expo app is ready. Opens straight into the
// dashboard; signed-out visitors are redirected to sign-in by Clerk.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Restock',
    short_name: 'Restock',
    description: 'Never run out of anything again. Track purchases, plan shopping trips, find the best store.',
    id: '/dashboard',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F2E7',
    theme_color: '#132B22',
    categories: ['shopping', 'lifestyle', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Shopping Trip', url: '/dashboard/shopping', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Reminders', url: '/dashboard/reminders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
