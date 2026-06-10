import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '도쿄 4박 5일 여행 코스 | 첫 도쿄 여행자를 위한 알짜 일정',
  description: '도쿄 4박 5일 완벽 코스. 아사쿠사, 시부야, 하라주쿠, 아키하바라, 신주쿠까지 처음 도쿄 여행도 막히지 않는 실전 가이드.',
}

export default function TokyoTravelPage() {
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
              {['도쿄', '일본', '4박5일', '도시여행'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
              도쿄 4박 5일 여행 코스 — 첫 방문자를 위한 알짜 실전 가이드
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              도쿄는 처음 가는 사람한테 약간 압도적인 도시예요. 지하철 노선도만 봐도 눈이 돌아가고, 어느 동네에서 뭘 해야 하는지 정보가 너무 많아서 오히려 헷갈리기도 하거든요. 그래서 이번 가이드는 "어디서 뭘 보고 뭘 먹는다"보다, 도쿄를 처음 여행하는 분들이 실제로 느끼는 혼란을 줄이는 데 초점을 맞췄어요. 4박 5일은 도쿄를 파악하기에 빡빡하지 않고 느슨하지도 않은 딱 적당한 일수예요.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">처음 도쿄라면 미리 알아야 할 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  도쿄는 넓어요. 서울보다 훨씬 넓어요. 시부야에서 아사쿠사까지 지하철로 40~50분이 걸리는데, 환승까지 하면 1시간 가까이 되는 경우도 있어요. 그래서 하루에 동네 두 곳을 묶는 건 괜찮지만, 세 곳을 넣으면 이동 시간에 하루가 녹아버려요. 이 점을 모르고 일정을 욕심 있게 짰다가 이동만 하다 지치는 경우가 많습니다.
                </p>
                <p>
                  발도 많이 아파요. 이건 진짜로요. 하루 종일 돌아다니면 20,000보 이상 걷는 게 기본인 도시예요. 패션에 신경 쓰고 싶어도, 신발만큼은 발 편한 걸 신어야 해요. 둘째 날부터 발바닥이 욱신거리면서 일정을 포기하게 되거든요.
                </p>
                <p>
                  도쿄는 치안이 좋아서 밤늦게 돌아다녀도 크게 걱정하지 않아도 돼요. 편의점이 24시간 운영되고 지하철도 심야 1시 이후까지 다니니까, 저녁 일정 여유 있게 짜도 됩니다.
                </p>
                <p>
                  그리고 도쿄는 딱히 "오사카처럼 적극적으로 먼저 말 걸어주는" 분위기가 아니에요. 길을 물으면 친절하게 알려주지만, 음식점에서 일본어 한마디도 못해도 메뉴 사진을 가리키면 다 통합니다. 언어 걱정은 크게 안 해도 돼요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 1 — 아사쿠사, 우에노, 아키하바라</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  나리타 공항에서 도쿄 시내까지 이동하는 방법은 여러 가지예요. 나리타 익스프레스(N'EX)는 신주쿠·시부야·요코하마까지 직통으로 가는 대신 편도 3,070엔이고, 케이세이 스카이라이너는 우에노까지 2,570엔에 41분이에요. 예산을 아끼고 싶으면 케이세이 본선 급행(약 1,200엔, 80분)도 있는데 피곤하면 비추예요. 하네다 공항에서는 케이큐선이나 도쿄 모노레일로 이동하면 돼요.
                </p>
                <p>
                  첫날은 아사쿠사부터 시작하세요. 센소지 절은 도쿄에서 제일 오래된 절인데, 오전 7시 이전에 가면 사람이 별로 없어요. 나카미세 상점가는 기념품 쇼핑 하기에 딱 좋고, 인형야키(150엔)나 닌교야키 하나씩 사 먹으면서 걷는 느낌이 도쿄 여행의 시작을 제대로 알려줘요.
                </p>
                <p>
                  점심 후에는 우에노 쪽으로 걸어서 이동(약 20분)하거나, 아메요코 시장을 지나쳐봐도 좋아요. 아메요코는 재래시장 느낌인데 생선, 건어물, 잡화를 저렴하게 살 수 있는 곳이에요. 관광지라기보다 생활감 있는 곳이라 취향 탈 수도 있어요.
                </p>
                <p>
                  저녁은 아키하바라로 이동하세요. 전자상가 거리이기도 하지만 지하 1층짜리 라멘집이나 덮밥집이 많아서 저녁 식사하기에도 좋아요. 규동 한 그릇에 400~600엔이면 배 불리게 먹을 수 있어요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 2 — 하라주쿠, 시부야, 에비스</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  하라주쿠역 근처에서 시작하는 둘째 날은 도쿄의 젊은 감각을 느끼는 날이에요. 다케시타 거리는 오전 10시쯤 가야 가게들이 열리는데, 크레페 하나 들고 걸으면서 구경하는 게 이 거리의 정석이에요. 크레페 하나에 500~700엔, 토핑 추가하면 800~900엔까지도 해요.
                </p>
                <p>
                  다케시타 거리에서 오모테산도 힐스 쪽으로 넘어가면 분위기가 확 달라져요. 명품 브랜드숍이 줄지어 있고 카페도 예쁜 곳들이 많아요. 걷는 것 자체가 좋은 거리예요. 특히 오모테산도 근처 블루보틀 커피(라테 한 잔 900엔 내외)는 줄이 길지만 분위기 좋아서 여행 인스타에 잘 어울려요.
                </p>
                <p>
                  점심 이후에는 시부야로 이동하세요. 시부야 스크램블 교차로는 낮에도 볼 만하지만 저녁에 더 장관이에요. 시부야 스카이 전망대(입장료 2,000엔)에서 교차로 내려다보는 야경은 도쿄에서 손꼽히는 야경이에요. 미리 예약하지 않으면 저녁 시간대는 꽉 찰 수 있으니까 공식 사이트에서 예약하고 가세요.
                </p>
                <p>
                  에비스는 시부야에서 야마노테선으로 한 정거장이에요. 에비스 가든 플레이스 쪽은 조용하고 세련된 분위기라서 시부야의 번잡함에 지쳤을 때 잠깐 쉬어가기 좋아요. 저녁 식사는 에비스 주변 이자카야에서 해결해도 좋습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 3 — 신주쿠 온종일</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  신주쿠는 하루로도 부족한 동네예요. 동쪽과 서쪽이 완전히 다른 얼굴이거든요. 서쪽 신주쿠는 도청이 있는 고층 빌딩 지대라 관광객들이 많이 찾고, 동쪽 신주쿠는 가부키초·골든가이·이자카야 거리가 있어서 밤에 더 빛을 발해요.
                </p>
                <p>
                  오전엔 신주쿠 도청 전망대(무료)를 추천해요. 오전 9시에 문 열고 보통 주말엔 기다림이 있지만, 날씨 좋은 날 후지산 보이는 경우도 있어요. 물론 그건 운이에요. 무료라는 게 최대 장점이고 도쿄 스카이트리(2,100엔)나 시부야 스카이보다 부담 없이 갈 수 있어요.
                </p>
                <p>
                  점심은 신주쿠 다카시마야 지하 식품관이나 이세탄 백화점 지하를 탐방하는 걸 추천해요. 진짜 도쿄 사람들이 일상에서 뭘 먹는지 볼 수 있거든요. 고급 도시락(오베토)이 2,000~3,500엔인데, 내용물은 충분히 그 값 해요.
                </p>
                <p>
                  오후엔 신주쿠 교엔(입장료 500엔)에서 한 시간 정도 쉬어가는 것도 좋아요. 도심 한복판에 있는 넓은 공원인데, 봄 벚꽃 시즌엔 사람이 엄청 많지만 다른 계절엔 한적하게 산책할 수 있어요. 이동 지치는 날 중간에 앉아서 쉬기 딱 좋은 곳이에요.
                </p>
                <p>
                  저녁은 가부키초 골목이나 오모이데 요코초(사진 찍히는 좁은 골목 이자카야 거리)에서 맥주 한 잔 하면서 마무리하세요. 오모이데 요코초의 야키토리 꼬치 한 개가 150~200엔, 생맥주 500ml가 600~800엔이에요. 연기 자욱한 분위기가 일본 술자리 감성이 뭔지 확실히 느끼게 해줘요.
                </p>
              </div>
            </section>

            <div className="bg-indigo-50 rounded-xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-1">4박 5일 일정, Voyalogue로 관리해보세요</p>
              <p className="text-sm text-gray-500 mb-3">Day별로 카드를 만들고 맛집·명소 링크를 저장해두면 여행 중에 찾아보기 훨씬 편해요. 동행자가 있으면 같은 일정을 공유해서 같이 편집할 수도 있습니다.</p>
              <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
                도쿄 일정 무료로 만들기
              </Link>
            </div>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 4 — 도쿄 근교 선택: 닛코 or 요코하마 or 가마쿠라</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <p>
                  넷째 날은 도쿄 시내에서 벗어나 근교로 나가는 날이에요. 세 곳 중 하나를 선택하는데, 각각 성격이 달라요. 본인 취향에 맞게 고르세요.
                </p>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1.5 text-sm">닛코 — 화려한 신사 건축을 보고 싶다면</h3>
                  <p>
                    도쿄 아사쿠사에서 도부 닛코선 특급을 타면 약 2시간, 편도 2,720엔이에요. 도쇼궁 신사의 황금빛 장식은 일본에서 이렇게 화려한 곳이 있나 싶을 정도예요. 닛코는 단풍 시즌(10월 중순~11월 초)에 특히 아름다워요. 단, 시내에서 거리가 있어서 왕복 4시간 이상 이동 시간이 소요됩니다. 느긋하게 보고 싶다면 1박도 고려할 만해요.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1.5 text-sm">요코하마 — 차이나타운과 항구를 보고 싶다면</h3>
                  <p>
                    신주쿠에서 JR 특급으로 약 40분, 편도 800엔 내외로 갈 수 있어요. 근교 중에 이동이 제일 편합니다. 미나토미라이 지구의 야경이 유명하고, 차이나타운에서 점심 먹고 산책하기 좋아요. 도쿄 빽빽한 번화가에서 잠깐 빠져나와 항구 분위기 즐기고 싶을 때 딱 맞는 선택이에요.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1.5 text-sm">가마쿠라 — 거대 불상과 바다를 보고 싶다면</h3>
                  <p>
                    신주쿠에서 쇼난 신주쿠 라인으로 약 1시간, 편도 940엔이에요. 높이 13.35m의 가마쿠라 대불(고토쿠인 대불, 입장료 300엔)은 야외에 있어서 사진이 잘 나오고, 에노시마 쪽으로 이동하면 바다도 볼 수 있어요. 여름엔 가마쿠라 해변 분위기가 좋고, 봄·가을에 하이킹 코스를 걷기에도 딱이에요.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 5 — 롯폰기, 긴자, 귀국</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  마지막 날 오전은 롯폰기에서 시작하세요. 롯폰기 힐스 모리 타워 전망대(스카이데크, 2,000엔)는 360도 야외 전망대라 날씨 좋은 날 후지산이 보이기도 해요. 롯폰기 미술관(모리 미술관)도 같은 건물 52층에 있는데 현대미술 전시가 수시로 바뀌니까 관심 있으면 체크해보세요.
                </p>
                <p>
                  점심은 긴자로 이동해서 먹으세요. 긴자는 도쿄에서 손꼽히는 고급 쇼핑 거리이지만, 1,000~1,500엔대 런치 메뉴를 내놓는 가게들도 많아요. 긴자 이토야 문구점은 문구에 관심 없어도 들어가서 구경할 만한 공간이에요. 6~7층 규모의 문구 전문점인데 인테리어도 예쁘고 선물용 물건 사기에도 좋습니다.
                </p>
                <p>
                  공항으로는 여유 있게 출발하세요. 나리타 공항은 도심에서 멀어서 신주쿠에서 출발하면 N'EX로 1시간 30분, 케이세이 스카이라이너로도 1시간이 넘게 걸려요. 체크인 마감 2시간 전에 공항에 있으려면 시내 출발을 꽤 일찍 잡아야 합니다. 하네다 공항은 훨씬 가까워서(도심에서 30~40분), 하네다 발착 항공편을 이용하면 마지막 날 더 느긋하게 즐길 수 있어요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">도쿄에서 꼭 먹어야 할 음식</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  도쿄는 음식으로 유명한 도시인데, 선택지가 너무 많아서 오히려 고르기 어려운 곳이기도 해요. 몇 가지만 짚어드릴게요.
                </p>
                <ul className="flex flex-col gap-2.5 ml-2">
                  <li>
                    <strong className="text-gray-800">스시</strong> — 쓰키지 외부 시장(내부 시장은 이전)에서 파는 서서 먹는 스시가 1접시 200~400엔이에요. 오전 6~7시에 가야 줄이 짧은 편이고, 가게마다 신선도와 가격이 달라요. 고급 오마카세는 시작가가 보통 15,000엔 이상이라 예산 여유가 없으면 회전 스시(쿠라 스시, 스시로)도 충분히 맛있어요.
                  </li>
                  <li>
                    <strong className="text-gray-800">라멘</strong> — 도쿄 라멘은 간장 베이스 쇼유 라멘이 정통이지만, 요즘은 돈코츠, 미소, 시오 등 다양한 스타일의 가게들이 많아요. 한 그릇 900~1,400엔이 보통이고, 런치 타임에는 교자(군만두) 세트로 1,300~1,600엔 정도 해요.
                  </li>
                  <li>
                    <strong className="text-gray-800">규카츠(牛カツ)</strong> — 돈카츠의 소고기 버전이라고 보면 돼요. 겉은 튀기고 속은 레어로 먹는 방식인데, 도쿄에서 유독 인기 있는 메뉴예요. 1인분에 1,500~2,200엔 수준이에요. 신주쿠나 시부야 근처에 전문점이 여럿 있어요.
                  </li>
                  <li>
                    <strong className="text-gray-800">모츠나베(もつ鍋)</strong> — 내장 전골 요리인데, 처음엔 거부감이 있을 수 있는데 먹어보면 진짜 맛있어요. 진한 간장이나 된장 육수에 내장과 채소를 넣고 끓이는 방식이에요. 이자카야에서 1인분 1,400~1,800엔 수준이고, 맥주 한 잔이랑 같이 먹으면 시너지가 나요.
                  </li>
                  <li>
                    <strong className="text-gray-800">편의점 음식</strong> — 무시하면 안 돼요. 세븐일레븐 오니기리(110~160엔), 훼미리마트 프라이드치킨(200엔 내외), 로손 크리미 슈크림이 아침 식사나 간식으로 진짜 훌륭해요. 끼니 하나를 편의점으로 해결하면 식비를 크게 아낄 수 있어요.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">교통 — 스이카 카드 한 장으로 다 됩니다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  스이카(Suica)는 도쿄의 기본 교통 카드예요. JR, 지하철, 버스, 편의점, 자판기 어디서나 써요. 도착하면 공항 자동판매기에서 500엔 보증금 포함 2,000엔짜리를 발급받으면 돼요. 스마트폰에 애플 월렛이나 구글 월렛이 있으면 모바일 스이카로 발급받는 게 더 편해요.
                </p>
                <p>
                  도쿄 지하철 노선도는 처음에 복잡해 보이지만, 실제로는 구글 맵이 전부 알려줘요. 어디서 타서 어디서 환승하고 몇 번 출구로 나오는지까지 다 나오기 때문에, 지하철 타는 건 생각보다 어렵지 않아요. 다만 환승 때 역 안에서 걸어야 하는 거리가 꽤 긴 곳도 있어서, 환승역에서 배낭 메고 걷다 보면 체력 소모가 있어요.
                </p>
                <p>
                  기본 운임은 1구간 178엔(지하철 기준)부터 시작이에요. 도심 내 이동은 대부분 200~300엔 수준이고, 나리타 공항처럼 먼 거리는 1,000엔 이상 나와요. 하루에 여러 곳을 이동하면 교통비만 1,500~2,500엔 나오는 날도 있으니 예산에 포함해두세요.
                </p>
                <p>
                  택시는 기본 요금이 500엔인데, 서울보다 비싸고 도심 정체가 심할 때는 요금이 빠르게 올라가요. 짧은 거리는 지하철 타는 게 낫습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">예산은 이렇게 잡으세요</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: '항공권 (왕복, 인천 출발)', value: '20~45만 원' },
                    { label: '숙소 (4박, 1인 기준)', value: '20~50만 원' },
                    { label: '교통비 (공항 포함, 4박 5일)', value: '약 15,000~20,000엔' },
                    { label: '식비 (1일 기준)', value: '3,000~6,000엔/일' },
                    { label: '입장료·야경 전망대 등', value: '5,000~10,000엔 (전체)' },
                    { label: '쇼핑·기념품', value: '개인 차이 크지만 10,000엔 이상 예비' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500 mb-0.5">{i.label}</p>
                      <p className="font-bold text-gray-800 text-sm">{i.value}</p>
                    </div>
                  ))}
                </div>
                <p>
                  총 예산은 숙소 선택과 쇼핑 여부에 따라 편차가 커요. 게스트하우스에서 자면서 편의점을 적극 활용하면 항공 포함 50만 원대도 가능해요. 비즈니스 호텔에서 자고 음식 제대로 먹으면 항공 포함 100만 원 이상 잡는 게 현실적이에요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">한 번 더 — 도쿄 여행에서 많이 놓치는 것들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  도쿄 처음 간 사람들이 공통적으로 나중에 아쉬워하는 게 몇 가지 있어요. 첫째는 "일정을 너무 많이 넣었다"는 거예요. 도쿄는 걷다 보면 골목 하나에도 재밌는 게 많은 도시라, 리스트에 없던 가게에 들어가고 싶고 길에서 뭔가를 먹고 싶어지는데 일정이 빡빡하면 그걸 못해요. 하루에 두 동네 정도가 적당해요.
                </p>
                <p>
                  둘째는 야경을 안 본 거예요. 도쿄는 낮도 좋지만 야경이 정말 아름다운 도시예요. 시부야 스카이, 롯폰기 스카이데크, 신주쿠 도청 무료 전망대 중 하나는 꼭 가보세요. 날씨 좋은 맑은 날 야경은 진짜 잊기 어렵습니다.
                </p>
                <p>
                  셋째는 돈을 무조건 아끼려 한 거예요. 도쿄에서 규카츠 한 번, 오마카세 회전 스시 한 번, 야경 전망대 한 번은 돈을 쓰는 게 나아요. 이 경험값은 여행비 전체에서 차지하는 비중이 크지 않은데 기억에 남는 시간이 돼요.
                </p>
                <p>
                  그리고 여행 정보를 너무 많이 찾는 것도 오히려 해가 될 수 있어요. 블로그 20개 읽고 유튜브 10개 보다 보면 오히려 뭘 선택해야 할지 헷갈려요. 일정의 큰 틀만 잡고, 나머지는 현지에서 느끼면서 결정하는 게 훨씬 즐거운 여행이 됩니다.
                </p>
              </div>
            </section>

          </div>
        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/osaka-travel', label: '오사카 3박 4일 코스' },
            { href: '/guide/japan-travel', label: '일본 여행 완벽 가이드' },
            { href: '/guide/travel-budget-tips', label: '여행 예산 절약 팁' },
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
