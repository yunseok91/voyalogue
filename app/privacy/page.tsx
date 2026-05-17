import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '개인정보처리방침 | Voyalogue',
  description: 'Voyalogue 개인정보처리방침 — 수집하는 정보, 이용 목적, 제3자 제공 및 이용자 권리에 대해 안내합니다.',
}

const SECTIONS = [
  {
    title: '제1조 (개인정보의 처리 목적)',
    content: `Voyalogue(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경될 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

① 회원 가입 및 관리: Google 소셜 로그인을 통한 회원제 서비스 이용에 따른 본인 확인, 개인 식별, 서비스 부정 이용 방지, 각종 고지·통지, 분쟁 조정을 위한 기록 보존
② 서비스 제공: 여행 일정 관리, 멤버 초대·공유, 환율 정보 제공 등 핵심 서비스 제공
③ 서비스 개선 및 통계: 접속 빈도 파악, 이용자 서비스 이용에 관한 통계 분석`,
  },
  {
    title: '제2조 (처리하는 개인정보의 항목)',
    content: `회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.

① 필수 수집 항목 (Google 로그인 시 자동 제공)
  - 이름(닉네임), 이메일 주소, 프로필 사진 URL
  - Google 계정 고유 식별자(UID)

② 서비스 이용 과정에서 자동 생성·수집되는 정보
  - 여행 일정 데이터(도시, 날짜, 장소, 예산, 멤버 목록)
  - 서비스 이용 기록, 접속 로그, 쿠키, IP 주소
  - 기기 정보(브라우저 종류, OS)

③ 광고 서비스 관련 (Google AdSense)
  - 광고 성과 측정을 위한 쿠키 및 유사 기술 (제4조 참조)`,
  },
  {
    title: '제3조 (개인정보의 처리 및 보유 기간)',
    content: `① 회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.

② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
  - 회원 가입·관리 목적: 회원 탈퇴 시까지 (단, 법령에서 별도 기간을 정한 경우 그에 따름)
  - 서비스 이용 기록: 서비스 이용 후 3년
  - 전자상거래 관련 기록: 5년 (전자상거래법 제6조)

③ 회원이 탈퇴를 요청하는 경우, 지체 없이 개인정보를 파기합니다.`,
  },
  {
    title: '제4조 (Google AdSense 및 제3자 광고)',
    content: `회사는 Google AdSense를 통해 광고를 게재합니다. 이와 관련하여 다음 사항을 고지합니다.

① Google은 본 사이트에서 광고를 게재하기 위해 쿠키를 사용합니다.
② Google은 해당 쿠키를 통해 이전에 본 사이트 또는 인터넷상의 다른 사이트를 방문한 사용자에게 광고를 게재합니다.
③ 이용자는 Google 광고 설정(https://adssettings.google.com)에서 개인 맞춤 광고를 비활성화할 수 있습니다.
④ Google 개인정보 보호 정책 전문은 https://policies.google.com/privacy 에서 확인할 수 있습니다.
⑤ 쿠키 사용을 원하지 않는 이용자는 웹 브라우저의 설정을 변경하여 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.`,
  },
  {
    title: '제5조 (개인정보의 제3자 제공)',
    content: `① 회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.

  - 이용자들이 사전에 동의한 경우
  - 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우

② 본 서비스는 다음 제3자 서비스를 이용합니다.
  - Firebase (Google): 인증, 데이터베이스, 스토리지 서비스 제공
  - Google Maps Platform: 지도 및 장소 검색 서비스 제공
  - Google AdSense: 광고 서비스 제공`,
  },
  {
    title: '제6조 (개인정보처리의 위탁)',
    content: `회사는 서비스 향상을 위해서 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.

| 수탁업체 | 위탁업무 |
| Google LLC (Firebase) | 회원 인증, 데이터 저장 및 관리 |
| Google LLC (Google Maps) | 지도 및 장소 검색 |

위탁 계약 시 개인정보 보호법 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고 있습니다.`,
  },
  {
    title: '제7조 (이용자의 권리·의무 및 행사 방법)',
    content: `① 이용자는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
  - 개인정보 열람 요구
  - 오류 등이 있을 경우 정정 요구
  - 삭제 요구
  - 처리 정지 요구

② 권리 행사는 contact@voyalogue.com 으로 서면, 전화, 이메일을 통해 요청하시면 지체 없이 조치하겠습니다.

③ 이용자가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.`,
  },
  {
    title: '제8조 (개인정보의 파기)',
    content: `① 회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.

② 이용자로부터 동의 받은 개인정보 보유 기간이 경과하거나 처리 목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관 장소를 달리하여 보존합니다.

③ 개인정보 파기의 절차 및 방법은 다음과 같습니다.
  - 파기 절차: 파기 사유가 발생한 개인정보를 선정하고 개인정보 보호 책임자의 승인을 받아 파기합니다.
  - 파기 방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기합니다.`,
  },
  {
    title: '제9조 (개인정보의 안전성 확보 조치)',
    content: `회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.

① 관리적 조치: 내부 관리 계획 수립·시행, 최소 인원 접근 권한 부여
② 기술적 조치: 개인정보처리 시스템(Firebase) 등의 접근 권한 관리, SSL 암호화 통신, 보안프로그램 설치
③ 물리적 조치: Google Cloud의 데이터센터 물리적 보안 시스템 활용`,
  },
  {
    title: '제10조 (개인정보 보호 책임자)',
    content: `회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.

개인정보 보호 책임자
  - 이메일: contact@voyalogue.com
  - 처리 시간: 평일 10:00 ~ 18:00

이용자는 회사의 서비스(또는 사업)을 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호 책임자에게 문의하실 수 있습니다. 회사는 이용자의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.`,
  },
  {
    title: '제11조 (개인정보 처리방침의 변경)',
    content: `① 이 개인정보처리방침은 2026년 1월 1일부터 적용됩니다.

② 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600" />
            <span className="font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 홈으로</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            개인정보처리방침
          </h1>
          <p className="text-sm text-gray-400 mb-10">최종 수정일: 2026년 1월 1일 | 시행일: 2026년 1월 1일</p>

          <p className="text-sm text-gray-600 leading-relaxed mb-10 p-4 bg-blue-50 rounded-xl border border-blue-100">
            Voyalogue(이하 &quot;회사&quot;)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>

          <div className="flex flex-col gap-10">
            {SECTIONS.map(s => (
              <section key={s.title}>
                <h2 className="text-base font-bold text-gray-900 mb-3">{s.title}</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link href="/terms" className="text-sm text-blue-600 hover:underline">이용약관 보기 →</Link>
            <Link href="/contact" className="text-sm text-blue-600 hover:underline">문의하기 →</Link>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        © 2026 Voyalogue. All rights reserved.
      </footer>
    </div>
  )
}
