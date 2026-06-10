import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '커플 여행 예산 계획 | 돈 때문에 싸우지 않는 여행 준비법',
  description: '커플 여행, 예산 때문에 싸우지 않으려면 미리 정해야 할 게 있어요. 현실적인 커플 여행 예산 계획과 분담 방법을 정리했습니다.',
}

export default function CoupleTravelBudgetPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600" />
            <span className="font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
          </Link>
          <Link href="/guide" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 가이드 목록</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10">

          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {['커플여행', '예산계획', '정산', '여행준비'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              커플 여행 예산 계획 — 돈 때문에 싸우지 않는 방법
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              커플이 함께 여행 가서 싸우는 이유 중 가장 많은 게 돈 문제라는 걸 아시나요? 여행지의 낭만과 현실 예산의 간극, 지출 기준이 다른 두 사람, 누가 얼마를 낼지에 대한 암묵적인 기대 차이 — 이것들이 여행 중에 터지면 생각보다 크게 번집니다. 미리 준비하면 충분히 피할 수 있는 문제들이에요.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">여행 가서 돈 때문에 싸우는 패턴들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>커플 여행에서 돈 때문에 갈등이 생기는 패턴은 대부분 비슷합니다. 가장 흔한 게 "한쪽이 더 많이 쓰고 싶어 하는" 상황이에요. 한 명은 좋은 레스토랑에서 저녁을 먹고 싶고, 다른 한 명은 현지 포장마차로 충분하다고 생각하는 거죠. 이게 한두 번이면 넘어가지만, 며칠 동안 계속되면 감정이 쌓입니다.</p>
                <p>두 번째 패턴은 "지금은 그냥 내가 낼게" 방식입니다. 식사할 때마다 한 명이 카드를 꺼내는 게 편하니까 그렇게 하다 보면, 어느 순간 "내가 더 많이 쓴 것 같은데?"라는 생각이 들기 시작해요. 말 안 하고 속으로 참으면 나중에 더 크게 터집니다.</p>
                <p>세 번째는 예산 초과 상황에서의 갈등이에요. 계획보다 돈이 많이 나왔을 때, 한 명은 "어쩔 수 없지, 여행인데"라고 생각하고 다른 한 명은 "이럴 줄 알았어, 처음부터 무리했잖아"라고 받아치면 — 여행이 망가집니다. 초과 지출에 대한 기준도 미리 맞춰두는 게 좋아요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">출발 전에 꼭 정해야 할 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행 가기 전에 딱 두 가지만 합의해두면, 여행 중 돈 때문에 갈등이 생길 확률이 절반 이하로 줄어듭니다.</p>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">총 예산 확정</p>
                    <p>항공권, 숙소, 식비, 교통, 쇼핑, 입장료, 기타 비상금까지 포함한 1인당 총 예산을 먼저 정하세요. 이때 두 사람이 생각하는 숫자가 다를 수 있는데, 솔직하게 얘기하는 게 낫습니다. "나 이번에 50만 원까지가 한계야"라고 말하는 게 어색하게 느껴져도, 말하지 않고 여행 가는 것보다 훨씬 낫습니다.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">지출 분담 방식 결정</p>
                    <p>50:50으로 나눌 건지, 아니면 다른 기준을 쓸 건지 미리 정해야 해요. 그리고 "식사는 번갈아가며 내기", "숙소는 같이 반반 내기" 같은 세부 규칙도 있으면 좋습니다. 방식을 정해두면 매번 "이거 어떻게 할까?" 고민하지 않아도 되니까 편해요.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">50:50 vs 소득 비례 분담 — 솔직한 의견</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>커플 여행에서 가장 많이 하는 고민 중 하나가 이거예요. "반반이 공평한 건가, 아니면 소득이 많은 쪽이 더 내야 하나?"</p>
                <p>제 솔직한 생각은 이렇습니다. 소득 차이가 크지 않다면 50:50이 제일 깔끔해요. 계산도 단순하고, "내가 더 냈다"는 감정이 생길 여지가 없습니다. 반반으로 정해두면 식사할 때 번갈아 내거나, 모든 지출을 합산해서 나중에 차액을 이체하거나 — 어느 방식이든 기준이 명확합니다.</p>
                <p>반면 소득 차이가 상당하다면, 무조건 반반이 오히려 불편해질 수 있어요. 소득이 많은 쪽이 좋은 숙소나 식사를 원하는데 상대방 예산이 안 된다면, 반반 고집하다가 한쪽이 무리하게 되거든요. 이럴 땐 "숙소는 6:4, 식비는 반반" 같은 카테고리별 비율을 정하는 것도 방법이에요.</p>
                <p>가장 중요한 건 둘 다 납득하는 방식을 쓰는 겁니다. 외부에서 보기에 공평한 방식이 중요한 게 아니에요. 우리 둘이 괜찮으면 그게 맞는 방식이에요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">카테고리별 예산 짜는 법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>전체 예산을 한 덩어리로 잡지 말고, 카테고리별로 나눠서 잡으면 관리가 쉬워집니다. 실제로 여행 예산이 초과되는 경우의 대부분은 어느 한 카테고리에서 예상보다 훨씬 많이 쓰기 때문이에요.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  {[
                    { label: '항공권', note: '일찍 예약할수록 저렴, 가격 변동 크니 미리 확정' },
                    { label: '숙소', note: '위치에 따라 가격 차이 큼, 교통비 절약 여부도 함께 고려' },
                    { label: '식비', note: '1끼 기준 상한선을 정해두면 편함, 고급 식사는 1~2번으로 특별 이벤트화' },
                    { label: '교통', note: '현지 패스, 택시, 대중교통 비율 미리 파악' },
                    { label: '입장료/투어', note: '미리 가고 싶은 곳 조사하고 예산에 포함' },
                    { label: '쇼핑/기타', note: '개인 지출은 공동 예산과 분리해서 각자 관리' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="font-bold text-gray-900 text-xs mb-1">{i.label}</p>
                      <p className="text-xs text-gray-500">{i.note}</p>
                    </div>
                  ))}
                </div>
                <p>쇼핑 예산은 꼭 개인 예산으로 따로 분리하는 게 좋아요. 한 명은 쇼핑을 많이 하고 다른 한 명은 별로 안 하는 경우, 쇼핑 지출을 공동 예산에 넣으면 불공평하게 느껴질 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">커플 여행 저렴하게 즐기는 현실적인 방법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>예산이 빡빡하다고 여행을 즐기지 못하는 건 아니에요. 방법을 좀 더 현명하게 쓰면 됩니다.</p>
                <p><strong className="text-gray-800">비수기 여행:</strong> 같은 목적지도 성수기와 비수기 항공권 가격 차이가 2~3배 나는 경우가 많습니다. 일본 오사카를 예로 들면, 7~8월이나 연말보다 3~4월(벚꽃 시즌 직전), 11월 초 정도가 상대적으로 저렴해요. 날씨도 좋아서 오히려 더 만족스러운 경우도 많습니다.</p>
                <p><strong className="text-gray-800">에어비앤비 or 아파트형 숙소:</strong> 호텔 대신 에어비앤비나 아파트형 숙소를 쓰면 취사가 가능해서 식비를 상당히 줄일 수 있어요. 특히 장기 여행(5박 이상)이면 차이가 확 납니다. 아침 식사는 마트에서 간단하게 해결하고, 점심이나 저녁 한 끼만 제대로 먹는 패턴으로 가면 식비를 30~40%는 줄일 수 있어요.</p>
                <p><strong className="text-gray-800">로컬 식당:</strong> 관광지 주변 레스토랑은 보통 두 배 이상 비쌉니다. 구글 맵에서 현지인 후기가 많은 골목 안쪽 식당을 찾는 게 맛도 좋고 가격도 착해요. "로컬 맛집 찾기"를 여행의 하나의 재미로 만들면 오히려 추억이 됩니다.</p>
                <p><strong className="text-gray-800">무료 명소 우선:</strong> 유럽 여행이라면 많은 공원, 광장, 거리 자체가 볼거리예요. 유료 입장 명소는 1~2개만 선별해서 가고, 나머지는 걸어 다니는 코스로 짜면 입장료를 크게 절약할 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">예산보다 더 쓸 때 대처법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>아무리 잘 짜도 여행에서는 예상치 못한 지출이 생깁니다. 현지에서 마음에 드는 게 생겼거나, 투어가 너무 재밌어서 추가로 신청하거나, 비가 와서 교통비가 더 나오거나. 이럴 때 둘이 싸우지 않으려면 사전에 "초과 예산 규칙"을 정해두는 게 좋아요.</p>
                <p>예를 들어 "1인당 추가 예비비 5만 원을 별도로 잡아두고, 이 이상 쓸 것 같으면 그때 같이 상의한다"는 식으로요. 예비비 범위 안에서는 각자 자유롭게 쓰고, 그 이상은 합의를 거치는 방식입니다. 이렇게 하면 사소한 초과 지출로 매번 의논할 필요 없이, 큰 지출만 함께 결정하면 됩니다.</p>
                <p>그리고 여행 중에 예산이 얼마나 남았는지 가끔 확인하는 것도 좋아요. "오늘까지 총 얼마 썼더라"를 같이 보면서 남은 일정 예산을 조율하는 거죠. 이걸 깜짝 공개로 하면 스트레스가 되지만, 미리 "중간에 한번 확인하자"고 약속해두면 오히려 안심이 됩니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">여행 후 정산이 남는 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>커플 여행을 하면 "이번엔 네가 더 낸 것 같으니까 다음에 내가 쏜다"는 암묵적인 합의로 끝내는 경우가 많아요. 단기적으로는 괜찮은데, 여행을 여러 번 가면서 이 "미뤄진 정산"이 쌓이면 나중에 누가 얼마를 더 냈는지 파악도 안 되고 감정도 묘하게 됩니다.</p>
                <p>그래서 여행이 끝난 후 간단하게라도 정리하는 게 좋습니다. 완벽한 원화 정산이 아니더라도, "이번 여행은 네가 20만 원 정도 더 낸 것 같으니까 다음 외식 때 내가 낼게"처럼 명확하게 인지하고 마무리하는 게 낫습니다. 투명하게 공유하는 게 관계를 더 건강하게 만들어요.</p>
                <p>여행 지출 내역을 앱으로 기록해두면 이 과정이 훨씬 쉬워집니다. 여행 중 지출을 같이 입력해두면 나중에 "누가 얼마 냈더라"를 기억으로 복원할 필요 없이 데이터로 확인할 수 있어요. Voyalogue의 지출 기록과 정산 기능을 써보시면 이런 마무리 과정이 훨씬 편해집니다. 일정 기록과 지출이 같이 남아서 "그날 우리 어디서 얼마 썼더라"가 한눈에 보이거든요.</p>
              </div>
            </section>

            <div className="mt-4 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-1">커플 여행 일정과 예산, 한 앱에서 관리하기</p>
              <p className="text-sm text-gray-500 mb-3">Voyalogue로 여행 일정 공유하고, 지출 기록하고, 마지막 정산까지 한 번에 해보세요. 둘이 함께 보는 일정이 생기면 여행 준비가 훨씬 즐거워집니다.</p>
              <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
                무료로 시작하기
              </Link>
            </div>

          </div>
        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/group-travel-settlement', label: '단체여행 돈 정산 방법' },
            { href: '/guide/travel-budget-tips', label: '예산 절약 팁' },
            { href: '/guide/travel-exchange-tips', label: '환전 꿀팁' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">이용약관</Link>
          <Link href="/guide" className="hover:text-gray-600 transition-colors">여행 가이드</Link>
        </div>
        <p>© 2026 Voyalogue. All rights reserved.</p>
      </footer>
    </div>
  )
}
