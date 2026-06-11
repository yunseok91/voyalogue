import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '유럽 여행 완벽 준비 가이드 2025 | Voyalogue',
  description: '유럽 여행 처음 준비하시나요? 쉥겐 비자, 유레일 패스, 파리·런던·로마 추천 코스, 예산 계획까지 모두 정리했습니다.',
}

export default function EuropeTravelPage() {
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
            <span className="text-4xl block mb-4">🇪🇺</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['유럽', '장거리', '배낭여행', '2025'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              유럽 여행 완벽 준비 가이드 2025
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              유럽은 많은 여행자들의 버킷리스트 1위입니다. 처음이라면 준비할 것이 많아 막막하게 느껴질 수 있지만, 핵심만 잘 챙기면 생각보다 어렵지 않습니다. 비자부터 이동 수단, 추천 도시까지 단계별로 정리했습니다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📋 비자 & 입국</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">쉥겐 비자:</strong> 프랑스, 독일, 이탈리아, 스페인 등 쉥겐 협약 가입국 26개국은 단일 비자로 입국할 수 있습니다. 대한민국 여권 소지자는 180일 중 최대 90일까지 무비자로 체류 가능합니다.</p>
                <p><strong className="text-gray-800">영국:</strong> 브렉시트 이후 영국은 쉥겐 지역에서 제외되었습니다. 단, 한국인은 영국도 무비자(최대 6개월)로 입국 가능합니다. 영국 여행을 일정에 포함한다면 쉥겐 체류 기간과 별도로 관리하세요.</p>
                <p><strong className="text-gray-800">ETIAS (2025년 예정):</strong> EU는 2025년부터 무비자 입국자에게 사전 여행 허가제(ETIAS)를 도입할 예정입니다. 출발 전 공식 웹사이트에서 최신 정보를 확인하세요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🚆 도시 간 이동</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">유레일 패스:</strong> 유럽 다수 국가를 기차로 이동할 계획이라면 유레일 패스가 경제적입니다. 연속권(특정 기간 내 무제한)과 플렉시권(특정 일수 선택)으로 나뉘며, 여행 스타일에 맞게 선택하세요. 출발 전 한국에서 구매하는 것이 현지보다 저렴합니다.</p>
                <p><strong className="text-gray_800">저비용 항공 (LCC):</strong> Ryanair, easyJet, Wizz Air 등 유럽 저비용항공사를 이용하면 도시 간 이동 비용을 크게 절약할 수 있습니다. 수하물 요금이 별도이므로 짐을 최소화하고 기내 반입 짐만 이용하면 편도 2~5만 원대로 이동이 가능합니다.</p>
                <p><strong className="text-gray-800">야간 버스·기차:</strong> 숙박과 이동을 동시에 해결할 수 있어 일정이 빠듯한 배낭여행자에게 인기 있는 옵션입니다. FlixBus는 주요 유럽 도시를 연결하는 저렴한 버스 서비스입니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🗺️ 추천 도시 & 코스</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🗼 파리, 프랑스 (3~4일)</p>
                  <p>에펠탑, 루브르 박물관, 몽마르트르 언덕, 오르세 미술관이 필수 코스입니다. 박물관 패스를 구매하면 주요 미술관·박물관을 줄 서지 않고 입장할 수 있어 시간을 절약할 수 있습니다. 파리 외곽의 베르사유 궁전은 반나절 일정으로 방문하기 좋습니다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🏛️ 로마, 이탈리아 (3일)</p>
                  <p>콜로세움, 바티칸 시국, 트레비 분수, 스페인 광장이 대표 명소입니다. 콜로세움과 바티칸 박물관은 사전 예약이 필수이며, 현장 줄이 매우 깁니다. 로마는 도보 이동이 가능한 도시이므로 지도를 잘 활용하세요.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🍺 바르셀로나, 스페인 (2~3일)</p>
                  <p>가우디 건축물(사그라다 파밀리아, 구엘 공원, 카사 바트요)이 도시 전체의 아이덴티티를 형성합니다. 고딕 지구와 람블라스 거리, 보케리아 시장도 놓치지 마세요. 해변과 도시 문화를 동시에 즐길 수 있는 곳입니다.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">💶 예산 가이드</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { label: '저예산 (호스텔 + 자취)', value: '1인 8~12만 원/일' },
                    { label: '중간 (3성급 + 현지 식당)', value: '1인 18~28만 원/일' },
                    { label: '항공권 (왕복)', value: '70~150만 원' },
                    { label: '유레일 패스 (15일)', value: '약 60~90만 원' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500 mb-0.5">{i.label}</p>
                      <p className="font-bold text-gray-900">{i.value}</p>
                    </div>
                  ))}
                </div>
                <p>유럽 물가는 국가마다 차이가 큽니다. 서유럽(프랑스, 영국, 스위스)은 상대적으로 비싸고, 동유럽(체코, 헝가리, 폴란드)은 저렴합니다. 예산이 빠듯하다면 동유럽 여행을 우선 고려하는 것도 좋은 방법입니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🇬🇧 런던, 영국 (3~4일)</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>런던은 유럽 여행 중 물가가 가장 비싼 도시 중 하나다. 밥 한 끼에 15~25파운드(25,000~42,000원)는 기본으로 생각해야 하고, 교통비도 만만치 않다. 그래도 대영박물관, 내셔널 갤러리, 테이트 모던 같은 주요 박물관이 무료라는 게 큰 장점이다.</p>
                <p><strong className="text-gray-800">필수 명소:</strong> 빅벤과 웨스트민스터 다리, 타워브리지, 버킹엄 궁전 근위병 교대식(오전 11시, 매일은 아님), 코벤트 가든, 노팅힐 포토벨로 마켓(토요일). 해리포터 스튜디오 투어는 런던 외곽에 있는데 미리 예약 안 하면 입장권 구하기 힘드니 계획이 있다면 출발 전에 예약해두자.</p>
                <p><strong className="text-gray-800">교통:</strong> 오이스터 카드(Oyster Card)나 비자/마스터카드 컨택트리스 결제가 가능하다. 하루 최대 금액이 정해져 있어 여러 번 타도 일정 금액 이상은 안 나온다. 지하철(튜브)보다 버스가 시내 구경하기는 훨씬 좋다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🇨🇿 동유럽도 고려해보자 (프라하, 부다페스트)</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>예산이 빠듯하거나 서유럽에서 느끼는 관광지화된 분위기가 싫다면 동유럽을 강력 추천한다. 물가가 파리의 절반 이하고, 유럽 분위기는 충분히 느낄 수 있다.</p>
                <p><strong className="text-gray-800">프라하:</strong> 체코 수도. 구시가지 광장과 천문 시계탑, 프라하 성, 카를 다리가 핵심이다. 관광지인데도 밥 한 끼에 10,000~15,000원이면 먹을 수 있고, 체코 맥주는 물보다 싸다는 말이 있을 정도로 저렴하다. 2박 3일이면 주요 명소는 다 돌 수 있다.</p>
                <p><strong className="text-gray-800">부다페스트:</strong> 헝가리 수도. 다뉴브 강을 사이에 두고 부다 지구와 페스트 지구로 나뉜다. 국회의사당 야경이 압도적이고, 세체니 온천이 유명하다. 루인 바(Ruin Bar)라는 독특한 분위기의 술집 문화도 흥미롭다. 프라하보다도 물가가 더 저렴하다.</p>
                <p>두 도시는 야간 버스나 기차로 연결되어 있어 묶어서 여행하기 좋다. 빈(오스트리아)을 중간에 끼우면 3개국 루트도 가능하다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📅 유럽 여행 최적 시기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">봄 (4~5월):</strong> 날씨도 좋고 성수기 직전이라 가격이 합리적이다. 특히 5월은 유럽 여행의 황금 시기라 불릴 만큼 날씨와 가격 모두 균형이 잘 맞다. 단, 5월 초 황금연휴(한국 공휴일) 기간엔 한국인 여행자가 몰려 항공권이 비싸진다.</p>
                <p><strong className="text-gray-800">여름 (6~8월):</strong> 성수기다. 날씨는 좋지만 모든 게 비싸고 붐빈다. 줄 서는 시간만 몇 시간씩 걸리는 경우도 생긴다. 유럽 대부분 지역이 건조한 더위라 한국 여름보다는 덜 불쾌하다. 7~8월 여행이라면 주요 명소 입장권은 반드시 사전 예약하자.</p>
                <p><strong className="text-gray-800">가을 (9~10월):</strong> 개인적으로 제일 추천하는 시기다. 성수기가 막 끝나 가격이 내려가고, 날씨도 쾌적하다. 유럽 음식 축제나 와인 수확 시즌 이벤트도 가을에 많다.</p>
                <p><strong className="text-gray-800">겨울 (11~2월):</strong> 비수기라 항공과 숙소가 싸다. 하지만 일조 시간이 짧고 날씨가 흐린 날이 많아 야외 관광에는 불리하다. 대신 크리스마스 마켓(12월)이 열리는 시기라 독일, 오스트리아 쪽은 이 시즌만의 분위기가 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🛡️ 소매치기 예방, 이렇게 하면 된다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>유럽 여행에서 소매치기 걱정을 안 할 수는 없다. 특히 바르셀로나, 로마, 파리, 프라하는 소매치기가 활발한 도시로 알려져 있다. 겁먹을 필요는 없지만 기본 대비는 해두자.</p>
                <p><strong className="text-gray-800">실전 예방법:</strong> 귀중품(여권, 현금, 스마트폰)은 앞주머니나 몸 앞쪽 크로스백에 넣자. 배낭을 앞으로 메거나, 지퍼를 잠그고 다녀야 한다. 지하철에서 문이 닫히기 직전 타거나 내리는 사람을 특히 조심하자. 좁은 관광지, 에스컬레이터, 혼잡한 시장에서도 조심이 필요하다.</p>
                <p><strong className="text-gray-800">여권 관리:</strong> 여권은 숙소 금고나 배낭 깊숙한 곳에 보관하고, 외출 시엔 여권 사본(사진 찍어두기)과 신분증 역할을 대신할 카드를 갖고 다니는 것도 방법이다. 유럽 대부분 국가에서 신분증 제시 요청이 있을 수 있으니 여권 없이 다닐 경우 사본이라도 있어야 한다.</p>
                <p><strong className="text-gray-800">만약 도난당했다면:</strong> 현지 경찰서에 폴리스 리포트(신고서)를 받아야 여행자보험 청구가 가능하다. 여권을 분실했다면 해당 국가 주재 한국 대사관이나 영사관에 연락해 임시 여권을 발급받을 수 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">💡 유럽 여행 핵심 팁</h2>
              <ul className="text-sm text-gray-600 leading-relaxed flex flex-col gap-2">
                <li>• <strong className="text-gray-800">여행자 보험:</strong> 유럽은 의료비가 비쌉니다. 출발 전 반드시 여행자 보험에 가입하세요.</li>
                <li>• <strong className="text-gray-800">소매치기 주의:</strong> 관광지, 지하철, 버스에서 소매치기가 많습니다. 귀중품은 앞주머니나 크로스백에 보관하세요.</li>
                <li>• <strong className="text-gray-800">해외 결제 카드:</strong> 트래블월렛, 트레블로그 등 해외 수수료 없는 카드를 준비하면 환전 비용을 절약할 수 있습니다.</li>
                <li>• <strong className="text-gray-800">Voyalogue 활용:</strong> 파리-로마-바르셀로나 다도시 일정을 한 앱에서 날짜별로 관리하고 항공권·숙소 정보를 통합 저장하세요.</li>
              </ul>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 유럽 여행 일정 만들기</p>
            <p className="text-sm text-gray-500 mb-3">파리, 로마, 바르셀로나를 잇는 다도시 일정을 한 화면에서 관리하세요. 항공권·숙소·일별 코스까지 통합 관리 가능합니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 일정 만들기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/japan-travel', label: '🇯🇵 일본 여행 가이드' },
            { href: '/guide/travel-budget-tips', label: '💰 예산 절약 팁' },
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
