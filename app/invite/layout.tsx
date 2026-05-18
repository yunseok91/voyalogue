import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '여행 초대가 도착했어요',
  description: '친구가 Voyalogue 여행에 초대했어요. 함께 일정을 계획해 보세요!',
  openGraph: {
    title: '여행 초대가 도착했어요',
    description: '친구가 Voyalogue 여행에 초대했어요. 함께 일정을 계획해 보세요!',
    type: 'website',
    siteName: 'Voyalogue',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: '여행 초대가 도착했어요',
    description: '친구가 Voyalogue 여행에 초대했어요. 함께 일정을 계획해 보세요!',
  },
}

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
