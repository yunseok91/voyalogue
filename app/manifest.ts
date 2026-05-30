import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Voyalogue — 스마트 여행 플래너',
    short_name: 'Voyalogue',
    description: '친구와 함께하는 여행 플래너. 여행 일정, 지도, 예산을 한 곳에서 관리하세요.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#1D4ED8',
    categories: ['travel', 'productivity'],
    lang: 'ko',
    icons: [
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  }
}
