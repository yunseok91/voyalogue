import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { InAppBrowserGate } from '@/components/InAppBrowserGate'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { OnboardingBanner } from '@/components/OnboardingBanner'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://voyalogue.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Voyalogue — 스마트 여행 플래너',
    template: '%s | Voyalogue',
  },
  description: '일정·지도·예산·정산까지. 친구와 함께하는 스마트 여행 플래너.',
  keywords: ['여행 플래너', '여행 일정', '여행 계획', '해외여행', '국내여행', '일정 관리', '여행 앱'],
  authors: [{ name: 'Voyalogue' }],
  creator: 'Voyalogue',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Voyalogue',
    title: 'Voyalogue — 스마트 여행 플래너',
    description: '일정·지도·예산·정산까지. 친구와 함께하는 스마트 여행 플래너.',
    url: BASE_URL,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Voyalogue' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voyalogue — 스마트 여행 플래너',
    description: '일정·지도·예산·정산까지. 친구와 함께하는 스마트 여행 플래너.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'Nfig-RstHBntpewTXiAjVugT692x04WwlYLpYpsn1j0',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-6889911728160635" />
        <meta name="theme-color" content="#1D4ED8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Voyalogue" />
      </head>
      <body>
        {/*
        토스페이먼츠 SDK — 결제 기능 활성화 시 주석 해제:
        <Script
          src="https://js.tosspayments.com/v1/payment"
          strategy="lazyOnload"
        />
        */}
        <GoogleAnalytics />
        <InAppBrowserGate>
          <AuthProvider>
            {children}
            <OnboardingBanner />
          </AuthProvider>
        </InAppBrowserGate>
      </body>
    </html>
  )
}
