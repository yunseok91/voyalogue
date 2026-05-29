import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Voyalogue 소개 | 스마트 여행 계획 서비스',
  description: 'Voyalogue는 항공·숙소·일정을 한 곳에서 관리하는 여행 계획 서비스입니다. AI 일정 생성, 실시간 환율 계산, 친구와 함께하는 공유 일정을 무료로 시작하세요.',
}

const FEATURES = [
  {
    emoji: '🗓️',
    title: '스마트 일정 관리',
    desc: '날짜별 일정표에 장소, 식당, 액티비티를 직접 추가하거나 AI로 자동 생성할 수 있습니다. 구글 맵과 연동해 동선까지 한눈에 확인하세요.',
  },
  {
    emoji: '✈️',
    title: '항공·숙소 통합 관리',
    desc: '항공권과 숙소 정보를 일정에 직접 등록하고, 정산에 자동 반영됩니다. 여행 전 준비 사항을 한 페이지에서 모두 관리하세요.',
  },
  {
    emoji: '💱',
    title: '실시간 환율 계산',
    desc: '현지 통화로 지출을 입력하면 실시간 환율로 원화 환산 금액이 자동 계산됩니다. 날짜별로 환율을 따로 설정하는 것도 가능합니다.',
  },
  {
    emoji: '👥',
    title: '친구와 공유 일정',
    desc: '초대 링크 하나로 친구, 가족, 동행과 일정을 공유하고 함께 편집할 수 있습니다. 각자의 역할(방장/멤버/총무)을 나눠 효율적으로 협업하세요.',
  },
  {
    emoji: '🧾',
    title: '여행 정산',
    desc: '항공, 숙소, 일별 지출을 자동으로 합산해 1인당 금액을 계산합니다. 복잡한 정산 스프레드시트가 필요 없습니다.',
  },
  {
    emoji: '🤖',
    title: 'AI 여행 플래너',
    desc: '목적지와 여행 기간을 입력하면 AI가 맞춤 일정을 자동으로 작성해드립니다. 초안을 기반으로 원하는 대로 수정해 완성하세요.',
  },
]

const FAQ = [
  {
    q: 'Voyalogue는 무료인가요?',
    a: '네, 현재 베타 기간 동안 모든 기능을 무료로 사용할 수 있습니다. Google 계정만 있으면 바로 시작할 수 있습니다.',
  },
  {
    q: '여행 일정을 친구와 함께 편집할 수 있나요?',
    a: '초대 링크를 공유하면 친구가 멤버로 참여해 일정을 함께 편집할 수 있습니다. 보기 전용 링크를 따로 발급해 공유만 할 수도 있습니다.',
  },
  {
    q: '어떤 통화를 지원하나요?',
    a: 'KRW(원), USD(달러), EUR(유로), JPY(엔), CNY(위안) 등 주요 통화를 지원하며, 실시간 환율이 자동으로 적용됩니다.',
  },
  {
    q: '모바일에서도 사용할 수 있나요?',
    a: '네, 모바일 브라우저에 최적화되어 있어 별도 앱 설치 없이 스마트폰으로도 편리하게 사용할 수 있습니다.',
  },
]

export default function AboutPage() {
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">

        {/* 히어로 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
          <span className="inline-block text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-4">About Voyalogue</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-snug mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            여행 계획의 모든 것을<br />한 곳에서
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
            Voyalogue는 복잡한 여행 준비를 단순하게 만들기 위해 만들어진 스마트 여행 계획 서비스입니다.
            항공권 정보 등록부터 숙소, 날짜별 코스, 환율 정산까지 — 흩어져 있던 여행 준비를 하나의 화면에서 해결하세요.
            Google 계정으로 3초 만에 시작할 수 있으며, 친구와 실시간으로 일정을 공유하고 함께 편집할 수 있습니다.
          </p>
          <Link href="/auth"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[18px] text-sm transition-colors">
            무료로 시작하기
          </Link>
        </div>

        {/* 주요 기능 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>주요 기능</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="flex gap-4">
                <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>자주 묻는 질문</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {FAQ.map(item => (
              <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Q. {item.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 문의 */}
        <div className="bg-blue-600 rounded-2xl p-8 sm:p-12 text-white">
          <h2 className="text-xl font-extrabold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>문의 및 피드백</h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-4">
            서비스 이용 중 불편한 점이나 개선 제안이 있으시면 언제든지 문의해주세요.
            사용자 의견을 바탕으로 더 좋은 서비스를 만들어나가겠습니다.
          </p>
          <a href="mailto:lyuns1105@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-bold rounded-[14px] text-sm hover:bg-blue-50 transition-colors">
            lyuns1105@gmail.com
          </a>
        </div>

      </main>

      <footer className="text-center py-8 text-xs text-gray-400 flex flex-col gap-2">
        <div className="flex justify-center gap-6">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">이용약관</Link>
          <Link href="/contact" className="hover:text-gray-600 transition-colors">문의하기</Link>
        </div>
        <p>© 2026 Voyalogue. All rights reserved.</p>
      </footer>
    </div>
  )
}
