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
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🧳 캐리어 vs 배낭, 뭐가 나을까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행 스타일에 따라 달라지는데, 무조건 어느 쪽이 낫다고 말하기는 어렵다. 다만 여행 패턴에 따라 확실히 더 맞는 게 있다.</p>
                <p><strong className="text-gray-800">캐리어가 유리한 경우:</strong> 한 도시에 베이스캠프를 두고 이동이 많지 않을 때, 숙소가 호텔이나 에어비앤비처럼 캐리어 보관이 편한 곳일 때. 바퀴가 있어서 무겁게 싸도 끌고 다닐 수 있다는 게 장점이다. 단, 돌바닥이나 계단이 많은 유럽 구시가지에서는 캐리어 끌기가 생각보다 힘들다.</p>
                <p><strong className="text-gray-800">배낭이 유리한 경우:</strong> 여러 도시나 나라를 이동하는 배낭여행 스타일, 대중교통을 많이 쓰는 경우. 손이 자유롭고 계단이나 좁은 골목에서 유리하다. 단, 등에 짐을 지는 만큼 무게 관리가 중요하다. 15kg 이상이면 하루 종일 들고 다니기 힘들다.</p>
                <p><strong className="text-gray-800">기내 반입 사이즈 기준:</strong> 1주일 이하 여행이라면 기내 반입 캐리어(55×40×20cm 이하)만으로 충분한 경우가 많다. 위탁 수하물 요금을 아낄 수 있고, 도착하자마자 바로 이동할 수 있어 시간 절약이 된다. 다만 LCC마다 규정이 조금씩 달라서 탑승 전 꼭 확인해야 한다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🌏 여행지별 추가로 챙겨야 할 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">일본 여행 시</p>
                  <ul className="flex flex-col gap-1.5 text-gray-500">
                    <li>• 교통 카드용 잔돈 — 수이카/이코카 카드는 편의점·자판기·지하철 모두 쓰이니 충전 여유 두기</li>
                    <li>• 소형 에코백 — 일본 마트는 비닐봉지 유료, 들고 다닐 장바구니 하나 챙기면 편함</li>
                    <li>• 포켓 와이파이 또는 유심 — 구글 맵 없이는 이동이 복잡해짐</li>
                    <li>• 여름이라면 — 쿨링 스프레이, 손선풍기, 땀 흡수 잘 되는 얇은 옷</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">유럽 여행 시</p>
                  <ul className="flex flex-col gap-1.5 text-gray-500">
                    <li>• 자물쇠 — 호스텔 라커 이용 시 필수, 여행용 다이얼 자물쇠 하나 챙기기</li>
                    <li>• 멀티 어댑터 — 유럽은 C타입 플러그, 영국은 G타입으로 다름</li>
                    <li>• 슬리퍼 — 유스호스텔 사용 시, 또는 해변 갈 때</li>
                    <li>• 소매치기 방지 보조가방 — 앞에 메는 크로스백이나 허리 파우치</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">동남아(태국·베트남·발리 등) 여행 시</p>
                  <ul className="flex flex-col gap-1.5 text-gray-500">
                    <li>• 모기 기피제 — 현지에서 살 수 있지만 한국 제품이 더 효과적인 경우 많음</li>
                    <li>• 정수 기능이 있는 텀블러 또는 세균 걱정 없는 물 구매 예산</li>
                    <li>• 얇은 긴팔 셔츠 — 사원 입장 시 어깨와 무릎이 가려야 하는 경우 많음</li>
                    <li>• 전자 모기장 또는 모기장 — 저가 숙소 이용 시</li>
                    <li>• 물놀이 장비 — 현지 구매 가능하나 퀄리티 불확실</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🚫 가져가면 오히려 짐이 되는 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>짐을 줄이려면 안 가져가도 되는 것을 빼는 게 훨씬 효과적이다. 막상 안 써서 그냥 들고 왔다 갔다 한 것들이 여기에 해당된다.</p>
                <ul className="flex flex-col gap-2">
                  <li><strong className="text-gray-800">헤어드라이어:</strong> 거의 모든 호텔·게스트하우스에 비치돼 있다. 없으면 프런트에 빌려달라고 하면 된다. 굳이 무거운 드라이어 챙길 이유가 없다.</li>
                  <li><strong className="text-gray-800">책:</strong> 종이책은 무겁다. 전자책 리더기나 스마트폰으로 대체하자. 여행 중 읽을 시간도 생각보다 많지 않다.</li>
                  <li><strong className="text-gray-800">여러 벌의 청바지:</strong> 청바지 한 벌은 무게가 600~800g이다. 한 벌이면 충분하고, 더운 나라라면 아예 안 가져가도 된다. 린넨 팬츠처럼 가볍고 시원한 소재로 대체하자.</li>
                  <li><strong className="text-gray-800">'혹시 모르니' 약품 꾸러미:</strong> 있으면 좋지만 지사제, 두통약, 소화제, 밴드 정도면 충분하다. 웬만한 약은 현지 약국에서 살 수 있다.</li>
                  <li><strong className="text-gray-800">여행 전용 카메라:</strong> 요즘 스마트폰 카메라로 충분한 경우가 대부분이다. 진짜 사진에 진심이 아니라면 DSLR이나 미러리스는 생각보다 짐이 된다.</li>
                </ul>
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
