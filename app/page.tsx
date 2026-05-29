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
  { label: '여행지 탐색', href: '#features' },
  { label: '일정 만들기', href: '#how' },
  { label: '커뮤니티', href: '#reviews' },
]

const FEATURES = [
  {
    icon: '✨',
    bg: 'bg-violet-50',
    title: 'AI가 짜주는 맞춤 일정',
    desc: '취향·예산·인원·교통수단을 입력하면 AI가 최적의 여행 일정을 자동으로 생성해 드립니다. 단 1분이면 완성.',
  },
  {
    icon: '🗺️',
    bg: 'bg-teal-50',
    title: '지도로 보는 전체 동선',
    desc: '국내는 카카오맵, 해외는 구글맵. 장소를 추가할 때마다 지도에 핀이 그려지고 날짜별 경로를 한눈에 확인할 수 있어요.',
  },
  {
    icon: '👥',
    bg: 'bg-orange-50',
    title: '친구와 함께 계획하기',
    desc: '초대 링크로 일행을 불러 함께 일정을 보고 수정하세요. 실시간으로 함께 편집하고 완성된 일정을 공유할 수 있어요.',
  },
  {
    icon: '👑',
    bg: 'bg-amber-50',
    title: '총무 기능으로 정산 끝',
    desc: '그룹 여행의 골칫거리, 돈 계산. 총무를 지정하면 여행 경비를 한 곳에서 관리하고 1인당 정산 금액을 자동으로 계산해드려요.',
  },
  {
    icon: '📊',
    bg: 'bg-blue-50',
    title: '예산 & 지출 한눈에',
    desc: '여행 예산을 설정하고 지출을 실시간으로 기록하세요. 날짜별 소비 현황과 남은 예산을 대시보드에서 바로 확인할 수 있어요.',
  },
  {
    icon: '⭐',
    bg: 'bg-yellow-50',
    title: '장소별 별점으로 기록',
    desc: '방문한 장소마다 별점과 메모를 남겨보세요. 여행이 끝나면 최고의 순간만 모은 나만의 여행 리포트가 자동으로 완성됩니다.',
  },
]

const STEPS = [
  {
    n: '1',
    title: '도시 선택',
    desc: '가고 싶은 나라·도시를 검색하고 여행 기간과 함께하는 인원을 설정하세요.',
  },
  {
    n: '2',
    title: '장소 추가',
    desc: '아침·점심·저녁별로 가고 싶은 장소를 검색해 추가하세요. 지도에서 동선이 자동으로 그려집니다.',
  },
  {
    n: '3',
    title: '공유 & 출발',
    desc: '완성된 일정을 초대 링크로 친구에게 공유하세요. 이제 여행만 즐기면 됩니다.',
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
    trip: '파리 5일 여행',
    text: '일정 짜는 게 이렇게 쉬운 적이 없었어요. 지도에서 바로 동선이 보여서 너무 편했습니다!',
    stars: 5,
  },
  {
    name: '박민준',
    trip: '제주도 3일 여행',
    text: '아침·점심·저녁 구분이 정말 유용해요. 지도에서 동선이 바로 보여서 겹치는 일정 없이 짤 수 있었어요.',
    stars: 5,
  },
  {
    name: '이현아',
    trip: '오사카 4일 여행',
    text: '친구 4명이 같이 편집하면서 일정 짰는데 충돌 없이 너무 잘 됐어요. 앞으로도 쓸 것 같아요.',
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
              <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                ✈&nbsp;&nbsp;Smart Travel Planner
              </span>
            </div>

            <div className="flex flex-col gap-0">
              <h1 className="text-4xl sm:text-5xl xl:text-[72px] font-extrabold text-gray-900 leading-[1.1]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                나만의 완벽한<br />여행 계획,
              </h1>
              <h2 className="text-4xl sm:text-5xl xl:text-[72px] font-extrabold text-blue-600 leading-[1.1]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                가장 쉽게.
              </h2>
            </div>

            <p className="text-lg text-gray-500 leading-relaxed max-w-[480px]">
              복잡한 일정 짜기는 이제 그만. 항공권부터 숙소, 일별<br className="hidden sm:block" />코스까지 한 번에 계획하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <Link href="/trips"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-[26px] text-[15px] transition-colors">
                  내 여행 시작하기
                </Link>
              ) : (
                <Link href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-[26px] text-[15px] transition-colors">
                  새 일정 만들기
                </Link>
              )}
              <button onClick={() => scrollTo('demo')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-[26px] text-[15px] hover:bg-gray-50 transition-colors">
                ▶&nbsp;&nbsp;데모 보기
              </button>
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
      <section className="bg-[#F9FAFB] border-y border-gray-200 py-7">
        <p className="text-center text-[15px] font-semibold text-gray-400">
          지금 베타 오픈 — 무료로 사용해보세요
        </p>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-28 px-4 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <Tag color="bg-blue-50 text-blue-600">Features</Tag>
            <h2 className="text-4xl xl:text-[44px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              여행 준비가 즐거워집니다
            </h2>
            <p className="text-base text-gray-500 max-w-[780px]">
              Voyalogue와 함께라면 스트레스 없이 완벽한 일정을 세울 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="bg-white rounded-[20px] p-8 border border-gray-200 hover:shadow-md transition-shadow flex flex-col gap-5">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center text-2xl`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
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
                몇 가지 질문에 답하면<br />AI가 일정을 완성해요
              </h2>
              <p className="text-base text-gray-500 leading-relaxed max-w-[480px]">
                여행지, 기간, 인원, 취향만 입력하세요. Gemini AI가 식사 · 관광 · 이동을 고려해 하루하루 최적의 코스를 짜드립니다.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  '✈️  목적지와 여행 기간 설정',
                  '🎯  취향 · 예산 · 교통수단 선택',
                  '🗓️  AI가 날짜별 코스 자동 완성',
                  '📍  지도에서 전체 동선 바로 확인',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span>{item}</span>
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
            <Tag color="bg-green-100 text-green-700">How it works</Tag>
            <h2 className="text-4xl xl:text-[44px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              3분 만에 완성되는 여행 계획
            </h2>
            <p className="text-base text-gray-500 max-w-[720px]">
              복잡한 과정은 없습니다. 단 세 단계로 완벽한 일정을 만드세요.
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
                      {item.type === 'flight' ? '✈' : item.type === 'hotel' ? '🏠' : item.n}
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
            <div className="flex-1 relative min-h-[380px]">
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
            <Tag color="bg-orange-50 text-orange-600">Reviews</Tag>
            <h2 className="text-4xl xl:text-[40px] font-extrabold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              여행자들의 솔직한 후기
            </h2>
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
            지금 무료로 시작하세요.
          </h2>
          <p className="text-base text-slate-400">
            가입 후 30초, 첫 번째 여행 일정을 바로 만들 수 있습니다.
          </p>
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
          <nav className="flex gap-6">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">이용약관</Link>
            <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">문의하기</Link>
          </nav>
        </div>
      </footer>

    </div>
  )
}
