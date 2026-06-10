import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '해외 유심칩 vs 포켓와이파이 | 여행 전에 꼭 알아야 할 차이점',
  description: '해외여행 유심칩이 나은지, 포켓와이파이가 나은지 헷갈리죠. 나라별로, 인원수에 따라 뭐가 이득인지 정리했습니다.',
}

export default function SimCardGuidePage() {
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
              {['통신', '유심', '포켓와이파이', 'eSIM'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
              해외 유심칩 vs 포켓와이파이, 둘 다 써봤는데 솔직히 말하면
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              해외여행 준비할 때 통신 수단 고르는 거, 생각보다 헷갈리죠. 유심칩이 싸다는 얘기도 있고, 포켓와이파이가 편하다는 얘기도 있고. 저도 처음엔 그냥 공항에서 눈에 보이는 거 집었다가 여러 번 후회한 경험이 있습니다. 나라마다 다르고, 함께 여행하는 인원수에 따라서도 달라지거든요. 여기서는 제가 직접 써본 경험 기준으로 솔직하게 정리해 봤습니다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">둘 다 써본 입장에서 하는 말</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>솔직히 말하면, 지금 시점에서 1인 여행이면 유심칩이나 e심(eSIM)이 훨씬 편합니다. 포켓와이파이는 2~3명 이상 같이 다닐 때, 혹은 특별한 이유가 없으면 굳이 선택할 이유가 많이 줄었어요.</p>
                <p>예전엔 포켓와이파이가 가격 대비 나을 때가 있었는데, 요즘 유심 가격이 워낙 저렴해졌거든요. 일본 5일 유심이 1만 5천 원에서 2만 원대면 살 수 있는데, 이 가격이면 포켓와이파이 대여료랑 거의 비슷하거나 더 쌉니다. 그런데 포켓와이파이는 충전기도 챙겨야 하고, 가방에서 꺼내야 하고, 잃어버릴 걱정도 하면서 다녀야 하니까요.</p>
                <p>그렇다고 포켓와이파이가 완전히 쓸모없는 건 아닙니다. 가족 여행이나 커플 여행에서 두 사람이 하나 쓰면 비용 반으로 줄고, 노트북이나 태블릿까지 연결해서 쓸 때는 여전히 유용합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">유심칩 장단점</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2">좋은 점</p>
                  <ul className="flex flex-col gap-2">
                    <li>• <strong className="text-gray-800">현지 번호가 생깁니다.</strong> 이게 의외로 중요한데, 우버나 그랩 같은 앱 쓸 때, 현지 식당 예약할 때, 에어비앤비 호스트한테 연락할 때 현지 번호가 있으면 훨씬 수월합니다. 포켓와이파이는 현지 번호가 없거든요.</li>
                    <li>• <strong className="text-gray-800">데이터 무제한 상품이 많습니다.</strong> 일본, 태국, 베트남 등 아시아 지역 유심은 5~10일 무제한 데이터가 2만 원대에 가능합니다. 일일 데이터 제한이 있는 상품도 있는데, 그 경우엔 하루 1~2GB 쓰고 나면 속도가 줄어드니 구매 전에 꼭 확인하세요.</li>
                    <li>• <strong className="text-gray-800">별도 장비가 없습니다.</strong> 폰에 꽂으면 끝. 배터리 걱정 없고, 분리해서 들고 다닐 필요도 없습니다.</li>
                    <li>• <strong className="text-gray-800">가격이 저렴합니다.</strong> 네이버 스마트스토어나 쿠팡에서 미리 사두면 공항 픽업보다 20~30% 저렴하게 살 수 있습니다.</li>
                  </ul>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2">단점도 있습니다</p>
                  <ul className="flex flex-col gap-2">
                    <li>• <strong className="text-gray-800">한국 번호가 일시 정지됩니다.</strong> 유심을 교체하면 한국 번호로 오는 전화나 문자를 못 받습니다. 은행 OTP나 카카오 인증이 필요한 상황이 생기면 불편할 수 있어요. 듀얼심 폰이라면 이 문제는 해결됩니다.</li>
                    <li>• <strong className="text-gray-800">유심 교체가 번거롭습니다.</strong> 핀 없으면 못 빼는 폰도 있고, 처음 해보시는 분들은 긴장할 수 있어요. 공항 픽업 유심이면 직원이 끼워주니까 그나마 낫습니다.</li>
                    <li>• <strong className="text-gray-800">분실하면 끝입니다.</strong> 작은 칩이라 잃어버리면 구매한 금액 그냥 날아갑니다. 원래 유심 빼서 따로 보관해 뒀다가 돌아올 때 교체하면 됩니다.</li>
                    <li>• <strong className="text-gray-800">여러 명이 같이 쓸 수 없습니다.</strong> 4명이 같이 여행한다면 4개 사야 합니다. 이 경우 포켓와이파이 1대보다 총비용이 높아질 수 있어요.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">포켓와이파이 장단점</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2">이럴 때 포켓와이파이가 낫습니다</p>
                  <ul className="flex flex-col gap-2">
                    <li>• <strong className="text-gray-800">여러 명이 함께 쓸 때.</strong> 보통 포켓와이파이 1대에 3~5대까지 연결할 수 있습니다. 4명이 여행한다면 유심 4개 살 비용으로 와이파이 1대면 됩니다. 1인당 비용이 절반 이하로 떨어질 수 있어요.</li>
                    <li>• <strong className="text-gray-800">노트북, 태블릿 등 여러 기기를 써야 할 때.</strong> 업무 겸 여행이거나 영상 편집처럼 데이터를 많이 써야 하는 경우엔 포켓와이파이가 유연합니다.</li>
                    <li>• <strong className="text-gray-800">유심 교체가 어려운 폰을 쓸 때.</strong> 일부 구형 폰이나 유심 슬롯이 복잡한 경우 포켓와이파이가 더 간단합니다.</li>
                  </ul>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-2">생각보다 불편한 점들</p>
                  <ul className="flex flex-col gap-2">
                    <li>• <strong className="text-gray-800">배터리 관리가 번거롭습니다.</strong> 보통 포켓와이파이 배터리가 8~10시간인데, 하루 종일 관광하다 보면 오후에 방전되는 경우가 꽤 많아요. 보조배터리를 따로 챙겨야 합니다.</li>
                    <li>• <strong className="text-gray-800">그룹에서 분리가 안 됩니다.</strong> 식당에서 팀이 나뉘거나, 각자 다른 데 가고 싶을 때 와이파이 기기를 누가 갖고 있느냐로 갈등이 생깁니다. 경험해보셨죠? 저도 오사카에서 한 번 겪었습니다.</li>
                    <li>• <strong className="text-gray-800">반납이 귀찮습니다.</strong> 여행 끝나고 공항 반납 카운터 찾아야 하는데, 비행기 탑승 시간 빠듯할 때 이게 스트레스입니다. 반납 기간 초과하면 추가 요금도 붙어요.</li>
                    <li>• <strong className="text-gray-800">현지 번호가 없습니다.</strong> 앞서 말했듯이, 현지 번호 필요한 상황이 생각보다 많습니다.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">나라별 추천 방식</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">일본 — 유심이나 포켓와이파이 둘 다 괜찮습니다</p>
                  <p>일본은 유심 선택지가 워낙 다양하고 가격도 합리적이라 1인 여행이면 유심이 편합니다. 단, 일본 현지 통신망(도코모, SoftBank 계열)을 쓰는 유심을 골라야 속도가 안정적입니다. 가족 여행이라면 포켓와이파이도 충분히 선택지가 됩니다. 일본은 전국 커버리지가 좋아서 어느 쪽을 선택해도 크게 불편하지 않아요.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">동남아(태국·베트남·필리핀 등) — 유심 강력 추천</p>
                  <p>동남아는 현지 유심이 정말 저렴합니다. 태국 7일 무제한 유심이 현지에서 사면 우리 돈으로 3천~5천 원이에요. 공항 도착해서 바로 살 수 있고, AIS나 DTAC 같은 현지 통신사 유심이 속도도 잘 나옵니다. 굳이 한국에서 미리 비싸게 살 필요도 없습니다. 다만 현지에서 사면 의사소통이 조금 필요하니, 불편하신 분들은 한국에서 미리 구매해 가세요.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">유럽 — 유심 추천, 특히 EU 로밍 유심</p>
                  <p>유럽은 EU 회원국 간 로밍이 무료라 EU 로밍 유심 하나면 여러 나라를 커버할 수 있습니다. 영국은 브렉시트로 EU에서 빠져서 따로 처리해야 합니다. 보통 10일~2주 유럽 여행이면 10~15GB 용량 유심으로도 충분합니다. 넷플릭스나 유튜브 스트리밍을 많이 할 게 아니라면요. 유럽 포켓와이파이는 가격이 생각보다 비싸고 나라별로 기기를 바꿔야 하는 경우도 있어서 유심이 훨씬 편합니다.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">미국·캐나다 — eSIM이나 현지 프리페이드 유심</p>
                  <p>미국은 T-Mobile이나 AT&T 프리페이드 유심이 잘 나옵니다. 한국에서 미리 구매하거나, 도착 후 월마트나 타깃에서 저렴하게 살 수 있습니다. 넓은 나라라 통신망 커버리지 차이가 있으니 여행 경로에 따라 통신사를 골라야 합니다.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">데이터 용량, 얼마나 필요한가</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>이걸 모르면 너무 많이 사거나 중간에 데이터가 떨어지거나 둘 중 하나가 됩니다. 대략적인 기준을 잡아드리겠습니다.</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-3">하루 사용량 기준</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: '지도(구글맵) 적극 사용', value: '약 150~300MB/일' },
                      { label: '인스타그램 사진 업로드 10장', value: '약 50~100MB' },
                      { label: '유튜브 30분 (720p)', value: '약 300~500MB' },
                      { label: '카카오톡·문자 중심 사용', value: '하루 100MB 이하' },
                    ].map(i => (
                      <div key={i.label} className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-0.5">{i.label}</p>
                        <p className="font-bold text-gray-800 text-sm">{i.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p>지도 많이 쓰고, 사진 올리고, 동영상 좀 보는 일반적인 여행자라면 하루 500MB~1GB 정도 씁니다. 7일 여행이면 5~7GB면 여유 있게 씁니다. 그냥 무제한으로 사는 게 속 편하긴 한데, 무제한이라도 일일 데이터 한도 초과 후 속도 제한이 걸리는 상품이 많으니 상세 조건을 꼭 확인하세요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">eSIM, 요즘 이게 대세인 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>e심은 물리적인 유심 칩 없이 QR코드나 앱으로 통신사를 바꾸는 기술입니다. 최근 2~3년 사이에 많이 보급돼서 아이폰 XS 이후 모델, 삼성 갤럭시 S20 이후 모델 대부분이 지원합니다.</p>
                <p>e심의 가장 큰 장점은 <strong className="text-gray-800">유심 칩을 교체하지 않아도 된다</strong>는 겁니다. 여행 출발 전에 미리 QR코드를 등록해두고, 비행기 착륙하면 바로 활성화됩니다. 공항에서 유심 찾으러 돌아다닐 필요 없고, 기존 한국 번호 유심을 뽑을 필요도 없어서 한국 번호 수신이 됩니다(듀얼심으로 동시 사용 가능).</p>
                <p>단점이 있다면, <strong className="text-gray-800">폰을 분실하거나 교체할 때 e심 재등록이 번거롭습니다.</strong> 그리고 아직 일부 저가 폰이나 구형 폰은 지원이 안 됩니다. 본인 폰이 e심 지원하는지 먼저 확인해 보세요.</p>
                <p>요즘 airalo, Klook, KT·SKT·LGU+ 같은 통신사에서도 e심 상품을 팔고 있습니다. airalo는 국제 브랜드라 다양한 나라를 커버하고, 가격도 경쟁력이 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">어디서 사면 가장 저렴한가</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>구매 방법에 따라 같은 유심이라도 가격 차이가 꽤 납니다.</p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <strong className="text-gray-800">공항 픽업 (인천공항 통신사 부스)</strong><br />
                    KT, SKT, LGU+ 부스가 모두 있고, 도착 후 현장에서 유심을 수령하거나 미리 예약해서 찾는 방식입니다. 가격은 인터넷보다 조금 비싸지만 즉각적이고 직원한테 설치도 도움받을 수 있어 초보자한테는 편합니다. 출국 당일 아침 픽업도 가능합니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">네이버 스마트스토어 / 쿠팡</strong><br />
                    보통 가장 저렴합니다. 일본 7일 무제한 유심이 1만 2천~1만 5천 원대에 많이 올라와 있어요. 출발 3~5일 전에 주문하면 집으로 배송 받을 수 있습니다. 단, 리뷰 잘 보고 최근 구매자 후기 확인하는 게 중요합니다. 같은 가격이라도 속도나 안정성 차이가 있거든요.
                  </li>
                  <li>
                    <strong className="text-gray-800">airalo, Klook 등 해외 플랫폼</strong><br />
                    e심 구매에 특화돼 있습니다. 앱에서 바로 QR코드 받아서 등록하면 돼서 배송 기다릴 필요가 없습니다. 여러 나라를 묶은 지역형 e심도 있어서 유럽 여러 나라를 여행할 때 유용합니다.
                  </li>
                  <li>
                    <strong className="text-gray-800">현지 공항이나 편의점</strong><br />
                    태국, 베트남 등 동남아에서는 현지 편의점에서 사는 게 한국보다 훨씬 저렴합니다. 다만 영어나 현지어로 된 안내를 따라 설정해야 하는 번거로움이 있습니다.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">정리하면</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>복잡하게 생각할 필요 없이 이 기준으로 고르면 됩니다.</p>
                <div className="bg-blue-50 rounded-xl p-5">
                  <ul className="flex flex-col gap-2">
                    <li>• <strong className="text-gray-800">1인 여행</strong> → 유심이나 e심. 폰이 e심 지원하면 e심이 제일 편합니다.</li>
                    <li>• <strong className="text-gray-800">2~4명 여행</strong> → 유심 각자 또는 포켓와이파이 1대. 사람 수와 가격 비교해서 결정.</li>
                    <li>• <strong className="text-gray-800">일본·동남아·유럽</strong> → 유심 또는 e심 강력 추천.</li>
                    <li>• <strong className="text-gray-800">노트북 등 다기기 필요</strong> → 포켓와이파이가 유리.</li>
                    <li>• <strong className="text-gray-800">은행 앱이나 한국 번호 인증이 많이 필요</strong> → e심(듀얼심 유지)이 가장 좋음.</li>
                  </ul>
                </div>
                <p>어느 쪽이든 출발 전날 밤에 설정해두는 건 피하세요. 문제가 생기면 대처할 시간이 없습니다. 최소 1~2일 전에 확인해두는 게 좋습니다.</p>
              </div>
            </section>

          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 여행 일정 관리하기</p>
            <p className="text-sm text-gray-500 mb-3">유심 준비됐으면 이제 일정도 정리해보세요. 숙소, 이동 동선, 식당까지 한 곳에서 관리할 수 있습니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>

        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/travel-insurance', label: '여행자 보험 가이드' },
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
