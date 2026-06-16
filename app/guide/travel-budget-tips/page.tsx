import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '여행 예산 계획 완벽 가이드 | 항목별 배분부터 귀국 후 정산까지',
  description: '여행 예산, 얼마를 어떻게 나눠야 할까. 항공·숙소·식비·관광비 항목별 현실적인 예산 배분법과 여행 중 지출 관리 방법을 정리했습니다.',
}

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
            <div className="flex flex-wrap gap-2 mb-4">
              {['예산계획', '여행비용', '절약', '정산'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              여행 예산 계획 — 얼마가 필요하고, 어떻게 나눠야 하나
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              여행 예산 짜는 게 귀찮아서 대충 "한 100만 원 정도 들겠지" 하고 떠났다가 귀국 후 카드 명세서를 보고 당황한 경험, 한 번쯤 있을 것이다. 문제는 예산이 부족했던 게 아니라 어디서 얼마를 쓸지 미리 생각하지 않은 것이다. 항목별로 예산을 나눠두면 여행 중에 불필요한 과소비가 줄어들고, 남은 금액도 파악하기 쉬워진다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">여행 예산, 어디서부터 시작해야 하나</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>예산 계획에서 가장 먼저 해야 할 건 총 예산이 아니라 <strong className="text-gray-800">고정 비용부터 확정하는 것</strong>이다. 항공권과 숙박비는 여행 전에 이미 결제가 끝나는 비용이라 변수가 없다. 이 두 항목을 먼저 확정한 다음, 나머지를 현지 지출 예산으로 잡는 방식이 가장 현실적이다.</p>
                <p>예를 들어 일본 오사카 4박 5일 여행을 기준으로 항공권 25만 원, 호텔 4박 32만 원이 고정 비용이라면, 총 예산 100만 원 중 57만 원이 이미 빠진다. 남은 43만 원을 5일치 현지 경비로 나누면 하루 약 86,000원이 생활비가 된다. 이 숫자를 기준으로 하루에 식비·교통비·관광비를 어떻게 나눌지 생각해보는 것이다.</p>
                <p>총 예산을 먼저 정하고 그 안에서 쪼개려고 하면 계산이 꼬인다. 고정비 → 남은 금액 → 하루 예산 순으로 계산하는 게 훨씬 명확하다. 여행 기간이 길수록, 사람이 많을수록 이 계산을 제대로 해두는 게 더 중요해진다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">항목별 예산 배분 — 현실적인 기준</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행 예산을 짤 때 흔히 쓰는 비율이 있다. 항공 30%, 숙박 25%, 식비 20%, 관광·액티비티 15%, 쇼핑 및 기타 10% 정도다. 하지만 이 비율은 여행 스타일에 따라 크게 달라진다. 쇼핑이 목적인 여행이라면 쇼핑 비중을 20~30%로 높이고 숙박을 낮추는 식으로 조정해야 한다.</p>
                <p><strong className="text-gray-800">식비</strong>는 하루 기준으로 잡는 게 편하다. 일본에서 편의점 밥과 라멘을 섞으면 하루 5,000~8,000엔(약 4.5~7만 원)으로 충분하다. 레스토랑 위주로 먹는다면 10,000~15,000엔은 잡아야 한다. 유럽은 물가가 높아서 식비를 하루 60~80유로(약 9~12만 원) 정도로 잡는 경우도 많다.</p>
                <p><strong className="text-gray-800">교통비</strong>는 도시 내 이동과 도시 간 이동을 나눠야 한다. 일본처럼 교통 패스(JR패스, 이코카)를 사야 하는 경우엔 사전 구매 비용이 수만 원에서 수십만 원까지 나온다. 이 비용을 식비로 착각해 계산에서 빠뜨리는 경우가 많으니 별도 항목으로 체크해두는 게 좋다.</p>
                <p><strong className="text-gray-800">관광·입장료</strong>는 미리 찾아봐야 한다. 유럽은 박물관 입장료가 1곳에 20~30유로인 경우도 있다. 루브르, 바티칸 박물관 같은 곳은 사전 예약을 하더라도 각각 17~20유로다. 3~4곳을 방문 계획이라면 관광비만 100유로 이상 나올 수 있다. 반면 자연 위주로 다니거나 무료 시장, 공원을 즐기는 스타일이라면 관광비를 거의 0으로 잡을 수도 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">숙소 예산 — '위치 대 가격' 트레이드오프</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>숙박비를 아끼려다 위치가 나쁜 숙소를 택하면 교통비와 시간이 더 든다. 이걸 간과하는 경우가 많다. 예를 들어 도쿄 중심부에서 지하철로 40분 거리의 외곽 숙소를 선택하면 숙박비는 1박에 2~3만 원 저렴할 수 있지만, 하루 2번 왕복하는 교통비와 이동 시간을 합산하면 오히려 손해인 경우가 생긴다. 3박이라면 이 차이가 더 벌어진다.</p>
                <p>숙소는 주요 관광지나 교통 허브와 도보 10~20분 이내 거리가 가장 효율적이다. Booking.com, 아고다, 호텔스닷컴 등을 비교할 때 지도 보기 기능으로 주변 지하철역이나 버스 정류장 위치를 반드시 확인하자.</p>
                <p>예산을 추가로 아끼고 싶다면 호스텔 도미토리, 에어비앤비, 한인민박 등도 선택지다. 혼자 여행한다면 호스텔 도미토리가 가장 저렴하고, 가족이나 그룹 여행이라면 통째로 빌리는 에어비앤비가 호텔보다 저렴할 수 있다. 4명이 2베드룸 에어비앤비를 빌리면 1인당 숙박비가 비즈니스 호텔 싱글룸의 절반 이하가 되는 경우도 많다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">식비를 줄이는 현실적인 전략</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>식비는 절약 의지가 있으면 가장 많이 줄일 수 있는 항목이기도 하고, 방심하면 가장 많이 초과하는 항목이기도 하다. 기본 전략은 매 끼니를 레스토랑에서 먹지 않는 것이다. 아침을 숙소 근처 슈퍼마켓이나 편의점에서 해결하고, 점심에 현지 식당에서 제대로 먹고, 저녁을 좀 더 가볍게 가져가는 패턴이 여행자들 사이에서 많이 쓰인다.</p>
                <p>일본의 경우 편의점(세븐일레븐, 패밀리마트, 로손)에서 주먹밥·샌드위치·도시락이 400~600엔 수준이라 아침이나 간식으로 충분하다. 현지 체인 음식점(사이제리야, 마쓰야, 스키야)은 500~800엔에 한 끼를 해결할 수 있다. 유럽은 슈퍼마켓(리들, 알디, 까르푸)에서 빵·과일·치즈 등을 사면 식비를 크게 줄일 수 있다.</p>
                <p>반면 여행의 즐거움 중 하나가 현지 맛집 경험이므로, 식비를 무조건 최소화하는 것보다 "하루 한 끼는 꼭 먹고 싶은 곳에서 제대로 먹고, 나머지는 가볍게"라는 원칙을 세우는 게 현실적이다. 하루 중 한 끼를 미리 정해두면 나머지 끼니에서 자연스럽게 절약하게 된다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">여행 중 지출을 추적하지 않으면 생기는 일</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>많은 여행자들이 지출 추적을 귀찮아한다. 여행 중에 일일이 기록하는 게 분위기 깨는 것 같기도 하고, 어차피 귀국하면 카드 명세서로 다 확인되니까 그때 보면 된다는 생각도 든다. 하지만 카드 명세서는 여행이 끝난 다음에 나온다. 중간에 얼마를 썼는지 모르면 남은 일정에서 예산 조정이 불가능하다.</p>
                <p>실제로 추적 없이 여행한 사람들이 가장 많이 하는 말은 "나중에 보니 쇼핑에서 예상보다 훨씬 많이 썼다"는 거다. 구매할 때는 각각 3만 원, 5만 원으로 느껴지는 물건들이 여러 개 쌓이면 20~30만 원이 된다. 그걸 여행 중에 인지하고 있었다면 마지막 날 무리하지 않았을 텐데, 돌아오고 나서야 후회하는 패턴이 반복된다.</p>
                <p>지출 추적은 복잡하게 할 필요가 없다. 메모 앱에 날짜별로 금액만 기록하거나, 여행 계획 앱에 일정별로 지출을 입력하는 것으로 충분하다. 그날 자기 전 10분, 오늘 쓴 돈을 합산해보는 루틴만 있어도 예산 초과를 방지할 수 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">쇼핑 예산은 반드시 따로 잡아야 한다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행 예산에서 가장 통제하기 어려운 항목이 쇼핑이다. 계획에 없던 물건을 사게 되는 경우가 많고, 면세나 현지 가격 메리트 때문에 "이건 여기서 사야 해"라는 논리로 충동구매가 이어진다. 이를 방지하려면 쇼핑 예산을 여행 전에 명확하게 정해두는 것이 좋다.</p>
                <p>쇼핑 예산을 잡을 때는 "무엇을 살 것인가"를 미리 리스트로 정리해두는 방법이 효과적이다. 일본 갈 때 사고 싶은 것들, 코스메틱 몇 개, 기념품 몇 가지, 예산 합계 X만 원 — 이렇게 구체적으로 정해두면 그 이상 쓰는 걸 스스로 억제하게 된다. 반면 "그냥 현지에서 보면서 사야지"로 가면 돌아보면 수십만 원이 쇼핑에 나가 있는 경우가 많다.</p>
                <p>면세점은 필요한 것만 사는 공간이지, 쇼핑을 즐기는 공간이 아니다. 면세 한도(1인당 미화 800달러)를 초과하면 세관 신고 후 관세를 내야 한다는 것도 알아두자. 초과 시 품목에 따라 8~20%의 관세가 붙으니, 면세라는 이유로 필요 이상으로 사다가 오히려 더 쓰는 상황이 생길 수 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">예상 외 지출을 위한 비상금 전략</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행에서는 항상 예상 밖의 지출이 생긴다. 비행기 지연으로 공항에서 밥을 사야 하는 상황, 갑자기 비가 와서 우산을 사야 하는 상황, 짐을 잃어버려 필요한 물건을 현지에서 사야 하는 상황, 몸이 아파서 약국을 가야 하는 상황 등 어떤 일이 생길지 모른다. 이런 변수를 완전히 없애는 것은 불가능하다.</p>
                <p>대신 비상금 개념으로 전체 예산의 10~15%를 따로 남겨두는 것이 좋다. 100만 원짜리 여행이라면 10~15만 원을 써도 되는 예비 자금으로 두는 것이다. 이 돈을 쓰지 않으면 귀국 후 여유 자금이 되고, 쓰게 되면 예산 초과 없이 대응할 수 있다.</p>
                <p>여행자 보험도 예상 외 지출에 대비하는 중요한 수단이다. 해외에서 병원을 가야 할 때 의료비가 수십만 원에서 수백만 원까지 나오는 경우가 있다. 여행자 보험은 보통 일주일 여행 기준으로 1~3만 원이면 가입할 수 있어서 가성비 면에서 거의 최고 수준이다. 출발 전날이라도 가입할 수 있으니 놓치지 말자.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">그룹 여행의 예산 관리 — 정산이 핵심이다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>혼자 여행하면 지출 추적이 쉽지만, 여럿이 함께 다니면 복잡해진다. 식사나 교통을 한 명이 대표로 결제하고, 나중에 나눠 내는 방식이 일반적인데 — 이걸 제대로 기록해두지 않으면 귀국 후 "내가 더 많이 낸 것 같은데?"라는 분쟁이 생긴다.</p>
                <p>그룹 여행에서는 공동 지출과 개인 지출을 처음부터 구분하는 게 중요하다. 숙소, 렌트카, 단체 투어처럼 모두 함께 쓰는 비용은 공동 지출로 기록하고, 각자의 개인 식사나 쇼핑은 개인 지출로 분리한다. 공동 지출만 나중에 n분의 1로 정산하면 된다.</p>
                <p>이 정산 과정에서 스프레드시트를 쓰거나 메모를 나중에 모아서 계산하는 건 실수가 생기기 쉽다. 지출 항목이 많아지면 누가 뭘 얼마 냈는지 기억이 흐릿해지는 경우도 있다. 여행 중에 실시간으로 지출을 기록하고, 귀국 후 자동으로 1인당 금액을 계산해주는 도구를 쓰면 이런 문제를 아예 방지할 수 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">귀국 후 정산과 다음 여행 준비</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행이 끝나고 집에 돌아오면 지출 정산을 마무리해야 한다. 카드 명세서가 나오기 전에 여행 중 기록해둔 지출 내역을 기준으로 먼저 정산하는 게 좋다. 카드 결제는 1~2주 후에 명세서로 나오는데, 그 시점에 여행이 기억에서 흐릿해지면 어떤 지출인지 파악하기 어려워진다.</p>
                <p>환전해서 남은 외화는 귀국 후 재환전할 수 있지만, 재환전 시 다시 수수료가 붙는다. 다음 여행에서 같은 나라를 갈 계획이 있다면 남은 소량의 외화는 보관해두는 것도 방법이다. 다만 동남아시아 통화(베트남 동, 인도네시아 루피아 등)는 국내에서 재환전이 안 되거나 환율이 매우 불리하게 적용되니 최소한으로 남기는 게 낫다.</p>
                <p>이번 여행의 실제 지출 데이터는 다음 여행 예산을 짜는 데 가장 정확한 기준이 된다. "일본 오사카 4박 5일에 2인 기준 총 180만 원 들었다"는 수치가 있으면, 비슷한 다음 여행에서 예산을 훨씬 정확하게 잡을 수 있다. 여행 후 지출 내역을 정리해두는 습관이 장기적으로 여행 비용을 줄이는 가장 좋은 방법 중 하나다.</p>
              </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">여행 예산과 정산, Voyalogue로 한 번에</p>
            <p className="text-sm text-gray-500 mb-3">항목별 지출을 날짜별로 기록하고, 여행 파트너와 공유해 자동으로 1인당 금액을 계산하세요. 여행 전 계획부터 귀국 후 정산까지 한 곳에서 관리됩니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/travel-exchange-tips', label: '💱 해외 환전 완벽 가이드' },
            { href: '/guide/cheap-flights', label: '✈️ 항공권 싸게 사는 법' },
            { href: '/guide/travel-insurance', label: '🛡️ 여행자 보험 가이드' },
            { href: '/guide/group-travel-settlement', label: '🧾 그룹 여행 정산법' },
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
