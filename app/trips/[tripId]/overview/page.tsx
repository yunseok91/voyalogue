'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'
import { TripMap, type MapItem, type DayGroup, DAY_COLORS } from '@/components/TripMap'
import { ChevronRight, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'

/* ── 타입 ── */
type SlotLabel = '아침' | '점심' | '저녁' | '미정'

type PlanItem = {
  id:       string
  name:     string
  lat:      number
  lng:      number
  timeSlot: SlotLabel
  cat?:     string
  order:    number
}


type TripMeta = {
  title:          string
  city:           string
  startDate:      string
  days:           number
  ownerUid?:      string
}

/* ── 날짜 포맷 ── */
function fmtDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})`
}

const SLOT_ORDER: Record<string, number> = { 아침: 0, 점심: 1, 저녁: 2, 미정: 3 }

/* ── 메인 컴포넌트 ── */
function OverviewContent({ tripId }: { tripId: string }) {
  const router            = useRouter()
  const { user }          = useAuthStore()
  const uid               = user!.uid

  const [meta,      setMeta]      = useState<TripMeta | null>(null)
  const [dayItems,  setDayItems]  = useState<Record<string, PlanItem[]>>({})
  const [loading,   setLoading]   = useState(true)
  const [activeDayIdx, setActiveDayIdx] = useState(-1)  // -1 = 전체 일정

  /* 데이터 fetch (1회) */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const tripSnap = await getDoc(doc(db, 'users', uid, 'trips', tripId))
        if (!tripSnap.exists() || cancelled) return
        const m = tripSnap.data() as TripMeta & { ownerUid?: string }
        if (!cancelled) setMeta(m)

        /* items per day — meta.days 수 기반으로 d1~dN 직접 로드 (days 문서 존재 여부 무관) */
        const totalDays = (m as { days?: number }).days ?? 0
        const dayIds = Array.from({ length: totalDays }, (_, i) => `d${i + 1}`)
        const allItems: Record<string, PlanItem[]> = {}
        await Promise.all(dayIds.map(async dayId => {
          const snap = await getDocs(
            collection(db, 'users', uid, 'trips', tripId, 'days', dayId, 'items')
          )
          allItems[dayId] = snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanItem))
        }))
        if (!cancelled) setDayItems(allItems)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [uid, tripId])

  /* day labels — meta.days 기반으로 생성 */
  const days = useMemo(() => {
    if (!meta) return []
    const start = new Date(meta.startDate)
    return Array.from({ length: meta.days }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return {
        dayId: `d${i + 1}`,
        label: `Day ${i + 1}`,
        date:  d.toISOString().slice(0, 10),
      }
    })
  }, [meta])

  /* TripMap용 dayGroups */
  const dayGroups = useMemo<DayGroup[]>(() => {
    return days.map((day, idx) => {
      const color = DAY_COLORS[idx % DAY_COLORS.length]
      const raw   = (dayItems[day.dayId] ?? [])
        .slice()
        .sort((a, b) => (SLOT_ORDER[a.timeSlot] ?? 3) - (SLOT_ORDER[b.timeSlot] ?? 3) || a.order - b.order)
      const items: MapItem[] = raw.map(i => ({ id: i.id, name: i.name, lat: i.lat, lng: i.lng, timeSlot: i.timeSlot, cat: i.cat }))
      return { dayId: day.dayId, label: day.label, color, items }
    })
  }, [days, dayItems])

  const showAll      = activeDayIdx === -1
  const activeDay    = days[activeDayIdx]
  const activeDayId  = showAll ? undefined : activeDay?.dayId
  const activeGroup  = dayGroups[activeDayIdx]
  const activeItems  = activeGroup?.items.filter(i => !('markerType' in i)) ?? []

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">일정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!meta) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">여행을 찾을 수 없어요.</p>
      </div>
    )
  }

  /* ── 사이드 패널 공통 콘텐츠 ── */
  const sidePanel = (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">AI 일정 완성</span>
        </div>
        <h1 className="text-lg font-extrabold text-gray-900 leading-tight">{meta.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {meta.city} · {meta.days}박 {meta.days + 1}일
        </p>
      </div>

      {/* Day 탭 */}
      <div className="flex gap-1.5 px-4 py-3 flex-shrink-0 overflow-x-auto scrollbar-none">
        {/* 전체 일정 탭 */}
        <button
          onClick={() => setActiveDayIdx(-1)}
          className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeDayIdx === -1 ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span>전체</span>
          <span className="text-[10px] font-normal opacity-80 mt-0.5">일정</span>
        </button>

        {days.map((day, idx) => {
          const color = DAY_COLORS[idx % DAY_COLORS.length]
          const isAct = idx === activeDayIdx
          return (
            <button
              key={day.dayId}
              onClick={() => setActiveDayIdx(idx)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isAct ? 'text-white shadow-sm' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              }`}
              style={isAct ? { background: color } : undefined}
            >
              <span>{day.label}</span>
              {day.date && <span className="text-[10px] font-normal opacity-80 mt-0.5">{fmtDate(day.date)}</span>}
            </button>
          )
        })}
      </div>

      {/* 아이템 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        {showAll ? (
          /* 전체 일정 — 모든 Day 그룹 표시 */
          <div className="flex flex-col gap-4">
            {dayGroups.map((g, gi) => {
              const gItems = g.items.filter(i => !('markerType' in i && i.markerType === 'special'))
              if (gItems.length === 0) return null
              return (
                <div key={g.dayId}>
                  <button
                    onClick={() => setActiveDayIdx(gi)}
                    className="flex items-center gap-2 mb-2 hover:opacity-75 transition-opacity"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                    <span className="text-xs font-bold text-gray-700">{g.label}</span>
                    <span className="text-[10px] text-gray-400">{gItems.length}개</span>
                  </button>
                  <ol className="flex flex-col gap-1.5 pl-4">
                    {gItems.map((item, ii) => (
                      <li key={item.id} className="flex items-center gap-2 py-0.5">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: g.color }}>{ii + 1}</span>
                        <span className="text-xs text-gray-700 truncate">{item.name}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}
          </div>
        ) : activeItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">이 날 일정이 없어요</div>
        ) : (
          <ol className="flex flex-col gap-2">
            {activeItems.map((item, i) => {
              const color = activeGroup?.color ?? '#3B82F6'
              return (
                <li key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                    style={{ background: color }}
                  >{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{item.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.timeSlot}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
        <Link
          href={`/trips/${tripId}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
        >
          일정 확인하기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row">
      {/* 지도 영역 */}
      <div className="flex-1 relative min-h-0">
        {dayGroups.length > 0 && (
          <TripMap
            city={meta.city}
            items={[]}
            dayGroups={dayGroups}
            activeDayId={activeDayId}
          />
        )}
      </div>

      {/* 사이드 패널 — 데스크탑: 오른쪽 고정, 모바일: 하단 시트 */}
      <div className="hidden lg:flex lg:w-[340px] lg:flex-shrink-0 bg-white border-l border-gray-200 flex-col h-full overflow-hidden">
        {sidePanel}
      </div>

      {/* 모바일 하단 시트 */}
      <div className="lg:hidden bg-white border-t border-gray-200 flex flex-col" style={{ maxHeight: '55vh' }}>
        {sidePanel}
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const { tripId } = useParams<{ tripId: string }>()
  return <AuthGuard><OverviewContent tripId={tripId} /></AuthGuard>
}
