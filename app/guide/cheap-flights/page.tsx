import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '항공권 싸게 사는 법 | 시기부터 앱까지 실제로 효과 있는 방법들',
  description: '항공권 저렴하게 구매하는 방법 총정리. 최저가 검색 사이트, 출발 몇 달 전에 사야 하는지, 특가 항공권 잡는 방법까지.',
}

export default function CheapFlightsPage() {
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
            <span className="text-4xl block mb-4">✈️</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['항공권', '최저가', '여행절약', '특가'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              항공권 싸게 사는 법
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              같은 비행기, 같은 날짜인데 누군가는 15만 원에 샀고 누군가는 45만 원을 냈다. 이게 실제로 일어나는 일이다. 항공사가 좌석 가격을 실시간으로 조정하기 때문에 언제, 어디서 사느냐에 따라 가격이 완전히 달라진다. 어떻게 하면 싸게 살 수 있는지 실제로 효과 있는 방법들만 정리했다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📊 항공권 가격이 날마다 바뀌는 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>항공사는 비행기 좌석을 여러 개의 '클래스'로 나눠서 판다. 같은 이코노미 자리라도 초기에 풀리는 저렴한 클래스(보통 Y, B, M 같은 코드로 관리)부터 팔리고, 그게 소진되면 비싼 클래스 좌석이 채워진다. 남은 좌석 수, 출발까지 남은 시간, 경쟁 항공사 가격, 특정 날의 수요 등이 복합적으로 반영되어 알고리즘이 실시간으로 가격을 조정한다.</p>
                <p>그래서 같은 검색을 오전에 하면 30만 원인데 저녁에 하면 28만 원인 경우도 생기고, 반대로 올라가 있기도 하다. 또 성수기 직전에 가격이 치솟는 건 당연하고, 역으로 성수기가 지나고 나서 비수기 직전 항공권 가격이 갑자기 떨어지는 '막판 특가'도 발생한다.</p>
                <p>이 원리를 이해하면 단순히 "일찍 사면 싸다"는 공식이 항상 맞지는 않다는 것도 알 수 있다. 상황에 따라 다르다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📅 출발 얼마 전에 사는 게 제일 쌀까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>정답부터 말하면, 단거리 노선(한국-일본, 한국-동남아)은 출발 1~3개월 전, 장거리 노선(유럽, 미국)은 3~6개월 전이 통계적으로 가격이 가장 안정적이고 선택지가 많은 구간이다.</p>
                <p>너무 일찍 사면(6개월 이상 전) 아직 항공사가 가격을 높게 잡고 있을 때가 많다. 초기 좌석 클래스가 비싸게 시작하는 경우도 있어서 오히려 손해다. 반대로 너무 늦게(2~4주 전) 사면 저렴한 클래스 좌석은 다 소진되고 비싼 것만 남아 있는 경우가 대부분이다.</p>
                <p>다만 LCC(저비용항공사) 특가는 패턴이 다르다. 티웨이, 제주항공, 에어부산 같은 LCC들은 '플래시딜' 형태로 한정된 기간·좌석에 파격 가격을 내놓는다. 이건 예고 없이 뜨고 빠르게 소진된다. 이 특가를 노린다면 항공사 앱 알림이나 항공권 가격 추적 서비스를 켜두고 기다려야 한다.</p>
                <p>요약: 계획이 있다면 1~3개월 전 구매. 특가를 노린다면 알림 설정 후 기회가 오면 바로 결제.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🔍 항공권 검색 사이트 비교</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">스카이스캐너 (Skyscanner)</p>
                  <p>전 세계 가장 많이 쓰는 항공권 비교 사이트다. 날짜를 '전체'로 설정하면 한 달 중 어떤 날이 가장 싼지 달력 형태로 볼 수 있어서 유연하게 날짜를 고를 때 좋다. 목적지도 '어디든지'로 설정하면 현재 가장 저렴한 취항지들을 보여줘서 영감을 얻기 좋다. 단, 스카이스캐너는 메타서치라 실제 예약은 각 항공사나 OTA(온라인 여행사)로 넘어가서 진행하게 된다. 최저가 링크가 오케이, 인터파크 같은 곳으로 연결되기도 하는데 추가 수수료 붙는 경우도 있으니 확인이 필요하다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">네이버항공</p>
                  <p>국내 OTA들을 한 번에 비교하기 편하다. 인터파크, 하나투어, 온라인투어, 땡처리닷컴 등 다양한 판매처 가격을 한 화면에서 볼 수 있다. 한글 인터페이스라 익숙하고, 결제도 네이버페이로 할 수 있어서 국내 여행자에게 편하다. 다만 외국 항공사 저가 직항이나 LCC 특가는 빠진 경우도 있어서 스카이스캐너와 병행해서 쓰는 게 좋다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">카약 (KAYAK)</p>
                  <p>가격 예측 기능이 특징이다. "지금 사면 좋은가, 기다리는 게 나은가"를 그래프로 보여주는데, 100% 신뢰하기보단 참고용으로 활용하면 된다. 항공+호텔 패키지 검색도 가능하고 글로벌 OTA까지 포함해서 더 넓게 비교된다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">인터파크투어</p>
                  <p>국내 대형 OTA 중 하나로 LCC 특가 알림 서비스가 잘 되어 있다. 땡처리 특가 섹션에 파격 가격이 올라오는 경우도 있다. 단순 검색보다 특가 탭을 자주 확인하는 게 포인트다.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🔔 특가 항공권 잡는 실전 팁</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">항공사 앱 알림 켜두기:</strong> 제주항공, 진에어, 에어부산, 티웨이항공 앱을 설치하고 푸시 알림을 켜두면 플래시딜이 뜰 때 바로 알 수 있다. 특가는 뜨자마자 몇 시간 안에 소진되는 경우도 있어서 빠른 결정이 필요하다. 미리 카드 정보를 앱에 저장해두면 더 빠르게 결제할 수 있다.</p>
                <p><strong className="text-gray-800">스카이스캐너 가격 알림:</strong> 특정 노선을 저장해두면 가격이 변동할 때 이메일로 알려준다. 꼭 사야 하는 날짜가 정해져 있을 때 유용하다.</p>
                <p><strong className="text-gray-800">항공사 뉴스레터 구독:</strong> 귀찮게 느껴지지만 항공사 이메일 뉴스레터에 비공개 특가가 먼저 올라오는 경우가 있다. 특히 에어아시아, 스쿠트 같은 외국계 LCC들이 이런 방식으로 특가를 공개한다.</p>
                <p><strong className="text-gray-800">대안 날짜·공항 확인:</strong> 원하는 날짜보다 하루 앞이나 뒤가 확연히 저렴한 경우도 많다. 일정에 유연성이 있다면 ±1~2일 범위로 가격을 비교해보자. 또 인천 외에 김포, 청주, 부산(김해) 출발 편이 경우에 따라 저렴할 수 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📆 요일과 시간대별 가격 차이</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>출발 요일은 화요일, 수요일, 목요일이 주말(금~일)에 비해 평균 10~20% 저렴한 경우가 많다. 주말에 출발하고 싶은 수요가 집중되다 보니 금요일 저녁~일요일 항공권은 가격이 올라가는 경향이 있다.</p>
                <p>비행 시간대도 영향을 준다. 새벽 출발(오전 6시 이전)이나 심야 출발은 수요가 낮아서 낮 시간대보다 저렴하게 팔리는 경우가 많다. 단, 새벽 비행기는 공항 가는 교통편이 없어서 전날 공항 근처에서 자거나 택시를 써야 하는 상황이 생긴다. 교통비까지 합산해서 비교하는 게 맞다.</p>
                <p>항공권을 검색하는 요일도 영향이 있다는 말이 있다. 화요일, 수요일에 검색하면 가격이 싸다는 속설인데, 공식적으로 검증된 데이터는 없다. 큰 차이는 없지만 여러 날에 걸쳐 비교해보는 습관 자체는 나쁘지 않다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">⚖️ LCC vs 대형항공사, 어떻게 고를까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>무조건 LCC가 싸다고 생각하면 함정에 빠진다. LCC는 기본 운임이 저렴하지만 위탁수하물, 기내식, 좌석 지정, 환불/변경 수수료 등이 모두 별도다. 짐 15kg 하나만 추가해도 3~5만 원씩 올라가는 경우가 있다.</p>
                <p>짐이 많거나, 기내식이 필요하거나, 스케줄 변경 가능성이 있는 비즈니스 출장이라면 대형항공사가 결과적으로 더 나을 수 있다. 반면 배낭 하나만 들고 1~2주 여행 가는 경우라면 LCC가 확실히 이득이다.</p>
                <p>비교할 때는 기본 운임이 아니라, 짐값과 좌석 지정비를 포함한 총금액으로 비교해야 한다. 스카이스캐너에서 LCC 가격을 보여줄 때 수하물 미포함 가격인 경우가 많으니 주의가 필요하다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🔄 경유 vs 직항, 현실적 판단</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>경유편이 직항보다 5~15만 원 저렴한 경우가 많다. 시간이 넉넉한 여행이고 경유지가 흥미로운 곳(예: 홍콩, 방콕, 두바이)이라면 경유를 오히려 즐기는 여행자도 있다.</p>
                <p>하지만 단점도 분명하다. 총 이동 시간이 3~6시간 이상 늘어나고, 환승 중 수하물 분실 위험이 높아지고, 연결편 지연으로 다음 비행기를 놓치면 꽤 복잡한 상황이 생긴다. 연결 시간이 1시간 30분 이하인 경유는 공항에 따라 실제로 빡빡할 수 있다.</p>
                <p>경유를 고려한다면 환승 시간은 최소 2시간 이상, 같은 항공사(또는 파트너 항공사) 내 연결편인지 확인하자. 다른 항공사끼리 개별 발권된 경우 앞 비행기가 늦어도 뒷 비행기를 무료로 보장해주지 않는다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🏅 마일리지 항공권 활용</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>마일리지 항공권은 제대로 쓰면 이코노미 현금 티켓 2~3장 값어치를 하는 비즈니스 클래스를 무료로 탈 수 있는 수단이다. 단, 이 분야는 학습 곡선이 있다.</p>
                <p>대한항공 스카이패스, 아시아나 아시아나클럽이 대표적이다. 적립은 해당 항공사 탑승이 기본이지만, 제휴 신용카드로 일상 결제 시에도 마일리지가 쌓인다. 마일리지가 빨리 모이는 신용카드(현대카드 M포인트 전환, 삼성카드 마일리지 전환 등)를 주력 카드로 쓰면 1~2년 안에 단거리 왕복 항공권 정도는 모을 수 있다.</p>
                <p>주의할 점은 마일리지 유효기간(대한항공 10년, 아시아나 10년)과 성수기 보너스 항공권 좌석 확보가 어렵다는 점이다. 특히 설·추석 연휴나 7~8월 여름 성수기엔 마일리지 좌석이 오픈 즉시 소진된다. 원하는 날짜가 있다면 오픈 시점(출발 330일 전)에 바로 잡는 게 필요하다.</p>
                <p>마일리지 항공권은 한 번 익숙해지면 여행 경험을 완전히 바꿔놓는 도구다. 당장 여행 계획이 없더라도 마일리지 카드 하나쯤 만들어두는 걸 추천한다.</p>
              </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 항공 일정 관리하기</p>
            <p className="text-sm text-gray-500 mb-3">항공권 정보를 등록하고 날짜별 여행 일정을 한 번에 정리하세요. 여행 파트너와 실시간으로 공유할 수 있습니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/travel-exchange-tips', label: '💱 해외여행 환전 가이드' },
            { href: '/guide/jeju-travel', label: '🍊 제주도 여행 코스' },
            { href: '/guide/japan-travel', label: '🇯🇵 일본 여행 가이드' },
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
