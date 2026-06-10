import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '여행자 보험 꼭 가입해야 할까 | 현실적인 가입 기준과 방법',
  description: '여행자 보험, 정말 필요한지 모르겠다는 분들을 위한 현실적인 가이드. 어떤 상황에서 보험이 필요한지, 얼마짜리 가입하면 되는지 정리했습니다.',
}

export default function TravelInsurancePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600" />
            <span className="font-bold text-gray-900">Voyalogue</span>
          </Link>
          <Link href="/guide" className="text-sm text-gray-500 hover:text-gray-900">← 가이드 목록</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10">

          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {['보험', '여행 준비', '의료비', '실용 팁'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
              여행자 보험, 진짜 필요한지 솔직하게 따져봤습니다
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              여행자 보험 가입하라고 하면 귀찮고, 괜히 돈 낭비 같기도 하죠. 저도 처음엔 그랬습니다. 그런데 가입 안 했다가 아찔한 상황을 몇 번 목격하고 나서 생각이 완전히 바뀌었습니다. 여기서는 보험이 실제로 어떤 상황에서 필요한지, 뭘 어떻게 가입하면 되는지 현실적으로 정리해 드리겠습니다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">보험 안 들었다가 후회한 케이스들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>제 주변에서 직접 들은 이야기들입니다. 과장 없이요.</p>
                <p>지인 한 명은 도쿄 여행 중에 걷다가 발목을 삐었습니다. 별거 아니겠지 싶어서 현지 병원에 갔더니 엑스레이 찍고 처치하는 데 5만 엔(당시 환율로 약 50만 원)이 나왔습니다. 보험 없이 전부 본인 부담했어요. 나중에 알고 보니 일본 여행자 보험 가입해뒀으면 전액 돌려받을 수 있었습니다.</p>
                <p>또 다른 케이스는 유럽 여행 중 비행기 수하물이 3일 동안 분실된 경우입니다. 당장 입을 옷도 없고, 현지에서 급하게 구매한 물건들 비용이 30만 원 넘게 나왔는데, 여행자 보험이 있었다면 수하물 지연 특약으로 보상받을 수 있었습니다.</p>
                <p>여행 중 갑자기 배탈 나서 링거 맞으러 간 것, 오토바이 대여하다 넘어진 것, 강도 맞아서 지갑 잃어버린 것. 이런 일들이 생각보다 흔하게 발생합니다. 운이 좋으면 아무 일도 없겠지만, 딱 한 번이라도 이런 상황이 생기면 보험료가 전혀 아깝지 않습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">꼭 필요한 보장 항목</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <p>여행자 보험 상품을 보면 항목이 너무 많아서 뭘 챙겨야 할지 모를 수 있습니다. 실제로 의미 있는 항목만 골라드리겠습니다.</p>
                <ul className="flex flex-col gap-4">
                  <li>
                    <strong className="text-gray-800">해외 의료비 (가장 중요)</strong><br />
                    이게 없으면 나머지는 의미가 없습니다. 해외에서 아파서 병원 가면 우리나라 건강보험이 안 됩니다. 전액 본인 부담입니다. 미국 응급실은 조금 처치해도 수백만 원이 기본이에요. 1억 원 이상 보장하는 상품을 골라야 여행 내내 안심할 수 있습니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">항공 지연·결항 보상</strong><br />
                    공항에서 몇 시간 기다려본 분들은 알 겁니다. 연착이 4~6시간 이상이면 식비와 교통비가 꽤 나옵니다. 항공 지연 특약이 있으면 일정 시간 이상 지연 시 정해진 금액을 받을 수 있습니다. 특히 환승이 많은 여행 일정이라면 더 중요합니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">수하물 분실·지연</strong><br />
                    수하물 분실은 생각보다 자주 일어납니다. 분실 시 물품 배상, 지연 시 현지 긴급 구매 비용 보상을 해주는 항목입니다. 수하물에 비싼 물건 넣어 다니는 분이라면 꼭 확인하세요.
                  </li>
                  <li>
                    <strong className="text-gray-800">여행 중 배상 책임</strong><br />
                    본인이 사고를 냈을 때 상대방에게 배상해야 하는 경우를 커버합니다. 렌터카 운전이나 자전거 대여 중 사고가 났을 때 특히 중요합니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">여행 취소 특약 (선택)</strong><br />
                    출발 전 취소해야 하는 상황(질병, 가족 경조사 등)에서 항공권·숙소 취소 위약금을 보상해줍니다. 환불 불가 상품 위주로 예약했다면 유용하지만, 그렇지 않다면 굳이 추가하지 않아도 됩니다.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">얼마짜리 가입하면 될까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>생각보다 저렴합니다. 이걸 몰라서 가입 안 하는 분이 많은데, 기준을 잡아드리겠습니다.</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: '3~5일 아시아 여행 (일본·태국 등)', value: '1~2만 원대' },
                      { label: '7~10일 동남아·아시아 여행', value: '2~3만 원대' },
                      { label: '2주 유럽 여행', value: '4~6만 원대' },
                      { label: '미국·캐나다 여행', value: '5~8만 원 이상 (의료비 높음)' },
                    ].map(i => (
                      <div key={i.label} className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-0.5">{i.label}</p>
                        <p className="font-bold text-gray-800 text-sm">{i.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p>미국 빼고 대부분의 여행에서 보험료 5만 원 이내면 충분히 좋은 보장 받을 수 있습니다. 아까워 보여도 여행 경비의 1~2% 수준이에요. 그 1~2%가 급할 때 수십, 수백만 원을 돌려받을 수도 있다는 걸 생각하면 꽤 합리적인 투자입니다.</p>
                <p>단, 너무 저렴한 상품은 의료비 한도가 낮거나, 특정 상황(음주 중 사고, 오토바이 탑승 등)이 면책 조항에 걸릴 수 있습니다. 상품 구매 전에 보장 한도와 면책 사항은 반드시 확인하세요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">나라별 의료비 수준 차이</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>이게 보험 필요성의 핵심입니다. 나라마다 의료비가 완전히 다릅니다.</p>
                <div className="flex flex-col gap-3">
                  <div className="border-l-4 border-red-400 pl-4">
                    <p className="font-semibold text-gray-800 mb-1">미국 — 절대 보험 없이 가면 안 됩니다</p>
                    <p>미국 응급실은 세계에서 가장 비쌉니다. 독감 증상으로 응급실 갔다가 검사 몇 가지 하고 링거 맞으면 200~400만 원은 기본입니다. 수술이라도 필요하면 수천만 원도 가능해요. 미국 여행자 보험은 의료비 한도 1억 이상짜리로 들어야 합니다.</p>
                  </div>
                  <div className="border-l-4 border-yellow-400 pl-4">
                    <p className="font-semibold text-gray-800 mb-1">일본·유럽 — 적당히 비쌉니다</p>
                    <p>일본은 국민건강보험이 잘 돼 있어서 내국인에게는 저렴하지만, 여행자는 건강보험 적용이 안 됩니다. 간단한 진료 1~5만 엔, 입원이 필요하면 그 이상입니다. 유럽도 나라마다 다르지만 역시 외국인 의료비는 비쌉니다. 의료비 3천만~5천만 원 보장 상품 정도면 충분합니다.</p>
                  </div>
                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="font-semibold text-gray-800 mb-1">동남아 — 상대적으로 저렴하지만 보험은 필요</p>
                    <p>태국, 베트남, 필리핀 등은 의료비가 한국보다 낮습니다. 로컬 병원이면 진료비가 1~5만 원 수준인 경우도 있어요. 하지만 여행자들이 가는 국제 병원은 훨씬 비쌉니다. 그리고 오토바이 사고나 수상 스포츠 중 부상처럼 큰 부상이 생기면 이야기가 달라집니다. 동남아라도 보험은 꼭 드세요.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">앱으로 가입하는 게 편한 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>예전엔 보험 가입하려면 전화나 방문이 기본이었는데, 요즘은 카카오페이, 토스, 각 보험사 앱에서 5분 이내로 가입이 됩니다.</p>
                <p>카카오페이에서는 여행자 보험 비교 서비스를 제공하는데, 여러 보험사 상품을 한눈에 보면서 가격과 보장 내용을 비교하고 바로 가입할 수 있습니다. 삼성화재, 현대해상, DB손해보험 등 주요 손보사 상품이 올라와 있어서 직접 각 사 앱을 다운받을 필요 없이 한 번에 비교할 수 있어요.</p>
                <p>가입할 때 필요한 건 본인 주민등록번호, 여행지, 여행 기간, 동반 여행자 정보 정도입니다. 출발 당일에도 가입은 되는데, 되도록 출발 전날까지는 해두는 게 마음 편합니다.</p>
                <p>중요한 점: <strong className="text-gray-800">출국 후에는 가입이 안 됩니다.</strong> 이미 해외에 나가 있는 상태에서 보험 가입은 불가능하니, 꼭 출국 전에 처리하세요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">보험금 실제로 청구하는 법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>보험 가입하는 것도 중요하지만, 막상 사고가 났을 때 어떻게 청구하는지를 모르면 청구를 못 하는 경우도 생깁니다.</p>
                <p>가장 중요한 건 <strong className="text-gray-800">영수증과 진단서를 꼭 챙기는 것</strong>입니다. 해외 병원에서 치료받고 나면 영수증(receipt)과 진료 기록(medical report)을 요청해서 받아두세요. 이게 없으면 나중에 청구가 안 됩니다.</p>
                <p>항공 지연이라면 항공사에서 지연 확인서(delay certificate)를 받아야 합니다. 공항 카운터나 고객센터에 요청하면 줍니다.</p>
                <p>수하물 분실이라면 공항 수하물 분실 신고서(Property Irregularity Report, PIR)가 필요합니다. 항공사 카운터에서 바로 신고하고 접수증을 받으세요.</p>
                <p>귀국 후 보험사 앱이나 웹사이트에 서류를 올리면 심사 후 입금됩니다. 보통 1~2주 안에 처리됩니다. 일부 보험사는 현지에서 바로 청구해서 병원비를 직접 납부해주는 현장 청구 서비스도 제공하니, 출국 전에 보험사 긴급 연락처를 저장해 두세요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">신용카드 부가 보험, 믿어도 될까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>삼성카드, 현대카드 등 일부 프리미엄 신용카드에 해외여행 보험이 기본 제공된다는 걸 아시는 분도 많습니다. 이거 믿고 별도 보험 안 드시는 분도 있는데, 몇 가지 주의할 점이 있습니다.</p>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2">카드 부가 보험의 한계</p>
                  <ul className="flex flex-col gap-2">
                    <li>• 항공권 및 숙박비를 해당 카드로 결제해야 보험이 활성화됩니다. 다른 카드나 현금으로 결제하면 적용 안 됩니다.</li>
                    <li>• 의료비 보장 한도가 낮은 경우가 많습니다. 300~500만 원 한도인 상품이 많아 미국 여행엔 택도 없습니다.</li>
                    <li>• 보장 항목이 제한적입니다. 수하물 지연, 항공 취소 등 세부 항목 보장이 없는 경우가 많습니다.</li>
                    <li>• 청구 절차가 복잡하거나 약관이 헷갈리는 경우도 있습니다.</li>
                  </ul>
                </div>
                <p>결론적으로 카드 부가 보험만 믿고 별도 보험을 안 드는 건 권장하지 않습니다. 특히 미국이나 의료비가 비싼 나라에 갈 때는 반드시 별도 보험을 드세요. 동남아 단기 여행이라면 카드 보험 확인 후 보완적으로 저렴한 보험 하나 추가하는 정도는 괜찮습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">결론</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행자 보험은 선택이 아니라 여행 준비의 기본값이라고 생각하는 게 맞습니다. 항공권 사고, 숙소 예약하고, 유심 챙기는 것처럼 그냥 당연히 하는 일이에요.</p>
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="font-semibold text-gray-800 mb-2">최소한 이것만 챙기세요</p>
                  <ul className="flex flex-col gap-2">
                    <li>• 해외 의료비 1억 이상 보장 (미국은 필수, 다른 나라도 권장)</li>
                    <li>• 항공 지연·수하물 분실 특약 포함 여부 확인</li>
                    <li>• 출국 전에 가입 (당일도 가능하지만 미리 할수록 좋음)</li>
                    <li>• 보험사 긴급 연락처 저장해두기</li>
                    <li>• 현지에서 영수증·진단서 반드시 챙기기</li>
                  </ul>
                </div>
                <p>아무 일 없으면 낸 보험료가 아깝겠지만, 그게 최선입니다. 아무 일 없었다는 게 가장 좋은 결과니까요.</p>
              </div>
            </section>

          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">여행 준비, Voyalogue로 한 번에</p>
            <p className="text-sm text-gray-500 mb-3">보험 준비됐으면 이제 일정도 잡아보세요. 날짜별 코스, 예산, 숙소를 한 곳에서 관리할 수 있습니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>

        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/sim-card-guide', label: '유심칩 vs 포켓와이파이' },
            { href: '/guide/duty-free-guide', label: '면세점 이용 가이드' },
            { href: '/guide/travel-budget-tips', label: '예산 절약 팁' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/guide">여행 가이드</Link>
        </div>
        <p>© 2026 Voyalogue. All rights reserved.</p>
      </footer>
    </div>
  )
}
