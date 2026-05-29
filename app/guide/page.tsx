import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '여행 가이드 | Voyalogue',
  description: '일본 여행, 유럽 여행, 예산 절약, 짐 싸는 법 등 실용적인 여행 정보를 모아놓은 Voyalogue 여행 가이드입니다.',
}

const GUIDES = [
  {
    slug: 'japan-travel',
    emoji: '🇯🇵',
    title: '일본 여행 완벽 가이드',
    desc: '도쿄, 오사카, 교토를 중심으로 비자, 교통, 예산, 추천 코스까지 한 번에 정리했습니다.',
    tags: ['일본', '아시아', '도시여행'],
  },
  {
    slug: 'europe-travel',
    emoji: '🇪🇺',
    title: '유럽 여행 준비하기',
    desc: '쉥겐 비자, 유레일 패스, 도시별 하이라이트까지 유럽 첫 여행자를 위한 완전 가이드입니다.',
    tags: ['유럽', '장거리', '배낭여행'],
  },
  {
    slug: 'travel-budget-tips',
    emoji: '💰',
    title: '여행 예산 절약 팁 10가지',
    desc: '항공권 최저가 구매 타이밍부터 현지 식비 절약법까지, 여행 비용을 줄이는 검증된 방법들입니다.',
    tags: ['예산', '절약', '팁'],
  },
  {
    slug: 'travel-packing',
    emoji: '🧳',
    title: '여행 짐 싸는 법 완전 정복',
    desc: '계절별·여행 타입별 필수 체크리스트와 짐을 최소화하는 패킹 노하우를 공개합니다.',
    tags: ['짐싸기', '체크리스트', '준비'],
  },
  {
    slug: 'how-to-use-voyalogue',
    emoji: '📱',
    title: 'Voyalogue 완전 사용 가이드',
    desc: '일정 생성부터 친구 초대, 정산까지 Voyalogue의 모든 기능을 단계별로 안내합니다.',
    tags: ['사용법', '튜토리얼', '기능'],
  },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600" />
            <span className="font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 홈으로</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <span className="inline-block text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-3">Travel Guide</span>
          <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>여행 가이드</h1>
          <p className="text-gray-500 text-sm mt-2">여행 준비에 필요한 실용 정보를 모아놓았습니다.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {GUIDES.map(g => (
            <Link key={g.slug} href={`/guide/${g.slug}`}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group">
              <span className="text-3xl mb-3 block">{g.emoji}</span>
              <h2 className="text-base font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{g.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{g.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.tags.map(t => (
                  <span key={t} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{t}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/about" className="hover:text-gray-600 transition-colors">서비스 소개</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">이용약관</Link>
        </div>
        <p>© 2026 Voyalogue. All rights reserved.</p>
      </footer>
    </div>
  )
}
