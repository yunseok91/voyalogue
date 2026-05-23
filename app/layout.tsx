import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { InAppBrowserGate } from '@/components/InAppBrowserGate'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: {
    default: 'Voyalogue — 스마트 여행 플래너',
    template: '%s | Voyalogue',
  },
  description: '친구와 함께하는 여행 플래너. 여행 일정, 지도, 예산을 한 곳에서 관리하세요.',
  keywords: ['여행 플래너', '여행 일정', '여행 계획', '해외여행', '국내여행', '일정 관리', '여행 앱'],
  authors: [{ name: 'Voyalogue' }],
  creator: 'Voyalogue',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Voyalogue',
    title: 'Voyalogue — 스마트 여행 플래너',
    description: '친구와 함께하는 여행 플래너. 여행 일정, 지도, 예산을 한 곳에서 관리하세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 계정 소유권 인증용 — 사이트 전체 필요 */}
        <meta name="google-adsense-account" content="ca-pub-6889911728160635" />
        {/* 광고 스크립트는 랜딩 페이지(app/page.tsx)에만 개별 로드 */}
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
          <AuthProvider>{children}</AuthProvider>
        </InAppBrowserGate>
      </body>
    </html>
  )
}
