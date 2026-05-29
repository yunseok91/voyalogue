import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '여행 예산 절약 팁 10가지 | Voyalogue',
  description: '항공권 최저가 구매 타이밍부터 현지 식비 절약, 숙소 선택법까지 여행 비용을 줄이는 검증된 방법 10가지를 정리했습니다.',
}

const TIPS = [
  {
    num: '01',
    title: '항공권은 출발 2~3개월 전에 구매하라',
    desc: '항공권 가격은 출발일에 가까워질수록 오르는 경향이 있습니다. 성수기(여름 방학, 명절, 연휴) 일정이라면 최소 3~4개월 전에 예약하는 것이 좋습니다. 특히 화요일~수요일에 항공권 가격이 내려가는 경우가 많으니 가격 알림을 설정해두고 주기적으로 확인하세요. Google Flights의 가격 추적 기능을 활용하면 최저가 알림을 받을 수 있습니다.',
  },
  {
    num: '02',
    title: '비수기를 노려라',
    desc: '같은 목적지라도 비수기에는 항공권과 숙박비가 30~50% 저렴해집니다. 유럽의 경우 10~11월, 일본은 1~2월과 6월이 상대적으로 저렴합니다. 날씨가 완벽하지 않더라도 관광지 혼잡도가 낮아 오히려 더 여유롭게 여행할 수 있습니다.',
  },
  {
    num: '03',
    title: '해외 결제 수수료 없는 카드를 준비하라',
    desc: '일반 신용카드로 해외 결제 시 1.5~2.5%의 수수료가 붙습니다. 트래블월렛, 트레블로그, 토스 외화통장 등 해외 수수료가 없는 카드나 계좌를 준비하면 여행 기간 내내 수수료 없이 결제하고 인출할 수 있습니다. 10일 여행 기준으로 수십만 원 절약 효과가 있습니다.',
  },
  {
    num: '04',
    title: '숙소는 위치로 선택하라',
    desc: '저렴한 숙소를 고르더라도 교통 중심지에 있는 숙소를 선택하면 이동비와 시간을 아낄 수 있습니다. 교통비와 이동 시간을 합산하면 중심부의 조금 비싼 숙소가 오히려 더 경제적인 경우가 많습니다. Booking.com, Agoda 등을 비교하고 포인트 적립 혜택도 활용하세요.',
  },
  {
    num: '05',
    title: '현지 마트와 편의점을 활용하라',
    desc: '매 끼니를 레스토랑에서 먹으면 식비가 급격히 올라갑니다. 아침은 숙소에서 마트에서 구매한 식재료로, 점심만 현지 식당을 이용하는 전략을 쓰면 하루 식비를 절반 이하로 줄일 수 있습니다. 일본의 편의점, 유럽의 슈퍼마켓(리들, 알디)은 저렴하고 품질도 나쁘지 않습니다.',
  },
  {
    num: '06',
    title: '시티패스와 박물관 무료 입장일을 활용하라',
    desc: '파리 뮤지엄 패스, 로마 패스, 도쿄 서브웨이 티켓 등 도시별 통합 패스를 이용하면 주요 명소 입장료와 교통비를 묶어 저렴하게 해결할 수 있습니다. 또한 많은 유럽 박물관이 매월 첫 번째 일요일이나 특정 요일에 무료 입장을 제공합니다. 루브르 박물관도 매월 첫째 주 금요일 야간에 무료입니다.',
  },
  {
    num: '07',
    title: '짐을 줄여 수하물 비용을 없애라',
    desc: 'LCC(저비용항공사) 이용 시 수하물 비용이 항공권 가격의 30~50%를 차지하기도 합니다. 기내 반입 가능한 작은 캐리어(20인치) 하나로 짐을 최소화하면 수하물 비용을 완전히 아낄 수 있습니다. 현지에서 세탁하거나 간편한 기능성 의류를 활용하는 것이 핵심입니다.',
  },
  {
    num: '08',
    title: '무료 투어와 무료 명소를 찾아라',
    desc: '도보로 즐기는 자유 여행 외에도 많은 도시에서 Free Walking Tour를 제공합니다. 투어 마지막에 팁을 내는 방식이라 부담 없이 참여할 수 있고, 현지 가이드의 생생한 이야기를 들으며 도시를 이해하는 데 도움이 됩니다. 또한 공원, 해변, 시장 등 무료로 즐길 수 있는 명소도 찾아보세요.',
  },
  {
    num: '09',
    title: '미리 예약해 입장료를 아껴라',
    desc: '콜로세움, 바티칸 박물관, 오르세 미술관 등 인기 명소는 현장 구매 시 긴 줄과 함께 종종 웃돈을 내야 합니다. 공식 사이트에서 사전 예약하면 줄도 서지 않고 일반 입장료로 입장할 수 있습니다. 특히 성수기에는 일찍 매진되므로 2~3주 전에 예약해두세요.',
  },
  {
    num: '10',
    title: '예산을 미리 계획하고 추적하라',
    desc: '예산 없이 떠나면 귀국 후 카드 명세서를 보고 후회하기 십상입니다. 여행 전에 항공권, 숙박, 식비, 교통, 관광, 쇼핑 항목별로 예산을 배분하고, 여행 중 지출을 기록하며 관리하세요. Voyalogue의 여행 정산 기능을 활용하면 날짜별 지출을 쉽게 기록하고 1인당 금액을 자동으로 계산할 수 있습니다.',
  },
]

export default function TravelBudgetTipsPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600" />
            <span className="font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
          </Link>
          <Link href="/guide" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 가이드 목록</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
          <div className="mb-8">
            <span className="text-4xl block mb-4">💰</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['예산', '절약', '팁', '준비'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              여행 예산 절약 팁 10가지
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              여행 경비는 잘 준비하면 생각보다 많이 줄일 수 있습니다. 항공권 구매 타이밍부터 현지 식비 관리까지, 검증된 절약 방법 10가지를 정리했습니다.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {TIPS.map(tip => (
              <div key={tip.num} className="flex gap-4">
                <span className="text-3xl font-extrabold text-blue-100 flex-shrink-0 leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{tip.num}</span>
                <div className="pt-0.5">
                  <h2 className="text-sm font-bold text-gray-900 mb-2">{tip.title}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">예산 계획도 Voyalogue로</p>
            <p className="text-sm text-gray-500 mb-3">여행 전 항목별 예산을 설정하고, 현지에서 날짜별 지출을 기록해 자동 정산까지 한 번에 처리하세요.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/japan-travel', label: '🇯🇵 일본 여행 가이드' },
            { href: '/guide/europe-travel', label: '🇪🇺 유럽 여행 가이드' },
            { href: '/guide/travel-packing', label: '🧳 짐 싸는 법' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/guide" className="hover:text-gray-600 transition-colors">여행 가이드</Link>
          <Link href="/about" className="hover:text-gray-600 transition-colors">서비스 소개</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">개인정보처리방침</Link>
        </div>
        <p>© 2026 Voyalogue. All rights reserved.</p>
      </footer>
    </div>
  )
}
