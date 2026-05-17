import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Globe, Shield, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: '문의하기 | Voyalogue',
  description: 'Voyalogue 서비스에 대한 문의, 피드백, 버그 신고는 이 페이지를 통해 연락해 주세요.',
}

const FAQS = [
  {
    q: 'Voyalogue는 어떤 서비스인가요?',
    a: 'Voyalogue는 여행 일정을 쉽고 빠르게 계획할 수 있는 무료 여행 플래너 서비스입니다. 날짜별 일정 관리, 구글 지도 연동, 실시간 환율 확인, 친구 초대 공유까지 하나의 플랫폼에서 이용하실 수 있습니다.',
  },
  {
    q: '서비스 이용 비용이 있나요?',
    a: '기본 서비스는 완전 무료입니다. 현재 베타 서비스 기간으로 모든 기능을 무료로 이용하실 수 있습니다.',
  },
  {
    q: '데이터가 안전하게 보관되나요?',
    a: '모든 데이터는 Google Firebase를 통해 암호화되어 안전하게 보관됩니다. 개인정보처리방침에 따라 목적 외 사용은 절대 하지 않습니다.',
  },
  {
    q: '초대 링크를 받았는데 접속이 안 돼요.',
    a: '초대 링크는 Google 계정으로 로그인 후 이용하실 수 있습니다. 로그인 후 다시 링크에 접속해 주세요. 문제가 지속된다면 contact@voyalogue.com으로 문의해 주세요.',
  },
  {
    q: '광고를 보고 싶지 않아요.',
    a: '광고 없는 버전은 추후 소액 결제(500원)로 영구 이용 가능할 예정입니다. 현재 베타 기간에는 Google AdSense 광고가 표시될 수 있습니다.',
  },
]

export default function ContactPage() {
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">

        {/* 소개 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Voyalogue 소개 & 문의
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Voyalogue는 여행을 더 즐겁게 만들기 위한 스마트 여행 플래너 서비스입니다. 복잡한 일정 관리, 친구와의 공유, 예산 계산까지 하나의 앱으로 해결해 드립니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-5 flex flex-col gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <p className="font-bold text-gray-900 text-sm">스마트 여행 플래너</p>
              <p className="text-xs text-gray-500 leading-relaxed">드래그 앤 드롭 일정 관리, 구글 지도 연동, 실시간 환율 제공</p>
            </div>
            <div className="bg-green-50 rounded-xl p-5 flex flex-col gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <p className="font-bold text-gray-900 text-sm">안전한 데이터 보호</p>
              <p className="text-xs text-gray-500 leading-relaxed">Google Firebase 기반, SSL 암호화, 목적 외 정보 사용 없음</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-5 flex flex-col gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <p className="font-bold text-gray-900 text-sm">무료 베타 서비스</p>
              <p className="text-xs text-gray-500 leading-relaxed">현재 베타 기간 중 모든 기능 무료 제공</p>
            </div>
          </div>

          {/* 연락처 */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-4">연락처</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">이메일 문의</p>
                <a href="mailto:contact@voyalogue.com" className="text-sm font-semibold text-blue-600 hover:underline">
                  contact@voyalogue.com
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              평일 10:00 ~ 18:00 (주말·공휴일 제외, 보통 1~2일 내 답변)
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            자주 묻는 질문
          </h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="py-5 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-gray-900 mb-1.5">Q. {q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">A. {a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 링크 */}
        <div className="flex gap-4 text-sm">
          <Link href="/privacy" className="text-blue-600 hover:underline">개인정보처리방침</Link>
          <Link href="/terms" className="text-blue-600 hover:underline">이용약관</Link>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        © 2026 Voyalogue. All rights reserved.
      </footer>
    </div>
  )
}
