import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '여럿이 함께하는 여행 일정 짜기 | 의견 충돌 없이 계획 세우는 법',
  description: '단체 여행 일정 짜다 보면 의견 충돌이 생기기 마련이에요. 여럿이 함께 일정을 만들 때 실제로 도움이 되는 방법들을 정리했습니다.',
}

export default function GroupTravelPlanningPage() {
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
              {['단체여행', '일정계획', '공유', '여행준비'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              여럿이 함께하는 여행 일정 짜기 — 싸우지 않고 계획 세우는 법
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              4명이 여행을 간다고 하면, 사실 일정 짜는 것 자체가 하나의 프로젝트입니다. 누군가는 미술관을 가고 싶고, 누군가는 해변에서 쉬고 싶고, 누군가는 맛집 투어를 하고 싶고, 또 누군가는 일정을 빡빡하게 채우는 걸 싫어하죠. 출발 전부터 의견 충돌이 생기는 이유가 여기에 있습니다. 어떻게 하면 모두가 납득하는 일정을 만들 수 있을까요?
            </p>
          </div>

          <div className="flex flex-col gap-10">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">단체 여행 일정이 어려운 진짜 이유</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>혼자 여행할 때는 "오늘 어디 갈까?"가 5분 만에 결정됩니다. 하지만 4명이 있으면 그 결정이 40분이 걸리기도 해요. 저마다 원하는 게 다르고, 그 다름을 조율하는 과정 자체가 에너지를 씁니다.</p>
                <p>여기에 또 하나의 문제가 있어요. 여행에서는 리더십이 자연스럽게 생기는데, 대부분 말 잘하고 적극적인 한 사람이 일정을 주도하게 됩니다. 나머지는 따라가면서 속으로 "나는 저기 가고 싶었는데"라는 감정을 쌓아요. 여행이 끝나고 "그때 나 하고 싶은 거 못 했잖아"라는 말이 나오는 이유예요.</p>
                <p>구조적으로 이 문제를 해결하려면, 처음부터 모두가 의견을 낼 수 있는 프로세스를 만드는 게 중요합니다. 카리스마 있는 한 사람이 결정하는 방식은 단기적으로는 빠르지만, 만족도가 낮아지는 경우가 많아요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">여행 전에 꼭 해야 할 킥오프 미팅</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행 일정 짜기 전에, 딱 한 번만 모두가 함께 합의하는 자리를 만드세요. 카페에서 만나도 되고, 오픈 카카오톡 방에서 텍스트로 해도 됩니다. 여기서 최소한 세 가지는 정해야 해요.</p>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">총 예산 합의</p>
                    <p>1인당 항공+숙소+현지 경비를 대략 얼마 쓸 건지 먼저 맞춰야 합니다. 한 명은 50만 원 예산이고 다른 한 명은 150만 원 예산이면, 같은 여행을 할 수가 없어요. 예산 격차가 크면 취향 차이보다 훨씬 더 크게 충돌합니다.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">여행 스타일 공유</p>
                    <p>아침 일찍 다니는 타입인지, 느지막이 일어나서 여유롭게 보내는 타입인지. 관광지 위주인지, 현지 음식 탐방이 우선인지. 쇼핑이 필수인지, 자연 경관이 중요한지. 이걸 미리 나눠야 일정을 짤 때 실망이 줄어들어요.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">날짜와 기간 확정</p>
                    <p>당연한 것 같지만, 출발일과 귀국일이 한 명이라도 안 맞으면 전체 일정이 틀어집니다. 직장인이 섞여 있으면 휴가 일정이 제각각이라 이 부분이 생각보다 오래 걸려요. 킥오프 때 날짜를 확정 짓고 넘어가야 이후 계획이 꼬이지 않습니다.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">의견 취합하는 방법 — 구글 폼과 카카오톡 투표</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>모두의 의견을 공평하게 듣고 싶을 때, 가장 간단한 방법은 구글 폼을 하나 만드는 겁니다. "가고 싶은 도시 3개 골라봐", "하루에 몇 개 장소가 적당해?", "식사 예산은 1끼 기준 얼마?", "자유 시간이 꼭 필요해?" 같은 항목을 설문으로 만들어서 링크를 공유하면, 모두가 눈치 안 보고 자기 의견을 낼 수 있어요.</p>
                <p>카카오톡 투표 기능도 빠르게 쓰기 좋습니다. "숙소 위치: A 지역 vs B 지역", "3일째 오전 일정: 미술관 vs 시장 탐방 vs 휴식" 같은 선택지를 투표로 올리면 채팅 중에 바로 결정됩니다. 별도 앱을 열 필요도 없어서 참여율이 높아요.</p>
                <p>중요한 건, 취합한 의견을 바탕으로 초안 일정을 만들고 다시 공유해서 "이 정도면 괜찮아?"라고 한 번 더 확인하는 과정을 거치는 겁니다. 처음부터 완벽한 일정을 만들 필요는 없어요. 피드백을 반영해서 조금씩 수정하는 게 훨씬 자연스럽습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">공유 문서 vs 여행 앱 — 어느 쪽이 나을까</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>일정을 공유하는 도구 두 가지를 비교해볼게요.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">구글 시트 / 노션</p>
                    <ul className="text-xs flex flex-col gap-1 text-gray-600">
                      <li>+ 자유도 높음, 원하는 형식대로 만들 수 있음</li>
                      <li>+ 모두가 계정 없이도 편집 가능</li>
                      <li>- 여행 중에 휴대폰으로 보기 불편함</li>
                      <li>- 지도 연동, 알림 기능 없음</li>
                      <li>- 템플릿부터 만들어야 해서 처음 세팅이 번거로움</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">여행 일정 앱</p>
                    <ul className="text-xs flex flex-col gap-1 text-gray-600">
                      <li>+ 모바일 최적화, 여행 중 쓰기 편함</li>
                      <li>+ 지도 연동, 이동 경로 확인 가능</li>
                      <li>+ 실시간 공유, 수정 알림</li>
                      <li>- 앱 설치 및 가입이 필요함</li>
                      <li>- 자유도가 낮을 수 있음</li>
                    </ul>
                  </div>
                </div>
                <p>여행 준비 초반(일정 초안 잡기)에는 구글 시트나 노션이 편하고, 실제 여행 중에는 앱이 훨씬 유용합니다. 두 가지를 같이 쓰는 경우도 많아요. 중요한 건 팀원 모두가 같은 도구를 쓰는 것이지, 어떤 도구인지가 중요한 게 아니에요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">역할 분담 — 방장, 총무, 숙소 담당</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>단체 여행에서 역할을 나누면 준비가 훨씬 빨라집니다. 아무도 맡지 않으면 아무것도 안 되는 반면, 역할이 분배되면 각자 자기 영역에 집중할 수 있어요.</p>
                <p><strong className="text-gray-800">방장(일정 담당):</strong> 전체 일정 초안을 만들고, 의견을 취합하고, 최종 일정을 확정합니다. 여행 중 갑작스러운 변경도 방장이 조율해요. 적극적이고 꼼꼼한 사람이 맡으면 좋습니다.</p>
                <p><strong className="text-gray-800">총무(돈 담당):</strong> 공동 지출을 관리하고 정산합니다. 여행 중 금전 흐름을 기록해야 해서 책임감 있는 사람이 필요해요.</p>
                <p><strong className="text-gray-800">숙소 담당:</strong> 숙소 후보 조사, 예약, 체크인 정보 공유를 담당합니다. 숙소 입지나 시설에 관심 있는 사람이 맡으면 자연스럽습니다.</p>
                <p>역할이 없는 나머지 멤버들도 각자 관심 있는 맛집이나 명소 리스트 하나씩 가져오는 것도 좋은 방법이에요. 참여감이 생기고 "내 의견이 반영됐다"는 만족감이 높아집니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">일정 유연하게 짜는 팁 — 자유시간 꼭 넣기</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>단체 여행에서 가장 흔한 실수가 일정을 너무 빡빡하게 짜는 겁니다. "오전 10시 미술관, 오후 1시 점심, 오후 3시 시장, 오후 5시 카페…" 이렇게 짜면 한 군데에서 조금만 늦어도 전체 일정이 밀려요. 그리고 누군가 지치거나 따로 뭔가 사고 싶어도 일정에 쫓겨서 못하게 됩니다.</p>
                <p>하루 일정에 최소 1~2시간은 자유 시간으로 비워두세요. "오후 4시~6시는 각자 자유"처럼 명시해두면 그 시간에 쇼핑을 하든, 카페에서 쉬든, 다시 원하는 곳에 가든 각자 하고 싶은 걸 할 수 있습니다. 여행 만족도가 올라가는 결정적인 포인트예요.</p>
                <p>식사 장소도 너무 미리 정해두지 않는 게 좋아요. 점심 맛집 1~2개 정도 후보를 정해두되, 당일 상황에 따라 유연하게 바꿀 수 있도록 해두는 게 훨씬 낫습니다. 현지에서 우연히 발견한 좋은 음식점을 놓치는 것만큼 아쉬운 게 없어요.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">갑작스러운 변경에 대처하는 법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>아무리 완벽하게 일정을 짜도, 여행 중에는 예상치 못한 일이 생깁니다. 비가 와서 야외 일정이 취소되거나, 맛집이 문을 닫았거나, 누군가 몸이 안 좋거나. 이때 단체여행에서 가장 중요한 건 빠른 의사결정입니다.</p>
                <p>변경이 생기면 모두가 볼 수 있는 곳에 바로 공지하는 게 첫 번째예요. "비 와서 루프탑 카페 취소, 대신 실내 마켓 가는 건 어때?" 같은 식으로 대안을 같이 제시하면 결정이 빨라집니다. 대안 없이 "어떻게 할까?"만 물으면 의견이 분산돼서 결정이 느려져요.</p>
                <p>여행 일정을 앱으로 공유하면 이 부분이 훨씬 쉬워집니다. 방장이 앱에서 일정을 수정하면 팀원 모두가 동시에 업데이트된 일정을 볼 수 있거든요. 카톡으로 긴 문자를 보내거나 변경 내용을 설명하는 수고가 줄어듭니다. Voyalogue 공유 일정 기능이 이걸 잘 지원해요. 한 명이 수정하면 공유된 모두한테 반영되고, 여행 중에 실시간으로 "지금 우리 어디 있어?", "다음 목적지 어디야?" 확인이 됩니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">여행 중 실시간 공유의 중요성</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>4~5명이 함께 여행을 가다 보면, 잠깐 따로 움직이는 상황이 생깁니다. 쇼핑을 더 하고 싶은 사람, 먼저 숙소로 가고 싶은 사람, 근처 카페를 찾고 싶은 사람. 이럴 때 서로 어디 있는지, 몇 시에 다시 만나는지 카톡으로 계속 물어보는 게 꽤 번거로워요.</p>
                <p>여행 일정을 공유 앱으로 관리하면, 모두가 같은 일정을 보면서 다음 집결지와 시간을 파악할 수 있습니다. "우리 공유 일정에서 다음 장소 확인해"라는 말 한마디로 해결이 돼요.</p>
                <p>또 여행 중 사진이나 메모를 공유 일정에 남기면, 나중에 여행 후기를 쓰거나 다음 여행 계획을 잡을 때 참고가 됩니다. "그때 거기 맛있었잖아, 다음에 또 가자"가 단순한 기억이 아니라 기록으로 남아있는 거죠. 함께 여행한 순간들이 더 오래 남습니다.</p>
              </div>
            </section>

            <div className="mt-4 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-1">Voyalogue로 단체 여행 일정 공유하기</p>
              <p className="text-sm text-gray-500 mb-3">여행 일정을 만들고, 팀원들과 실시간으로 공유하고, 중간에 바뀌어도 모두가 바로 확인할 수 있어요. 공유 일정과 총무 기능을 무료로 사용해보세요.</p>
              <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
                무료로 일정 만들기
              </Link>
            </div>

          </div>
        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/group-travel-settlement', label: '단체여행 돈 정산 방법' },
            { href: '/guide/travel-budget-tips', label: '예산 절약 팁' },
            { href: '/guide/japan-travel', label: '일본 여행 가이드' },
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
