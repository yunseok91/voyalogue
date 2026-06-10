import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '다낭 3박 4일 여행 코스 | 바다부터 호이안까지 알차게',
  description: '다낭 3박 4일 실전 여행 코스. 미케비치, 바나힐, 호이안 올드타운, 오행산까지. 처음 다낭 가는 분들을 위한 현실적인 일정 가이드.',
}

export default function DanangTravelPage() {
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
              {['다낭', '베트남', '동남아', '해변여행', '3박4일'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
              다낭 3박 4일 여행 코스 — 바다부터 호이안까지 알차게 돌아보는 법
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              다낭을 처음 가는 분들이 제일 많이 하는 실수가 뭔지 아세요? 너무 많이 넣는 거예요. 바나힐에 호이안에 미케비치에 오행산에 다 하루에 욱여넣으려다가 결국 이동만 하다 지쳐서 돌아오는 경우가 꽤 많아요. 저도 첫 다낭 여행이 딱 그랬거든요. 그래서 이번엔 실제로 여유 있게 다녀온 일정을 바탕으로 정리해봤습니다. 무리 없이, 그러면서도 주요 스팟은 다 챙기는 3박 4일 코스예요.
            </p>
          </div>

          <div className="flex flex-col gap-10 text-sm text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">다낭 여행 적기 — 건기 vs 우기 솔직하게</h2>
              <p className="mb-3">
                다낭은 크게 건기(2월~8월)와 우기(9월~1월)로 나뉘어요. 한국 여행자들에게 제일 인기 있는 시즌은 3월~5월인데, 이 시기가 습도도 낮고 맑은 날이 많아서 바다를 즐기기 딱 좋아요. 기온은 낮에 30도 안팎인데 그늘에 있으면 생각보다 견딜 만해요.
              </p>
              <p className="mb-3">
                여름 성수기인 6월~8월은 한국 여름 방학이랑 겹쳐서 항공권 값이 확 올라요. 기온은 35도를 넘기도 하고 강한 뙤약볕이 내리쬐니까 낮 시간대 야외 관광은 좀 힘들 수 있어요. 대신 바다 수온이 따뜻해서 물놀이하기엔 좋고요.
              </p>
              <p className="mb-3">
                솔직히 말하면 우기라고 못 가는 건 아니에요. 10월~11월은 비가 자주 내리는 편이라 야외 일정이 자주 틀어지긴 하는데, 항공권이랑 숙소 가격이 꽤 저렴해지거든요. 호이안 등불 축제를 보고 싶다면 매달 음력 14일에 열리니까 날짜 맞춰 가는 것도 좋아요. 단, 10~11월은 태풍 시즌이기도 하니까 여행자보험은 꼭 챙기세요.
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
                <li><strong className="text-gray-800">베스트 시즌:</strong> 3월~5월 (선선하고 맑음, 항공권은 적당한 편)</li>
                <li><strong className="text-gray-800">여름 성수기:</strong> 6월~8월 (더움, 항공 비쌈, 물놀이엔 최적)</li>
                <li><strong className="text-gray-800">우기:</strong> 9월~1월 (비 잦음, 가격 저렴, 태풍 주의)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 1 — 미케비치, 한시장, 마담란</h2>
              <p className="mb-3">
                인천에서 다낭까지 직항으로 4시간 30분 정도 걸려요. 오전 비행기 타면 현지시각 낮 12~1시쯤 도착하는 경우가 많아서 첫날부터 움직일 시간이 충분해요. 베트남은 한국보다 2시간 느리니까 시차 적응도 어렵지 않아요.
              </p>
              <p className="mb-3">
                공항에서 숙소 체크인하고 첫 번째로 향할 곳은 <strong className="text-gray-800">미케비치(My Khe Beach)</strong>예요. 다낭 시내에서 그랩 타면 10~15분이면 닿아요. 요금은 3~4만 동(약 180~240원) 수준이고요. 미케비치는 모래가 정말 곱고 바다가 얕아서 수영하기 좋은데, 파도가 생각보다 세요. 물 안에 들어가실 분들은 파도 방향 잘 보고 들어가세요. 제가 처음 갔을 때 뒤에서 파도 맞고 넘어진 적 있거든요.
              </p>
              <p className="mb-3">
                해변에서 선베드 빌리면 보통 5만~10만 동이에요. 음료 한 잔 시키면 공짜로 쓸 수 있는 데도 많으니까 눈치껏 협상해보세요. 해질 무렵까지 바다 즐기다가 저녁은 <strong className="text-gray-800">한시장(Han Market)</strong> 근처로 이동하는 게 좋아요.
              </p>
              <p className="mb-3">
                한시장은 다낭 구시가지에 있는 전통 시장인데, 주로 여행자들이 많이 찾아요. 망고, 용과, 코코넛 같은 과일도 저렴하고 기념품도 많아요. 시장 안이 좀 덥고 어수선하긴 한데 그게 또 시장 분위기잖아요.
              </p>
              <p className="mb-3">
                저녁은 근처에 있는 <strong className="text-gray-800">마담란(Madam Lan)</strong>을 추천해요. 다낭에서 유명한 베트남 음식점인데 메뉴 가짓수가 엄청 많아요. 분보(Bun Bo, 쇠고기 쌀국수)를 시켰는데 가격도 7만 동(약 4천 원)에 양도 푸짐했어요. 관광지 음식점치고는 바가지 없는 편이에요. 저녁 7시 이후엔 웨이팅이 좀 생기니까 조금 이르게 가는 게 좋아요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 2 — 바나힐 케이블카, 황금교</h2>
              <p className="mb-3">
                2일차는 하루 종일 <strong className="text-gray-800">바나힐(Ba Na Hills)</strong>에서 보내는 게 좋아요. 다낭 시내에서 약 40분 거리인데, 그랩으로 편도 15만~20만 동 정도 해요. 대신 입장권이 꽤 비싸요. 성인 기준 80만 동(약 4만 7천 원) 정도인데, 케이블카 포함이에요.
              </p>
              <p className="mb-3">
                바나힐은 프랑스 식민지 시대에 지어진 리조트를 테마파크 형식으로 개발한 곳이에요. 고도가 약 1,400m라서 산 아래와 온도 차가 많이 나요. 저 갔을 때 아래는 33도인데 위에 올라가니까 22도였어요. 가디건이나 얇은 긴팔 하나 챙겨 가세요.
              </p>
              <p className="mb-3">
                제일 유명한 건 역시 <strong className="text-gray-800">황금교(Golden Bridge)</strong>예요. 거대한 두 손이 다리를 받치고 있는 독특한 구조물인데, SNS에서 많이 봤을 거예요. 실제로 보면 확실히 임팩트 있어요. 다만 사람이 어마어마하게 많아서 대기 줄이 길 수 있어요. 아침 일찍 케이블카 타고 올라가서 황금교 먼저 가는 걸 추천해요.
              </p>
              <p className="mb-3">
                바나힐 안에 레스토랑이나 뷔페가 있는데 솔직히 맛은 평범하고 가격은 비싸요. 미리 간식이나 샌드위치 챙겨 가는 게 나아요. 내려오는 건 케이블카 말고도 알파인 코스터라는 소형 썰매 같은 걸 탈 수 있는데, 어린이들이랑 함께라면 재밌어요. 하루 꽉 채워도 시간이 빠듯할 정도로 볼 게 많아요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 3 — 호이안 당일치기, 올드타운, 등불</h2>
              <p className="mb-3">
                3일차는 호이안 당일치기예요. 다낭에서 호이안까지는 약 30km 거리인데, 그랩으로 30~40분, 비용은 15만~20만 동 정도예요. 택시도 있는데 그랩이 훨씬 저렴하고 편리해요.
              </p>
              <p className="mb-3">
                <strong className="text-gray-800">호이안 올드타운(Hoi An Ancient Town)</strong>은 유네스코 세계문화유산으로 등재된 곳이에요. 입장료가 있는데 12만 동(약 7천 원)에 패키지 티켓 형식이에요. 올드타운 내 지정 관람지 5곳을 선택해서 들어갈 수 있어요. 일본 다리(내원교), 호이안 박물관, 풍흥 고가 등이 주요 스팟이에요.
              </p>
              <p className="mb-3">
                낮에는 고즈넉한 분위기에서 돌아다니다가 저녁에 등불이 켜지면 완전히 다른 동네처럼 변해요. 강변에 형형색색 등불이 가득 켜지는데, 직접 보면 진짜 예뻐요. 사진도 엄청 잘 나와요. 등불 하나 5천 동에서 1만 동에 구입해서 강물에 띄워 보내는 것도 할 수 있어요.
              </p>
              <p className="mb-3">
                호이안 음식도 꼭 먹어봐야 해요. 현지 쌀국수 격인 <strong className="text-gray-800">까오러우(Cao Lau)</strong>가 호이안 특산이에요. 어딜 가도 5만~7만 동 정도예요. 올드타운 안 골목 깊숙이 들어가면 현지인 식당이 있어서 더 싸게 먹을 수 있어요. 관광지 바로 앞은 좀 비싸고요.
              </p>
              <p className="mb-3">
                밤늦게 다낭으로 돌아올 때도 그랩 잘 잡혀요. 다만 밤 10시 넘으면 차가 좀 적어질 수 있으니까 너무 늦지 않게 복귀하는 게 좋아요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Day 4 — 오행산, 용교, 귀국</h2>
              <p className="mb-3">
                마지막 날은 비교적 여유로운 일정이에요. 오전 일찍 <strong className="text-gray-800">오행산(Marble Mountains)</strong>을 다녀오면 돼요. 미케비치 근처에 있어서 해변이랑 묶어서 보는 사람도 많아요. 입장료는 4만 동이고 엘리베이터 이용이 별도로 1만 5천 동이에요.
              </p>
              <p className="mb-3">
                오행산은 다섯 개의 대리석 산인데 그 안에 동굴과 절이 있어요. 계단이 많고 경사가 있어서 운동화 필수예요. 슬리퍼 신고 올라갔다가 고생한 분 봤어요. 꼭대기에서 바라보는 바다 전망이 진짜 시원해요. 올라가는 데 30분, 구경하는 데 1시간 정도 잡으면 충분해요.
              </p>
              <p className="mb-3">
                오행산에서 시내로 돌아오면서 점심 먹고, 오후에는 <strong className="text-gray-800">용교(Dragon Bridge)</strong> 주변 산책해도 좋아요. 낮에는 그냥 평범한 다리처럼 보이는데, 토요일이나 일요일 밤 9시에 불꽃과 물을 내뿜는 쇼가 있어요. 마지막 날이 주말이라면 비행기 시간에 맞춰서 보고 가는 것도 좋아요.
              </p>
              <p className="mb-3">
                다낭 국제공항은 시내에서 가까워서 이동 시간이 10~15분 정도밖에 안 걸려요. 출국 시간 2~3시간 전 도착을 목표로 움직이면 여유롭게 귀국할 수 있어요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">다낭 음식 — 꼭 먹어봐야 할 것들</h2>
              <p className="mb-3">
                다낭 여행에서 음식 빠지면 섭섭하죠. 베트남 음식이 기본적으로 한국인 입맛에 잘 맞는 편이에요.
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-gray-600">
                <li>
                  <strong className="text-gray-800">미꽝(Mi Quang):</strong> 다낭 대표 음식이에요. 강황으로 노랗게 물들인 굵은 면에 고기, 새우, 땅콩, 라임이 올라가요. 국물이 적고 비벼먹는 스타일이라 낯설 수 있는데 먹다 보면 맛있어요. 가격은 3만~5만 동.
                </li>
                <li>
                  <strong className="text-gray-800">반미(Banh Mi):</strong> 베트남식 바게트 샌드위치예요. 고기, 채소, 고수가 들어가는데 고수 못 드시는 분은 주문할 때 "콩 라우(Khong Rau)"라고 말하거나 손짓으로 빼달라고 하면 돼요. 길거리에서 1만 5천~3만 동이면 사 먹을 수 있어요.
                </li>
                <li>
                  <strong className="text-gray-800">반쎄오(Banh Xeo):</strong> 쌀가루 반죽에 새우, 고기, 숙주를 넣고 기름에 부친 거예요. 바삭한 식감이 좋아요. 쌈채소에 싸서 먹는 방식인데, 처음엔 어색해도 해보면 금방 익혀요. 5만~8만 동.
                </li>
                <li>
                  <strong className="text-gray-800">분보(Bun Bo Hue):</strong> 쌀국수인데 매운 육수가 특징이에요. 일반 쌀국수(Pho)보다 국물이 진하고 얼큰해서 한국인 입맛에 잘 맞아요. 5만~7만 동.
                </li>
              </ul>
              <p className="mt-3">
                거리 식당이나 로컬 식당을 이용하면 훨씬 저렴하게 먹을 수 있어요. 해산물 식당은 시장 근처에 모여 있는데 가격 흥정이 가능한 경우도 있어요. 일부 식당은 바가지를 치기도 하니까 주문 전에 가격 확인하는 습관을 들이세요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">교통 — 그랩을 강력 추천하는 이유</h2>
              <p className="mb-3">
                다낭에서는 <strong className="text-gray-800">그랩(Grab)</strong>이 사실상 필수예요. 앱 설치하면 바로 쓸 수 있고, 금액이 미리 표시되니까 바가지 걱정이 없어요. 택시는 기사에 따라 가격이 천차만별이고 미터기 조작하는 경우도 있거든요.
              </p>
              <p className="mb-3">
                시내 이동은 그랩 바이크(GrabBike)가 더 빠르고 저렴해요. 5만~8만 동이면 웬만한 거리는 다 가요. 대신 짐이 많거나 두 명 이상이면 그랩카(GrabCar)를 이용하는 게 좋아요.
              </p>
              <p className="mb-3">
                호이안 같은 원거리 이동은 그랩카로 20만 동 정도인데, 여러 명이 나눠 내면 꽤 저렴해요. 버스도 있긴 한데 노선이 복잡하고 베트남어 정보가 많아서 처음 가는 분들에게는 추천하기 어려워요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">예산 정리 — 환율 1원 = 약 170동 기준</h2>
              <p className="mb-3">
                실제 다낭 3박 4일 기준 예상 비용이에요. 물론 어떻게 먹고 어디 묵느냐에 따라 다르지만 참고용으로 보세요.
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-gray-600">
                <li><strong className="text-gray-800">항공권:</strong> 왕복 25만~50만 원 (시즌에 따라 차이 큼)</li>
                <li><strong className="text-gray-800">숙소:</strong> 하루 5만~15만 원 (다낭 시내 3성급 기준)</li>
                <li><strong className="text-gray-800">식비:</strong> 하루 2만~4만 원 (로컬 식당 위주)</li>
                <li><strong className="text-gray-800">바나힐 입장권:</strong> 약 4만 7천 원</li>
                <li><strong className="text-gray-800">호이안 입장권:</strong> 약 7천 원</li>
                <li><strong className="text-gray-800">교통(그랩 포함):</strong> 하루 1만~3만 원</li>
                <li><strong className="text-gray-800">총 예상 비용:</strong> 항공 포함 3박 4일 1인 기준 50만~80만 원</li>
              </ul>
              <p className="mt-3">
                베트남 동화로 환전할 때 공항 환전소는 환율이 불리해요. 시내 금은방(일명 골든 샵)에서 환전하면 더 좋은 환율로 바꿀 수 있어요. 다낭 공항 밖으로 나와서 한 블록 걸으면 환전소들이 있어요.
              </p>
            </section>

            <section className="bg-blue-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-2">여행 기록은 Voyalogue에</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                다낭 여행 다녀오셨나요? 미케비치 사진, 호이안 등불 사진, 맛집 기록을 <Link href="/" className="text-blue-600 underline">Voyalogue</Link>에 남겨보세요. 날짜별로 정리되고 지도에도 핀이 찍혀서 나중에 봤을 때 추억이 확 살아나요. 링크 공유도 돼서 같이 간 일행과 나눠볼 수 있어요.
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
