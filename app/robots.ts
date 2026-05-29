import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://voyalogue.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth', '/collection'],
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
