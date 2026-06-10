import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '면세점 이용 가이드 | 시내·공항·기내 어디서 사는 게 이득인지',
  description: '면세점 처음 이용하는 분들을 위한 가이드. 시내면세점과 공항면세점 차이, 면세 한도, 뭘 사면 실제로 이득인지 정리했습니다.',
}

export default function DutyFreeGuidePage() {
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
              {['면세점', '쇼핑', '세금', '여행 준비'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
              면세점이 무조건 싸다는 착각, 뭐가 진짜 이득인지 따져봤습니다
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              면세점이라고 하면 뭔가 다 싸게 살 수 있을 것 같은 기대감이 생기죠. 처음 이용할 때 저도 그랬습니다. 그런데 막상 들어가서 가격표 보다 보면, 분명히 면세인데 왜 이게 한국 인터넷 최저가보다 비싸지 싶은 경우도 꽤 있어요. 면세점은 모든 걸 싸게 파는 곳이 아닙니다. 이득인 것과 아닌 것이 따로 있습니다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">면세점이 무조건 싼 건 아닙니다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>면세점의 원리를 먼저 이해하면 뭘 사면 이득인지 쉽게 판단할 수 있습니다. 면세점은 출국자에게 부가가치세(VAT)와 개별소비세, 관세 등을 면제해서 파는 곳입니다. 따라서 평소에 세금이 많이 붙는 상품일수록 면세 효과가 큽니다.</p>
                <p>화장품에는 부가가치세(10%)가 붙습니다. 명품 가방이나 시계에는 개별소비세까지 붙어서 실제 세금 부담이 20% 이상인 경우도 있어요. 주류와 담배에는 주세와 각종 세금이 겹쳐서 세금 비중이 매우 높습니다.</p>
                <p>반면에, 세금 부담이 적은 상품은 면세 효과가 미미합니다. 예를 들어 식품이나 일부 생필품류는 애초에 세금이 낮아서 면세점에서 사도 일반 쇼핑몰이랑 가격 차이가 거의 없거나 오히려 비쌀 수도 있습니다.</p>
                <p>결론: 면세점에서 살 때는 반드시 가격 비교를 하고 들어가세요. 미리 사고 싶은 것의 국내 최저가를 확인해두고, 면세점에서 실제로 얼마나 저렴한지 비교한 뒤에 사면 됩니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">시내면세점 vs 공항면세점, 뭐가 다른가</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-3">시내면세점</p>
                    <ul className="flex flex-col gap-2 text-sm">
                      <li>• 서울 시내(명동, 동대문 등)에 위치</li>
                      <li>• 롯데, 신세계, 신라, 현대 등 대형 면세점</li>
                      <li>• 구매는 시내에서 하지만, 실제 물건 수령은 출국하는 날 공항에서 픽업</li>
                      <li>• 물건을 직접 보고 고를 수 있어 비교적 편안하게 쇼핑 가능</li>
                      <li>• 멤버십·쿠폰 혜택이 많음</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-3">공항면세점</p>
                    <ul className="flex flex-col gap-2 text-sm">
                      <li>• 인천·김포 등 공항 출국장 안에 위치</li>
                      <li>• 출국 심사 통과 후 탑승 대기 중 이용</li>
                      <li>• 사고 바로 들고 탑승 가능 (주류·향수 등 기내 반입 주의)</li>
                      <li>• 시간이 촉박할 수 있고, 가격이 시내보다 약간 높은 경우도 있음</li>
                      <li>• 즉흥 구매에 적합</li>
                    </ul>
                  </div>
                </div>
                <p>시내면세점에서 구매하면 출국 당일 공항 픽업 카운터에서 물건을 수령합니다. 주의할 점은 픽업 시간이 정해져 있다는 것입니다. 보통 비행기 출발 3시간 전부터 픽업이 가능한데, 너무 늦게 도착하면 못 받는 경우도 있으니 공항 도착 시간을 여유 있게 잡아야 합니다.</p>
                <p>온라인 면세점(롯데, 신라, 신세계 모두 앱과 웹사이트 운영)도 있습니다. 시내면세점과 동일하게 공항 픽업 방식이고, 편하게 집에서 주문한 뒤 공항에서 수령합니다. 할인 쿠폰과 포인트를 더 적극적으로 사용할 수 있어서 이 방법이 가장 저렴한 경우가 많습니다.</p>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-1">기내 면세점은 어떨까</p>
                  <p className="text-sm">기내 면세점은 선택지가 제한적이고 가격도 공항이나 시내면세점보다 높습니다. 급하게 선물을 챙겨야 할 때나 공항면세점에서 못 샀을 때 참고하는 정도로 활용하세요. 기내 면세 카탈로그는 탑승 전에 미리 보고 가면 시간을 아낄 수 있습니다.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">면세 한도와 세금, 꼭 알아야 할 기준</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>면세점에서 아무리 많이 사도 되는 건 아닙니다. 귀국할 때 세관 면세 한도를 초과하면 세금을 냅니다.</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-3">한국 입국 기준 면세 한도 (2024년 기준)</p>
                  <ul className="flex flex-col gap-2">
                    <li>• <strong className="text-gray-800">면세 구매 한도</strong> — 1인당 미화 800달러 (약 110만 원) 상당까지 면세 혜택. 단, 출국 시 구매하는 해외 면세점 구매 포함</li>
                    <li>• <strong className="text-gray-800">주류</strong> — 1병 (1리터 이하, 미화 400달러 이하). 초과하면 주세+VAT 추가 부과</li>
                    <li>• <strong className="text-gray-800">담배</strong> — 궐련 200개비(1보루), 전자담배 20개 등. 면세 구매 담배는 이 한도에 포함됨</li>
                    <li>• <strong className="text-gray-800">향수</strong> — 60ml 이하</li>
                    <li>• <strong className="text-gray-800">면세 한도 초과 시</strong> — 초과 금액에 따라 세율 적용. 자진 신고 시 세금 30% 감면 혜택 있음</li>
                  </ul>
                </div>
                <p>면세 한도 800달러는 해외에서 구매한 모든 것의 합산입니다. 현지 쇼핑몰에서 산 것, 면세점에서 산 것 다 합쳐서 계산합니다. 명품 하나 사면 금방 초과하는 금액이니 해외에서 고가품 구매할 계획이라면 미리 계산해두세요.</p>
                <p>한 가지 팁: 800달러 초과했다고 무조건 세관에 딱 걸리는 건 아닙니다. 하지만 세관 검사에 걸리면 세금뿐 아니라 가산세도 붙을 수 있어요. 초과 구매가 있다면 입국장 세관 신고대에서 자진 신고하는 게 오히려 유리합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">실제로 면세점에서 사면 이득인 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">화장품 — 이건 확실히 쌉니다</p>
                  <p>설화수, 후, SK-II, 에스티 로더, 맥 같은 브랜드 화장품은 면세점에서 사는 게 일반 백화점 대비 15~20% 저렴합니다. 특히 면세 쿠폰이나 포인트 추가 할인까지 더하면 차이가 꽤 납니다. 스킨케어, 파운데이션, 립 제품 등 소비성 화장품을 넉넉히 사두기 좋습니다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">주류 — 세금 차이가 가장 큰 품목</p>
                  <p>위스키, 와인, 브랜디 등 고급 주류는 면세 효과가 매우 큽니다. 한국에서 일반 시중 가격으로 사는 것보다 30~40% 저렴한 경우도 있습니다. 조니워커 블랙 라벨, 발렌타인 17년, 맥캘란 같은 제품들이 면세점에서 특히 경쟁력 있습니다. 단, 앞서 말한 1병 한도를 기억하세요.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">담배 — 세금 차이가 큽니다</p>
                  <p>한국 담배 가격에는 각종 세금이 절반 이상을 차지합니다. 면세점 담배는 시중 판매가의 50~60% 수준인 경우도 있습니다. 흡연자라면 면세 한도 내에서 구매하면 확실히 이득입니다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">명품 — 조건부 이득</p>
                  <p>샤넬, 루이비통, 구찌 등 명품은 개별소비세가 붙기 때문에 면세 효과가 있습니다. 단, 국내 면세점보다 현지 부티크에서 직접 사는 게 더 저렴한 경우도 있어요. 특히 유럽산 명품은 유럽 현지에서 VAT 환급(Tax Refund)을 받으면 면세점보다 오히려 저렴할 수 있습니다. 구매 전에 어디서 사는 게 실제로 저렴한지 계산해보세요.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">면세점에서 사도 별 이득 없는 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>뭐든 다 사려다 오히려 손해 보는 경우를 막기 위해 알려드립니다.</p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <strong className="text-gray-800">전자기기</strong><br />
                    카메라, 이어폰, 태블릿 등은 쿠팡이나 네이버 최저가와 비교했을 때 면세점이 오히려 비싼 경우가 많습니다. 전자기기는 세금 구조상 면세 혜택이 화장품이나 주류만큼 크지 않고, 국내 온라인 가격이 워낙 저렴하게 형성돼 있습니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">식품·과자</strong><br />
                    면세점에서 파는 수입 과자나 식품은 특별히 저렴하지 않습니다. 현지 마트나 관광지에서 사는 것과 큰 차이가 없거나 비쌀 수 있어요. 선물용으로 특정 제품을 원한다면 모르겠지만, 가격 때문에 면세점 식품을 고를 이유는 없습니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">패션 잡화(시계 제외)</strong><br />
                    가방이나 지갑 등은 면세 효과가 있지만, 온라인 병행 수입 가격과 비교해보면 차이가 크지 않은 경우도 있습니다. 특히 비명품 브랜드는 세금 자체가 낮아서 면세 혜택이 별로 없습니다.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">면세점 쿠폰·멤버십 제대로 활용하기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>면세점 가격은 정가에서 끝이 아닙니다. 쿠폰과 멤버십을 활용하면 추가로 10~20%까지 더 아낄 수 있습니다.</p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <strong className="text-gray-800">면세점 앱 쿠폰</strong><br />
                    롯데면세, 신라면세, 신세계면세 앱에는 정기적으로 쿠폰이 올라옵니다. 처음 가입 시 신규 회원 할인 쿠폰이 있고, 앱 푸시 알림 켜두면 타임세일 쿠폰도 받을 수 있습니다. 구매 전에 앱 쿠폰함 먼저 열어보는 습관을 들이면 됩니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">카드사 제휴 할인</strong><br />
                    특정 신용카드로 결제하면 5~10% 추가 할인이 적용됩니다. 면세점별로 제휴 카드가 다른데, 면세점 앱이나 웹사이트에서 '카드 제휴 할인' 탭을 보면 현재 어떤 카드가 할인 적용되는지 확인할 수 있습니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">포인트 적립 활용</strong><br />
                    면세점 자체 포인트(롯데 L포인트, 신세계 SSG포인트 등)를 적립해두면 다음 구매에 쓸 수 있습니다. 자주 여행하는 분이라면 특정 면세점에 멤버십을 집중시키는 게 유리합니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">항공사 마일리지 제휴</strong><br />
                    대한항공, 아시아나 마일리지 적립이 되는 면세점 구매도 있습니다. 대형 구매일 경우 마일리지 적립액이 의미 있는 수준이 됩니다.
                  </li>
                </ul>
                <p>이 모든 혜택을 한 번에 쓰기는 어렵지만, 쿠폰 하나에 카드 할인 하나만 더해도 면세 효과 위에 추가 5~10%가 더 빠집니다. 사전에 조금만 챙기면 꽤 큰 차이가 납니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">입국 시 세관 신고, 이것만 알아두세요</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>한국으로 돌아올 때 세관 신고를 잘못 이해하면 예상치 못한 세금이 나올 수 있습니다.</p>
                <p>입국장에서 받는 세관 신고서에는 해외에서 취득한 물품의 총액을 적습니다. 면세점 구매 + 현지에서 산 것 모두 포함입니다. 800달러 이하면 면세 통관, 초과하면 자진 신고 후 세금 납부를 해야 합니다.</p>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2">꼭 알아야 할 세관 주의사항</p>
                  <ul className="flex flex-col gap-2">
                    <li>• 해외에서 구매한 물품을 신고하지 않고 들어왔다가 세관에서 적발되면, 세금에 40% 가산세가 더 붙습니다. 차라리 자진 신고하면 세금의 30%를 감면받을 수 있어요.</li>
                    <li>• 식품·육류·과일 등 검역 대상 품목은 별도 신고가 필요합니다. 신선 식품이나 육가공품을 들고 들어오면 검역 통과가 안 될 수 있습니다.</li>
                    <li>• 면세점에서 산 주류·향수 등은 기내 수하물로 직접 들고 탈 경우 일부 항공편에서 제한이 있습니다. 보안 검색 후 면세점에서 산 경우엔 괜찮지만, 시내 면세점 픽업 주류를 항공기 객실 내 반입하면 제한됩니다. 공항 픽업 후 수하물로 부치는 게 안전합니다.</li>
                    <li>• 명품 가방이나 시계를 새것으로 들고 들어오면 가격 추정이 되기 때문에 신고 없이 통과가 어렵습니다. 미리 쇼핑백 정리하고, 영수증 지참하세요.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">면세점 이용 요약</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="font-semibold text-gray-800 mb-3">이 순서로 접근하면 됩니다</p>
                  <ol className="flex flex-col gap-2 list-decimal list-inside">
                    <li>살 것 정하고 국내 최저가 미리 확인</li>
                    <li>온라인 면세점 앱 가입, 쿠폰·카드 할인 확인</li>
                    <li>출국 3~5일 전 온라인 면세점에서 미리 주문</li>
                    <li>출국 당일 공항 픽업 카운터에서 수령 (시간 여유 있게 도착)</li>
                    <li>귀국 시 구매 총액 계산, 800달러 초과 여부 확인 후 세관 처리</li>
                  </ol>
                </div>
                <p>면세점 쇼핑은 잘 쓰면 여행 비용을 아끼는 좋은 방법이지만, 아무 생각 없이 들어가서 눈에 보이는 것 다 사다 보면 오히려 돈을 더 쓰게 됩니다. 뭘 살지 미리 정하고, 가격 비교하고, 쿠폰 챙기면 충분합니다.</p>
              </div>
            </section>

          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">여행 일정도 Voyalogue로 관리하세요</p>
            <p className="text-sm text-gray-500 mb-3">면세점 쇼핑 목록부터 현지 이동 동선까지, 여행 준비를 한 곳에서 정리할 수 있습니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>

        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/sim-card-guide', label: '유심칩 vs 포켓와이파이' },
            { href: '/guide/travel-insurance', label: '여행자 보험 가이드' },
            { href: '/guide/travel-exchange-tips', label: '환전 팁' },
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
