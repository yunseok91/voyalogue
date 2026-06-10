import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '제주도 2박 3일 여행 코스 | 렌트카로 동쪽부터 서쪽까지',
  description: '제주도 2박 3일 렌트카 여행 코스. 성산일출봉, 만장굴, 협재해수욕장, 한라산 둘레길. 제주 처음이라도 알차게 돌아볼 수 있는 루트.',
}

export default function JejuTravelPage() {
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
            <span className="text-4xl block mb-4">🍊</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['제주도', '국내여행', '렌트카', '2박3일'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              제주도 2박 3일 렌트카 여행 코스
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              제주를 처음 가는 친구한테 "뭘 먹어야 해, 어디서 자야 해"라고 물으면 열이면 열 다 다른 말을 한다. 그만큼 취향 타는 여행지긴 한데, 그래도 처음 가는 사람 기준에서 크게 실망하지 않을 코스는 어느 정도 정해져 있다. 렌트카 기준으로 2박 3일을 어떻게 짜면 알찬지 직접 다녀온 경험 바탕으로 정리해봤다.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🚗 제주 여행에서 렌트카가 거의 필수인 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>제주 버스가 생각보다 많이 다니긴 한다. 그런데 정류장에서 명소까지 걸어가는 거리가 만만치 않은 곳들이 많고, 배차 간격이 도심 기준으로 30분~1시간씩 나는 경우도 있다. 협재해수욕장 근처 카페에서 한 시간 더 있고 싶어도 다음 버스를 놓치면 발이 묶이는 상황이 생긴다.</p>
                <p>렌트카를 쓰면 이 문제가 싹 해결된다. 동쪽 코스 돌다가 마음에 드는 곳에서 30분 더 머물러도 되고, 갑자기 "저 오름 올라가 보자"는 즉흥 결정도 얼마든지 가능하다. 2박 3일 기준으로 소형차(모닝, 레이 등급) 기준 평일엔 하루 3~4만 원대, 주말엔 5~7만 원대 정도 나온다. 성수기(7~8월, 설·추석 연휴)는 미리 안 잡으면 두 배 이상 올라가기도 하니 최소 한 달 전에는 예약해두는 게 좋다.</p>
                <p>참고로 제주 공항 근처 렌터카 업체들은 셔틀버스로 픽업해주는 방식이라 공항에서 바로 받는 게 아니다. 셔틀 기다리는 시간이 15~30분 정도 걸릴 수 있으니 첫날 일정을 너무 빡빡하게 잡지 않는 게 낫다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📅 Day 1 — 제주 시내 적응하기 (제주시 기준)</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>오전에 도착해서 렌터카 픽업까지 끝내면 보통 점심쯤 된다. 첫날은 무리하게 동쪽이나 서쪽으로 밀고 나가지 말고 제주시 주변을 편하게 돌아보는 게 좋다.</p>
                <p><strong className="text-gray-800">동문재래시장</strong>은 점심 해결하기 좋다. 관광지화된 곳이라 가격이 조금 있긴 한데, 빙떡이나 오메기떡, 고기국수 한 그릇 먹는 재미가 있다. 시장 안이 좁고 붐비니까 주차는 근처 공영주차장에 하는 게 낫다. 시장 내부 주차장은 항상 만차에 가깝다.</p>
                <p><strong className="text-gray-800">용두암</strong>은 솔직히 15분이면 충분하다. 사진 찍고 바다 구경하는 정도. 기대를 너무 크게 하면 실망할 수 있는데, 그냥 제주 바다를 처음 눈에 담는 용도로 가볍게 들르면 된다.</p>
                <p>오후엔 <strong className="text-gray-800">함덕해수욕장</strong>으로 이동하자. 제주시에서 동쪽으로 20분 정도 거리다. 에메랄드빛 물색이 진짜 예쁜 곳인데, 백사장이 넓고 수심도 얕아서 물 무서운 사람도 들어가기 편하다. 주변에 카페도 많아서 저녁 먹기 전 한두 시간 여유 부리기 딱 좋다.</p>
                <p>숙소는 제주시 시내나 함덕 근처에 잡는 게 다음 날 동쪽 코스 이어가기 편하다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📅 Day 2 — 제주 동쪽 핵심 코스</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>둘째 날이 제주 여행의 하이라이트라고 해도 과언이 아니다. 성산일출봉, 섭지코지, 만장굴, 표선해변까지 동쪽 명소를 다 몰아서 돌아볼 수 있다.</p>
                <p><strong className="text-gray-800">성산일출봉</strong>은 아침 일찍 가는 게 무조건 좋다. 오전 9시만 넘어도 주차장이 꽉 차서 한참 기다려야 하는 경우가 많다. 입장료는 어른 기준 2,000원이고, 정상까지 올라가는 데 30분~40분 정도 걸린다. 경사가 생각보다 가파른 편이라 운동화는 기본이고 슬리퍼는 진짜 위험하다. 정상에서 내려다보는 분화구 전망은 사진으로 봐도 압도적인데 실제로 서 있으면 훨씬 더 크게 느껴진다.</p>
                <p><strong className="text-gray-800">섭지코지</strong>는 성산에서 10분 거리다. 바람이 많이 부는 날 걸으면 쉽지 않은데 그 바람이 또 이 곳 분위기를 만들어준다. 코스 끝에 오설록 아모레퍼시픽 건물이 있는데 커피 한 잔 마시기 좋다. 걸어서 왕복 1시간 정도 생각하면 된다.</p>
                <p><strong className="text-gray-800">만장굴</strong>은 세계자연유산으로 등록된 용암동굴이다. 내부 온도가 연중 11~12도로 유지돼서 여름에 가면 에어컨보다 시원하다. 조명도 잘 되어 있고 자녀 동반 여행에도 좋다. 다만 마지막에 돌아나오는 길이 좀 지루하게 느껴질 수 있다. 한 방향만 있어서 왔던 길 되돌아 나와야 한다.</p>
                <p>저녁은 <strong className="text-gray-800">표선해변</strong> 근처에서 해결하거나, 서귀포 쪽으로 내려가는 길에 있는 식당들을 이용해도 된다. 표선해변은 썰물 때 바닥이 넓게 드러나는 게 특이한데, 시간대에 따라 풍경이 완전히 달라진다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">📅 Day 3 — 서귀포·서쪽 해안 돌아서 귀가</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>마지막 날은 서귀포를 거쳐 서쪽으로 돌아서 공항으로 돌아오는 루트다. 비행기 시간이 저녁이라면 여유 있게 움직일 수 있다. 오후 출발이면 협재해수욕장에서 너무 오래 머물지 않도록 시간 체크가 필요하다.</p>
                <p><strong className="text-gray-800">주상절리대</strong>는 서귀포 시내 바로 옆에 있다. 바닷가 절벽에 육각형 돌기둥들이 늘어선 모습이 다른 데서 보기 힘든 풍경이다. 입장료 2,000원이고 걸어서 20~30분 정도면 다 볼 수 있다. 파도가 절벽에 부딪히는 소리가 꽤 웅장하다.</p>
                <p><strong className="text-gray-800">중문해수욕장</strong>은 주상절리 바로 근처라 같이 묶어서 돌면 된다. 파도가 제법 세서 서핑하는 사람들도 많다. 수영보다는 산책이나 사진 찍는 용도로 들르는 편이다.</p>
                <p>서쪽으로 이동하면 나오는 <strong className="text-gray-800">협재해수욕장</strong>이 개인적으로 제주에서 제일 좋았다. 한국 바다 맞나 싶을 만큼 물이 맑고 투명하다. 맞은편에 비양도가 보이는 풍경도 아름답고, 해변 뒤로 카페들이 줄지어 있어서 오후 시간 여유 있게 보내기 좋다. 주차장이 협소해서 성수기엔 뙤약볕에 주차 전쟁이 벌어지니 오전 중에 도착하는 게 낫다.</p>
                <p>협재에서 공항까지 30분 정도 거리다. 렌트카 반납은 연료를 가득 채워서 반납하는 조건이 대부분이니 공항 오기 전에 주유소 들르는 걸 잊지 말자. 공항 바로 앞 주유소는 리터당 100~200원 비싼 경우도 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🍽️ 제주에서 꼭 먹어봐야 할 음식</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">흑돼지:</strong> 제주에 왔으면 흑돼지는 한 번은 먹어야 한다는 말이 있는데, 솔직히 맞는 말이다. 제주 흑돼지는 식감이 일반 삼겹살보다 쫄깃하고 잡내가 적다. 제주시 흑돼지 골목에 유명한 집들이 몰려 있는데 점심엔 웨이팅 없이 들어갈 수 있는 곳도 많다. 1인분에 18,000~22,000원 선.</p>
                <p><strong className="text-gray-800">갈치조림·갈치구이:</strong> 제주산 갈치는 두께부터 다르다. 손가락 굵기 서너 개는 넘는 두툼한 갈치를 제대로 된 양념에 조려주는 곳이 서귀포 쪽에 많다. 2인 기준 25,000원~35,000원 정도인데, 처음 가격 보면 비싸 보여도 한 접시 나오는 양이 상당하다.</p>
                <p><strong className="text-gray-800">고기국수:</strong> 돼지뼈 육수에 두툼한 돼지고기 수육을 얹은 국수다. 아침 해장으로도 좋고 점심 가볍게 먹기도 좋다. 7,000~9,000원 정도로 가격도 합리적인 편이다. 국수 양이 적다 싶으면 소보다 대를 시키면 된다.</p>
                <p><strong className="text-gray-800">해산물:</strong> 제주 도착 첫날이나 마지막 날 시간이 된다면 한림항이나 모슬포항 근처 횟집을 가보는 것도 좋다. 관광지 가격보단 합리적이고 신선도도 좋다. 다만 점심 시간대 장사가 집중되는 편이라 저녁에 가면 일부 메뉴가 소진되어 있을 수도 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🔑 렌트카 예약·보험·주차 팁</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p><strong className="text-gray-800">예약 시기:</strong> 성수기(7~8월, 5월 황금연휴, 추석·설 연휴)엔 2~3달 전 예약이 기본이다. 비성수기 평일은 출발 일주일 전에도 구할 수 있지만 선택폭이 좁아진다. 제주패스, 롯데렌터카, 제주렌터카 등 비교 사이트에서 최저가 검색 후 업체 직접 예약하는 게 조금 더 저렴한 경우가 많다.</p>
                <p><strong className="text-gray-800">보험:</strong> 자차 보험은 반드시 들어야 한다. 제주 도로에 돌멩이가 많아서 차체 긁힘이나 타이어 사이드월 손상이 생각보다 자주 발생한다. 완전자차(슈퍼커버)를 선택하면 본인 부담 없이 처리할 수 있어서 마음이 편하다. 하루 만 원 차이라면 완전자차로 가는 게 낫다.</p>
                <p><strong className="text-gray-800">주차:</strong> 성산일출봉, 협재해수욕장, 한림공원 주변은 성수기에 주차 전쟁이 벌어진다. 이른 시간에 도착하거나, 조금 멀어도 유료 주차장을 활용하는 게 결과적으로 시간 절약이다. 제주 유료 주차장은 대부분 시간당 1,000~1,500원 정도로 저렴하다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🏨 숙소 지역 추천</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>제주 숙소는 위치가 중요하다. 렌트카가 있다고 해도 밤에 피곤하게 한 시간씩 이동하고 싶진 않으니까.</p>
                <p><strong className="text-gray-800">제주시 시내:</strong> 교통이 편하고 편의시설이 많다. 처음 제주 오는 경우 적응하기 편한 베이스캠프 역할을 한다. 공항과 가까워서 출발·도착 날 이동이 편하다.</p>
                <p><strong className="text-gray-800">함덕·조천 쪽:</strong> 동쪽 코스 위주로 여행할 계획이라면 추천. 조용하고 바다 근접 숙소가 많아서 여행 분위기가 확실히 난다.</p>
                <p><strong className="text-gray-800">서귀포 시내:</strong> 남쪽 바다 뷰를 원한다면 서귀포. 이중섭거리, 새연교 야경 등 저녁 즐길 거리도 있다. 단, 제주시 공항에서 1시간 거리라 막히는 날엔 첫날/마지막 날 이동이 부담될 수 있다.</p>
                <p><strong className="text-gray-800">한림·협재 쪽:</strong> 서쪽 바다 뷰 숙소를 원한다면. 한적한 분위기를 원하는 커플에게 추천. 주변에 식당이 많진 않다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">💰 예산 (2박 3일 커플 기준)</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { label: '항공권 (왕복, 2인)', value: '12~30만 원' },
                    { label: '렌트카 (2일 기준)', value: '8~16만 원' },
                    { label: '숙소 (2박)', value: '12~30만 원' },
                    { label: '식비 (3일, 2인)', value: '15~25만 원' },
                    { label: '입장료·기타', value: '3~5만 원' },
                    { label: '총합계 (2인)', value: '50~106만 원' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500 mb-0.5">{i.label}</p>
                      <p className="font-bold text-gray-900">{i.value}</p>
                    </div>
                  ))}
                </div>
                <p>항공권 가격 편차가 크다. 저가항공 특가를 미리 잡으면 1인 왕복 3~4만 원짜리도 나오고, 성수기 주말엔 15만 원이 넘기도 한다. 숙소도 비슷하다. 같은 2박이라도 게스트하우스 도미토리를 쓸지, 바다 뷰 풀빌라를 쓸지에 따라 10배 이상 차이난다. 알뜰하게 다녀오면 2인 기준 50만 원 안팎도 충분히 가능하다.</p>
              </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 제주 여행 일정 만들기</p>
            <p className="text-sm text-gray-500 mb-3">2박 3일 코스를 날짜별로 정리하고 여행 파트너와 실시간으로 공유해보세요. 장소 저장부터 동선 짜기까지 한 번에 됩니다.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 일정 만들기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/travel-exchange-tips', label: '💱 해외여행 환전 가이드' },
            { href: '/guide/cheap-flights', label: '✈️ 항공권 싸게 사는 법' },
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
