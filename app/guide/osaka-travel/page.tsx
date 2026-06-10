import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '오사카 3박 4일 여행 코스 | 처음 가도 헤매지 않는 일정 짜기',
  description: '오사카 3박 4일 여행 코스, 도톤보리부터 유니버설, 교토 당일치기까지. 처음 오사카 가는 사람도 바로 따라할 수 있는 실전 일정입니다.',
}

export default function OsakaTravelPage() {
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
              {['오사카', '일본', '3박4일', '관서'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
              오사카 3박 4일 여행 코스 — 처음 가도 헤매지 않는 실전 일정
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              오사카는 처음 일본 여행을 계획하는 분들한테 정말 적합한 도시예요. 규모가 도쿄보다 작아서 이동이 쉽고, 음식이 맛있고, 교토·나라·고베도 당일로 갔다 올 수 있거든요. 저는 처음 갔을 때 막막했던 기억이 있어서, 그 경험을 바탕으로 3박 4일 일정을 최대한 실용적으로 정리해봤습니다. 완벽한 일정이란 없지만, 적어도 어디서 뭘 먹어야 할지 모르겠다는 느낌은 없앨 수 있을 거예요.
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">언제 가는 게 좋을까요?</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  솔직히 말하면 오사카는 여름(7~8월)에 가면 진짜 힘들어요. 습도가 높고 체감온도가 40도 가까이 올라가는 날도 있어서, 걸어다니는 관광이 많은 오사카 특성상 체력 소모가 장난이 아닙니다. 일정 반도 소화 못하고 숙소로 돌아오는 경우도 생겨요.
                </p>
                <p>
                  가장 좋은 시기는 봄(3월 말~4월 초)이에요. 벚꽃 시즌에 오사카성 공원이나 교토 철학의 길을 걸으면 왜 일본 여행을 봄에 오는지 바로 이해가 돼요. 단, 이 시기에는 숙소 값이 평소보다 1.5~2배 뛰니까 최소 두 달 전에는 잡아야 합니다.
                </p>
                <p>
                  가을(10월~11월 중순)도 나쁘지 않아요. 단풍은 교토 쪽이 압도적이지만 오사카 내에서도 구경거리가 많고, 날씨가 선선해서 하루에 많이 걷기 좋습니다. 여름·봄을 피하고 싶다면 가을이 현실적인 선택이에요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 1 — 도톤보리, 구로몬 시장, 신사이바시</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  첫날은 간사이 국제공항(KIX)에서 입국해서 오사카 시내로 이동하는 것부터 시작이에요. 공항에서 시내까지는 난카이 전철 특급 라피트를 타면 난바까지 약 38분, 요금은 1,450엔입니다. 일반 급행을 타면 요금이 970엔으로 조금 싸지만 시간이 더 걸려요. 시간 여유가 있으면 급행도 나쁘지 않아요.
                </p>
                <p>
                  숙소에 짐을 던지고 나면 바로 도톤보리로 나가세요. 도톤보리는 오사카 여행의 상징 같은 곳인데, 처음엔 간판이 워낙 많아서 눈이 피로하기도 해요. 하지만 강변을 따라 걷다 보면 분위기에 금방 익숙해져요. 낮에도 좋지만 저녁에 네온사인이 켜지면 사진이 훨씬 예쁘게 나옵니다.
                </p>
                <p>
                  저녁 전에 구로몬 시장(쿠로몬 이치바)을 들르는 게 좋아요. 오전 10시부터 오후 5~6시 사이에 운영하는 가게가 많아서 타이밍을 잘 맞춰야 해요. 새벽에 도착해서 저녁에 나온다면 당일은 그냥 도톤보리만 집중하고 시장은 둘째 날 아침 일찍 가는 게 나을 수도 있어요. 시장 안에서 파는 해산물 꼬치나 참치 한 점은 500~800엔 수준이에요.
                </p>
                <p>
                  저녁 식사는 도톤보리 인근 라멘집이나 오코노미야키 가게에서 해결하세요. 신사이바시 쇼핑 거리는 11시까지도 가게들이 열어있어서 저녁에 슬슬 걸어보기 딱 좋아요. 드럭스토어에서 기초 화장품이나 간식 사기에도 좋고요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 2 — 유니버설 스튜디오 재팬(USJ)</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  USJ는 하루 통째로 써야 해요. 반만 넣으면 나중에 아쉽다는 소리 꼭 나옵니다. 입장권(스튜디오 패스 1일권)은 성인 기준 8,900엔인데, 날짜에 따라 9,400엔, 10,400엔까지 올라가니까 공식 사이트에서 미리 확인하세요. 주말이나 연휴는 당연히 더 비쌉니다.
                </p>
                <p>
                  익스프레스 패스는 가격이 5,000엔에서 26,000엔까지 다양한데, 솔직히 비성수기에는 없어도 주요 어트랙션 다 탈 수 있어요. 하지만 해리포터 구역이나 슈퍼 닌텐도 월드는 오픈런을 해야 대기 시간을 줄일 수 있어요. USJ는 오전 9시 개장인데 8시 반 전에 입구에 있어야 입장 줄에서 앞에 설 수 있습니다.
                </p>
                <p>
                  공원 안 식사 가격은 꽤 나와요. 버거 세트 하나에 1,500~2,000엔은 각오해야 하고, 버터비어 한 잔이 600엔입니다. 그래도 이건 경험값이라 생각하면 크게 아깝지는 않더라고요. 공원 밖에서 편의점 도시락 사서 들어가는 것도 가능하니까 예산이 빡빡하면 그렇게 해도 돼요.
                </p>
                <p>
                  USJ에서 나오면 저녁 7~8시가 되는 게 보통이에요. 지쳐서 화려하게 저녁 먹기 힘들 수도 있어요. 숙소 근처 편의점이나 라멘 한 그릇으로 마무리하는 날이에요. 발이 진짜 아파요, 솔직히.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 3 — 교토 당일치기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  오사카에서 교토는 JR 신쾌속 열차로 약 15분, 요금은 590엔입니다. 이 가격에 이 거리면 당일치기 안 가면 손해예요. 오전 8시 전에 오사카 역에서 출발하면 교토에 8시 20분 전후로 도착해서 아침 인파 몰리기 전에 명소에 먼저 들어갈 수 있어요.
                </p>
                <p>
                  후시미이나리 신사는 교토역에서 JR으로 5분 거리인 이나리역 바로 앞에 있어요. 오전 8시 이전에 가면 사람이 훨씬 적고 사진도 잘 나와요. 붉은 도리이 터널을 끝까지 올라가면 1~2시간 걸리는데, 체력이 허락하면 정상까지 가보세요. 중간에 포기하는 사람이 꽤 많기도 해요.
                </p>
                <p>
                  점심 전에 니조 성이나 금각사를 보고, 기온 거리를 오후에 걸으면 하루 일정이 꽤 알차게 돌아가요. 기온에서 마이코(게이샤 수련생)를 마주치는 건 요즘 꽤 어렵지만, 거리 자체가 예쁘니까 사진 찍으면서 천천히 걷기 좋아요.
                </p>
                <p>
                  저녁은 오사카로 돌아와서 드시는 걸 추천해요. 교토는 음식이 오사카보다 비싸고 양이 적은 편이거든요. 오사카로 돌아와서 도톤보리 야경 보면서 쿠시카츠 먹는 게 여행 만족도가 훨씬 높아요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Day 4 — 덴덴타운, 오사카성, 귀국</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  마지막 날은 비행기 시간에 따라 다르지만, 오후 중반 이후 출발이라면 오전 시간을 알차게 쓸 수 있어요. 저는 마지막 날 오전에 덴덴타운을 갔는데, 일본 서브컬처에 관심 없어도 가게 구경 자체가 재밌더라고요. 피규어, 레트로 게임 기기, 각종 전자기기가 좁은 골목에 빼곡하게 들어차 있어요.
                </p>
                <p>
                  덴덴타운에서 오사카성까지는 지하철로 15분 정도 거리예요. 오사카성 천수각 입장료는 600엔인데, 성 내부 전시보다는 성 주변 공원이 더 인상적이에요. 봄에 벚꽃 필 때 이 공원은 진짜 아름다워요. 시간이 촉박하면 성 바깥에서 사진만 찍고 공항으로 이동해도 충분합니다.
                </p>
                <p>
                  공항으로 이동할 때는 체크인 마감 2시간 전에는 공항에 도착해야 해요. 성수기엔 공항도 사람이 많아서 수속에 시간이 더 걸려요. 간사이 공항 면세점은 규모가 있으니 귀국 전 쇼핑을 거기서 마무리하셔도 됩니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">오사카에서 꼭 먹어야 할 음식들</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  오사카를 "먹는 도시"라고 부르는 데는 이유가 있어요. 도쿄보다 음식 가격도 저렴한 편이고, 먹거리 종류도 다양합니다.
                </p>
                <ul className="flex flex-col gap-2 ml-2">
                  <li>
                    <strong className="text-gray-800">타코야키</strong> — 도톤보리에만 줄 선 타코야키 집이 수십 개예요. 8개 한 판에 보통 500~600엔입니다. 겉은 바삭, 속은 촉촉하게 익은 상태에서 가쓰오부시가 얹혀 나오는데, 유명한 가게보다 줄 없는 골목 안 가게가 더 맛있을 때도 많아요.
                  </li>
                  <li>
                    <strong className="text-gray-800">오코노미야키</strong> — 오사카식과 히로시마식이 다른데, 오사카에서는 당연히 오사카식으로 먹어야죠. 철판 위에서 직접 굽는 방식으로 운영되는 가게들이 많아요. 1인분에 900~1,400엔 정도이고, 양도 꽤 됩니다. 점심으로 먹으면 저녁까지 배 안 고플 수 있어요.
                  </li>
                  <li>
                    <strong className="text-gray-800">쿠시카츠(串カツ)</strong> — 다양한 재료를 꼬치에 꿰어 튀긴 음식인데, 오사카에서는 소스에 두 번 찍는 게 금기예요. 가게에서 거의 필수로 그 안내가 붙어 있어요. 한 꼬치에 100~200엔 수준이라 부담 없이 여러 개 먹기 좋아요. 신세카이 지역이 쿠시카츠 본거지예요.
                  </li>
                  <li>
                    <strong className="text-gray-800">스시 & 사시미</strong> — 구로몬 시장에서 파는 싱싱한 해산물 한 점짜리 사시미가 생각보다 가격이 착해요. 고급 오마카세는 1인 20,000~50,000엔대지만, 서서 먹는 스시 가게(立ち食い寿司)는 1접시 100~200엔부터 시작합니다.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">교통 팁 — 이코카 카드 하나면 OK</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  오사카에서 이동할 때 이코카(ICOCA) 카드가 있으면 거의 모든 교통 수단을 해결할 수 있어요. JR 서일본 계열의 IC 카드인데, 오사카 지하철(오사카 메트로), JR 노선, 간사이 공항 열차, 편의점 결제까지 다 됩니다. 공항 도착하자마자 자동판매기에서 2,000엔 보증금 포함 2,000엔어치 충전해서 뽑는 게 제일 편해요.
                </p>
                <p>
                  스이카(Suica)나 파스모(PASMO) 카드도 오사카에서 사용 가능하지만, 발급은 도쿄 기준이라 오사카에서 처음 시작한다면 이코카가 더 자연스러워요. 어차피 교환성이 좋아서 어느 쪽이든 크게 상관없긴 합니다.
                </p>
                <p>
                  오사카를 오래 머물 예정이면 오사카 주유패스(1일권 2,800엔, 2일권 3,600엔)도 고려해볼 만해요. 오사카 내 관광지 무료 입장 + 지하철 무제한이라 관광지 여러 개를 하루에 몰아다닐 때 효율이 나와요. 단, 숙소에서 멀리 나가는 교토 당일치기 날에는 해당되지 않으니 잘 계산해서 쓰세요.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">예산 현실적으로 잡는 법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
                <p>예산은 항상 "생각보다 더 써요". 그 점을 감안하고 잡으세요.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: '항공권 (왕복, 인천 출발)', value: '20~40만 원' },
                    { label: '숙소 (3박, 1인 기준)', value: '15~30만 원' },
                    { label: 'USJ 1일권', value: '약 8,900엔 (~9만 원)' },
                    { label: '교토 당일치기 교통·입장', value: '약 3,000~5,000엔' },
                    { label: '식비 (1일 3끼 + 간식)', value: '3,000~5,000엔/일' },
                    { label: '이코카 카드 충전', value: '10,000엔 이상 권장' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500 mb-0.5">{i.label}</p>
                      <p className="font-bold text-gray-800 text-sm">{i.value}</p>
                    </div>
                  ))}
                </div>
                <p>
                  신칸센을 타고 도쿄에서 오사카로 이동할 경우 노조미 기준 편도 13,750엔이에요. 오사카만 갈 거라면 비행기가 더 경제적이지만, 도쿄+오사카 복합 일정이면 신칸센도 고려해볼 만합니다. JR패스(7일권 50,000엔 내외)와 단순 편도 요금을 비교해서 결정하세요.
                </p>
              </div>
            </section>

            <div className="mt-4 bg-blue-50 rounded-xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 오사카 일정 한눈에 정리하기</p>
              <p className="text-sm text-gray-500 mb-3">Day별로 일정 카드를 만들고, 숙소·교통·음식 정보를 한 곳에 모아두면 여행 중 스마트폰 여러 앱 왔다갔다할 필요 없어요. 같이 여행하는 친구랑 실시간 공유도 됩니다.</p>
              <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
                무료로 오사카 일정 만들기
              </Link>
            </div>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">마지막으로 — 솔직한 조언 몇 가지</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>
                  오사카는 걷는 양이 많아요. 하루 15,000~20,000보 걷는 날도 흔해요. 출발 전에 편한 신발을 꼭 챙기세요. 예쁜 운동화보다 발 편한 운동화가 훨씬 나아요. 이건 진짜 경험에서 나온 말이에요.
                </p>
                <p>
                  일본은 현금 없이 다니기 어려운 상황이 아직 꽤 있어요. 오사카도 카드 안 되는 가게가 있고, 특히 시장 안 작은 가게들은 현금만 받는 곳도 많아요. 최소 20,000엔은 현금으로 갖고 다니는 게 안전해요. 공항 ATM보다 시내 세븐일레븐 ATM이 한국 카드 호환이 잘 됩니다.
                </p>
                <p>
                  포켓 와이파이나 유심은 꼭 준비하세요. 구글 맵 없이 오사카 다니는 건 꽤 어렵거든요. 특히 지하철 환승이나 버스 정류장 찾을 때 실시간 인터넷이 없으면 시간 낭비가 심해져요. 한국에서 미리 예약하면 공항에서 바로 수령 가능합니다.
                </p>
                <p>
                  그리고 USJ는 번화가에서 거리가 좀 있어요. 오전 8시 30분에 입장 줄에 서려면 숙소에서 7시 40분 정도에는 나와야 해요. 전날 일찍 자는 게 중요한 날이에요.
                </p>
              </div>
            </section>

          </div>
        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/tokyo-travel', label: '도쿄 4박 5일 코스' },
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
