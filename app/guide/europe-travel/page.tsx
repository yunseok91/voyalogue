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
