import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '발리 5박 6일 여행 코스 | 우붓부터 꾸따까지 지역별로',
  description: '발리 5박 6일 완벽 가이드. 우붓 논길 트레킹, 울루와투 절벽 사원, 스미냑 해변까지. 발리 처음이라도 여유롭게 즐길 수 있는 실전 코스.',
}

export default function BaliTravelPage() {
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
              {['발리', '인도네시아', '동남아', '리조트여행', '5박6일'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
              발리 5박 6일 여행 코스 — 우붓에서 시작해서 꾸따로 마무리하는 루트
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              발리는 솔직히 한 번 가면 또 가고 싶어지는 곳이에요. 근데 처음 가는 분들은 어디서부터 어떻게 시작해야 할지 막막하죠. 우붓이 좋다는데 어떤 숙소에서 묵어야 하는지, 꾸따랑 스미냑이 뭐가 다른지, 스쿠터 타면 위험한지 아닌지. 제가 처음 발리 갔을 때 궁금했던 것들이랑 실제 다녀와서 알게 된 것들 위주로 정리해봤어요.
            </p>
          </div>

          <div className="flex flex-col gap-10 text-sm text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">발리 입문자에게 먼저 하는 말</h2>
              <p className="mb-3">
                발리는 인도네시아에 속해 있지만 힌두교 문화권이에요. 인도네시아 전체가 이슬람 다수 국가인데 발리만 힌두가 90% 이상이에요. 그래서 분위기가 다른 동남아 나라랑은 많이 달라요. 곳곳에 제물 바구니(짜낭 사리)가 놓여 있고, 절이 많고, 문화적인 분위기가 강해요.
              </p>
              <p className="mb-3">
                그래서 중요한 게 있어요. <strong className="text-gray-800">사원이나 절 입장할 때는 사롱(허리 감는 천)을 착용해야 해요.</strong> 반바지 차림이면 입장 거부당할 수 있거든요. 대부분의 사원 입구에서 빌려주는데, 일부는 유료예요. 노출이 심한 옷은 야외에서도 자제하는 게 예의상 좋아요.
              </p>
              <p className="mb-3">
                항공편은 인천에서 발리(응우라라이 국제공항)까지 직항이 있어요. 약 7시간 30분~8시간 소요돼요. 한국보다 1시간 느리고요. 비자는 인도네시아 도착비자(VOA)로 500,000루피아(약 4만 5천 원) 내고 30일짜리 받을 수 있어요. 미리 온라인으로 신청하면 공항에서 빠르게 처리돼요.
              </p>
              <p className="mb-3">
                환율은 1원에 약 11~12루피아 정도예요. 100,000루피아가 약 9천 원 정도니까 10만 루피아 단위로 계산하면 편해요. 루피아 지폐는 단위가 커서 처음에 헷갈리는데 금방 익숙해져요. ATM에서 루피아 인출도 가능하고, 시내 환전소도 많아요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 1~2 — 우붓: 논길, 원숭이숲, 화산 호수</h2>
              <p className="mb-3">
                발리 여행의 첫 베이스는 <strong className="text-gray-800">우붓(Ubud)</strong>으로 잡는 게 좋아요. 공항에서 우붓까지 차로 약 1시간~1시간 30분 걸려요. 고젝이나 그랩으로 미리 잡아두면 돼요. 요금은 약 15만~20만 루피아 정도.
              </p>
              <p className="mb-3">
                우붓은 발리 내륙 고원 지대에 있어서 해안가보다 훨씬 선선해요. 낮에 28~30도, 밤에 22~24도 정도라 쾌적하게 지낼 수 있어요. 논밭이 펼쳐지는 전원 풍경이 아름답고, 전통 공예·예술 문화가 살아있는 곳이에요.
              </p>
              <p className="mb-3">
                <strong className="text-gray-800">뜨갈랄랑 논길(Tegallalang Rice Terrace)</strong>은 계단식 논이 이어지는 풍경으로 발리 대표 사진 명소예요. 입장료는 기부 형식으로 2만~5만 루피아 정도 내면 돼요. 논길 따라 걷는 시간은 1~2시간 정도 잡으면 충분해요. 낮에는 뜨겁고 사람도 많으니까 오전 8~9시에 가는 걸 추천해요.
              </p>
              <p className="mb-3">
                우붓 시내에 있는 <strong className="text-gray-800">원숭이숲(Sacred Monkey Forest)</strong>은 이름 그대로 원숭이들이 자유롭게 돌아다니는 신성한 숲이에요. 입장료 9만 루피아. 원숭이들이 사람에게 꽤 가까이 다가오는데, 귀엽다고 만지려 하면 안 돼요. 음식 들고 들어가면 빼앗기는 경우 있어요. 가방 지퍼는 꼭 잠가두세요. 진짜로요.
              </p>
              <p className="mb-3">
                이틀째 하루는 우붓에서 차로 약 1시간 거리에 있는 <strong className="text-gray-800">킨타마니 화산과 바투르 호수(Kintamani & Lake Batur)</strong>를 다녀오는 게 좋아요. 1,700m 고원에서 내려다보는 바투르 화산과 호수 전망이 진짜 멋있어요. 주변 식당에서 점심 먹으면서 전망 감상하는 코스가 인기예요. 투어 차량 빌리면 반나절에 약 40만~60만 루피아.
              </p>
              <p className="mb-3">
                우붓에서 저녁은 레기안 로드(Jl. Raya Ubud) 근처 음식점들이 많아요. 나시고렝 3만~5만 루피아, 신선한 과일 주스 2만~3만 루피아 정도예요. 우붓 밤은 전통 무용 공연을 하는 곳도 있어요. 케착 댄스 공연은 저녁 7시 반쯤 시작하는데 약 10만 루피아예요. 볼 만해요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 3 — 누사두아 or 꾸따 해변</h2>
              <p className="mb-3">
                3일차는 내륙에서 해안으로 이동할 시간이에요. <strong className="text-gray-800">누사두아(Nusa Dua)</strong>는 고급 리조트가 밀집한 고요한 해변이고, <strong className="text-gray-800">꾸따(Kuta)</strong>는 서핑과 쇼핑, 나이트라이프로 유명한 번화한 해변이에요. 분위기가 완전 달라요.
              </p>
              <p className="mb-3">
                가족 여행이나 조용히 쉬고 싶은 분들은 누사두아, 서핑 배워보고 싶거나 여러 사람들이랑 어울리고 싶은 분들은 꾸따가 맞아요. 저는 첫 발리 여행에서 꾸따에 묵었는데, 솔직히 너무 시끄럽고 호객 행위가 심해서 피곤했어요. 두 번째 여행 때는 스미냑에 묵었는데 그게 훨씬 좋더라고요.
              </p>
              <p className="mb-3">
                꾸따 해변 서쪽으로는 인도양 일몰이 유명해요. 오후 5시~6시쯤 해변에 자리 잡으면 주황빛 하늘이 정말 멋있어요. 해변 주변에 서핑 레슨 제공하는 스쿨이 많고 1~2시간에 20만~30만 루피아 정도예요. 초보자도 쉽게 배울 수 있어요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 4~5 — 스미냑, 캉구, 울루와투</h2>
              <p className="mb-3">
                4~5일차는 <strong className="text-gray-800">스미냑(Seminyak)</strong>과 <strong className="text-gray-800">캉구(Canggu)</strong> 지역을 베이스로 삼는 게 좋아요. 꾸따보다 세련된 분위기고, 로컬 카페와 빈티지 숍, 레스토랑이 많아서 거리 자체가 구경거리예요.
              </p>
              <p className="mb-3">
                스미냑 해변 근처에는 해변 클럽들이 있는데 낮에 데이 패스 끊으면 풀장이랑 선베드를 이용할 수 있어요. 포테이토 헤드(Potato Head Beach Club)가 유명한데 입장료가 있거나 최소 주문 금액이 있어요. 저녁에는 칵테일 한 잔 마시면서 노을 보는 게 발리 감성이에요.
              </p>
              <p className="mb-3">
                캉구는 서퍼들의 동네예요. 에코 선데이 마켓 같은 주말 플리마켓도 열리고, 인스타 감성 가득한 카페들이 많아서 여유롭게 걷기 좋아요. 렌터카 없이 스쿠터로 돌아다니는 사람들이 많은 동네이기도 해요.
              </p>
              <p className="mb-3">
                5일차 오후나 저녁은 꼭 <strong className="text-gray-800">울루와투 사원(Uluwatu Temple)</strong>을 가보세요. 발리 남쪽 해안 절벽 위에 지어진 사원으로, 고도 70m에서 내려다보는 인도양이 장관이에요. 입장료는 5만 루피아이고 사롱 대여 포함이에요. 오후 6시쯤 시작하는 일몰 감상 포인트로도 유명해요.
              </p>
              <p className="mb-3">
                울루와투에서도 원숭이를 조심해야 해요. 선글라스, 모자, 핸드폰을 낚아채 가는 원숭이들이 있어요. 인스타그램에 울루와투 원숭이 피해 후기가 진짜 많아요. 물건 노출은 최소화하세요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 6 — 귀국 전 마지막 쇼핑과 스파</h2>
              <p className="mb-3">
                마지막 날은 비행기 시간에 따라 다르지만, 오전에 스파 예약해두면 좋아요. 발리 스파는 가격 대비 만족도가 높은 편이에요. 발리니즈 마사지 1시간에 10만~20만 루피아, 고급 스파도 한국보다 훨씬 저렴해요. 쿠타나 스미냑에 스파가 많은데 미리 예약하는 게 안전해요.
              </p>
              <p className="mb-3">
                쇼핑은 스미냑의 비치워크 쇼핑센터나 꾸따 아트 마켓에서 할 수 있어요. 기념품은 가격 흥정이 기본이에요. 처음 부르는 가격의 50~70%로 흥정 시작하면 돼요. 너무 깎으려 하면 분위기가 나빠지는 경우 있으니 적당히 하세요.
              </p>
              <p className="mb-3">
                공항은 응우라라이 국제공항 하나뿐이에요. 성수기에는 공항이 많이 막힐 수 있어서 출발 3시간 전 도착을 목표로 잡는 게 좋아요. 짐에 나무 공예품이나 부적 같은 물건 넣을 때 세관에 걸리는 경우 있으니까 확인해보세요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">발리 음식 — 무조건 먹어봐야 할 것</h2>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-gray-600">
                <li>
                  <strong className="text-gray-800">나시고렝(Nasi Goreng):</strong> 인도네시아식 볶음밥이에요. 달달하고 약간 매콤한 맛이에요. 어디서든 3만~6만 루피아면 먹을 수 있어요. 로컬 식당이든 리조트 조식이든 거의 다 있어요.
                </li>
                <li>
                  <strong className="text-gray-800">사테(Satay):</strong> 꼬치 구이예요. 닭고기, 돼지고기, 생선 등 다양해요. 땅콩 소스에 찍어 먹는 게 기본이에요. 길거리에서 5개에 2만 루피아 정도예요.
                </li>
                <li>
                  <strong className="text-gray-800">바비굴링(Babi Guling):</strong> 발리식 통돼지 바비큐예요. 발리 힌두 문화에서 축제 음식으로 쓰이는 건데 관광객에게도 인기예요. 우붓에 '이부 오카'라는 유명한 식당이 있고, 한 접시에 5만~8만 루피아예요. 점심 시간에 재료가 다 팔리는 경우 있어서 오전 11시~12시 사이에 가는 게 좋아요.
                </li>
                <li>
                  <strong className="text-gray-800">가도가도(Gado-Gado):</strong> 삶은 채소에 땅콩 소스를 뿌린 샐러드예요. 한국인 입맛에는 호불호 갈릴 수 있는데 담백하고 건강한 맛이에요.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">교통 — 스쿠터 vs 고젝, 솔직한 판단</h2>
              <p className="mb-3">
                발리 교통의 핵심은 고젝(Gojek)이에요. 인도네시아판 그랩이라고 보면 돼요. 오토바이 택시(GoRide)랑 차량 택시(GoCar) 모두 있어요. 앱에서 금액이 미리 표시되고 카드 결제도 가능해서 바가지 걱정 없이 편하게 써요.
              </p>
              <p className="mb-3">
                스쿠터는 저렴하게 이동할 수 있고 발리 감성에 잘 맞긴 한데, <strong className="text-gray-800">솔직히 초보자에겐 위험해요.</strong> 도로가 좁고 차선 개념이 느슨하고, 외국인 교통사고가 매년 꽤 많이 나요. 국제면허 없이 운전하면 사고 시 보험 처리도 안 되는 경우 있고요. 발리 첫 방문이라면 고젝이 훨씬 안전하고 편해요.
              </p>
              <p className="mb-3">
                우붓에서 해안가까지는 차로 1시간 넘게 걸리는 경우도 있어요. 장거리 이동은 차량 대절 서비스를 이용하는 분들도 많아요. 하루 8시간 기준 50만~80만 루피아 정도인데, 우붓에서 울루와투까지 한 번에 돌아다니기엔 대절이 가성비 좋아요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">예산과 주의사항</h2>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-gray-600 mb-4">
                <li><strong className="text-gray-800">항공권:</strong> 직항 왕복 40만~80만 원 (성수기 100만 원 이상도 있음)</li>
                <li><strong className="text-gray-800">숙소:</strong> 하루 5만~20만 원 (게스트하우스~3성급 기준)</li>
                <li><strong className="text-gray-800">식비:</strong> 하루 2만~5만 원 (로컬 식당 위주)</li>
                <li><strong className="text-gray-800">입장료 합계:</strong> 2만~4만 원 사이</li>
                <li><strong className="text-gray-800">도착비자(VOA):</strong> 약 4만 5천 원</li>
                <li><strong className="text-gray-800">총 예상 비용:</strong> 5박 6일 1인 기준 항공 포함 70만~120만 원</li>
              </ul>
              <p className="mb-3">
                발리에서 주의해야 할 게 있어요. 음식은 위생 상태가 불규칙해서 상하기 쉬운 해산물은 믿을 만한 식당에서만 드세요. 물도 생수 사 먹는 게 기본이에요. 그리고 사원 주변에서는 과하게 흥정하거나 큰 소리 내는 게 실례예요. 현지 문화에 대한 최소한의 존중이 필요한 곳이에요.
              </p>
            </section>

            <section className="bg-blue-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-2">발리 여행 기록을 남기고 싶다면</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                발리 여행은 사진도 많이 찍게 되고 방문한 스팟도 많아요. 논길, 해변, 사원, 카페... 이 모든 걸 날짜별로 정리해두고 싶다면 <Link href="/" className="text-blue-600 underline">Voyalogue</Link>를 써보세요. 여행 경로를 일정별로 정리하고 메모와 사진을 함께 남길 수 있어요. 나중에 "발리에서 뭐 했더라" 싶을 때 바로 꺼내볼 수 있어요.
              </p>
            </section>

          </div>
        </article>
      </main>

      <footer className="border-t border-gray-100 bg-white mt-10">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <span>© 2025 Voyalogue</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-600">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-gray-600">이용약관</Link>
            <Link href="/guide" className="hover:text-gray-600">가이드</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
