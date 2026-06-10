import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '방콕 4박 5일 여행 코스 | 왕궁부터 야시장까지 현지인처럼',
  description: '방콕 4박 5일 여행 코스 완벽 정리. 왓포, 왓아룬, 짜뚜짝 시장, 아시아티크, 카오산로드. 처음 방콕 여행도 헷갈리지 않게.',
}

export default function BangkokTravelPage() {
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
              {['방콕', '태국', '동남아', '도시여행', '4박5일'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
              방콕 4박 5일 여행 코스 — 왕궁, 야시장, 로컬 맛집까지 현지인처럼
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              방콕은 처음 가도 어렵지 않은 도시예요. BTS 지하철이 잘 되어 있고, 그랩이 잘 잡히고, 영어도 관광지 위주로는 웬만큼 통해요. 근데 의외로 헷갈리는 게 많아요. 왕궁 근처에서 "오늘 왕궁 문 닫았어요" 하고 다른 데로 유도하는 사기꾼이라든지, 툭툭 탔다가 너무 비쌌다든지. 그런 것들 미리 알고 가면 훨씬 편하게 여행할 수 있어요.
            </p>
          </div>

          <div className="flex flex-col gap-10 text-sm text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">방콕 처음이라면 알아둘 것들</h2>
              <p className="mb-3">
                인천에서 방콕 수완나품 공항까지 직항으로 5시간 30분~6시간 걸려요. 한국보다 2시간 느리고요. 비자는 30일 무비자 입국이 가능해요. 공항에서 바로 나오면 돼요.
              </p>
              <p className="mb-3">
                환율은 1원에 약 0.026바트 정도, 즉 1바트가 약 38~40원이에요. 100바트 = 약 3,800~4,000원이라고 생각하면 계산하기 편해요. 공항 환전소보다 시내 슈퍼리치(Super Rich) 같은 환전소가 환율이 좋아요.
              </p>
              <p className="mb-3">
                공항에서 시내는 <strong className="text-gray-800">공항철도(Airport Rail Link)</strong>가 제일 편해요. 수완나품에서 BTS 환승역인 파야타이(Phaya Thai)역까지 45분, 45바트예요. 택시도 있는데 고속도로 요금 포함해서 300~500바트 사이예요. 그랩이 공항 안에서 잘 안 잡히는 경우도 있어서 그냥 공식 택시 카운터 이용하는 게 편해요.
              </p>
              <p className="mb-3">
                방콕의 최대 단점은 교통 체증이에요. 낮 12시~저녁 8시는 도로가 막혀서 차로 이동하면 예상보다 2~3배 시간이 걸릴 수 있어요. 그래서 가급적 BTS나 MRT 지하철 노선 위주로 움직이는 게 좋고, 도보 이동도 많이 고려해야 해요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 1 — 왕궁, 왓포, 왓아룬, 카오산로드</h2>
              <p className="mb-3">
                첫날은 방콕 구시가지인 라따나꼬씬 지역에서 시작해요. 주요 사원들이 몰려 있는 곳이에요. 아침 일찍 출발해야 하는데, 낮에는 너무 더워서 야외 관광이 힘들거든요. 오전 8시 전후로 출발하는 걸 강력 추천해요.
              </p>
              <p className="mb-3">
                <strong className="text-gray-800">왕궁(Grand Palace)</strong>은 방콕 대표 관광지예요. 입장료 500바트인데 비싸긴 해도 규모가 어마어마해서 돈값은 해요. 단, 반바지나 민소매는 절대 안 돼요. 복장 규정이 엄격해서 민소매나 반바지로 가면 천을 빌려줘서 두르게 해요. 차라리 가기 전에 긴바지나 얇은 바지 챙겨가는 게 낫고요.
              </p>
              <p className="mb-3">
                왕궁 안에 있는 <strong className="text-gray-800">왓프라깨우(Wat Phra Kaew)</strong>는 에메랄드 불상을 모시는 곳으로 태국 사람들에게 아주 신성한 장소예요. 왕궁 입장권에 포함이에요. 관광객들로 넘쳐나긴 하지만 건축 자체가 눈이 부실 정도로 화려해요.
              </p>
              <p className="mb-3">
                왕궁에서 걸어서 10분 거리에 <strong className="text-gray-800">왓포(Wat Pho)</strong>가 있어요. 길이 46m짜리 황금 와불상이 있는 곳인데, 직접 보면 크기에 압도돼요. 입장료 200바트. 왓포는 태국 전통 마사지의 발상지이기도 해서, 사원 안에 마사지 학교가 있어요. 발 마사지 1시간에 420바트인데 사원 안에서 받는 거라 좀 독특한 경험이에요.
              </p>
              <p className="mb-3">
                오후 늦게는 선착장에서 보트 타고 짜오프라야 강 건너편 <strong className="text-gray-800">왓아룬(Wat Arun)</strong>으로 이동해요. 강 건너 보트 왕복 16바트 정도예요. 왓아룬은 도자기 조각으로 뒤덮인 탑이 유명한데, 일몰 전후로 보는 게 가장 예뻐요. 강 건너에서 바라보는 왓아룬 야경도 꽤 근사해요.
              </p>
              <p className="mb-3">
                저녁은 <strong className="text-gray-800">카오산로드(Khao San Road)</strong>로 이동하면 돼요. 배낭여행자 거리로 유명하고 밤이 되면 더 활기차요. 길거리 음식이 가득하고 노점상도 많아요. 팟타이 50~80바트, 튀긴 곤충 간식(달달하고 고소해요, 생각보다 나쁘지 않아요) 50~100바트. 지갑, 핸드폰 소매치기 주의하세요. 사람이 많은 곳에서 앞 주머니 활용해요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 2 — 짜뚜짝 시장, 쑤쿰윗</h2>
              <p className="mb-3">
                <strong className="text-gray-800">짜뚜짝 주말 시장(Chatuchak Weekend Market)</strong>은 세계 최대 규모의 주말 시장 중 하나예요. 매주 토·일요일에 열리고, MRT 캄팽펫역에서 내리면 돼요. 섹션이 30개가 넘고 가게 수가 1만 5천 개 이상이에요. 가죽 제품, 옷, 빈티지 가구, 반려동물, 식물, 음식까지 없는 게 없어요.
              </p>
              <p className="mb-3">
                더운 낮에는 정말 힘들어요. 아침 일찍 가서 11시 전에 나오는 게 좋아요. 비닐 봉지에 담긴 코코넛 아이스크림 사 먹으면서 돌아다니면 좀 버텨지고요. 흥정은 기본이에요. 가격표 없는 제품은 무조건 흥정 가능해요.
              </p>
              <p className="mb-3">
                오후에는 BTS 타고 <strong className="text-gray-800">쑤쿰윗(Sukhumvit)</strong> 지역으로 이동해요. 방콕의 번화한 상업 지구로 백화점, 레스토랑, 마사지숍이 가득해요. 엠쿼티어(EmQuartier), 터미널21 쇼핑몰이 있어서 쇼핑하기도 좋아요. 터미널21은 각 층이 세계 도시 테마로 꾸며져 있고, 푸드코트가 시장 형식이라 음식 가격이 착해요. 쌀국수 한 그릇에 60~80바트예요.
              </p>
              <p className="mb-3">
                쑤쿰윗 밤은 나나(Nana)나 아속(Asok) 쪽으로 걷다 보면 다양한 분위기의 가게들이 많아요. 루프탑 바에서 방콕 야경을 보고 싶다면 이 지역이나 실롬 지역에 옵션이 많아요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 3 — 아시아티크, 차이나타운, 야시장</h2>
              <p className="mb-3">
                3일차 낮에는 좀 여유롭게 시작해도 좋아요. 더운 낮을 피해 숙소에서 쉬다가 오후 늦게 <strong className="text-gray-800">차이나타운(Yaowarat)</strong>으로 이동하는 루트가 좋아요.
              </p>
              <p className="mb-3">
                MRT 용왈랏역 하차. 야오와랏 로드를 따라 걷다 보면 노점 음식, 해산물 구이, 죽집 등이 줄지어 있어요. 저녁 시간대부터 활기가 넘쳐요. 방콕 차이나타운에서 해산물 구이를 먹는 건 거의 필수 코스예요. 꽃게 찜, 새우 구이, 가리비 등이 가격 대비 맛있어요. 식당마다 가격이 다르니까 메뉴판 확인 먼저 하세요.
              </p>
              <p className="mb-3">
                저녁 후반에는 그랩 타고 <strong className="text-gray-800">아시아티크(Asiatique The Riverfront)</strong>로 이동하세요. 짜오프라야 강변에 지어진 야외 쇼핑·엔터테인먼트 공간이에요. 밤에 조명이 켜지면 분위기가 정말 좋아요. 대관람차, 쇼핑 부티크, 레스토랑, 분수 쇼까지 있어요. 입장료 없고 구경만 해도 돼요. 밤 10~11시까지 운영해요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 4 — 아유타야 당일치기 or 수상시장</h2>
              <p className="mb-3">
                4일차는 방콕 외곽 당일치기 두 가지 옵션 중 선택하면 돼요.
              </p>
              <p className="mb-3">
                <strong className="text-gray-800">아유타야(Ayutthaya)</strong>는 방콕 북쪽 80km에 있는 옛 태국 수도예요. 기차로 약 1시간 30분, 편도 15~20바트예요. 방콕 화람퐁역에서 출발해요. 현지에서 자전거 빌려서 유적지 돌아다닐 수 있어요. 돌로 만든 불상 머리가 나무뿌리에 감겨 있는 왓 마하탓이 제일 유명해요. 태국 역사에 관심 있는 분들에게 강추예요. 유적지는 거의 야외라 모자와 선크림 필수예요.
              </p>
              <p className="mb-3">
                <strong className="text-gray-800">수상시장(Floating Market)</strong>은 담넌사두억(Damnoen Saduak)이 가장 유명한데 사실 요즘은 관광객용으로 많이 상업화됐어요. 배 타고 돌아다니면서 음식 사 먹는 경험 자체는 재밌는데, 가격도 좀 비싸고 흥정 압박이 있어서 진짜 로컬 시장 느낌은 아니에요. 그래도 독특한 경험을 원한다면 나쁘지 않아요. 투어 차량으로 왕복 3시간 정도예요.
              </p>
              <p className="mb-3">
                저녁은 방콕 시내로 돌아와서 마지막 밤을 즐겨요. 루프탑 바를 아직 안 갔다면 오늘 가보세요. 방콕은 루프탑 바가 많기로 유명한데, 스카이바(Sky Bar), 옥타브(Octave) 같은 곳이 방콕 야경 보기 좋아요. 드레스코드 있는 곳도 있으니 미리 확인하세요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 5 — 시암, 쇼핑몰, 귀국</h2>
              <p className="mb-3">
                마지막 날은 <strong className="text-gray-800">시암(Siam)</strong> 지역으로 가면 돼요. BTS 시암역 주변에 파라곤(Siam Paragon), 센트럴월드(CentralWorld), 엠비오(MBK)가 모여 있어요.
              </p>
              <p className="mb-3">
                시암 파라곤은 고급 브랜드 위주고, 엠비오는 저렴한 쇼핑몰이에요. 짐 무게 신경 쓰인다면 이곳에서 가방 하나 더 사도 좋고요. 센트럴월드 지하 푸드코트에서 마지막 태국 음식 한 끼 해결하는 것도 좋아요.
              </p>
              <p className="mb-3">
                공항은 수완나품이 주요 국제공항이에요. BTS 파야타이역에서 공항철도로 이동하거나, 그랩으로 이동하면 돼요. 오후 비행기라면 시암에서 오전에 쇼핑하고 이동해도 시간 여유 있어요. 공항 면세점에서 태국 과자, 스낵 세트 사 가는 것도 좋아요. 이제는 한국에서도 태국 과자 구하기 어렵지 않지만 직접 사 가면 더 신선하고 선물용으로도 좋아요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">방콕 음식 — 꼭 먹어야 할 것</h2>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-gray-600">
                <li>
                  <strong className="text-gray-800">팟타이(Pad Thai):</strong> 쌀국수 볶음이에요. 새우나 닭고기 선택할 수 있고 땅콩가루, 라임, 숙주가 곁들여 나와요. 길거리 노점에서 50~80바트예요. 매콤하게 먹고 싶으면 고추가루 넣어달라고 하세요. 단, 고수가 들어가는 경우 있으니 싫으면 빼달라고 하세요.
                </li>
                <li>
                  <strong className="text-gray-800">똠양꿍(Tom Yum Goong):</strong> 태국 새우 매운탕이에요. 레몬그라스, 카피르 라임잎, 갈랑갈 향이 특징이에요. 처음엔 낯선 향이 강할 수 있는데 익숙해지면 진짜 맛있어요. 식당에서 150~300바트 정도.
                </li>
                <li>
                  <strong className="text-gray-800">망고 찹쌀밥(Khao Niao Mamuang):</strong> 태국 대표 디저트예요. 잘 익은 노란 망고에 코코넛 밀크로 지은 찹쌀이 올라가요. 한 접시에 50~80바트. 정말 맛있어요. 망고 철인 4~6월에 특히 달고 맛있어요.
                </li>
                <li>
                  <strong className="text-gray-800">쏨땀(Som Tam):</strong> 파파야 샐러드예요. 잘게 채 썬 파파야에 라임, 피시소스, 고추를 섞어 만들어요. 매운 걸 좋아하면 진짜 취향 저격이에요. 매운 정도 조절 가능하니까 주문할 때 말해주세요.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">교통 — BTS, MRT, 툭툭 vs 그랩</h2>
              <p className="mb-3">
                방콕 교통의 핵심은 <strong className="text-gray-800">BTS 스카이트레인</strong>과 <strong className="text-gray-800">MRT 지하철</strong>이에요. 두 노선이 시내 주요 지점을 촘촘하게 연결해요. 단거리 이동은 15~50바트 수준이에요. 여러 번 탄다면 래빗카드나 교통카드를 구매해서 쓰면 편해요.
              </p>
              <p className="mb-3">
                <strong className="text-gray-800">그랩(Grab)</strong>은 방콕에서도 잘 돼요. 교통 체증이 있어서 예상보다 오래 걸릴 수 있지만 요금은 투명하게 표시돼요. 지하철 안 닿는 곳은 그랩 카로 이동하는 게 제일 편해요.
              </p>
              <p className="mb-3">
                <strong className="text-gray-800">툭툭</strong>은 재미로 한 번 타볼 만한데, 가격은 절대 먼저 제시하는 금액에 타면 안 돼요. 일반 그랩 요금의 2~3배를 부르는 경우가 많아요. 짧은 거리에 100~150바트 정도 흥정이 적당해요. 그리고 "싸게 데려다줄게, 대신 가는 길에 내 친구 가게에 잠깐 들러" 하는 기사는 조심하세요. 안 사면 괜찮긴 한데 시간 낭비예요.
              </p>
              <p className="mb-3">
                짜오프라야 강변 이동에는 <strong className="text-gray-800">수상버스(Chao Phraya Express Boat)</strong>가 유용해요. 강변 사원들 사이를 빠르게 오갈 수 있고 요금도 15~40바트로 저렴해요. 왕궁에서 아시아티크 이동할 때도 쓸 수 있어요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">예산 정리</h2>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-gray-600">
                <li><strong className="text-gray-800">항공권:</strong> 왕복 25만~50만 원 (성수기엔 더 비쌈)</li>
                <li><strong className="text-gray-800">숙소:</strong> 하루 4만~12만 원 (시내 3성급 기준)</li>
                <li><strong className="text-gray-800">식비:</strong> 하루 1만 5천~3만 원 (로컬 식당 위주)</li>
                <li><strong className="text-gray-800">관광지 입장료:</strong> 하루 1만~2만 원 (왕궁 500바트 포함)</li>
                <li><strong className="text-gray-800">교통비:</strong> 하루 5천~1만 5천 원 (BTS + 그랩 혼합)</li>
                <li><strong className="text-gray-800">총 예상 비용:</strong> 4박 5일 1인 기준 항공 포함 50만~80만 원</li>
              </ul>
              <p className="mt-3">
                방콕은 숙소 퀄리티 대비 가격이 정말 좋은 편이에요. 5만 원 안팎으로 수영장 있는 깔끔한 호텔에 묵을 수 있어요. 숙소 위치는 BTS역 근처로 잡으면 이동이 훨씬 편해요. 실롬, 시암, 쑤쿰윗 중심부가 좋아요.
              </p>
            </section>

            <section className="bg-blue-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-2">방콕 여행, 기록으로 남겨두세요</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                왓포, 야시장, 망고 찹쌀밥 먹은 가게... 여행 중에 찍은 사진과 방문 장소를 <Link href="/" className="text-blue-600 underline">Voyalogue</Link>에 날짜별로 정리해두면 나중에 다시 보기 정말 좋아요. "그때 먹었던 팟타이 어디서 먹었더라" 싶을 때 바로 꺼내볼 수 있어요. 여행 동반자랑 같이 기록을 공유하는 것도 가능해요.
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
