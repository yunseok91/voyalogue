import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '일본 여행 완벽 가이드 2025 | Voyalogue',
  description: '일본 여행을 처음 준비하는 분을 위한 완벽 가이드. 비자, 교통, 도쿄·오사카·교토 추천 코스, 예산, 유용한 앱까지 모두 정리했습니다.',
}

export default function JapanTravelPage() {
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
            <span className="text-4xl block mb-4">🇯🇵</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['일본', '아시아', '도시여행', '2025'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              일본 여행 완벽 가이드 2025
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              일본은 한국에서 가장 가깝고 접근하기 쉬운 해외 여행지 중 하나입니다. 비자 없이 90일까지 체류할 수 있어 처음 해외여행을 준비하는 분들에게도 적합합니다. 도쿄, 오사카, 교토를 중심으로 여행 준비의 모든 것을 정리했습니다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">✈️ 항공권 & 입국</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">비자:</strong> 대한민국 여권 소지자는 관광 목적으로 최대 90일까지 무비자 입국이 가능합니다. 별도 신청 절차 없이 여권만으로 입국할 수 있습니다.</p>
                <p><strong className="text-gray-800">항공편:</strong> 서울(인천/김포)에서 도쿄(나리타/하네다), 오사카(간사이/이타미), 삿포로, 후쿠오카 등 직항 노선이 다수 운항됩니다. 저비용항공사(LCC)를 이용하면 왕복 15~25만 원대에도 구매 가능합니다. 최소 2~3개월 전에 예약하면 저렴한 가격으로 구매할 수 있습니다.</p>
                <p><strong className="text-gray-800">입국 심사:</strong> 일본 입국 시 Visit Japan Web 사전 등록을 해두면 입국 심사가 훨씬 빠릅니다. 공항에서 모바일 큐알코드로 빠른 통과가 가능합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🚆 현지 교통</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">IC 카드 (Suica / PASMO):</strong> 일본 여행의 필수품입니다. 전국 대부분의 지하철, 버스, 편의점에서 사용할 수 있습니다. 공항에서 바로 구매하거나 스마트폰 NFC 기능을 통해 발급받을 수 있습니다.</p>
                <p><strong className="text-gray-800">신칸센:</strong> 도쿄-오사카 구간(약 2시간 30분), 오사카-히로시마(약 1시간 30분) 등 도시 간 이동에 신칸센을 이용합니다. JR패스를 사전 구매하면 일정 기간 신칸센을 무제한으로 이용할 수 있어 여러 도시를 여행할 경우 유리합니다.</p>
                <p><strong className="text-gray-800">시내 교통:</strong> 도쿄와 오사카의 지하철 망은 매우 촘촘합니다. Google Maps가 일본 대중교통 안내를 완벽히 지원하므로 이동 중 막힘 없이 활용할 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🗺️ 추천 도시 & 코스</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🗼 도쿄 (3~4일 추천)</p>
                  <p>시부야, 신주쿠, 아키하바라, 아사쿠사, 하라주쿠, 오다이바가 대표 명소입니다. 첫날은 시내 중심부에서 이동 흐름을 익히고, 이후 목적에 맞는 구역을 하루씩 집중적으로 돌아보는 방식이 효율적입니다. 도쿄 스카이트리나 시부야 스카이 전망대에서 야경을 감상하는 일정도 추천합니다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🏯 교토 (2~3일 추천)</p>
                  <p>일본 전통 문화를 가장 잘 느낄 수 있는 도시입니다. 후시미이나리 신사의 붉은 도리이 터널, 아라시야마 대나무 숲, 금각사, 기온 거리가 대표적입니다. 벚꽃 시즌(3월 말~4월 초)과 단풍 시즌(11월)에 방문하면 더욱 아름다운 풍경을 감상할 수 있습니다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🎡 오사카 (1~2일 추천)</p>
                  <p>먹거리 천국으로 유명한 도시입니다. 도톤보리 거리의 음식 골목, 구로몬 시장, 오사카성이 주요 명소입니다. 교토와 가까워 함께 일정을 묶기 좋습니다. 특히 타코야키, 오코노미야키, 구시카츠는 꼭 먹어봐야 합니다.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">💴 예산 가이드</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { label: '저예산 (게스트하우스 + 편의점 식사)', value: '1인 5~7만 원/일' },
                    { label: '중간 예산 (비즈니스호텔 + 현지 식당)', value: '1인 10~15만 원/일' },
                    { label: '편안한 여행 (3성급 + 자유 식사)', value: '1인 18~25만 원/일' },
                    { label: '항공권', value: '왕복 15~30만 원' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500 mb-0.5">{i.label}</p>
                      <p className="font-bold text-gray-900">{i.value}</p>
                    </div>
                  ))}
                </div>
                <p>일본은 편의점 음식 수준이 높아 편의점만 이용해도 식비를 크게 절약할 수 있습니다. 런치 타임에는 많은 레스토랑이 저렴한 세트 메뉴를 제공하므로 점심을 메인 식사로 활용하는 것도 좋은 방법입니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🌸 언제 가는 게 좋을까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">벚꽃 시즌 (3월 말~4월 초):</strong> 일본 여행 성수기 중에서도 가장 인기 많은 시기다. 도쿄 기준으로 보통 3월 25일~4월 5일 사이가 만개 기간인데, 해마다 조금씩 다르다. 우에노 공원, 메구로강, 치도리가후치 주변이 벚꽃 명소로 유명하다. 단, 이 시기엔 항공권과 숙소 가격이 평소보다 2~3배 뛰고 예약도 금방 마감되니 최소 두 달 전엔 잡아야 한다.</p>
                <p><strong className="text-gray-800">여름 (7~8월):</strong> 솔직히 일본 여름은 굉장히 덥고 습하다. 도쿄 기준 낮 최고 기온이 35도를 넘는 날도 많고, 체감은 더 높다. 그래도 불꽃놀이 축제(하나비 대회), 여름 마쓰리(축제), 유카타 입고 다니는 분위기가 있어서 이 시기만의 매력이 있다. 체력이 된다면 나름 특별한 경험이 가능하다.</p>
                <p><strong className="text-gray-800">가을 단풍 (11월):</strong> 벚꽃 다음으로 인기 많은 시기다. 교토의 단풍이 특히 유명한데, 기요미즈데라, 난젠지, 아라시야마 일대가 붉게 물드는 11월 중순~하순이 절정이다. 이 시기 교토는 사람이 너무 많아 주요 명소 앞에서 줄을 꽤 서야 한다.</p>
                <p><strong className="text-gray-800">겨울 (12~2월):</strong> 비수기라 항공권과 숙소가 상대적으로 저렴하다. 삿포로 눈 축제(2월), 온천 여행을 즐기기 좋은 시기다. 도쿄·오사카는 영하까지 내려가지 않아 두꺼운 패딩 하나면 충분하다. 홋카이도 쪽은 다른 이야기지만.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🍜 일본에서 꼭 먹어봐야 할 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>일본 음식의 수준이 높다는 건 두말할 것도 없는데, 처음 가는 사람이 어디서 뭘 먹어야 할지 막막할 수 있다. 유명 맛집보다 오히려 동네 중견 가게들이 훨씬 맛있는 경우가 많다.</p>
                <p><strong className="text-gray-800">라멘:</strong> 지역마다 스타일이 다르다. 도쿄는 간장 기반 소유 라멘, 삿포로는 미소 라멘, 하카타(후쿠오카)는 돼지뼈 육수 돈코츠 라멘이 유명하다. 한 그릇에 1,000~1,400엔 정도. 줄이 길어도 보통 30분 이내라 기다릴 만하다. 자판기로 식권 뽑는 방식이 많으니 영어 버튼이나 사진을 찾아보자.</p>
                <p><strong className="text-gray-800">편의점 음식:</strong> 과소평가하기 쉬운데, 일본 편의점(세븐일레븐, 로손, 패밀리마트)의 음식은 진짜 수준급이다. 주먹밥(오니기리) 한 개에 150~200엔, 따뜻한 만두나 어묵도 100~200엔 수준이다. 아침식사로 편의점 활용하면 하루 식비를 크게 줄일 수 있다.</p>
                <p><strong className="text-gray-800">이자카야:</strong> 저녁에 동네 이자카야 한 번은 꼭 가보길 추천한다. 혼자 가도 어색하지 않고, 맥주 한 잔에 야키토리(닭꼬치) 몇 개 시켜놓으면 2,000~3,000엔으로 만족스러운 저녁이 된다. 관광지 근처보다 주택가 골목 이자카야가 훨씬 저렴하고 현지 분위기도 난다.</p>
                <p><strong className="text-gray-800">주의할 점:</strong> 일본 식당은 테이블에 앉으면 물과 오시보리(물수건)가 나오는데 이건 무료다. 그리고 식사 중 팁은 주지 않는다. 오히려 팁을 놓고 나오면 쫓아나와서 돌려주는 경우도 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🎌 알아두면 편한 일본 생활 팁</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">현금은 필수:</strong> 일본은 2025년에도 현금 사용 비중이 생각보다 높다. 작은 식당, 신사, 지방 가게 중에 카드를 아예 안 받는 곳이 있다. 세븐일레븐 ATM에서 해외 카드로 엔화 인출이 가능한데, 수수료가 비교적 낮은 편이다. 20,000~30,000엔 정도는 현금으로 준비해두자.</p>
                <p><strong className="text-gray-800">온천(오후로) 에티켓:</strong> 온천이나 목욕탕에 처음 가면 헷갈릴 수 있다. 들어가기 전에 반드시 몸을 씻어야 하고, 수건을 물에 담그면 안 된다. 타투가 있으면 입장 제한하는 곳이 많으니 미리 확인하자.</p>
                <p><strong className="text-gray-800">쓰레기통이 없다:</strong> 일본 거리에 쓰레기통이 거의 없다. 편의점에서 산 음식 쓰레기는 편의점 쓰레기통에 버릴 수 있고, 아니면 숙소로 가져가야 한다. 길거리에서 먹으면서 걷는 것도 일부 관광지를 제외하고는 자제하는 편이다.</p>
                <p><strong className="text-gray-800">신사 예절:</strong> 신사 입구 도리이를 통과할 땐 가볍게 고개를 숙이는 게 예의다. 물 뜨는 곳(데미즈야)에서 손을 씻는 순서도 있는데 몰라도 크게 문제없다. 소원을 비는 곳에서 박수를 치는 건 일반적인 모습이라 같이 해봐도 좋다.</p>
                <p><strong className="text-gray-800">전철에서:</strong> 일본 전철에서는 통화는 삼가고 음식도 먹지 않는 게 기본이다. 조용한 분위기에 익숙해지면 오히려 편하다. 혼잡한 시간대(오전 7~9시, 오후 6~8시)엔 탑승객이 엄청나니 이 시간대 이동은 최대한 피하자.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📱 유용한 앱 & 팁</h2>
              <ul className="text-sm text-gray-600 leading-relaxed flex flex-col gap-2">
                <li>• <strong className="text-gray-800">Google Maps</strong> — 일본 대중교통 경로 안내, 실시간 운행 정보 제공</li>
                <li>• <strong className="text-gray-800">Papago / DeepL</strong> — 메뉴판, 간판 실시간 번역에 필수</li>
                <li>• <strong className="text-gray-800">Visit Japan Web</strong> — 입국 심사 사전 등록, 면세 신청</li>
                <li>• <strong className="text-gray-800">Voyalogue</strong> — 도쿄·오사카·교토 일정을 한 앱에서 통합 관리, 친구와 실시간 공유</li>
                <li>• <strong className="text-gray-800">현금 준비:</strong> 일본은 아직 현금 사용 비중이 높습니다. 공항 ATM이나 세븐일레븐 ATM에서 엔화를 인출하는 것이 환율이 유리한 경우가 많습니다.</li>
              </ul>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 일본 여행 일정 만들기</p>
            <p className="text-sm text-gray-500 mb-3">도쿄·오사카·교토 일정을 AI로 자동 생성하거나 직접 구성해보세요. 항공권, 숙소, 날별 코스까지 한 번에 관리할 수 있습니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 일정 만들기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/europe-travel', label: '🇪🇺 유럽 여행 가이드' },
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
