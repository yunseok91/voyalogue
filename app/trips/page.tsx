'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, ChevronLeft, ChevronRight, Trash2, Palette, X, Info, Zap, Wrench } from 'lucide-react'
import { collection, orderBy, query, doc, deleteDoc, getDocs, updateDoc, where, getDoc } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'
import { ExcelModal } from '@/components/organisms/ExcelModal'
import { AppNavbar } from '@/components/AppNavbar'
import { gradientStyle, parseGradientHex } from '@/lib/tripGradient'

/* ── 타입 ── */
type TripStatus = 'ongoing' | 'upcoming' | 'done'
type Filter     = 'all' | 'ongoing' | 'upcoming' | 'done'

type Trip = {
  id:        string
  city:      string
  title?:    string
  startDate: string
  endDate:   string
  nights:    number
  days:      number
  gradient:  string
  textDark?: boolean
}

type InvitedTripRef = {
  ownerUid: string
  tripId:   string
  viewCode: string
}

type InvitedTrip = Trip & {
  isInvited: true
  viewCode:  string
  ownerUid:  string
}

type AnnouncementType = 'notice' | 'event' | 'maintenance'

type Announcement = {
  id:        string
  title:     string
  body:      string
  type:      AnnouncementType
  active:    boolean
  createdAt: Timestamp
}

const BANNER_META: Record<AnnouncementType, {
  icon: typeof Info
  bg: string
  border: string
  text: string
  badge: string
  label: string
}> = {
  notice:      { icon: Info,   bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  badge: 'bg-blue-100 text-blue-700',   label: '공지' },
  event:       { icon: Zap,    bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700', label: '이벤트' },
  maintenance: { icon: Wrench, bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-800',badge: 'bg-orange-100 text-orange-700',label: '점검' },
}

const PAGE_SIZE   = 9
const TODAY       = new Date()
const STATUS_ORDER: Record<TripStatus, number> = { ongoing: 0, upcoming: 1, done: 2 }

function getStatus(trip: Trip): TripStatus {
  const s = new Date(trip.startDate), e = new Date(trip.endDate)
  if (TODAY >= s && TODAY <= e) return 'ongoing'
  if (TODAY < s) return 'upcoming'
  return 'done'
}

function getDday(startDate: string) {
  return Math.ceil((new Date(startDate).getTime() - TODAY.getTime()) / 86400000)
}

function formatRange(start: string, end: string) {
  return `${start.replace(/-/g, '.')} – ${end.slice(5).replace(/-/g, '.')}`
}

function pageNums(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const left  = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)
  const nums: (number | '…')[] = [1]
  if (left > 2) nums.push('…')
  for (let i = left; i <= right; i++) nums.push(i)
  if (right < total - 1) nums.push('…')
  nums.push(total)
  return nums
}

function darkenHex(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const h = (n: number) => Math.round(n * 0.65).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/* ── 공지사항 배너 ── */
function AnnouncementBanners() {
  const [banners, setBanners]   = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    getDocs(query(collection(db, 'announcements'), where('active', '==', true), orderBy('createdAt', 'desc')))
      .then(snap => setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement))))
      .catch(() => {/* silent */})
  }, [])

  const visible = banners.filter(b => !dismissed.has(b.id))
  if (visible.length === 0) return null

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 space-y-2">
      {visible.map(b => {
        const meta = BANNER_META[b.type]
        const Icon = meta.icon
        return (
          <div key={b.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${meta.bg} ${meta.border}`}>
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${meta.text}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${meta.badge}`}>{meta.label}</span>
                <span className={`text-sm font-semibold ${meta.text}`}>{b.title}</span>
              </div>
              <p className={`text-xs ${meta.text} opacity-80`}>{b.body}</p>
            </div>
            <button
              onClick={() => setDismissed(prev => new Set([...prev, b.id]))}
              className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors ${meta.text}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

type AdminMessage = {
  id: string
  title: string
  body: string
  createdAt: Timestamp
  read: boolean
}

/* ── 내부 컴포넌트 ── */
function TripsContent() {
  const { user } = useAuthStore()
  const [trips,         setTrips]         = useState<Trip[]>([])
  const [invitedTrips,  setInvitedTrips]  = useState<InvitedTrip[]>([])
  const [dbLoading,     setDbLoading]     = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [page,   setPage]   = useState(1)
  const [showExcel, setShowExcel] = useState(false)
  const [darkOverride, setDarkOverride] = useState<Record<string, boolean>>({})
  const [popupMsg, setPopupMsg] = useState<AdminMessage | null>(null)

  /* Firestore 1회 읽기 (onSnapshot 대신 getDocs — 비용 절감) */
  const fetchTrips = async (uid: string) => {
    try {
      const q = query(collection(db, 'users', uid, 'trips'), orderBy('startDate', 'asc'))
      const snap = await getDocs(q)
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Trip[])
    } catch { /* silent */ } finally {
      setDbLoading(false)
    }
  }

  const fetchInvitedTrips = async (uid: string) => {
    try {
      const refSnap = await getDocs(collection(db, 'users', uid, 'invitedTrips'))
      const refs = refSnap.docs.map(d => d.data() as InvitedTripRef)
      const settled = await Promise.all(
        refs.map(async (ref) => {
          try {
            const tripSnap = await getDoc(doc(db, 'users', ref.ownerUid, 'trips', ref.tripId))
            if (!tripSnap.exists()) return null
            return { id: ref.tripId, ...tripSnap.data(), isInvited: true as const, viewCode: ref.viewCode, ownerUid: ref.ownerUid } as InvitedTrip
          } catch { return null }
        })
      )
      setInvitedTrips(settled.filter(Boolean) as InvitedTrip[])
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (!user) return
    fetchTrips(user.uid)
    fetchInvitedTrips(user.uid)

    /* 탭 포커스 복귀 시 재조회 (다른 페이지에서 여행 수정 후 돌아왔을 때 갱신) */
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchTrips(user.uid)
        fetchInvitedTrips(user.uid)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  /* 마운트 시 미읽음 메시지 중 최신 1개 팝업 */
  useEffect(() => {
    if (!user) return
    const fetchPopup = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'messages'),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        const unread = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as AdminMessage))
          .find(m => !m.read)
        if (unread) setPopupMsg(unread)
      } catch { /* silent */ }
    }
    fetchPopup()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const tripsWithStatus = useMemo(
    () => trips.map(t => ({ ...t, status: getStatus(t) })),
    [trips]
  )

  const counts = useMemo(() => ({
    all:      tripsWithStatus.length,
    ongoing:  tripsWithStatus.filter(t => t.status === 'ongoing').length,
    upcoming: tripsWithStatus.filter(t => t.status === 'upcoming').length,
    done:     tripsWithStatus.filter(t => t.status === 'done').length,
  }), [tripsWithStatus])

  const sorted = useMemo(() => {
    const filtered = filter === 'all'
      ? tripsWithStatus
      : tripsWithStatus.filter(t => t.status === filter)
    return [...filtered].sort((a, b) => {
      const od = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (od !== 0) return od
      const ta = new Date(a.startDate).getTime()
      const tb = new Date(b.startDate).getTime()
      return a.status === 'done' ? tb - ta : ta - tb
    })
  }, [tripsWithStatus, filter])

  const totalPages   = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentTrips = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalNights  = tripsWithStatus.reduce((s, t) => s + t.nights, 0)

  const getIsDark = (trip: Trip) => darkOverride[trip.id] ?? trip.textDark ?? false

  const toggleTextColor = async (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !getIsDark(trip)
    setDarkOverride(prev => ({ ...prev, [trip.id]: next }))
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'trips', trip.id), { textDark: next })
      } catch {
        setDarkOverride(prev => ({ ...prev, [trip.id]: !next }))
      }
    }
  }

  const handleColorApply = async (hex: string, tripId: string) => {
    if (!user) return
    const gradient = `${hex},${darkenHex(hex)}`
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, gradient } : t))
    try {
      await updateDoc(doc(db, 'users', user.uid, 'trips', tripId), { gradient })
    } catch { /* silent */ }
  }

  const handleFilter = (f: Filter) => { setFilter(f); setPage(1) }
  const handlePage   = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault()
    if (!user || !confirm('이 여행을 삭제할까요?')) return

    /* UI 즉시 반영 (getDocs 재조회 없이 로컬 state 갱신) */
    setTrips(prev => prev.filter(t => t.id !== tripId))

    /* Firestore 하위 문서 일괄 삭제 */
    const daysSnap = await getDocs(collection(db, 'users', user.uid, 'trips', tripId, 'days'))
    for (const dayDoc of daysSnap.docs) {
      const itemsSnap = await getDocs(collection(db, 'users', user.uid, 'trips', tripId, 'days', dayDoc.id, 'items'))
      for (const itemDoc of itemsSnap.docs) {
        await deleteDoc(doc(db, 'users', user.uid, 'trips', tripId, 'days', dayDoc.id, 'items', itemDoc.id))
      }
      await deleteDoc(doc(db, 'users', user.uid, 'trips', tripId, 'days', dayDoc.id))
    }
    await deleteDoc(doc(db, 'users', user.uid, 'trips', tripId))

    /* Storage 영수증 파일 삭제 */
    try {
      const [{ storage }, { ref, listAll, deleteObject }] = await Promise.all([
        import('@/lib/firebase'),
        import('firebase/storage'),
      ])
      const receiptsRef = ref(storage, `users/${user.uid}/trips/${tripId}/receipts`)
      const listed = await listAll(receiptsRef)
      await Promise.all(listed.items.map(item => deleteObject(item)))
    } catch { /* Storage 경로 없으면 무시 */ }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: '전체' },
    { key: 'ongoing',  label: '여행중' },
    { key: 'upcoming', label: '예정' },
    { key: 'done',     label: '완료' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, sans-serif' }}>

      <AppNavbar active="trips" onExcel={() => setShowExcel(true)} />

      <AnnouncementBanners />

      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-16 pt-6 sm:pt-10 pb-16">

        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            내 일정
          </h1>
          {dbLoading
            ? <p className="text-sm text-gray-400">불러오는 중…</p>
            : <p className="text-sm text-gray-500">총 {counts.all}개의 여행 · {totalNights}박 계획 중</p>
          }
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-2 mb-5 sm:mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => handleFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                filter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full leading-none ${
                filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* 로딩 스켈레톤 */}
        {dbLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-[120px] bg-gray-200" />
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-6 w-14 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <MapPin className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-medium">해당하는 여행이 없어요.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
              {currentTrips.map(trip => {
                const isOngoing  = trip.status === 'ongoing'
                const isUpcoming = trip.status === 'upcoming'
                const badge = isOngoing  ? { label: '여행중', cls: 'bg-green-500 text-white' }
                            : isUpcoming ? { label: `D-${getDday(trip.startDate)}`, cls: 'bg-blue-50 text-blue-600' }
                            :              { label: '완료', cls: 'bg-gray-100 text-gray-500' }
                const isDark = getIsDark(trip)

                /* 텍스트 색상 — isDark 기준 */
                const clrTitle    = isDark ? 'text-gray-900'   : 'text-white'
                const clrSub      = isDark ? 'text-gray-600'   : 'text-white/85'
                const clrDate     = isDark ? 'text-gray-500'   : 'text-white/80'
                const clrIcon     = isDark ? 'text-gray-700'   : 'text-white/80'
                const clrBtn      = isDark ? 'bg-black/10 hover:bg-black/20 text-gray-800' : 'bg-black/20 hover:bg-black/40 text-white'
                const clrToggle   = isDark
                  ? 'bg-black/10 hover:bg-black/20 text-gray-800 ring-1 ring-black/10'
                  : 'bg-white/20 hover:bg-white/30 text-white ring-1 ring-white/20'

                return (
                  <Link key={trip.id} href={`/trips/${trip.id}`} className="group relative">
                    <div className={`bg-white rounded-2xl border overflow-hidden transition-all group-hover:shadow-md group-hover:-translate-y-0.5 ${
                      isOngoing ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'
                    }`}>
                      <div className="h-[120px] sm:h-[130px] p-4 sm:p-5 flex flex-col justify-between relative"
                        style={{ background: gradientStyle(trip.gradient) }}>
                        <div className="flex items-start justify-between">
                          <MapPin className={`w-6 h-6 sm:w-7 sm:h-7 ${clrIcon}`} />
                          <div className="flex items-center gap-1.5">
                            {isOngoing && (
                              <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${isDark ? 'text-gray-800 bg-black/10' : 'text-white bg-white/20'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />여행 중
                              </span>
                            )}
                            {/* 텍스트 색상 토글 */}
                            <button
                              onClick={e => toggleTextColor(e, trip)}
                              title={isDark ? '흰색 텍스트로 전환' : '검은색 텍스트로 전환'}
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black transition-all ${clrToggle}`}
                            >
                              A
                            </button>
                            {/* 팔레트 */}
                            <label
                              title="색상 변경"
                              onClick={e => e.stopPropagation()}
                              style={{ cursor: 'pointer', position: 'relative', display: 'flex' }}
                            >
                              <input
                                type="color"
                                defaultValue={parseGradientHex(trip.gradient).from}
                                onChange={e => handleColorApply(e.target.value, trip.id)}
                                style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                              />
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${clrToggle}`}>
                                <Palette className="w-3.5 h-3.5" />
                              </div>
                            </label>
                            <button
                              onClick={e => handleDelete(e, trip.id)}
                              className={`opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full transition-all ${clrBtn}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className={`font-bold text-base leading-snug ${clrTitle}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {trip.title || trip.city}
                          </p>
                          {trip.title && (
                            <p className={`text-xs font-medium mt-0.5 ${clrSub}`}>{trip.city}</p>
                          )}
                          <p className={`text-xs mt-1 font-medium ${clrDate}`}>{formatRange(trip.startDate, trip.endDate)}</p>
                        </div>
                      </div>
                      <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">{trip.nights}박 {trip.days}일</span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => handlePage(page - 1)} disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageNums(page, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                  ) : (
                    <button key={p} onClick={() => handlePage(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                        p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                      }`}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => handlePage(page + 1)} disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {totalPages > 1 && (
              <p className="text-center text-xs text-gray-400 mt-3">
                {sorted.length}개 중 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)}번째
              </p>
            )}
          </>
        )}

        {/* 초대받은 여행 */}
        {!dbLoading && invitedTrips.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="h-px flex-1 bg-gray-200" />
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <h2 className="text-lg font-extrabold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  초대받은 여행
                </h2>
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{invitedTrips.length}</span>
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {invitedTrips
                .map(trip => ({ ...trip, status: getStatus(trip) }))
                .sort((a, b) => {
                  const od = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
                  if (od !== 0) return od
                  return a.status === 'done'
                    ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                    : new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                })
                .map(trip => {
                  const isOngoing  = trip.status === 'ongoing'
                  const isUpcoming = trip.status === 'upcoming'
                  const badge = isOngoing  ? { label: '여행중', cls: 'bg-green-500 text-white' }
                              : isUpcoming ? { label: `D-${getDday(trip.startDate)}`, cls: 'bg-blue-50 text-blue-600' }
                              :              { label: '완료', cls: 'bg-gray-100 text-gray-500' }
                  const isDark = trip.textDark ?? false
                  const clrTitle = isDark ? 'text-gray-900' : 'text-white'
                  const clrSub   = isDark ? 'text-gray-600' : 'text-white/85'
                  const clrDate  = isDark ? 'text-gray-500' : 'text-white/80'
                  const clrIcon  = isDark ? 'text-gray-700' : 'text-white/80'

                  return (
                    <Link key={trip.id} href={`/share/${trip.viewCode}`} className="group relative">
                      <div className={`bg-white rounded-2xl border overflow-hidden transition-all group-hover:shadow-md group-hover:-translate-y-0.5 ${
                        isOngoing ? 'border-green-300 ring-1 ring-green-200' : 'border-indigo-100 ring-1 ring-indigo-50'
                      }`}>
                        <div className="h-[120px] sm:h-[130px] p-4 sm:p-5 flex flex-col justify-between relative"
                          style={{ background: gradientStyle(trip.gradient) }}>
                          <div className="flex items-start justify-between">
                            <MapPin className={`w-6 h-6 sm:w-7 sm:h-7 ${clrIcon}`} />
                            <div className="flex items-center gap-1.5">
                              {isOngoing && (
                                <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${isDark ? 'text-gray-800 bg-black/10' : 'text-white bg-white/20'}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />여행 중
                                </span>
                              )}
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-sm ${isDark ? 'text-indigo-700 bg-indigo-100/80' : 'text-white bg-white/20'}`}>
                                초대됨
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className={`font-bold text-base leading-snug ${clrTitle}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {trip.title || trip.city}
                            </p>
                            {trip.title && (
                              <p className={`text-xs font-medium mt-0.5 ${clrSub}`}>{trip.city}</p>
                            )}
                            <p className={`text-xs mt-1 font-medium ${clrDate}`}>{formatRange(trip.startDate, trip.endDate)}</p>
                          </div>
                        </div>
                        <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">{trip.nights}박 {trip.days}일</span>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        )}
      </main>

      {showExcel && user && (
        <ExcelModal
          onClose={() => setShowExcel(false)}
          trips={tripsWithStatus}
          uid={user.uid}
        />
      )}

      {/* 운영자 메시지 팝업 */}
      {popupMsg && user && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div
            className="bg-white rounded-2xl w-[360px] mx-4 shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-blue-600 px-5 py-3">
              <span className="text-xs font-bold text-white/80 tracking-wide">운영자 메시지</span>
            </div>
            <div className="px-5 py-5">
              <p className="text-base font-bold text-gray-900 mb-2">{popupMsg.title}</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{popupMsg.body}</p>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, 'users', user.uid, 'messages', popupMsg.id), { read: true })
                  } catch { /* silent */ }
                  setPopupMsg(null)
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TripsPage() {
  return <AuthGuard><TripsContent /></AuthGuard>
}
