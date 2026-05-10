'use client'

import React, { useState, use, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, Star, MapPin, Wallet, Camera, CheckCircle, ChevronRight, Loader2 } from 'lucide-react'
import { doc, onSnapshot, collection, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'

/* ── 타입 ── */
type TripMeta = {
  city:      string
  startDate: string
  endDate:   string
  nights:    number
  days:      number
  people:    number
  gradient:  string
  budget:    number
  totalRating?: number
}

type PlanItem = {
  id:      string
  name:    string
  cat:     string
  price:   number
  rating:  number
  timeSlot: string
  dayId:   string
}

/* ── 유틸 ── */
function formatKRW(n: number) {
  const r = Math.round(n)
  return r % 10000 === 0 ? `${(r / 10000).toLocaleString()}만원` : `${r.toLocaleString()}원`
}

function SmallStars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(v => (
        <Star key={v} className={`w-3 h-3 ${v <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </span>
  )
}

function StarRow({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="flex gap-1">
      {[1,2,3,4,5].map(v => (
        <Star key={v}
          className={`w-6 h-6 transition-colors ${v <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} ${onChange ? 'cursor-pointer hover:text-amber-300' : ''}`}
          onClick={() => onChange?.(v)}
        />
      ))}
    </span>
  )
}

const CAT_COLORS: Record<string, string> = {
  장소: 'bg-blue-100 text-blue-700',
  쇼핑: 'bg-pink-100 text-pink-700',
  식사: 'bg-orange-100 text-orange-700',
  교통: 'bg-gray-100 text-gray-500',
  기타: 'bg-gray-100 text-gray-500',
}

/* ── 본체 ── */
function SummaryContent({ tripId }: { tripId: string }) {
  const { user } = useAuthStore()
  const uid = user!.uid

  const [meta,       setMeta]       = useState<TripMeta | null>(null)
  const [allItems,   setAllItems]   = useState<PlanItem[]>([])
  const [daySummaries, setDaySummaries] = useState<{ day: string; date: string; highlights: string[]; spent: number }[]>([])
  const [loading,    setLoading]    = useState(true)

  const [overallRating, setOverallRating] = useState(0)
  const [review,        setReview]        = useState('')
  const [submitted,     setSubmitted]     = useState(false)

  /* ── 여행 메타 구독 ── */
  useEffect(() => {
    const ref = doc(db, 'users', uid, 'trips', tripId)
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data() as TripMeta
        setMeta(data)
        setOverallRating(data.totalRating ?? 0)
      }
      setLoading(false)
    })
  }, [uid, tripId])

  /* ── 모든 day의 items 로드 ── */
  useEffect(() => {
    if (!meta) return
    const fetchAll = async () => {
      const daysSnap = await getDocs(collection(db, 'users', uid, 'trips', tripId, 'days'))
      const items: PlanItem[] = []
      const summaries: typeof daySummaries = []

      const sorted = daysSnap.docs.sort((a, b) => a.id.localeCompare(b.id))

      for (const dayDoc of sorted) {
        const dayData = dayDoc.data()
        const itemsSnap = await getDocs(
          collection(db, 'users', uid, 'trips', tripId, 'days', dayDoc.id, 'items')
        )
        const dayItems = itemsSnap.docs.map(d => ({
          id: d.id, dayId: dayDoc.id, ...d.data(),
        })) as PlanItem[]

        items.push(...dayItems)
        summaries.push({
          day:        dayData.label ?? dayDoc.id,
          date:       dayData.date  ?? '',
          highlights: dayItems.filter(i => i.cat !== '교통').map(i => i.name).slice(0, 3),
          spent:      dayItems.reduce((s, i) => s + (i.price ?? 0), 0),
        })
      }
      setAllItems(items)
      setDaySummaries(summaries)
    }
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!meta, uid, tripId])

  /* ── 통계 ── */
  const totalSpent = useMemo(() => allItems.reduce((s, i) => s + (i.price ?? 0), 0), [allItems])
  const budgetPct  = meta ? Math.min(100, Math.round((totalSpent / (meta.budget || 1)) * 100)) : 0
  const topPlaces  = useMemo(() =>
    [...allItems].filter(i => i.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 4),
    [allItems]
  )

  /* ── 리뷰 저장 ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallRating === 0) return
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), {
      totalRating: overallRating,
      reviewText:  review,
    })
    setSubmitted(true)
  }

  const formatDate = (d: string) => {
    if (!d) return ''
    return `${parseInt(d.slice(5,7))}/${parseInt(d.slice(8,10))}`
  }

  if (loading || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Navbar ── */}
      <nav className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-10">
        <Link href={`/trips/${tripId}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> 플래너
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>여행 요약</span>
      </nav>

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6 sm:gap-8">

        {/* ── 히어로 카드 ── */}
        <div className={`rounded-3xl bg-gradient-to-br ${meta.gradient} p-6 sm:p-8 text-white relative overflow-hidden`}>
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-white/80" />
              <span className="text-sm font-semibold text-white/80">여행 완료</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {meta.city}
            </h1>
            <p className="text-white/70 text-sm">
              {meta.startDate?.slice(5).replace('-','/')} – {meta.endDate?.slice(5).replace('-','/')} · {meta.nights}박 {meta.days}일 · {meta.people || 2}명
            </p>
            <div className="flex items-center gap-4 sm:gap-6 mt-5 flex-wrap">
              {[
                { val: `${meta.nights}박`,        label: '총 박수' },
                { val: formatKRW(totalSpent),      label: '총 지출' },
                { val: `${topPlaces.filter(p => p.rating >= 5).length}곳`, label: '별점 5점' },
              ].map(({ val, label }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <div className="w-px h-8 bg-white/20" />}
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{val}</p>
                    <p className="text-white/60 text-xs mt-0.5">{label}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

          {/* ── 예산 요약 ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900">예산 요약</h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: '총 예산',   val: formatKRW(meta.budget || 0),              cls: 'text-gray-900' },
                { label: '총 지출',   val: formatKRW(totalSpent),                    cls: 'text-gray-900' },
                { label: '남은 예산', val: formatKRW((meta.budget || 0) - totalSpent), cls: 'text-emerald-600 font-bold' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-semibold ${cls}`}>{val}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${budgetPct}%` }} />
              </div>
              <p className="text-[11px] text-gray-400 text-right">{budgetPct}% 사용</p>
            </div>
          </div>

          {/* ── 베스트 장소 ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900">베스트 장소</h2>
            </div>
            {topPlaces.length === 0 ? (
              <p className="text-sm text-gray-400">별점을 남긴 장소가 없어요.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topPlaces.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <SmallStars rating={p.rating} />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_COLORS[p.cat] ?? 'bg-gray-100 text-gray-500'}`}>
                      {p.cat}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 일별 하이라이트 ── */}
        {daySummaries.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Camera className="w-4 h-4 text-violet-600" />
              <h2 className="text-sm font-bold text-gray-900">일별 하이라이트</h2>
            </div>
            <div className="flex flex-col gap-0">
              {daySummaries.map((d, i) => (
                <div key={i} className="flex gap-4 pb-5 last:pb-0">
                  <div className="flex flex-col items-center flex-shrink-0 w-8">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white">
                      {formatDate(d.date) || d.day.replace('Day ','')}
                    </div>
                    {i < daySummaries.length - 1 && (
                      <div className="w-0.5 bg-gray-100 flex-1 mt-1" style={{ minHeight: 20 }} />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-bold text-gray-900 mb-1">{d.day}</p>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {d.highlights.length > 0
                        ? d.highlights.map((h, j) => (
                            <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{h}</span>
                          ))
                        : <span className="text-xs text-gray-400">일정 없음</span>
                      }
                    </div>
                    {d.spent > 0 && <p className="text-xs text-gray-400">{formatKRW(d.spent)} 지출</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 여행 평점 & 리뷰 ── */}
        {submitted ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              리뷰가 저장되었습니다
            </h3>
            <SmallStars rating={overallRating} />
            {review && <p className="text-sm text-gray-600 max-w-sm">"{review}"</p>}
            <Link href="/trips"
              className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-colors">
              내 여행 목록으로 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-1">전체 여행 평점</h2>
            <p className="text-xs text-gray-400 mb-5">이번 여행은 어떠셨나요?</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <StarRow value={overallRating} onChange={setOverallRating} />
                {overallRating > 0 && (
                  <p className="text-xs text-blue-600 font-semibold">
                    {['','별로였어요','그저 그랬어요','괜찮았어요','좋았어요','최고였어요!'][overallRating]}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-600">한 줄 후기 (선택)</label>
                <textarea rows={3} placeholder="이번 여행에서 가장 기억에 남는 순간은?"
                  value={review} onChange={e => setReview(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={overallRating === 0}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">
                  리뷰 저장하기
                </button>
                <Link href="/trips"
                  className="px-5 py-3.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                  건너뛰기
                </Link>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  )
}

export default function TripSummaryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params)
  return <AuthGuard><SummaryContent tripId={tripId} /></AuthGuard>
}
