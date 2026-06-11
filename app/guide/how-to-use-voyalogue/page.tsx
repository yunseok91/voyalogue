import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Voyalogue 사용 가이드 | 여행 일정 만들기부터 정산까지',
  description: 'Voyalogue 완전 사용 가이드. 회원가입, 여행 일정 생성, AI 플래너, 친구 초대, 항공·숙소 등록, 예산 정산까지 단계별로 안내합니다.',
}

const STEPS = [
  {
    step: '01',
    title: '회원가입 & 로그인',
    desc: 'Google 계정으로 3초 만에 가입할 수 있습니다. 별도 회원가입 양식이나 비밀번호 설정이 필요 없습니다. 로그인 상태는 브라우저에 유지되어 다음 방문 시 자동 로그인됩니다.',
    tip: '여러 구글 계정을 사용 중이라면 로그인 시 계정 선택 화면에서 원하는 계정을 선택하세요.',
  },
  {
    step: '02',
    title: '새 여행 만들기',
    desc: '로그인 후 여행 목록 화면에서 "+ 새 여행" 버튼을 눌러 여행을 생성합니다. 도시명, 여행 기간, 인원, 예산, 통화 등 기본 정보를 입력하면 날짜별 일정표가 자동으로 생성됩니다.',
    tip: '도시를 입력할 때 구체적인 도시명(예: 도쿄, 오사카)을 입력하면 더 정확한 AI 추천을 받을 수 있습니다.',
  },
  {
    step: '03',
    title: 'AI로 일정 자동 생성하기',
    desc: '여행을 만든 후 "AI 일정 생성" 버튼을 누르면 목적지와 기간에 맞는 날짜별 코스를 자동으로 작성해드립니다. 생성된 일정은 자유롭게 수정할 수 있습니다.',
    tip: '여행 스타일(맛집 투어, 액티비티 중심, 쇼핑 등)을 함께 입력하면 더 맞춤화된 일정을 추천받을 수 있습니다.',
  },
  {
    step: '04',
    title: '날짜별 일정 편집하기',
    desc: '각 날짜 탭을 선택해 장소, 식당, 액티비티를 추가할 수 있습니다. 항목마다 메모, 예약 링크, 이동 시간을 기록할 수 있으며, 드래그로 순서를 변경할 수 있습니다.',
    tip: '장소 검색은 구글 맵과 연동되어 있어 정확한 위치와 정보를 바로 확인할 수 있습니다.',
  },
  {
    step: '05',
    title: '항공권 & 숙소 등록하기',
    desc: '일정 상단의 "항공편" 및 "숙소" 탭에서 예약한 항공권과 숙소 정보를 등록할 수 있습니다. 금액을 입력하면 여행 정산에 자동으로 반영됩니다.',
    tip: '"정산에 포함" 옵션을 켜면 해당 비용이 최종 1인당 비용 계산에 포함됩니다.',
  },
  {
    step: '06',
    title: '친구 초대하기',
    desc: '"멤버 초대" 버튼을 눌러 초대 링크를 생성한 뒤 카카오톡이나 문자로 공유하세요. 링크를 받은 친구가 클릭하면 멤버로 자동 합류되어 일정을 함께 편집할 수 있습니다.',
    tip: '보기 전용 공유 링크를 별도로 발급하면 멤버가 아닌 사람에게도 일정을 공유할 수 있습니다.',
  },
  {
    step: '07',
    title: '환율 & 예산 관리',
    desc: '여행 통화를 설정하면 실시간 환율이 자동으로 적용됩니다. 날짜별로 다른 환율을 직접 입력해 설정하는 것도 가능합니다. 예산 항목별로 지출을 기록하면 전체 소비 현황을 한눈에 확인할 수 있습니다.',
    tip: '현지에서 환전한 환율이 있다면 직접 입력해 더 정확한 정산을 할 수 있습니다.',
  },
  {
    step: '08',
    title: '여행 정산하기',
    desc: '여행 후 "정산" 버튼을 누르면 항공권, 숙소, 날짜별 지출 내역을 합산해 1인당 금액을 자동으로 계산합니다. 금액 내역을 캡처해 멤버들에게 공유하세요.',
    tip: '총무 역할을 맡은 멤버는 정산 화면에서 직접 금액을 확인하고 관리할 수 있습니다.',
  },
]

export default function HowToUseVoyaloguePage() {
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
            <span className="text-4xl block mb-4">📱</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {['사용법', '튜토리얼', '가이드', '기능'].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{t}</span>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Voyalogue 완전 사용 가이드
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              회원가입부터 여행 정산까지 Voyalogue의 모든 기능을 단계별로 안내합니다. 처음 사용하시는 분도 5분이면 기본 기능을 모두 익힐 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {STEPS.map(s => (
              <div key={s.step} className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{s.step}</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-sm font-bold text-gray-900 mb-2">{s.title}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-2">{s.desc}</p>
                  <div className="flex items-start gap-1.5 bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-blue-500 text-xs flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-xs text-blue-700 leading-relaxed">{s.tip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-8">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">총무 기능 — 여행 정산이 이렇게 편해진다</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여럿이 여행하면 돈 정산이 제일 번거롭다. 누가 얼마 냈는지, 항공권은 어떻게 나누는지, 현지에서 쓴 돈은 어떻게 합산하는지 — 이걸 엑셀로 하거나 카카오톡으로 공유하면 금방 복잡해진다. Voyalogue의 총무 기능은 이 과정을 많이 단순하게 만들어준다.</p>
                <p><strong className="text-gray-800">총무 지정 방법:</strong> 여행 멤버 목록에서 총무 역할을 맡을 사람에게 총무 권한을 부여하면 된다. 총무는 지출 내역을 직접 입력하고 수정할 수 있다. 총무 뽑기 기능(폭탄 돌리기, 달리기 레이스, 투표 등 미니게임 방식)으로 재미있게 총무를 정할 수도 있다.</p>
                <p><strong className="text-gray-800">정산 방식:</strong> 날짜별로 지출을 입력하면 1인당 금액이 자동으로 계산된다. 항공권이나 숙소 같은 고정 비용도 정산에 포함시킬 수 있고, 특정 멤버만 참여한 항목(일부가 가지 않은 투어 등)은 참여자만 분담하도록 설정할 수 있다. 해외 여행이라면 날짜별 환율을 직접 설정해 더 정확하게 계산할 수 있다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">여행 리포트 — 다녀온 여행을 정리하는 방법</h2>
              <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
                <p>여행을 다녀오고 나면 어떤 하루가 제일 좋았는지, 어디서 얼마를 썼는지 기억이 희미해진다. 여행 중 별점을 남겨두면 여행 리포트에서 이걸 정리해서 볼 수 있다.</p>
                <p><strong className="text-gray-800">별점 남기기:</strong> 일정 항목마다 별점(1~5점)을 남길 수 있다. 함께 여행한 멤버들도 각자 별점을 남기면 평균 별점으로 표시된다. 나중에 리포트에서 베스트 장소 순위를 볼 수 있다.</p>
                <p><strong className="text-gray-800">여행 리포트 내용:</strong> 총 지출 및 1인당 지출, 카테고리별(식사·관광·교통·쇼핑) 지출 비율, 날짜별 지출 그래프, 방문한 장소 별점 순위, 날짜별 하이라이트 등이 자동으로 정리된다. 여행 후 공유하기에도 좋다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">자주 묻는 질문</h2>
              <div className="flex flex-col gap-5">
                {[
                  { q: '멤버가 직접 일정을 편집할 수 있나요?', a: '초대 링크 방식에 따라 다릅니다. 편집 권한이 있는 링크로 합류한 멤버는 일정을 직접 수정할 수 있어요. 보기 전용 링크로 합류하면 조회만 가능합니다.' },
                  { q: '여행 중에 스마트폰으로 바로 쓸 수 있나요?', a: '네, 모바일 브라우저에 최적화되어 있어 앱 설치 없이도 스마트폰에서 편리하게 사용할 수 있습니다. 홈 화면에 추가해두면 앱처럼 빠르게 접근할 수 있어요.' },
                  { q: '여러 여행을 동시에 관리할 수 있나요?', a: '가능합니다. 여행 목록에서 여러 개의 여행을 만들어 각각 관리할 수 있어요. 과거 여행도 기록으로 남겨두고 나중에 다시 볼 수 있습니다.' },
                  { q: '인터넷이 없을 때도 일정을 볼 수 있나요?', a: '현재는 인터넷 연결이 필요합니다. 해외에서는 유심이나 포켓 와이파이를 이용해 연결을 유지하는 것을 권장해요.' },
                  { q: 'Voyalogue는 무료인가요?', a: '베타 기간 동안 모든 기능을 무료로 사용할 수 있습니다. Google 계정만 있으면 바로 시작할 수 있어요.' },
                ].map(item => (
                  <div key={item.q} className="border border-gray-100 rounded-xl px-5 py-4">
                    <p className="text-sm font-bold text-gray-900 mb-1.5">Q. {item.q}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">A. {item.a}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 bg-blue-50 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">지금 바로 시작해보세요</p>
            <p className="text-sm text-gray-500 mb-3">Google 계정만 있으면 무료로 시작할 수 있습니다. 첫 여행 일정을 AI로 자동 생성해보세요.</p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[14px] text-sm transition-colors">
              무료로 시작하기
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: '/guide/japan-travel', label: '🇯🇵 일본 여행 가이드' },
            { href: '/guide/travel-budget-tips', label: '💰 예산 절약 팁' },
            { href: '/guide/travel-packing', label: '🧳 짐 싸는 법' },
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
