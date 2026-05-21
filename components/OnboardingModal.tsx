'use client'

import { useState, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Plus, CheckSquare, Users, Crown, Wallet, Star, Plane, BedDouble } from 'lucide-react'

/* ─────────────────────────────────────────────
   내부 헬퍼
───────────────────────────────────────────── */

function Pin({ n, style }: { n: number; style: React.CSSProperties }) {
  return (
    <div className="absolute z-20 flex items-center gap-1" style={style}>
      <div className="relative flex-shrink-0">
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-60" />
        <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 text-white text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-lg">
          {n}
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 text-white text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </div>
      <div>
        <p className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-snug">{title}</p>
        <p className="text-[11px] sm:text-[12px] text-gray-500 leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   슬라이드 1 — /trips
───────────────────────────────────────────── */
function Slide1() {
  return (
    <div className="relative bg-[#F8FAFC] rounded-xl overflow-hidden border border-gray-200">
      {/* AppNavbar */}
      <nav className="h-11 sm:h-12 bg-white border-b border-gray-200 flex items-center px-3 sm:px-4 justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-600" />
          <span className="font-bold text-sm sm:text-base text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
          <span className="text-[8px] font-bold px-1 py-0.5 bg-blue-100 text-blue-600 rounded-full hidden sm:inline">BETA</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
          <span className="text-blue-600 font-semibold">내 여행</span>
          <span>컬렉션</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-full text-[10px] sm:text-xs font-semibold">
            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">새 여행 만들기</span>
          </div>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">Y</div>
        </div>
      </nav>
      {/* Pin 1 */}
      <Pin n={1} style={{ top: 9, right: 52 }} />

      <div className="px-3 sm:px-4 pt-3 pb-3">
        <h1 className="text-base sm:text-lg font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>내 일정</h1>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">총 3개의 여행 · 13박 계획 중</p>
        <div className="flex gap-1.5 mt-2 mb-2.5">
          {['전체 3','여행중','예정','완료'].map((f, i) => (
            <span key={f} className={`px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold ${i === 0 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>{f}</span>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { title: '오사카 여행', bg: 'linear-gradient(135deg,#6366f1,#4f46e5)', badge: 'D-12', badgeCls: 'bg-blue-50 text-blue-600' },
            { title: '또복이와 첫 해외여행', bg: 'linear-gradient(135deg,#f43f5e,#be123c)', badge: '완료', badgeCls: 'bg-gray-100 text-gray-500' },
            { title: '방콕 배낭여행', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', badge: '여행중', badgeCls: 'bg-green-500 text-white' },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-[52px] sm:h-[60px] p-2 sm:p-2.5 flex flex-col justify-between" style={{ background: t.bg }}>
                <Crown className="w-3 h-3 text-white/70" />
                <p className="text-white font-bold text-[10px] sm:text-[11px] leading-tight">{t.title}</p>
              </div>
              <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] text-gray-500">4박 5일</span>
                <span className={`text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-full ${t.badgeCls}`}>{t.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   슬라이드 2 — /trips/[id]
───────────────────────────────────────────── */
function Slide2() {
  return (
    <div className="relative bg-[#F8FAFC] rounded-xl overflow-hidden border border-gray-200">
      <nav className="bg-white border-b border-gray-200">
        {/* 줄 1 */}
        <div className="h-11 sm:h-12 flex items-center px-3 gap-2">
          <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0">← 내 여행</span>
          <div className="w-px h-3 bg-gray-200 hidden sm:block" />
          <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f43f5e,#be123c)' }} />
            <span className="font-bold text-xs sm:text-sm text-gray-900 truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>또복이와 첫 해외여행</span>
            <span className="flex-shrink-0 flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
              <Crown className="w-1.5 h-1.5 sm:w-2 sm:h-2" />방장
            </span>
          </div>
          {/* 데스크톱 */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 text-[10px] sm:text-xs font-semibold text-gray-600">
              <div className="flex -space-x-1.5">
                {['#6366f1','#f43f5e','#10b981'].map((c,i) => <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full ring-2 ring-white" style={{ background: c }} />)}
              </div>
              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />멤버 편집
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-[10px] sm:text-xs text-gray-600">
              <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />체크리스트
            </div>
            <div className="flex items-center gap-0.5 px-2 sm:px-2.5 py-1 rounded-full bg-gray-900 text-white text-[10px] sm:text-[11px] font-semibold">
              여행 요약<ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
        </div>
        {/* 모바일 줄 2 */}
        <div className="sm:hidden flex items-center justify-between px-3 py-1.5 border-t border-gray-100">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200">
            <div className="flex -space-x-1.5">
              {['#6366f1','#f43f5e'].map((c,i) => <div key={i} className="w-4 h-4 rounded-full ring-1 ring-white" style={{ background: c }} />)}
            </div>
            <span className="text-[9px] text-gray-600 ml-1">3명</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="h-7 px-2.5 flex items-center gap-0.5 rounded-full bg-gray-900 text-white text-[10px] font-semibold">
              요약<ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </nav>

      {/* Pins on navbar */}
      <Pin n={1} style={{ top: 11, right: 172 }} />
      <Pin n={2} style={{ top: 11, right: 80 }} />
      <Pin n={3} style={{ top: 11, right: 4 }} />

      {/* 고정 일정 */}
      <div className="bg-white border-b border-gray-100 px-3 py-2">
        <div className="flex gap-2">
          {[
            { icon: Plane, label: 'ICN→NRT', time: '4/8 09:00', color: 'text-blue-500' },
            { icon: BedDouble, label: 'APA 호텔', time: '4/8~4/12', color: 'text-violet-500' },
          ].map(({ icon: Icon, label, time, color }, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
              <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${color}`} />
              <span className="font-medium">{label}</span>
              <span className="text-gray-400">{time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 날짜 탭 */}
      <div className="flex gap-1.5 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto">
        {['Day 1\n4/8','Day 2\n4/9','Day 3\n4/10','Day 4\n4/11','Day 5\n4/12'].map((d, i) => (
          <div key={i} className={`flex-shrink-0 text-center px-2 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold leading-tight ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {d.split('\n').map((line, j) => <div key={j}>{line}</div>)}
          </div>
        ))}
      </div>

      {/* 아이템 */}
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {[
          { name: '초지한 도쿄 미드타운점', cat: '식사', price: '¥1,200', rating: 4, catCls: 'bg-orange-100 text-orange-600' },
          { name: '시바 공원', cat: '장소', price: '무료', rating: 5, catCls: 'bg-blue-100 text-blue-600' },
          { name: '편의점', cat: '쇼핑', price: '¥500', rating: 3, catCls: 'bg-pink-100 text-pink-600' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 px-2.5 sm:px-3 py-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-full ${item.catCls}`}>{item.cat}</span>
              </div>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-900 mt-0.5 truncate">{item.name}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700">{item.price}</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(v => <Star key={v} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${v <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Pin 4 */}
      <Pin n={4} style={{ bottom: 36, left: 12 }} />

      {/* 예산 푸터 */}
      <div className="bg-white border-t border-gray-100 px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-[9px] sm:text-[10px] text-gray-400">일 지출</p>
          <p className="text-xs sm:text-sm font-extrabold text-gray-900">¥2,200 <span className="text-[9px] sm:text-[10px] text-gray-400 font-normal">≈ 21,450원</span></p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 sm:w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '13%' }} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600">13%</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   슬라이드 3 — /share/[code]
───────────────────────────────────────────── */
function Slide3() {
  return (
    <div className="relative bg-[#F8FAFC] rounded-xl overflow-hidden border border-gray-200">
      <nav className="bg-white border-b border-gray-200">
        <div className="h-11 sm:h-12 flex items-center px-3 gap-2">
          <span className="text-[10px] text-gray-400 flex-shrink-0">← 일정</span>
          <div className="w-px h-3 bg-gray-200 hidden sm:block" />
          <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }} />
            <span className="font-bold text-xs sm:text-sm text-gray-900 truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>방콕 배낭여행</span>
            <span className="flex-shrink-0 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">게스트</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 text-xs text-gray-600">
              <div className="flex -space-x-1.5">
                {['#f59e0b','#6366f1','#10b981'].map((c,i) => <div key={i} className="w-5 h-5 rounded-full ring-2 ring-white" style={{ background: c }} />)}
              </div>
              <Users className="w-3 h-3 text-gray-400" />멤버
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-xs text-gray-600">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[11px] font-semibold">
              여행 요약<ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
        <div className="sm:hidden flex items-center justify-between px-3 py-1.5 border-t border-gray-100">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200">
            <div className="flex -space-x-1.5">
              {['#f59e0b','#6366f1'].map((c,i) => <div key={i} className="w-4 h-4 rounded-full ring-1 ring-white" style={{ background: c }} />)}
            </div>
            <span className="text-[9px] text-gray-600 ml-1">3명</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="h-7 px-2.5 flex items-center gap-0.5 rounded-full bg-gray-900 text-white text-[10px] font-semibold">
              요약<ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </nav>
      {/* Pins */}
      <Pin n={1} style={{ top: 11, left: 175 }} />
      <Pin n={2} style={{ top: 11, right: 152 }} />

      {/* 멤버 배너 */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-900">초대받은 여행</p>
            <p className="text-[9px] text-indigo-500">PIN 코드로 합류했어요</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-indigo-200">
          <span className="text-[9px] text-indigo-400">PIN</span>
          <span className="text-[10px] font-extrabold text-indigo-700 tracking-widest">A3K9F2</span>
        </div>
      </div>
      <Pin n={3} style={{ top: 58, right: 6 }} />

      {/* 멤버 역할 */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2 flex-wrap">
        {[
          { name: '김민준', bg: '#f59e0b', role: '방장', roleCls: 'bg-blue-100 text-blue-700' },
          { name: '이서연', bg: '#6366f1', role: '총무', roleCls: 'bg-amber-100 text-amber-700' },
          { name: '나', bg: '#10b981', role: '멤버', roleCls: 'bg-gray-100 text-gray-500' },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: m.bg }}>{m.name[0]}</div>
            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-full ${m.roleCls}`}>{m.role}</span>
          </div>
        ))}
      </div>
      <Pin n={4} style={{ top: 110, left: 12 }} />

      {/* 날짜 탭 */}
      <div className="flex gap-1.5 px-3 py-2 bg-white border-b border-gray-100">
        {['Day 1\n6/20','Day 2\n6/21','Day 3\n6/22'].map((d, i) => (
          <div key={i} className={`flex-shrink-0 text-center px-2 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold leading-tight ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {d.split('\n').map((line, j) => <div key={j}>{line}</div>)}
          </div>
        ))}
      </div>

      {/* 아이템 */}
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {[
          { name: '왓 포 (와불 사원)', cat: '장소', price: '100฿', rating: 5, catCls: 'bg-blue-100 text-blue-600' },
          { name: '팟타이 로드', cat: '식사', price: '80฿', rating: 4, catCls: 'bg-orange-100 text-orange-600' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 px-2.5 sm:px-3 py-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <span className={`text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-full ${item.catCls}`}>{item.cat}</span>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-900 mt-0.5 truncate">{item.name}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700">{item.price}</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(v => <Star key={v} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${v <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   슬라이드 설정
───────────────────────────────────────────── */
const SLIDES = [
  {
    title: '내 여행 목록',
    subtitle: '/trips 화면',
    Mockup: Slide1,
    features: [
      { n: 1, title: '새 여행 만들기', desc: 'AI 일정 초안 추천, 커버 사진 업로드, 예산 설정, 친구 초대 PIN 자동 생성' },
    ],
  },
  {
    title: '여행 플래너',
    subtitle: '/trips/[id] 화면',
    Mockup: Slide2,
    features: [
      { n: 1, title: '멤버 관리', desc: 'PIN 번호로 친구 초대, 방장·총무·멤버 역할 설정' },
      { n: 2, title: '체크리스트', desc: '여행 준비물과 할 일을 멤버와 실시간으로 공유' },
      { n: 3, title: '여행 요약', desc: '예산·지출 현황, 일정 하이라이트, 멤버별 정산 확인' },
      { n: 4, title: '일정 항목', desc: '카테고리·지출 기록, 별점 투표, 영수증 첨부, 참석 인원 설정' },
    ],
  },
  {
    title: '초대된 여행',
    subtitle: '/share 화면',
    Mockup: Slide3,
    features: [
      { n: 1, title: '게스트 역할 표시', desc: '방장·총무·게스트 역할에 따라 편집 권한이 달라져요' },
      { n: 2, title: '멤버 목록', desc: '함께하는 모든 멤버의 역할과 프로필을 확인하세요' },
      { n: 3, title: 'PIN 코드 초대', desc: '방장이 발급한 6자리 PIN으로 여행에 합류해요' },
      { n: 4, title: '멤버 역할 뱃지', desc: '방장 (파란색), 총무 (황색), 멤버 (회색) 구분' },
    ],
  },
]

/* ─────────────────────────────────────────────
   메인
───────────────────────────────────────────── */
export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]
  const TOTAL = SLIDES.length

  const handleNext = useCallback(() => {
    if (step >= TOTAL - 1) onClose()
    else setStep(s => s + 1)
  }, [step, TOTAL, onClose])

  const handlePrev = useCallback(() => setStep(s => Math.max(0, s - 1)), [])

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex flex-col overflow-y-auto"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 상단 */}
      <div className="sticky top-0 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-black/70 backdrop-blur-sm z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-300 ${i === step ? 'w-5 sm:w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-xs sm:text-sm">{slide.title}</p>
          <p className="text-white/40 text-[9px] sm:text-[10px] hidden sm:block">{slide.subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-white/60 hover:text-white text-xs font-semibold transition-colors"
        >
          건너뛰기 <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* 스크린샷 + 기능 설명 */}
      <div className="flex-1 flex flex-col items-center px-3 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4">
        <div className="w-full max-w-[820px]">
          <slide.Mockup />
        </div>

        {/* 기능 설명 카드 */}
        <div className="w-full max-w-[820px] bg-white/8 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/10">
          <div className={`grid gap-2 sm:gap-3 ${slide.features.length >= 3 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {slide.features.map(f => (
              <FeatureRow key={f.n} n={f.n} title={f.title} desc={f.desc} />
            ))}
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="sticky bottom-0 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-black/70 backdrop-blur-sm">
        <button
          onClick={handlePrev}
          disabled={step === 0}
          className="flex items-center gap-1 sm:gap-1.5 text-white/50 hover:text-white disabled:opacity-0 disabled:pointer-events-none text-xs sm:text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> 이전
        </button>

        <p className="text-white/40 text-xs">{step + 1} / {TOTAL}</p>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 sm:gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-colors shadow-lg"
        >
          {step >= TOTAL - 1 ? '시작하기' : '다음'}
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  )
}
