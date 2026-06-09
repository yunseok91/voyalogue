'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Globe, Menu, X, Star } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { AdUnit } from '@/components/AdUnit'
import { ServiceRatingModal } from '@/components/ServiceRatingModal'
import { getDocs, collection, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { TripMap, type DayGroup, DAY_COLORS } from '@/components/TripMap'

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: '기능', href: '#features' },
  { label: '사용법', href: '#how' },
  { label: '후기', href: '#reviews' },
]

const FEATURES = [
  {
    iconPath: (
      <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
        <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
      </svg>
    ),
    bg: 'bg-violet-50',
    title: 'AI 일정 초안',
    desc: '목적지·기간·인원만 입력하면 하루 코스가 나와요. 마음에 안 드는 건 바로 수정하면 됩니다.',
  },
  {
    iconPath: (
      <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>
      </svg>
    ),
    bg: 'bg-teal-50',
    title: '지도 위 동선 확인',
    desc: '장소를 추가하는 순간 지도에 핀이 찍혀요. 동선이 너무 멀거나 겹치는지 한눈에 보입니다.',
  },
  {
    iconPath: (
      <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
      </svg>
    ),
    bg: 'bg-orange-50',
    title: '링크 하나로 같이 짜기',
    desc: '초대 링크 보내면 친구도 바로 들어와서 같이 편집해요. 카톡 대신 여기서 정하면 됩니다.',
  },
  {
    iconPath: (
      <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/>
      </svg>
    ),
    bg: 'bg-amber-50',
    title: '총무가 정산까지',
    desc: '총무 한 명이 지출 입력하면 1인당 금액이 자동으로 나와요. 여행 끝나고 돈 얘기 안 해도 됩니다.',
  },
  {
    iconPath: (
      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
      </svg>
    ),
    bg: 'bg-blue-50',
    title: '예산 쓸 때마다 기록',
    desc: '얼마 썼는지 그때그때 기록하면 남은 예산이 보여요. 날짜별로 얼마 썼는지도 확인됩니다.',
  },
  {
    iconPath: (
      <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
      </svg>
    ),
    bg: 'bg-yellow-50',
    title: '여행 끝나면 리포트',
    desc: '갔던 곳마다 별점 남기면 여행 리포트가 만들어져요. 어떤 하루가 제일 좋았는지 돌아볼 수 있어요.',
  },
]

const STEPS = [
  {
    n: '1',
    title: '어디 갈지 정하기',
    desc: '도시 검색해서 날짜·인원 설정하면 끝이에요. 여러 여행을 따로 관리할 수 있어요.',
  },
  {
    n: '2',
    title: '장소 하나씩 넣기',
    desc: '아침·점심·저녁 슬롯에 가고 싶은 곳 검색해서 추가하면 지도에 바로 반영돼요.',
  },
  {
    n: '3',
    title: '링크 보내고 출발',
    desc: '친구한테 링크 하나 보내면 같이 볼 수 있어요. 일정은 여기 있으니 이제 짐만 싸세요.',
  },
]

type SidebarItemType = 'flight' | 'hotel' | 'place'
const MAP_ITEMS: { n: number; name: string; time: string; stars?: number; tag: string; active: boolean; type: SidebarItemType }[] = [
  { n: 1, name: '파리 CDG 도착',  time: '10:30 AM', tag: '비행기', active: false, type: 'flight' },
  { n: 2, name: '에펠탑',         time: '06:00 PM', stars: 5, tag: '장소',  active: true,  type: 'place'  },
  { n: 3, name: '오페라 호텔',    time: '09:00 PM', tag: '숙소',  active: false, type: 'hotel'  },
]

const DEMO_DAY_GROUPS: DayGroup[] = [
  {
    dayId: 'd1', label: 'Day 1', color: DAY_COLORS[0],
    items: [
      { id: 'flight-in',  name: '파리 CDG 도착',   lat: 49.0097, lng: 2.5479, timeSlot: '비행기', cat: '비행기', markerType: 'special' },
      { id: 'p1',         name: '에펠탑',           lat: 48.8584, lng: 2.2945, timeSlot: '저녁',   cat: '장소'   },
      { id: 'hotel1',     name: '오페라 호텔',      lat: 48.8736, lng: 2.3322, timeSlot: '숙소',   cat: '숙소',  markerType: 'special' },
    ],
  },
  {
    dayId: 'd2', label: 'Day 2', color: DAY_COLORS[1],
    items: [
      { id: 'p2',     name: '루브르 박물관',   lat: 48.8606, lng: 2.3376, timeSlot: '아침', cat: '박물관'  },
      { id: 'p3',     name: '노트르담 대성당', lat: 48.8530, lng: 2.3499, timeSlot: '점심', cat: '장소'    },
      { id: 'p4',     name: '센 강 유람선',    lat: 48.8566, lng: 2.3522, timeSlot: '저녁', cat: '액티비티'},
      { id: 'hotel1', name: '오페라 호텔',     lat: 48.8736, lng: 2.3322, timeSlot: '숙소', cat: '숙소',   markerType: 'special' },
    ],
  },
  {
    dayId: 'd3', label: 'Day 3', color: DAY_COLORS[2],
    items: [
      { id: 'p5',        name: '몽마르트 언덕', lat: 48.8867, lng: 2.3431, timeSlot: '아침', cat: '장소'   },
      { id: 'p6',        name: '오르세 미술관', lat: 48.8600, lng: 2.3266, timeSlot: '점심', cat: '박물관' },
      { id: 'flight-out',name: '파리 CDG 출발', lat: 49.0097, lng: 2.5479, timeSlot: '비행기', cat: '비행기', markerType: 'special' },
    ],
  },
]

const REVIEWS = [
  {
    name: '김지수',
    trip: '파리 5일',
    text: '구글맵이랑 노션이랑 카톡 다 열어놓고 짜다가 이거 쓰니까 훨씬 편했어요. 지도 보면서 동선 맞추는 게 직관적이에요.',
    stars: 5,
  },
  {
    name: '박민준',
    trip: '제주도 3일',
    text: '아침 점심 저녁 슬롯으로 나눠서 넣으니까 하루가 너무 빡빡해지는 걸 방지할 수 있었어요.',
    stars: 5,
  },
  {
    name: '이현아',
    trip: '오사카 4일',
    text: '여럿이 같이 쓰는 게 신기했어요. 각자 가고 싶은 곳 추가해서 합치는 식으로 쓰니까 의견 충돌도 없었고.',
    stars: 5,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskName(name: string): string {
  if (!name || name === '익명') return '익명'
  if (name.length === 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {children}
    </span>
  )
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type LiveReview = { id: string; name: string; text: string; stars: number }

export default function LandingPage() {
  const [scrolled,      setScrolled]      = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [showRating,    setShowRating]    = useState(false)
  const [liveReviews,   setLiveReviews]   = useState<LiveReview[] | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    getDocs(query(
      collection(db, 'serviceReviews'),
      where('featured', '==', true),
      limit(12),
    )).then(snap => {
      if (snap.size > 0) {
        const sorted = snap.docs
          .map(d => {
            const data = d.data()
            return {
              id:    d.id,
              name:  data.displayName ?? '익명',
              text:  data.text ?? '',
              stars: data.rating ?? 5,
              ts:    data.createdAt?.toMillis?.() ?? 0,
            }
          })
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 6)
        setLiveReviews(sorted)
      }
    }).catch(err => console.error('[reviews]', err))
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  const displayedReviews = liveReviews ?? REVIEWS
  const avgRating = displayedReviews.length
    ? (displayedReviews.reduce((s, r) => s + r.stars, 0) / displayedReviews.length).toFixed(1)
    : '5.0'

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* AdSense — 랜딩 페이지에만 로드 */}
      <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6889911728160635"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />

      {showRating && <ServiceRatingModal onClose={() => setShowRating(false)} />}

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 h-[72px] flex items-center transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'}`}>
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Voyalogue
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">BETA</span>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href.slice(1))}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                {l.label}
              </button>
            ))}
          </nav>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowRating(true)}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                후기 남기기
              </button>
              <Link href="/trips"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-[18px] transition-colors">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                    {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                여행 시작하기
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-[18px] transition-colors">
                무료로 시작하기
              </Link>
            </div>
          )}

          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="absolute top-full inset-x-0 bg-white border-b border-gray-100 px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href.slice(1))}
                className="text-sm text-gray-700 text-left">{l.label}</button>
            ))}
            {user ? (
              <Link href="/trips" className="py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl text-center">
                여행 시작하기
              </Link>
            ) : (
              <Link href="/auth" className="py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl text-center">
                시작하기
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="min-h-screen pt-[72px] flex items-stretch relative">
        {/* bg glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/6 blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row">

          {/* Left copy — 절반 너비, 패딩 유지 */}
          <motion.div
            className="flex-1 flex flex-col justify-center gap-7 px-4 sm:px-8 lg:px-16 py-12 sm:py-20 lg:max-w-[50%]"
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}>

            <div className="inline-flex">
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.8 1.1l1 4.5c.1.4.4.7.8.8l3.5.5 1 3.4c.1.4.4.7.8.8l4.5 1c.5.1 1-.3 1.1-.8z"/>
                </svg>
                여행 플래너
              </span>
            </div>

            <div className="flex flex-col gap-0">
              <h1 className="text-4xl sm:text-5xl xl:text-[72px] font-extrabold text-gray-900 leading-[1.1]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                여행 일정은
              </h1>
              <h2 className="text-4xl sm:text-5xl xl:text-[72px] font-extrabold text-blue-600 leading-[1.1]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                같이 짜야죠.
              </h2>
            </div>

            <p className="text-lg text-gray-500 leading-relaxed max-w-[480px]">
              지도로 보는 동선, 링크 하나로 공유, 정산까지.<br className="hidden sm:block" />여행 앱이 이래도 되나 싶을 거예요.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <Link href="/trips"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[26px] text-[15px] transition-colors shadow-lg shadow-blue-600/20">
                  내 여행 시작하기
                </Link>
              ) : (
                <Link href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[26px] text-[15px] transition-colors shadow-lg shadow-blue-600/20">
                  무료로 시작하기
                </Link>
              )}
              <button onClick={() => scrollTo('demo')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-[26px] text-[15px] hover:bg-gray-50 transition-colors">
                ▶&nbsp;&nbsp;데모 보기
              </button>
            </div>

            {/* 소셜 프루프 마이크로카피 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
              {[
                '완전 무료',
                'Google 계정으로 10초 가입',
                '신용카드 불필요',
              ].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: Spline — 오른쪽 절반 전체, 박스 없이 */}
          <motion.div
            className="flex-1 relative min-h-[500px] lg:min-h-0 overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}>

            {/* 왼쪽 페이드 — 텍스트 영역과 자연스럽게 이어지도록 */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

            {/* iframe 140% 크기로 렌더링 후 scale(0.714) 로 줄임 → Spline 뷰포트가 넓어져 줌아웃 효과 */}
            <iframe
              src="https://my.spline.design/luggageanimated-UNMmTdkSV4G1BEiMg5fRITqL/"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '140%',
                height: '140%',
                transform: 'translate(-50%, -50%) scale(0.714)',
                border: 'none',
                pointerEvents: 'none',
              }}
              title="Voyalogue 3D"
            />
          </motion.div>

        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────────── */}
      <section className="bg-[#F9FAFB] border-y border-gray-200 py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            {[
              {
                icon: <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
                title: '완전 무료',
                sub: '베타 기간 모든 기능 무료'
              },
              {
                icon: <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
                title: '10초 가입',
                sub: 'Google 계정으로 바로 시작'
              },
              {
                icon: <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
                title: '링크로 공유',
                sub: '친구와 함께 편집·확인'
              },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center gap-1.5 px-4 py-1 text-center">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">{item.icon}</div>
                <span className="text-sm font-bold text-gray-700">{item.title}</span>
                <span className="text-xs text-gray-400 hidden sm:block">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <Tag color="bg-blue-50 text-blue-600">기능</Tag>
            <h2 className="text-4xl xl:text-[44px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              이런 것들이 됩니다
            </h2>
            <p className="text-base text-gray-500 max-w-[780px]">
              일정 짜는 것부터 여행 끝나고 정리하는 것까지 한 곳에서 다 됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="bg-white rounded-[20px] p-7 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all flex flex-col gap-4">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center`}>
                  {f.iconPath}
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Trip Planner ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-[#F9FAFB]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* 왼쪽 텍스트 */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="inline-flex">
                <Tag color="bg-violet-100 text-violet-700">AI Trip Planner</Tag>
              </div>
              <h2 className="text-4xl xl:text-[44px] font-extrabold text-gray-900 leading-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                어디 갈지 정했으면<br />일정은 AI한테 맡겨요
              </h2>
              <p className="text-base text-gray-500 leading-relaxed max-w-[480px]">
                여행지, 기간, 인원, 취향 입력하면 Gemini AI가 하루하루 코스 초안을 만들어줘요. 마음에 드는 것만 남기고 수정하면 됩니다.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  { icon: <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.8 1.1l1 4.5c.1.4.4.7.8.8l3.5.5 1 3.4c.1.4.4.7.8.8l4.5 1c.5.1 1-.3 1.1-.8z"/></svg>, text: '목적지와 여행 기간 입력' },
                  { icon: <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>, text: '취향·예산·교통수단 선택' },
                  { icon: <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, text: 'AI가 날짜별 코스 초안 작성' },
                  { icon: <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: '지도에서 동선 확인 후 조정' },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-2.5 text-sm text-gray-700">
                    {item.icon}
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/trips/new"
                className="inline-flex items-center gap-2 w-fit px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-[22px] text-sm transition-colors">
                AI로 일정 만들어보기
              </Link>
            </div>

            {/* 오른쪽 UI 목업 */}
            <div className="flex-1 w-full max-w-[480px]">
              <div className="bg-white rounded-[24px] border border-gray-200 shadow-xl overflow-hidden">
                {/* 헤더 */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-base">✨</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">AI 여행 플래너</p>
                    <p className="text-[11px] text-gray-400">취향 기반 맞춤 일정 생성</p>
                  </div>
                </div>
                {/* 생성된 일정 미리보기 */}
                <div className="px-5 py-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-gray-500">🗓 Day 1 · 도쿄</p>
                  {[
                    { time: '아침', place: '쓰키지 시장', cat: '식사', color: 'bg-amber-500' },
                    { time: '점심', place: '아사쿠사 센소지', cat: '장소', color: 'bg-blue-500' },
                    { time: '저녁', place: '신주쿠 골든가이', cat: '식사', color: 'bg-rose-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{item.place}</p>
                        <p className="text-[11px] text-gray-400">{item.time}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{item.cat}</span>
                    </div>
                  ))}
                  <p className="text-xs font-bold text-gray-500 mt-1">🗓 Day 2 · 도쿄</p>
                  {[
                    { time: '아침', place: '하라주쿠 카페 거리', cat: '식사', color: 'bg-emerald-500' },
                    { time: '점심', place: '시부야 스카이 전망대', cat: '장소', color: 'bg-blue-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{item.place}</p>
                        <p className="text-[11px] text-gray-400">{item.time}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{item.cat}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <div className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold rounded-2xl text-center">
                    일정 저장하기
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 광고 1 — Features 하단 / How it works 상단 ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-4 bg-[#F9FAFB]">
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? ''} format="horizontal" className="rounded-xl overflow-hidden" />
      </div>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how" className="py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-12 sm:mb-16">
            <Tag color="bg-green-100 text-green-700">사용법</Tag>
            <h2 className="text-4xl xl:text-[44px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              이렇게 쓰면 됩니다
            </h2>
            <p className="text-base text-gray-500 max-w-[720px]">
              세 단계면 일정 완성이에요. 어렵지 않아요.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col gap-5">
                <div className="bg-white rounded-[20px] p-8 border border-gray-200 flex flex-col gap-5 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-base font-bold flex items-center justify-center flex-shrink-0">
                      {s.n}
                    </div>
                    {i < 2 && (
                      <span className="hidden md:block ml-auto text-2xl text-gray-300 pr-2">→</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Map demo ──────────────────────────────────────────────────────── */}
      <section id="demo" className="py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-[#F9FAFB]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <Tag color="bg-blue-50 text-blue-600">Interactive Map</Tag>
            <h2 className="text-4xl xl:text-[40px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              지도 위에서 완성되는 완벽한 동선
            </h2>
            <p className="text-base text-gray-500 max-w-[840px]">
              국내 여행은 카카오맵, 해외 여행은 구글맵. 두 지도를 하나의 플래너에서.
            </p>
          </div>

          <div className="rounded-[20px] overflow-hidden border border-gray-200 shadow-lg bg-white flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="lg:w-[400px] flex-shrink-0 flex flex-col p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
              <div className="mb-1">
                <p className="text-base font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  파리 여행 일정
                </p>
                <p className="text-xs text-gray-400 mt-0.5">7월 15일 – 7월 17일 · 3일</p>
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex flex-col gap-2">
                {MAP_ITEMS.map(item => (
                  <div key={item.n}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.active ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      item.type === 'flight' ? 'bg-sky-500' : item.type === 'hotel' ? 'bg-amber-700' : item.active ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {item.type === 'flight'
                        ? <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.8 1.1l1 4.5c.1.4.4.7.8.8l3.5.5 1 3.4c.1.4.4.7.8.8l4.5 1c.5.1 1-.3 1.1-.8z"/></svg>
                        : item.type === 'hotel'
                        ? <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        : item.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.name} · {item.time}</p>
                      {item.stars != null ? <Stars count={item.stars} /> : (
                        <p className="text-[11px] text-gray-400">{item.tag}</p>
                      )}
                    </div>
                    {item.stars != null && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.active ? 'text-blue-600' : 'text-gray-400'}`}>
                        {item.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Map area */}
            <div className="relative h-[380px] lg:flex-1 lg:h-auto overflow-hidden">
              <TripMap
                city="파리, 프랑스"
                items={[]}
                dayGroups={DEMO_DAY_GROUPS}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      <section id="reviews" className="py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <Tag color="bg-orange-50 text-orange-600">후기</Tag>
            <h2 className="text-4xl xl:text-[40px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              써본 사람들 얘기
            </h2>
            {/* 종합 평점 */}
            <div className="flex items-center gap-3 mt-1">
              <Stars count={5} />
              <span className="text-base font-extrabold text-gray-800">{avgRating}</span>
              <span className="text-sm text-gray-400">/ 5.0 · {displayedReviews.length}개 후기</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {displayedReviews.map((r, i) => (
              <div key={'id' in r ? r.id : r.name + i} className="bg-[#F9FAFB] rounded-2xl p-7 border border-gray-200 flex flex-col gap-5">
                <Stars count={r.stars} />
                <p className="text-sm text-gray-700 leading-relaxed flex-1">"{r.text}"</p>
                <p className="text-xs font-semibold text-gray-400">
                  {maskName(r.name)}{'trip' in r ? ` · ${r.trip}` : ''}
                </p>
              </div>
            ))}
          </div>

          {/* 후기 섹션 내 CTA */}
          <div className="flex flex-col items-center gap-3 mt-14">
            {user ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">직접 경험해보셨나요?</p>
                <button
                  onClick={() => setShowRating(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  후기 남기기
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-gray-500">지금 바로 사용해보세요</p>
                <Link href="/auth"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-[22px] transition-colors shadow-md shadow-blue-600/20">
                  무료로 시작하기
                </Link>
                <p className="text-xs text-gray-400">신용카드 불필요 · Google 계정으로 10초 가입</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-[#F9FAFB]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-12 sm:mb-16">
            <Tag color="bg-purple-50 text-purple-600">FAQ</Tag>
            <h2 className="text-4xl xl:text-[44px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              자주 묻는 질문
            </h2>
          </div>
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {[
              { q: 'Voyalogue는 무료인가요?', a: '네, 현재 베타 기간 동안 모든 기능을 완전 무료로 사용할 수 있습니다. Google 계정만 있으면 바로 시작할 수 있습니다.' },
              { q: '여행 일정을 친구와 함께 편집할 수 있나요?', a: '초대 링크를 공유하면 친구가 멤버로 참여해 일정을 함께 편집할 수 있습니다. 보기 전용 공유 링크를 따로 발급해 특정 인원에게만 공유하는 것도 가능합니다.' },
              { q: '어떤 통화를 지원하나요?', a: 'KRW(원), USD(달러), EUR(유로), JPY(엔), CNY(위안) 등 주요 통화를 지원합니다. 실시간 환율이 자동 적용되며, 날짜별로 환율을 직접 설정할 수도 있습니다.' },
              { q: 'AI 일정 생성은 어떻게 작동하나요?', a: '목적지, 여행 기간, 여행 스타일을 입력하면 AI가 날짜별 추천 코스를 자동으로 작성해드립니다. 생성된 초안을 기반으로 자유롭게 수정해 나만의 일정을 완성하세요.' },
              { q: '모바일에서도 잘 되나요?', a: '네, 모바일 브라우저에 최적화되어 있어 별도 앱 설치 없이 스마트폰으로도 편리하게 이용할 수 있습니다.' },
              { q: '일정 데이터는 안전하게 보관되나요?', a: 'Google Firebase를 통해 데이터가 암호화·저장됩니다. 회원 탈퇴 시 모든 개인 데이터는 즉시 삭제됩니다.' },
            ].map(item => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Q. {item.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 광고 2 — 리뷰 하단 / CTA 상단 ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-4 bg-white">
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? ''} format="horizontal" className="rounded-xl overflow-hidden" />
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-gray-900 overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[560px] h-[400px] rounded-full bg-blue-600/17 blur-3xl pointer-events-none" />
        <div className="relative max-w-[880px] mx-auto flex flex-col items-center text-center gap-6">
          <h2 className="text-4xl xl:text-[52px] font-extrabold text-white leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            한번 써보세요.
          </h2>
          <p className="text-base text-slate-400">
            Google 계정으로 10초면 시작할 수 있어요. 무료입니다.
          </p>
          {/* 종합 평점 — CTA 섹션 */}
          <div className="flex items-center gap-2">
            <Stars count={5} />
            <span className="text-sm text-slate-400">{avgRating} · {displayedReviews.length}개 후기</span>
          </div>
          {user ? (
            <Link href="/trips"
              className="inline-flex items-center gap-2 mt-2 px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-[26px] text-base transition-colors shadow-lg shadow-blue-600/25">
              내 여행 보러가기
            </Link>
          ) : (
            <Link href="/auth"
              className="inline-flex items-center gap-2 mt-2 px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-[26px] text-base transition-colors shadow-lg shadow-blue-600/25">
              무료로 시작하기
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#F9FAFB] border-t border-gray-200 py-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-[18px] h-[18px] rounded-full bg-blue-600" />
            <span className="font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Voyalogue
            </span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Voyalogue Inc. All rights reserved.</p>
          <nav className="flex flex-wrap justify-center gap-6">
            <Link href="/about" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">서비스 소개</Link>
            <Link href="/guide" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">여행 가이드</Link>
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">이용약관</Link>
            <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">문의하기</Link>
          </nav>
        </div>
      </footer>

    </div>
  )
}
