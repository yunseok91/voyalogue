'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, Star, MapPin, Wallet, Camera, CheckCircle, ChevronRight, Loader2, Users } from 'lucide-react'
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'
import { useParams, useSearchParams } from 'next/navigation'
import { gradientStyle } from '@/lib/tripGradient'
import { getRatesInKRW, toKRW, formatKRW, formatLocal } from '@/lib/exchangeRate'
import { detectCurrencies, CURRENCY_SYMBOLS } from '@/lib/currencyMap'

/* ── 타입 ── */
type TripMeta = {
  city:               string
  title?:             string
  startDate:          string
  endDate:            string
  nights:             number
  days:               number
  people:             number
  gradient:           string
  budget:             number
  coverPhotoURL?:     string
  coverPhotoPosition?: number
  members?:           Array<{
    id:          string
    name:        string
    photoURL?:   string
    role?:       string
    colorIndex?: number
    hexColor?:   string
    left?:       boolean
  }>
}

type PlanItem = {
  id:              string
  name:            string
  cat:             string
  price:           number
  currency:        string
  rating:          number
  ratings?:        Record<string, number>
  timeSlot:        string
  dayId:           string
  participantIds?: string[]
  participants?:   number
}

type DayMeta = { dayId: string; label: string; date: string }

type MemberReview = {
  rating:    number
  text:      string
  name:      string
  createdAt: number
}

/* ── 유틸 ── */
function calcAvg(ratings: Record<string, number> = {}): number {
  const vals = Object.values(ratings)
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
}

function SmallStars({ rating }: { rating: number }) {
  const r = Math.round(rating)
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(v => (
        <Star key={v} className={`w-3 h-3 ${v <= r ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </span>
  )
}

function StarRow({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <span className="flex gap-1">
      {[1,2,3,4,5].map(v => (
        <Star key={v}
          className={`w-7 h-7 transition-colors ${v <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} ${onChange ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => onChange && setHover(v)}
          onMouseLeave={() => onChange && setHover(0)}
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
  교통: 'bg-teal-100 text-teal-700',
  기타: 'bg-gray-100 text-gray-500',
}

const ROLE_LABEL: Record<string, string> = {
  owner: '방장', treasurer: '총무', member: '멤버',
}

/* ── 본체 ── */
function SummaryContent({ tripId }: { tripId: string }) {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const ownerUid = searchParams.get('owner') ?? user!.uid
  const isOwner  = ownerUid === user!.uid

  const [meta,          setMeta]          = useState<TripMeta | null>(null)
  const [allItems,      setAllItems]      = useState<PlanItem[]>([])
  const [dayMetas,      setDayMetas]      = useState<DayMeta[]>([])
  const [memberReviews, setMemberReviews] = useState<Record<string, MemberReview>>({})
  const [rates,         setRates]         = useState<Record<string, number>>({ KRW: 1 })
  const [loading,       setLoading]       = useState(true)
  const [itemsLoading,  setItemsLoading]  = useState(true)

  const [overallRating, setOverallRating] = useState(0)
  const [review,        setReview]        = useState('')
  const [submitted,     setSubmitted]     = useState(false)

  /* ── 환율 ── */
  useEffect(() => {
    getRatesInKRW().then(setRates).catch(() => {})
  }, [])

  /* ── 여행 메타 로드 ── */
  useEffect(() => {
    getDoc(doc(db, 'users', ownerUid, 'trips', tripId))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data() as TripMeta & { memberReviews?: Record<string, MemberReview> }
          setMeta(data)
          setMemberReviews(data.memberReviews ?? {})
          const myReview = data.memberReviews?.[user!.uid]
          if (myReview) {
            setOverallRating(myReview.rating)
            setReview(myReview.text)
            setSubmitted(true)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUid, tripId])

  /* ── 아이템 로드 (방장·게스트 공통 시도) ── */
  useEffect(() => {
    if (!meta) return
    const fetchAll = async () => {
      setItemsLoading(true)
      try {
        const daysSnap = await getDocs(collection(db, 'users', ownerUid, 'trips', tripId, 'days'))
        const items: PlanItem[] = []
        const metas: DayMeta[]  = []
        const sorted = daysSnap.docs.sort((a, b) => a.id.localeCompare(b.id))
        for (const dayDoc of sorted) {
          const dayData = dayDoc.data()
          const itemsSnap = await getDocs(
            collection(db, 'users', ownerUid, 'trips', tripId, 'days', dayDoc.id, 'items')
          )
          const dayItems = itemsSnap.docs.map(d => ({
            id: d.id, dayId: dayDoc.id, currency: 'KRW', ...d.data(),
          })) as PlanItem[]
          items.push(...dayItems)
          metas.push({ dayId: dayDoc.id, label: dayData.label ?? dayDoc.id, date: dayData.date ?? '' })
        }
        setAllItems(items)
        setDayMetas(metas)
      } catch { /* 권한 없는 경우 무시 */ } finally {
        setItemsLoading(false)
      }
    }
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!meta])

  /* ── 파생 데이터 (rates 포함) ── */
  const totalSpent = useMemo(
    () => allItems.reduce((s, i) => s + toKRW(i.price ?? 0, i.currency || 'KRW', rates), 0),
    [allItems, rates]
  )

  const budgetPct = meta ? Math.min(100, Math.round((totalSpent / (meta.budget || 1)) * 100)) : 0

  const topPlaces = useMemo(() => {
    return allItems
      .map(i => {
        const avg = i.ratings && Object.keys(i.ratings).length > 0
          ? calcAvg(i.ratings)
          : (i.rating ?? 0)
        return { ...i, avg }
      })
      .filter(i => i.avg > 0 && i.cat !== '교통')
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4)
  }, [allItems])

  /* 기본 통화 감지 */
  const primaryCurrency = useMemo(() => {
    if (!meta) return 'KRW'
    return (meta as TripMeta & { currency?: string }).currency
      ?? detectCurrencies(meta.city)[0]
      ?? 'KRW'
  }, [meta])
  const isOverseas = primaryCurrency !== 'KRW'

  const totalSpentLocal = useMemo(() => {
    if (!isOverseas) return 0
    const rate = rates[primaryCurrency] ?? 1
    return allItems.reduce((s, i) => {
      if (!i.price || i.price <= 0) return s
      return s + (i.currency === primaryCurrency
        ? i.price
        : toKRW(i.price, i.currency || 'KRW', rates) / rate)
    }, 0)
  }, [allItems, rates, primaryCurrency, isOverseas])

  const daySummaries = useMemo(() =>
    dayMetas.map(dm => {
      const items = allItems.filter(i => i.dayId === dm.dayId)
      const localRate = rates[primaryCurrency] ?? 1
      return {
        label:      dm.label,
        date:       dm.date,
        highlights: items.filter(i => i.cat !== '교통').map(i => i.name).slice(0, 3),
        spent:      items.reduce((s, i) => s + toKRW(i.price ?? 0, i.currency || 'KRW', rates), 0),
        spentLocal: items.reduce((s, i) => {
          if (!i.price || i.price <= 0) return s
          return s + (i.currency === primaryCurrency
            ? i.price
            : toKRW(i.price, i.currency || 'KRW', rates) / localRate)
        }, 0),
      }
    }),
    [dayMetas, allItems, rates, primaryCurrency]
  )

  /* 멤버별 지출 (KRW) */
  const memberSpent = useMemo(() => {
    const members = (meta?.members ?? []).filter(m => !m.left)
    if (!members.length) return {} as Record<string, number>
    const result: Record<string, number> = {}
    members.forEach(m => { result[m.id] = 0 })
    allItems.forEach(item => {
      const krw = toKRW(item.price ?? 0, item.currency || 'KRW', rates)
      if (!krw || krw <= 0) return
      const allIds   = item.participantIds ?? []
      const validIds = allIds.filter(id => id in result)
      if (allIds.length > 0 && validIds.length > 0) {
        const share = krw / validIds.length
        validIds.forEach(id => { result[id] += share })
      } else {
        const share = krw / members.length
        members.forEach(m => { result[m.id] += share })
      }
    })
    return result
  }, [allItems, rates, meta])

  /* 멤버별 지출 (현지 통화) — 해외 여행 전용 */
  const memberSpentLocal = useMemo(() => {
    if (!isOverseas) return {} as Record<string, number>
    const members = (meta?.members ?? []).filter(m => !m.left)
    if (!members.length) return {} as Record<string, number>
    const result: Record<string, number> = {}
    members.forEach(m => { result[m.id] = 0 })
    const rate = rates[primaryCurrency] ?? 1
    allItems.forEach(item => {
      if (!item.price || item.price <= 0) return
      /* 모든 금액을 primaryCurrency로 환산 */
      const local = item.currency === primaryCurrency
        ? item.price
        : toKRW(item.price, item.currency || 'KRW', rates) / rate
      const allIds   = item.participantIds ?? []
      const validIds = allIds.filter(id => id in result)
      if (allIds.length > 0 && validIds.length > 0) {
        const share = local / validIds.length
        validIds.forEach(id => { result[id] += share })
      } else {
        const share = local / members.length
        members.forEach(m => { result[m.id] += share })
      }
    })
    return result
  }, [allItems, rates, meta, isOverseas, primaryCurrency])

  /* ── 리뷰 저장 ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallRating === 0) return
    const myReview: MemberReview = {
      rating:    overallRating,
      text:      review,
      name:      user!.displayName || user!.email?.split('@')[0] || '멤버',
      createdAt: Date.now(),
    }
    try {
      await updateDoc(doc(db, 'users', ownerUid, 'trips', tripId), {
        [`memberReviews.${user!.uid}`]: myReview,
      })
      setMemberReviews(prev => ({ ...prev, [user!.uid]: myReview }))
      setSubmitted(true)
    } catch { /* silent */ }
  }

  const fmtDate = (d: string) => d ? `${parseInt(d.slice(5,7))}/${parseInt(d.slice(8,10))}` : ''

  if (loading || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  const reviewList = Object.entries(memberReviews).sort((a, b) => b[1].createdAt - a[1].createdAt)
  const activeMembers = (meta.members ?? []).filter(m => !m.left)

  /* 히어로 카드 배경 */
  const heroStyle: React.CSSProperties = meta.coverPhotoURL
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%), url(${meta.coverPhotoURL})`,
        backgroundSize: 'cover',
        backgroundPosition: `center ${meta.coverPhotoPosition ?? 50}%`,
      }
    : { background: gradientStyle(meta.gradient) }

  const fiveStarCount = topPlaces.filter(p => p.avg >= 5).length

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Navbar ── */}
      <nav className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-10">
        <Link
          href={isOwner ? `/trips/${tripId}` : '#'}
          onClick={!isOwner ? (e) => { e.preventDefault(); window.history.back() } : undefined}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {isOwner ? '플래너' : '일정'}
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>여행 요약</span>
      </nav>

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6 sm:gap-8">

        {/* ── 히어로 카드 ── */}
        <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden" style={heroStyle}>
          {!meta.coverPhotoURL && (
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
          )}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-white/80" />
              <span className="text-sm font-semibold text-white/80">여행 완료</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {meta.title || meta.city}
            </h1>
            <p className="text-white/75 text-sm">
              {meta.startDate?.slice(5).replace('-','/')} – {meta.endDate?.slice(5).replace('-','/')} · {meta.nights}박 {meta.days}일 · {meta.people || 2}명
            </p>
            {!itemsLoading && allItems.length > 0 && (
              <div className="flex items-center gap-4 sm:gap-6 mt-5 flex-wrap">
                {([
                  { val: `${meta.nights}박`, label: '총 박수', sub: null },
                  { val: formatKRW(totalSpent) || '0원', label: '총 지출', sub: isOverseas && totalSpentLocal > 0 ? `${CURRENCY_SYMBOLS[primaryCurrency] ?? primaryCurrency}${Math.round(totalSpentLocal).toLocaleString()}` : null },
                  { val: `${fiveStarCount}곳`, label: '별점 5점', sub: null },
                ] as Array<{ val: string; label: string; sub: string | null }>).map(({ val, label, sub }, i) => (
                  <React.Fragment key={label}>
                    {i > 0 && <div className="w-px h-8 bg-white/20" />}
                    <div>
                      {sub && <p className="text-xs text-white/60 leading-none mb-0.5">{sub}</p>}
                      <p className="text-xl sm:text-2xl font-extrabold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{val}</p>
                      <p className="text-white/60 text-xs mt-0.5">{label}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 공통: 예산 + 베스트 장소 ── */}
        {!itemsLoading && allItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* 예산 요약 */}
              {(meta.budget || 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-gray-900">예산 요약</h2>
                  </div>
                  <div className="flex flex-col gap-3">
                    {([
                      { label: '총 예산',   krw: meta.budget,                            local: null,                               cls: 'text-gray-900' },
                      { label: '총 지출',   krw: totalSpent,                             local: isOverseas ? totalSpentLocal : null, cls: 'text-gray-900' },
                      { label: '남은 예산', krw: Math.abs(meta.budget - totalSpent),     local: null,                               cls: meta.budget >= totalSpent ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold', minus: meta.budget < totalSpent },
                    ] as Array<{ label: string; krw: number; local: number | null; cls: string; minus?: boolean }>).map(({ label, krw, local, cls, minus }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <div className={`flex flex-col items-end font-semibold ${cls}`}>
                          {local != null && (
                            <span className="text-xs text-gray-400 font-normal leading-none mb-0.5">
                              {CURRENCY_SYMBOLS[primaryCurrency] ?? primaryCurrency}{Math.round(local).toLocaleString()}
                            </span>
                          )}
                          <span>{minus ? '-' : ''}{formatKRW(krw) || '0원'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 text-right">{budgetPct}% 사용</p>
                  </div>
                </div>
              )}

              {/* 베스트 장소 */}
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
                          <SmallStars rating={p.avg} />
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

            {/* 멤버별 지출 */}
            {activeMembers.length > 1 && Object.keys(memberSpent).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-gray-900">멤버별 지출</h2>
                  <span className="text-xs text-gray-400 ml-1">균등 분배 기준</span>
                </div>
                <div className="flex flex-col gap-3">
                  {activeMembers
                    .sort((a, b) => (memberSpent[b.id] ?? 0) - (memberSpent[a.id] ?? 0))
                    .map(m => {
                      const spent  = memberSpent[m.id] ?? 0
                      const pct    = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0
                      const isMe   = m.id === user!.uid
                      return (
                        <div key={m.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                                {m.photoURL
                                  ? <img src={m.photoURL} alt={m.name} className="w-full h-full object-cover" />
                                  : m.name.slice(0, 1)
                                }
                              </div>
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {m.name}
                                {isMe && <span className="text-xs text-blue-500 ml-1">(나)</span>}
                              </span>
                              <span className="text-[11px] text-gray-400 flex-shrink-0">{ROLE_LABEL[m.role ?? 'member']}</span>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0 ml-2">
                              {isOverseas && (
                                <span className="text-xs text-gray-500 leading-none mb-0.5">
                                  {CURRENCY_SYMBOLS[primaryCurrency] ?? primaryCurrency}{Math.round(memberSpentLocal[m.id] ?? 0).toLocaleString()}
                                </span>
                              )}
                              <span className="text-sm font-bold text-gray-900">
                                {formatKRW(spent) || '0원'}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* 일별 하이라이트 */}
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
                          {fmtDate(d.date) || d.label.replace('Day ','')}
                        </div>
                        {i < daySummaries.length - 1 && (
                          <div className="w-0.5 bg-gray-100 flex-1 mt-1" style={{ minHeight: 20 }} />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-bold text-gray-900 mb-1">{d.label}</p>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {d.highlights.length > 0
                            ? d.highlights.map((h, j) => (
                                <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{h}</span>
                              ))
                            : <span className="text-xs text-gray-400">일정 없음</span>
                          }
                        </div>
                        {d.spent > 0 && (
                          <p className="text-xs text-gray-400">
                            {isOverseas && d.spentLocal > 0 && (
                              <span className="mr-1">
                                {CURRENCY_SYMBOLS[primaryCurrency] ?? primaryCurrency}{Math.round(d.spentLocal).toLocaleString()}
                              </span>
                            )}
                            {isOverseas && d.spentLocal > 0 && <span className="mr-1">·</span>}
                            {formatKRW(d.spent)} 지출
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 멤버 리뷰 목록 — 모든 멤버 공개 */}
        {reviewList.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900">멤버 리뷰</h2>
              <span className="text-xs text-gray-400 ml-1">{reviewList.length}명 작성</span>
            </div>
            <div className="flex flex-col gap-4">
              {reviewList.map(([reviewUid, r]) => {
                const member = activeMembers.find(m => m.id === reviewUid)
                const photo  = reviewUid === user!.uid
                  ? (user!.photoURL ?? member?.photoURL ?? null)
                  : (member?.photoURL ?? null)
                const isMe   = reviewUid === user!.uid
                return (
                  <div key={reviewUid} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 overflow-hidden flex-shrink-0">
                      {photo
                        ? <img src={photo} alt={r.name} className="w-full h-full object-cover" />
                        : r.name.slice(0, 1)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {r.name}
                          {isMe && <span className="text-xs text-blue-500 ml-1">(나)</span>}
                        </span>
                        <SmallStars rating={r.rating} />
                      </div>
                      {r.text && <p className="text-sm text-gray-600">"{r.text}"</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 내 리뷰 입력 ── */}
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
            <Link
              href={isOwner ? '/trips' : '#'}
              onClick={!isOwner ? (e) => { e.preventDefault(); window.history.back() } : undefined}
              className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-colors"
            >
              {isOwner ? '내 여행 목록으로' : '일정으로 돌아가기'} <ChevronRight className="w-4 h-4" />
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
                <textarea
                  rows={3}
                  placeholder="이번 여행에서 가장 기억에 남는 순간은?"
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={overallRating === 0}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
                >
                  리뷰 저장하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isOwner) window.location.href = '/trips'
                    else window.history.back()
                  }}
                  className="px-5 py-3.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  건너뛰기
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  )
}

export default function TripSummaryPage() {
  const { tripId } = useParams<{ tripId: string }>()
  return (
    <AuthGuard>
      <Suspense>
        <SummaryContent tripId={tripId} />
      </Suspense>
    </AuthGuard>
  )
}
