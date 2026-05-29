import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '여행 짐 싸는 법 완전 정복 | Voyalogue',
  description: '여행 타입별·계절별 필수 체크리스트와 짐을 최소화하는 패킹 노하우를 공개합니다. 기내 반입 규정부터 스마트 패킹 팁까지 총정리.',
}

const ESSENTIALS = [
  { cat: '서류 & 결제', items: ['여권 (유효기간 6개월 이상 확인)', '비자 서류 (해당 국가)', '항공권 e-ticket', '숙소 예약 확인서', '해외 결제 카드 (2장 이상)', '현지 통화 소액 현금', '여행자 보험 증서'] },
  { cat: '전자기기', items: ['스마트폰 + 충전기', '멀티 어댑터 (국가별 콘센트 확인)', '보조배터리 (기내 반입만 허용)', '이어폰', '카메라 (선택)'] },
  { cat: '의류 & 세면', items: ['속옷 (여행 일수 + 1벌)', '양말 (여행 일수 + 1켤레)', '겉옷 2~3벌 (코디 가능하게)', '접이식 우산 또는 우비', '세면도구 소형 (100ml 이하)', '선크림', '상비약 (두통약, 지사제, 소화제, 밴드)'] },
]

export default function TravelPackingPage() {
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
            <span className="text-4xl block mb-4">🧳</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['짐싸기', '체크리스트', '준비', '패킹'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              여행 짐 싸는 법 완전 정복
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              짐을 너무 많이 싸면 이동이 힘들고, 너무 적게 싸면 현지에서 당황합니다. 여행 타입과 기간에 맞게 짐을 최적화하는 방법을 정리했습니다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">✈️ 기내 반입 규정 먼저 확인하기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>항공사마다 기내 반입 수하물 규정이 다릅니다. 대부분의 항공사는 기내 반입 가방의 크기를 55×40×20cm 이하, 무게를 10kg 이하로 제한합니다. LCC(저비용항공사)는 더 엄격한 경우가 많으니 탑승 전 반드시 확인하세요.</p>
                <p><strong className="text-gray-800">액체류 규정 (기내 반입):</strong> 각 용기당 100ml 이하, 투명 지퍼백 1개(1리터 이하)에 담아야 합니다. 세면도구는 소형 용기에 소분하거나 현지에서 구매하는 것이 편리합니다.</p>
                <p><strong className="text-gray-800">보조배터리:</strong> 위탁 수하물로 부칠 수 없으며 기내 반입만 가능합니다. 용량 160Wh(약 43,000mAh) 이하만 허용됩니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📋 여행 필수 체크리스트</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ESSENTIALS.map(cat => (
                  <div key={cat.cat} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-700 mb-3">{cat.cat}</p>
                    <ul className="flex flex-col gap-1.5">
                      {cat.items.map(item => (
                        <li key={item} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-gray-300 flex-shrink-0 mt-0.5">□</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🌡️ 계절별 추가 체크리스트</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">☀️ 여름 (6~8월)</p>
                  <ul className="flex flex-col gap-1 text-gray-500">
                    <li>• 선크림 SPF 50 이상 (현지 구매도 가능하나 비쌀 수 있음)</li>
                    <li>• 쿨링 스프레이, 손선풍기</li>
                    <li>• 모자, 선글라스</li>
                    <li>• 얇은 카디건 (냉방 심한 실내 대비)</li>
                    <li>• 수영복 (해변·수영장 일정 포함 시)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">🍂 가을 · 봄 (3~5월, 9~11월)</p>
                  <ul className="flex flex-col gap-1 text-gray-500">
                    <li>• 가벼운 겉옷 (바람막이, 얇은 패딩)</li>
                    <li>• 레이어드 가능한 옷 구성</li>
                    <li>• 접이식 우산 (변덕스러운 날씨 대비)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">❄️ 겨울 (12~2월)</p>
                  <ul className="flex flex-col gap-1 text-gray-500">
                    <li>• 두꺼운 패딩 또는 코트</li>
                    <li>• 내열 발열 내의</li>
                    <li>• 장갑, 목도리, 모자</li>
                    <li>• 방수 신발 또는 부츠</li>
                    <li>• 보습 제품 (건조한 날씨 대비)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">💡 스마트 패킹 노하우</h2>
              <ul className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <li><strong className="text-gray-800">롤링 기법:</strong> 옷을 돌돌 말아 넣으면 구김이 줄고 공간을 더 효율적으로 사용할 수 있습니다.</li>
                <li><strong className="text-gray-800">패킹 큐브 활용:</strong> 카테고리별로 패킹 큐브에 분류하면 가방 안이 정리되고 필요한 것을 빨리 찾을 수 있습니다.</li>
                <li><strong className="text-gray-800">72시간 법칙:</strong> 짐 싸기가 끝나면 72시간 동안 사용한 물건만 추가로 넣는 원칙을 지키면 과부하를 막을 수 있습니다.</li>
                <li><strong className="text-gray-800">현지 구매 활용:</strong> 세면도구, 선크림, 생수 같은 무겁고 부피 큰 소모품은 현지 마트에서 구매하면 짐을 크게 줄일 수 있습니다.</li>
                <li><strong className="text-gray-800">신발은 최대 2켤레:</strong> 신발은 부피와 무게의 주범입니다. 편한 운동화 1개와 가벼운 샌들 또는 드레스 슈즈 1개로 조합을 최소화하세요.</li>
                <li><strong className="text-gray-800">귀국 짐 여유 공간 확보:</strong> 쇼핑을 계획한다면 출발 시 가방의 20~30% 여유 공간을 남겨두거나 접이식 에코백을 준비하세요.</li>
              </ul>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">짐 싸기 전에 일정부터 확정하세요</p>
            <p className="text-sm text-gray-500 mb-3">어디서 무엇을 하는지 일정이 확정되어야 필요한 짐이 보입니다. Voyalogue로 날짜별 일정을 먼저 완성하고 그에 맞게 짐을 준비하세요.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              일정 만들러 가기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/japan-travel', label: '🇯🇵 일본 여행 가이드' },
            { href: '/guide/europe-travel', label: '🇪🇺 유럽 여행 가이드' },
            { href: '/guide/travel-budget-tips', label: '💰 예산 절약 팁' },
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
