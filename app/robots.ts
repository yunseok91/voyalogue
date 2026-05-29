import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://voyalogue.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/privacy', '/terms', '/contact', '/guide', '/auth'],
        disallow: [
          '/admin',
          '/trips',
          '/profile',
          '/payment',
          '/invite',
          '/share',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
