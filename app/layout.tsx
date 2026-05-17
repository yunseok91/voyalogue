import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: {
    default: 'Voyalogue — 스마트 여행 플래너',
    template: '%s | Voyalogue',
  },
  description: '드래그 앤 드롭 일정 관리, 구글 지도 연동, 실시간 환율, 멤버 공유까지. Voyalogue로 완벽한 여행 계획을 세우세요.',
  keywords: ['여행 플래너', '여행 일정', '여행 계획', '해외여행', '국내여행', '일정 관리', '여행 앱'],
  authors: [{ name: 'Voyalogue' }],
  creator: 'Voyalogue',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Voyalogue',
    title: 'Voyalogue — 스마트 여행 플래너',
    description: '드래그 앤 드롭 일정 관리, 구글 지도 연동, 실시간 환율, 멤버 공유까지. Voyalogue로 완벽한 여행 계획을 세우세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6889911728160635" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6889911728160635"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/*
        토스페이먼츠 SDK — 결제 기능 활성화 시 주석 해제:
        <Script
          src="https://js.tosspayments.com/v1/payment"
          strategy="lazyOnload"
        />
        */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
