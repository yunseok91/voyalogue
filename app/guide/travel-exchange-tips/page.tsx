import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '해외여행 환전 완벽 가이드 | 어디서 어떻게 해야 손해 안 봐',
  description: '해외여행 환전, 어디서 하는 게 제일 이득일까. 은행 우대환율, 공항 환전소, 현지 ATM, 트래블카드까지. 환전 손해 안 보는 방법 총정리.',
}

export default function TravelExchangeTipsPage() {
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
            <span className="text-4xl block mb-4">💱</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['환전', '해외여행', '절약', '여행팁'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              해외여행 환전 완벽 가이드
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              해외여행 준비하면서 항공권이랑 숙소는 열심히 비교하는데, 환전은 대충 공항에서 하거나 그냥 카드 긁는 경우가 많다. 그런데 환전 방법만 바꿔도 10만 원짜리 여행에서 5,000~10,000원은 쉽게 절약된다. 규모가 커지면 그 차이도 커진다. 방법이 복잡해 보이지만 알고 보면 별거 없다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">💡 환전이 생각보다 복잡한 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>네이버에 "달러 환율" 치면 나오는 숫자가 있다. 예를 들어 1달러 = 1,350원이라고 뜨는데, 이걸 기준환율 또는 매매기준율이라고 한다. 실제 환전할 때 이 가격 그대로 거래하는 곳은 없다. 은행이든 환전소든 다들 여기에 수수료를 얹어서 팔기 때문이다.</p>
                <p>예를 들어 매매기준율이 1,350원이면, 은행 창구에서 사면 1,385원 정도 내야 한다. 35원짜리 스프레드가 붙은 거다. 100달러 환전하면 3,500원 손해, 1,000달러 환전하면 35,000원 손해. 생각보다 큰 금액이다.</p>
                <p>이 스프레드(수수료)가 얼마인지, 어떻게 줄이느냐가 환전 전략의 핵심이다. 방법마다 수수료 구조가 다르기 때문에 나라, 금액, 상황에 따라 최적 방법이 달라진다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🏦 은행 환전 — 우대환율 받는 법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>은행 창구에서 그냥 가면 기본 스프레드를 다 낸다. 하지만 은행 대부분이 '우대환율'이라는 걸 적용해준다. 해당 은행 앱이나 인터넷 뱅킹을 통해 환전 신청하면 스프레드를 50~90%까지 감면해주는 것이다.</p>
                <p><strong className="text-gray-800">모바일 환전 신청 방법:</strong> 각 은행 앱 → 환전 → 원하는 통화·금액 입력 → 수령 지점 선택(주거래 지점 또는 공항 지점). 신한은행, 하나은행, 우리은행 등 대부분 은행에서 지원한다. 공항 지점 픽업을 선택하면 출국 당일 공항에서 찾을 수 있어 편리하다.</p>
                <p><strong className="text-gray-800">환전 우대 쿠폰·이벤트:</strong> 은행 앱에서 종종 90% 우대 이벤트를 한다. 카카오뱅크나 토스에서도 환전 서비스를 제공하는데, 특히 토스는 달러·엔·유로에 대해 경쟁력 있는 환율을 제공하는 경우가 많다. 출발 전 여러 앱을 비교해보는 게 좋다.</p>
                <p>단점은 달러, 유로, 엔화 등 주요 통화는 괜찮은데, 동남아 통화(베트남 동, 인도네시아 루피아 등)는 취급 자체를 안 하는 은행이 많다는 거다. 이런 나라는 현지 ATM이나 현지 환전소를 이용하는 게 현실적이다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">✈️ 공항 환전소 — 솔직히 말하면 별로다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>공항 환전소는 편하다는 게 유일한 장점이다. 환율은 은행 창구보다 나쁜 경우가 많고, 특히 인천공항 출국장 안쪽 환전소는 이미 비행기 탄 것과 다름없는 상황이라 선택지가 없다는 걸 알고 마진을 더 높게 잡는다는 말도 있다.</p>
                <p>실제로 같은 날 같은 시간, 공항 내 환전소와 모바일 환전 가격을 비교해보면 100달러 기준 2,000~5,000원 차이가 나는 경우도 있다. 여행 한 번에 300달러 환전한다고 치면 6,000~15,000원 차이다.</p>
                <p>정말 급하게 출국하게 됐거나, 소액이라 큰 차이가 없다고 판단될 때만 이용하자. 그게 아니라면 출발 전 모바일 환전을 해두는 게 낫다. 공항 도착 후 은행 지점 픽업 창구에서 받는 방식이 가장 합리적이다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🏧 현지 ATM 인출 — 장단점과 수수료 계산</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>현지 ATM에서 현지 통화를 직접 뽑는 방법이다. 비자나 마스터카드 로고가 붙은 체크카드나 신용카드라면 전 세계 대부분 ATM에서 인출할 수 있다.</p>
                <p><strong className="text-gray-800">장점:</strong> 환전 환율이 은행 간 기준율에 가깝게 적용된다. 특히 동남아나 유럽에서는 현지 ATM이 국내 은행 환전보다 유리한 경우가 있다. 현금을 많이 들고 다니지 않아도 되니 분실 위험도 줄어든다.</p>
                <p><strong className="text-gray-800">단점 및 수수료:</strong> ATM 이용 수수료가 이중으로 붙는다. 국내 카드사 해외 인출 수수료(보통 1~1.5%) + 현지 ATM 운영사 수수료(현지 화폐로 200~500원 수준)가 합산된다. 1회 인출 금액이 클수록 고정 수수료 비중이 낮아지므로 소액으로 여러 번 뽑는 것보다 한 번에 필요한 만큼 인출하는 게 유리하다.</p>
                <p><strong className="text-gray-800">DCC(Dynamic Currency Conversion) 주의:</strong> 해외 ATM에서 "한국 원화로 인출하시겠습니까?"라는 선택이 나올 때 반드시 현지 통화를 선택해야 한다. 원화 선택 시 현지 ATM이 임의로 정한 불리한 환율이 적용된다. 이걸 모르고 원화 선택했다가 추가로 3~5% 손해 보는 경우가 꽤 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">💳 트래블카드·트래블월렛 활용법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>최근 몇 년 사이 트래블카드가 많이 보급됐다. 대표적으로 하나은행 트래블로그, 신한은행 SOL트래블카드, 트래블월렛(선불카드) 등이 있다.</p>
                <p>공통적으로 해외 결제 시 수수료가 없거나 매우 낮고, 일부는 해외 ATM 출금 수수료도 면제해준다. 특히 트래블월렛은 앱에서 다양한 통화로 미리 충전해두고 사용하는 방식이라 환율이 좋을 때 미리 충전해두는 전략도 가능하다.</p>
                <p>단점도 있다. 앱 충전이나 카드 발급에 익숙하지 않으면 처음에 헷갈릴 수 있고, 일부 국가에서는 현지 가맹점 단말기와 호환 문제로 결제가 안 되는 경우도 있다. 처음 쓰는 여행에선 트래블카드와 현금을 병행해서 가져가는 게 안전하다.</p>
                <p>유럽이나 일본 같이 카드 결제가 잘 되는 나라에서는 트래블카드 하나로도 대부분 해결된다. 반면 베트남, 태국 로컬 시장이나 야시장은 현금 위주라 현금도 챙겨야 한다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🌏 나라별 추천 환전 방법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🇯🇵 일본 엔화</p>
                  <p>국내 은행 모바일 환전(90% 우대 적용) + 공항 픽업 조합이 가장 일반적이다. 일본은 아직 현금 사용 비중이 높아서 넉넉하게 환전해 가는 게 좋다. 하루 식비·교통비 기준 1인 15,000엔~20,000엔 정도면 넉넉하다. 부족하면 세븐일레븐 ATM(세븐뱅크)에서 Visa/Master 카드로 인출할 수 있는데 환율이 나쁘지 않다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🌴 동남아 (태국·베트남·인도네시아 등)</p>
                  <p>현지에서 환전하는 게 대부분 유리하다. 태국은 슈퍼리치(Super Rich)라는 사설 환전소가 공항·시내에 많은데 은행보다 환율이 좋다. 베트남은 현지 ATM이나 공항 내 은행 환전소를 이용하자. 인도네시아 루피아는 국내에서 환전이 거의 불가능해서 현지 환전이 기본이다. 큰 금액을 한 번에 환전하면 더 좋은 환율을 적용해주는 곳도 있다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">🇪🇺 유럽 (유로)</p>
                  <p>카드 결제가 잘 되는 나라들이라 트래블카드 위주로 가는 것도 충분하다. 현금은 시장, 소규모 식당, 대중교통 자판기용으로 200~300유로 정도만 챙기면 된다. 유로는 국내 은행에서 모바일 환전이 잘 되므로 출발 전 환전 후 공항 픽업하는 방식 추천.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">⚠️ 환전할 때 흔히 하는 실수들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">출국 당일 공항에서 한꺼번에 환전:</strong> 시간 없고 긴장된 상황에서 환전 비교할 여유가 없다. 일주일 전이라도 미리 모바일 환전해두는 습관을 들이자.</p>
                <p><strong className="text-gray-800">너무 많이 환전했다가 남기기:</strong> 현지 통화는 귀국 후 재환전할 때 또 수수료가 붙는다. 특히 동남아 통화는 국내에서 재환전이 안 되는 경우도 있다. 일정 고려해서 조금 부족할 정도로만 환전하고, 부족하면 현지 ATM을 쓰는 전략이 낫다.</p>
                <p><strong className="text-gray-800">ATM에서 원화 선택:</strong> 앞서 말한 DCC 문제. 영어로 된 ATM 화면에서 당황해서 아무거나 누르다 원화 선택하면 손해다. 반드시 현지 통화(Local Currency) 선택.</p>
                <p><strong className="text-gray-800">환율 확인 없이 여행 내내 신용카드:</strong> 해외 신용카드 결제는 국제 브랜드 수수료(1%) + 카드사 해외 사용 수수료(0.2~1%)가 합산된다. 해외 수수료 없는 트래블카드나 체크카드를 쓰는 것과 비교하면 꽤 차이 난다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">✅ 결론: 나라별로 방법이 다르다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>단 하나의 정답은 없다. 나라마다, 금액마다 최적 방법이 다르다. 하지만 대부분의 여행에서 통하는 기본 원칙은 이렇다.</p>
                <p>주요 통화(달러·엔·유로)는 출발 전 모바일 우대환전. 동남아는 현지 ATM 또는 현지 환전소. 카드 결제는 해외 수수료 없는 트래블카드 사용. ATM에서는 무조건 현지 통화 선택.</p>
                <p>이 네 가지만 지켜도 여행 한 번에 1~3만 원은 절약된다. 여러 번 여행하면 꽤 쌓이는 금액이다. 처음엔 조금 번거롭게 느껴져도 한 번만 익혀두면 다음부터는 자동으로 손이 간다.</p>
              </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 여행 예산 관리하기</p>
            <p className="text-sm text-gray-500 mb-3">환전 금액부터 일별 지출까지 여행 예산을 한 곳에서 정리하고 파트너와 공유하세요.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/cheap-flights', label: '✈️ 항공권 싸게 사는 법' },
            { href: '/guide/jeju-travel', label: '🍊 제주도 여행 코스' },
            { href: '/guide/travel-budget-tips', label: '💰 여행 예산 절약 팁' },
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
