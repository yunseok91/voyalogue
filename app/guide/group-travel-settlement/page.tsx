import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '친구들이랑 해외여행, 돈 정산 어떻게 해? | 실전 방법 총정리',
  description: '여럿이 여행 가면 돈 정산이 제일 골치 아프죠. 엑셀로 하는 방법부터 앱 활용까지, 실제로 쓸 수 있는 정산 방법을 정리했습니다.',
}

export default function GroupTravelSettlementPage() {
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
              {['단체여행', '정산', '총무', '해외여행'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              친구들이랑 해외여행, 돈 정산 어떻게 해?
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              여행이 끝나고 가장 먼저 하는 게 뭔지 아세요? 사진 정리가 아니에요. 카카오톡 단톡방에서 시작되는 정산 전쟁이에요. "나 얼마 내야 해?", "숙소 나 낸 거 맞지?", "공항 버스 누가 샀더라?" — 이 대화가 여행보다 더 오래 가는 경우가 많습니다. 4~5명이 함께 다녀온 여행이라면 특히 더 복잡해지죠.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">정산이 여행보다 스트레스인 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행 중에는 다들 신나서 "나중에 정리하자"고 넘어가는데, 막상 여행이 끝나고 정리를 시작하면 기억이 흐릿해집니다. 누가 뭘 냈는지 모르고, 영수증도 없고, 어떤 건 각자 낸 것 같기도 하고. 거기다 해외여행이면 환율까지 끼어들어서 더 복잡해져요.</p>
                <p>또 하나의 문제는 심리적인 부분입니다. 친한 친구 사이에서 "너 나한테 3만 2천 원 줘야 해"라고 말하는 게 어색하게 느껴지는 거죠. 근데 그게 쌓이면 관계에 금이 가는 경우도 있어요. 돈 얘기는 미루면 미룰수록 더 불편해집니다.</p>
                <p>그래서 중요한 건 여행 중에 미리 기록하고, 규칙을 정하고, 정산 방식에 합의해두는 거예요. 여행 가기 전에 이미 절반은 해결됩니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">방법 1. 총무 한 명이 다 내고 나중에 정산하기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>가장 일반적인 방법입니다. 총무 한 명을 정해서 여행 중 모든 공동 지출을 한 사람 카드로 다 긁고, 여행이 끝난 후 총 금액을 n등분해서 각자 이체하는 방식이에요.</p>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wide">장점</p>
                  <ul className="flex flex-col gap-1">
                    <li>• 여행 중에 돈 계산 신경 쓸 필요 없이 편하게 즐길 수 있음</li>
                    <li>• 지출 흐름이 한 곳에 모여 있어서 정리하기 수월함</li>
                    <li>• 카드 포인트나 마일리지를 총무가 챙길 수 있음 (보상이 생김)</li>
                  </ul>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wide">단점</p>
                  <ul className="flex flex-col gap-1">
                    <li>• 총무 카드 한도가 부족하면 곤란해짐</li>
                    <li>• 총무가 돈을 돌려받기까지 시간이 걸리고, 일부는 눈치 없이 늦게 보내기도 함</li>
                    <li>• 항목 기록을 꼼꼼히 안 하면 나중에 다툼의 원인이 됨</li>
                    <li>• 개인 지출과 공동 지출이 섞이면 더 복잡해짐</li>
                  </ul>
                </div>
                <p>이 방법을 택한다면, 총무는 여행 중 공동 지출이 발생할 때마다 바로 메모해두는 습관이 필수입니다. 영수증 사진 찍어두거나, 노트 앱에 날짜별로 기록해두는 게 좋아요. 기억만 믿으면 꼭 빠지는 게 생깁니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">방법 2. 항목별로 역할 나눠서 각자 내기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>총무를 한 명에게 몰아주지 않고, 항목마다 담당자를 나누는 방법입니다. 예를 들어 A가 숙소를 내고, B가 투어를 내고, C가 식비를 내는 식이에요. 그러고 나중에 각자 낸 금액을 비교해서 차액을 정산합니다.</p>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wide">장점</p>
                  <ul className="flex flex-col gap-1">
                    <li>• 한 사람이 큰 금액을 선출해야 하는 부담이 줄어듦</li>
                    <li>• 각자 책임 영역이 명확해서 역할이 분산됨</li>
                  </ul>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wide">단점</p>
                  <ul className="flex flex-col gap-1">
                    <li>• 여행 후 정산이 더 복잡해질 수 있음 (금액 크기가 달라서 계산이 복잡)</li>
                    <li>• 중간에 갑자기 발생하는 지출 처리가 애매해짐</li>
                    <li>• 서로 낸 금액이 얼마인지 파악이 안 되면 나중에 혼란스러움</li>
                  </ul>
                </div>
                <p>이 방법은 미리 항목을 명확하게 나눠두고 시작해야 합니다. 여행 가기 전에 "너는 숙소, 나는 식비, 쟤는 교통"처럼 큼직한 카테고리를 배분하는 게 핵심이에요. 중간 지출이 생기면 누가 낼지도 그때그때 합의하고 기록해두는 게 나중에 훨씬 편합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">방법 3. 앱으로 실시간 기록하기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>요즘은 여행 정산을 도와주는 앱들이 제법 있습니다. 기본 방식은 비슷해요. 지출이 생길 때마다 앱에 기록하고, 누가 냈는지 누가 혜택을 받는지 입력하면 앱이 자동으로 "A가 B한테 얼마 줘야 한다"를 계산해줍니다.</p>
                <p><strong className="text-gray-800">Splitwise</strong>는 해외에서 가장 많이 쓰이는 정산 앱입니다. 다국어 지원이 되고, 다양한 통화로 입력이 가능해요. 지출 항목마다 누가 냈는지, 어떻게 나눌지 설정할 수 있어서 복잡한 계산도 처리됩니다. 단, 무료 버전은 기능 제한이 있어요.</p>
                <p><strong className="text-gray-800">카카오페이 정산</strong> 기능은 국내 친구들과 여행할 때 편합니다. 카카오톡 안에서 바로 요청할 수 있어서 별도 앱 설치 없이 쓸 수 있다는 게 장점이에요. 다만 해외 결제는 따로 입력해야 합니다.</p>
                <p><strong className="text-gray-800">Voyalogue</strong>는 여행 일정 공유 기능과 함께 총무/정산 기능을 같이 쓸 수 있어서 여행 중 지출을 일정과 연결해서 관리하기 편합니다. 일정별로 지출을 기록하고 팀원들과 실시간으로 공유할 수 있어요.</p>
                <p>어떤 앱을 쓰든 핵심은 여행 시작 전에 모두가 같은 앱을 설치하고 사용하기로 합의하는 겁니다. 한두 명이 앱을 안 써버리면 결국 따로 계산해야 하는 상황이 생겨요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">항공권, 숙소는 어떻게 나눌까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>항공권은 보통 각자 결제하는 경우가 많은데, 한 명이 일괄 예약하는 경우도 있어요. 일괄 예약할 때는 반드시 사전에 이체를 받고 결제하거나, 결제 직후 바로 금액을 공유하고 그날 안에 입금받는 게 좋습니다. 여행 전부터 큰 금액이 미결제 상태로 남아 있으면 불편함이 쌓입니다.</p>
                <p>숙소도 마찬가지예요. 한 명 카드로 결제하고 나중에 나눠도 되지만, 에어비앤비 같은 경우 환불 조건이 까다로울 수 있으니 결제자가 명확하게 공지하고 사전 입금을 받는 방식이 깔끔합니다.</p>
                <p>팁 하나를 드리자면, 항공권과 숙소는 큰 금액인 만큼 애초에 1/n로 나눠서 각자 미리 내는 게 제일 깔끔합니다. 여행 후 정산할 때 이 두 항목만 제외해도 계산이 훨씬 단순해져요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">환율 차이가 생길 때</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>해외여행에서 항상 나오는 골칫거리가 환율입니다. 같은 100달러를 냈는데 한 명은 환전을 미리 해서 원화 기준 13만 원에 맞췄고, 다른 한 명은 현지에서 카드로 결제해서 14만 원이 나왔다면, 정산할 때 기준을 뭘로 잡아야 할까요?</p>
                <p>가장 현실적인 방법은 정산 기준 환율을 하나로 통일하는 겁니다. 여행 당일 기준 환율이나 여행 기간 평균 환율로 정하고, 모든 지출을 그 환율 기준 원화로 환산해서 계산하는 거예요. 완벽하진 않지만, 이 방식이 가장 분쟁이 적습니다.</p>
                <p>카드 결제와 현금 결제가 섞여 있다면, 카드 수수료(보통 1~1.5%)도 비용에 포함되는 거 아니냐는 얘기가 나올 수 있어요. 이 부분은 미리 "카드 수수료는 각자 부담"으로 정하거나 무시하기로 합의해두는 게 좋습니다. 금액이 크지 않으면 그냥 무시하는 게 편해요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">총무 역할을 잘 정해야 하는 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>총무는 단순히 돈 내는 사람이 아닙니다. 지출을 기록하고, 중간에 공지하고, 마지막에 정산표를 만들고, 각자한테 얼마 내야 하는지 알려주는 역할까지 맡아요. 사실상 여행 재무팀장이에요.</p>
                <p>이 역할이 힘들다는 걸 다들 알기 때문에, 여행 전에 총무를 자원받거나 설득해서 정해두는 게 중요합니다. 그리고 총무에게 적절한 보상도 미리 약속해두세요. "총무는 정산 금액에서 5천 원 깎아준다"거나 "총무 밥은 우리가 산다"처럼 작은 것이라도 인정받는다는 느낌이 있어야 다음에도 누군가가 자원합니다.</p>
                <p>Voyalogue의 총무 기능을 활용하면 지출 입력부터 정산 계산까지 앱이 자동으로 처리해줘서 총무가 직접 엑셀이나 계산기를 두드릴 필요가 없어요. 여행 일정과 지출이 한 앱에서 연결되니까 "이날 뭐 먹고 얼마 썼더라" 같은 추적도 쉽습니다. 총무 역할을 맡은 사람 입장에서 체감 부담이 많이 줄어들어요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">정산 후 관계가 깨지지 않으려면</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>정산이 여행을 망치는 경우는 대부분 사전 합의 없이 나중에 청구가 날아오거나, 한쪽이 "내가 더 많이 냈잖아"라는 감정이 쌓였을 때입니다. 반대로 정산을 잘 마무리하면 다음 여행 때 같이 가자는 말이 자연스럽게 나와요.</p>
                <p>실질적인 팁을 드리자면, 정산은 여행 끝나고 3일 안에 완료하는 걸 원칙으로 정하는 게 좋습니다. 시간이 지날수록 기억도 흐려지고 돈 얘기 꺼내기도 더 어색해져요. 빠르게 마무리할수록 깔끔합니다.</p>
                <p>그리고 정산표를 공유할 때는 단톡방에 스크린샷 하나 올리는 것보다, 간단하게 항목별로 설명해주는 게 좋아요. "총 지출 120만 원, 1인당 30만 원, 너는 지금까지 25만 원 냈으니까 5만 원 이체해줘" — 이런 식으로 명확하게 알려줘야 입금이 빠릅니다.</p>
                <p>마지막으로, 정산이 끝나면 짧게라도 "수고했어, 다음에 또 가자"라는 마무리가 있어야 합니다. 돈 얘기로 끝나면 기억이 나쁘게 남으니까요. 여행의 마지막 인상도 관리가 필요합니다.</p>
              </div>
            </section>

            <div className="mt-4 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 여행 정산 한 번에 해결하기</p>
              <p className="text-sm text-gray-500 mb-3">일정과 지출을 한 앱에서 관리하고, 팀원들과 실시간으로 공유하세요. 총무 기능으로 정산 계산도 자동으로 처리됩니다.</p>
              <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
                무료로 시작하기
              </Link>
            </div>

          </div>
        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/group-travel-planning', label: '단체여행 일정 짜기' },
            { href: '/guide/travel-budget-tips', label: '예산 절약 팁' },
            { href: '/guide/couple-travel-budget', label: '커플 여행 예산 계획' },
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
