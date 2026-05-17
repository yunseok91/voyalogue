import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '이용약관 | Voyalogue',
  description: 'Voyalogue 이용약관 — 서비스 이용 조건, 이용자 의무, 저작권 및 면책 사항을 안내합니다.',
}

const SECTIONS = [
  {
    title: '제1조 (목적)',
    content: `이 약관은 Voyalogue(이하 "회사")가 운영하는 여행 일정 관리 서비스(이하 "서비스")를 이용함에 있어 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: '제2조 (정의)',
    content: `이 약관에서 사용하는 용어의 정의는 다음과 같습니다.

① "서비스"란 회사가 제공하는 여행 일정 계획·관리, 멤버 초대·공유, 지도 연동, 환율 계산 등 일체의 서비스를 말합니다.
② "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
③ "회원"란 회사와 이용 계약을 체결하고 이용자 아이디(ID)를 부여받은 자로서, 회사의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수 있는 자를 말합니다.`,
  },
  {
    title: '제3조 (약관의 명시와 개정)',
    content: `① 회사는 이 약관의 내용과 상호 및 대표자 성명, 영업소 소재지, 연락처(전화번호, 이메일 주소 등), 서비스 이용 약관을 이용자가 알 수 있도록 서비스 초기 화면에 게시합니다.

② 회사는 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」, 「개인정보 보호법」 등 관련 법령을 위배하지 않는 범위 내에서 이 약관을 개정할 수 있습니다.

③ 회사가 약관을 개정할 경우에는 적용 일자 및 개정 사유를 명시하여 현행 약관과 함께 서비스 내 공지사항에 게시하여 이용자에게 공지합니다.`,
  },
  {
    title: '제4조 (서비스의 제공)',
    content: `① 회사는 다음과 같은 서비스를 제공합니다.
  - 여행 일정 생성 및 관리 서비스
  - 일정 멤버 초대 및 공유 서비스
  - Google 지도 연동 장소 검색 서비스
  - 실시간 환율 정보 조회 서비스
  - 여행 관련 컬렉션(국가/도시) 관리 서비스
  - 기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스

② 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 정기 점검·시스템 업그레이드·장애 등의 경우 서비스 제공이 일시 중단될 수 있습니다.

③ 현재 서비스는 베타(BETA) 버전으로, 기능 및 UI가 사전 고지 없이 변경될 수 있습니다.`,
  },
  {
    title: '제5조 (회원 가입)',
    content: `① 이용자는 회사가 정한 가입 양식에 따라 회원 정보를 기입한 후 이 약관에 동의한다는 의사 표시를 함으로써 회원 가입을 신청합니다.

② 본 서비스는 Google 소셜 로그인을 통해 가입할 수 있으며, Google 계정 정보(이름, 이메일, 프로필 사진)가 서비스에 연동됩니다.

③ 회사는 다음 각 호에 해당하는 회원 가입 신청에 대해서는 승낙을 하지 않거나 사후에 이용 계약을 해지할 수 있습니다.
  - 가입 신청자가 이 약관에 의하여 이전에 회원 자격을 상실한 적이 있는 경우
  - 타인의 명의를 이용하여 신청한 경우
  - 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우
  - 기타 회원으로 등록하는 것이 서비스 운영상 현저히 지장이 있다고 판단되는 경우`,
  },
  {
    title: '제6조 (이용자의 의무)',
    content: `이용자는 다음 행위를 하여서는 안 됩니다.

① 타인의 정보 도용
② 회사가 게시한 정보의 변경
③ 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시
④ 회사 또는 제3자의 저작권 등 지식재산권에 대한 침해
⑤ 회사 또는 제3자의 명예를 손상시키거나 업무를 방해하는 행위
⑥ 외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위
⑦ 상업적 목적의 무단 스팸 발송 또는 서비스 어뷰징
⑧ 기타 불법적이거나 부당한 행위`,
  },
  {
    title: '제7조 (저작권의 귀속 및 이용 제한)',
    content: `① 회사가 작성한 저작물에 대한 저작권 기타 지식재산권은 회사에 귀속합니다.

② 이용자는 서비스를 이용하여 얻은 정보 중 회사에게 지식재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 전송, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.

③ 이용자가 서비스 내에 작성한 여행 일정, 댓글 등 콘텐츠에 대한 저작권은 해당 이용자에게 귀속됩니다.`,
  },
  {
    title: '제8조 (광고 게재)',
    content: `① 회사는 서비스의 운영과 관련하여 서비스 내에 광고를 게재할 수 있습니다.

② 회사는 Google AdSense를 통해 맞춤형 광고를 제공할 수 있으며, 광고는 이용자의 관심사에 기반하여 표시될 수 있습니다.

③ 이용자는 서비스에 포함된 광고를 통해 광고주의 사이트에 이동할 수 있으며, 이 경우 해당 사이트의 이용 약관 및 개인정보처리방침이 적용됩니다.`,
  },
  {
    title: '제9조 (면책 조항)',
    content: `① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.

② 회사는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대하여는 책임을 지지 않습니다.

③ 회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에 대하여 책임을 지지 않습니다.

④ 회사는 이용자가 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.

⑤ 본 서비스는 베타 버전으로 운영 중이며, 예고 없이 기능이 변경되거나 서비스가 중단될 수 있습니다.`,
  },
  {
    title: '제10조 (준거법 및 재판 관할)',
    content: `① 회사와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법원을 관할 법원으로 합니다.

② 회사와 이용자 간 제기된 소송에는 대한민국 법을 적용합니다.`,
  },
  {
    title: '부칙',
    content: `이 약관은 2026년 1월 1일부터 적용됩니다.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>
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
            이용약관
          </h1>
          <p className="text-sm text-gray-400 mb-10">최종 수정일: 2026년 1월 1일 | 시행일: 2026년 1월 1일</p>

          <div className="flex flex-col gap-10">
            {SECTIONS.map(s => (
              <section key={s.title}>
                <h2 className="text-base font-bold text-gray-900 mb-3">{s.title}</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link href="/privacy" className="text-sm text-blue-600 hover:underline">개인정보처리방침 보기 →</Link>
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
