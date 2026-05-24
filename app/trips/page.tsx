'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, ChevronLeft, ChevronRight, Trash2, Palette, X, Info, Zap, Wrench, Crown, User, ChevronDown, Edit2, Users, Wallet, LogOut, Copy, Loader2 } from 'lucide-react'
import { collection, orderBy, query, where, doc, deleteDoc, getDocs, updateDoc, getDoc, addDoc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'
import { ExcelModal, type LiveTrip } from '@/components/organisms/ExcelModal'
import { TripEditModal, type TripEditFormData } from '@/components/TripEditModal'
import { ReportModal } from '@/components/ReportModal'
import { AppNavbar } from '@/components/AppNavbar'
import { gradientStyle, parseGradientHex } from '@/lib/tripGradient'
import { generateCode } from '@/lib/inviteCode'
import { useScrollLock } from '@/hooks/useScrollLock'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { ServiceRatingModal } from '@/components/ServiceRatingModal'

/* ── 타입 ── */
type TripStatus  = 'ongoing' | 'upcoming' | 'done'
type Filter      = 'all' | 'ongoing' | 'upcoming' | 'done'
type RoleFilter  = 'all' | 'owner' | 'member'

type Trip = {
  id:             string
  city:           string
  title?:         string
  startDate:      string
  endDate:        string
  nights:         number
  days:           number
  gradient:       string
  textDark?:      boolean
  isSample?:      boolean
  people?:        number
  currency?:      string
  budget?:        number
  coverPhotoURL?:      string
  coverPhotoPosition?: number
  members?:            Array<{ id: string; name: string; role: string; photoURL?: string; hexColor?: string; colorIndex?: number; left?: boolean }>
  pendingDelete?:      boolean
  deletedAt?:          { toMillis(): number } | null
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
  myRole:    'member' | 'treasurer'
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
  icon:       typeof Info
  label:      string
  accentBg:   string
  iconBg:     string
  iconColor:  string
  badge:      string
  btnBg:      string
}> = {
  notice:      { icon: Info,   label: '공지사항', accentBg: 'bg-blue-500',    iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700',    btnBg: 'bg-blue-600 hover:bg-blue-700' },
  event:       { icon: Zap,    label: '이벤트',   accentBg: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', btnBg: 'bg-emerald-600 hover:bg-emerald-700' },
  maintenance: { icon: Wrench, label: '점검 안내', accentBg: 'bg-orange-500', iconBg: 'bg-orange-50',  iconColor: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700',  btnBg: 'bg-orange-600 hover:bg-orange-700' },
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
  return `${start.replace(/-/g, '.')} ~ ${end.replace(/-/g, '.')}`
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

/* ── 공지사항 팝업 ── */
function AnnouncementModal() {
  const [queue,     setQueue]     = useState<Announcement[]>([])
  const [noShow24h, setNoShow24h] = useState(false)

  useEffect(() => {
    getDocs(collection(db, 'announcements'))
      .then(snap => {
        const now = Date.now()
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Announcement))
          .filter(a => a.active)
          .filter(a => {
            try {
              const until = localStorage.getItem(`ann_24h_${a.id}`)
              return !(until && now < parseInt(until))
            } catch { return true }
          })
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        setQueue(list)
      })
      .catch(() => {})
  }, [])

  const handleClose = () => {
    const current = queue[0]
    if (!current) return
    if (noShow24h) {
      try { localStorage.setItem(`ann_24h_${current.id}`, String(Date.now() + 24 * 3600 * 1000)) } catch {}
    }
    setNoShow24h(false)
    setQueue(prev => prev.slice(1))
  }

  const current = queue[0]
  if (!current) return null

  const meta = BANNER_META[current.type]
  const Icon = meta.icon

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 컬러 스트라이프 */}
        <div className={`h-1.5 ${meta.accentBg}`} />

        {/* 헤더 */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${meta.iconBg}`}>
              <Icon className={`w-5 h-5 ${meta.iconColor}`} />
            </div>
            <div className="pt-0.5">
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${meta.badge}`}>
                {meta.label}
              </span>
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{current.title}</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0 ml-2 -mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 pb-6 border-b border-gray-100">
          <p className="text-sm text-gray-600 leading-[1.8] whitespace-pre-wrap">{current.body}</p>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noShow24h}
              onChange={e => setNoShow24h(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-gray-700 cursor-pointer"
            />
            <span className="text-[12px] text-gray-500">24시간 동안 보지 않기</span>
          </label>
          <button
            onClick={handleClose}
            className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors ${meta.btnBg}`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

function parseTripCountry(city: string): string {
  const parts = city.split(',').map(s => s.trim())
  return parts[1] ?? ''
}

/* ── 내부 컴포넌트 ── */
function TripsContent() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const countryFilter = searchParams.get('country') ?? null

  const [trips,         setTrips]         = useState<Trip[]>([])
  const [invitedTrips,  setInvitedTrips]  = useState<InvitedTrip[]>([])
  const [dbLoading,     setDbLoading]     = useState(true)
  const [filter,     setFilter]     = useState<Filter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [page,       setPage]       = useState(1)
  const [showExcel, setShowExcel] = useState(false)
  const [darkOverride, setDarkOverride] = useState<Record<string, boolean>>({})
  const [seedLoading, setSeedLoading] = useState(false)
  const [editTarget,  setEditTarget]  = useState<Trip | null>(null)
  const [showReport,  setShowReport]  = useState(false)
  const [memberPopupTrip, setMemberPopupTrip] = useState<InvitedTrip | null>(null)
  const [copyingId,   setCopyingId]   = useState<string | null>(null)
  const [showReview,  setShowReview]  = useState(false)


  useScrollLock(showExcel || !!editTarget || showReport || !!memberPopupTrip)

  /* Firestore 1회 읽기 + 24시간 지난 소프트 딜리트 항목 정리 */
  const fetchTrips = async (uid: string) => {
    try {
      const q = query(collection(db, 'users', uid, 'trips'), orderBy('startDate', 'asc'))
      const snap = await getDocs(q)
      const now = Date.now()
      const MS_24H = 24 * 60 * 60 * 1000

      const toHardDelete: string[] = []
      const all = snap.docs.map(d => {
        const data = d.data() as Omit<Trip, 'id'> & { deletedAt?: { toMillis(): number } }
        if (data.pendingDelete && data.deletedAt) {
          if (now - data.deletedAt.toMillis() >= MS_24H) {
            toHardDelete.push(d.id)
            return null
          }
        }
        return { ...data, id: d.id }
      }).filter(Boolean) as Trip[]

      setTrips(all)

      /* 백그라운드: 24시간 지난 항목 실제 삭제 */
      for (const tripId of toHardDelete) {
        deleteDoc(doc(db, 'users', uid, 'trips', tripId)).catch(() => {})
      }
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
            const data = tripSnap.data()
            const members = (data.members ?? []) as Array<{ id: string; role: string }>
            const myMember = members.find(m => m.id === uid)
            const myRole: 'member' | 'treasurer' = myMember?.role === 'treasurer' ? 'treasurer' : 'member'
            return { id: ref.tripId, ...data, isInvited: true as const, viewCode: ref.viewCode, ownerUid: ref.ownerUid, myRole } as InvitedTrip
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

  /* 새 일정 등록 직후 서비스 후기 팝업 — 이미 작성한 사용자는 표시 안 함 */
  useEffect(() => {
    if (!user) return
    try {
      if (localStorage.getItem('showServiceReview')) {
        localStorage.removeItem('showServiceReview')
        getDocs(query(collection(db, 'serviceReviews'), where('uid', '==', user.uid)))
          .then(snap => { if (snap.empty) setShowReview(true) })
          .catch(() => setShowReview(true))
      }
    } catch {}
  }, [user])


  const tripsWithStatus = useMemo(
    () => trips.map(t => ({ ...t, status: getStatus(t) })),
    [trips]
  )

  const counts = useMemo(() => {
    const invitedWithStatus = invitedTrips.map(t => ({ ...t, status: getStatus(t) }))
    const ownPool     = roleFilter !== 'member' ? tripsWithStatus       : []
    const invPool     = roleFilter !== 'owner'  ? invitedWithStatus     : []
    const combined    = [...ownPool, ...invPool]
    return {
      all:      combined.length,
      ongoing:  combined.filter(t => t.status === 'ongoing').length,
      upcoming: combined.filter(t => t.status === 'upcoming').length,
      done:     combined.filter(t => t.status === 'done').length,
    }
  }, [tripsWithStatus, invitedTrips, roleFilter])

  const sorted = useMemo(() => {
    let filtered = filter === 'all'
      ? tripsWithStatus
      : tripsWithStatus.filter(t => t.pendingDelete || t.status === filter)
    if (countryFilter) {
      filtered = filtered.filter(t => t.pendingDelete || parseTripCountry(t.city) === countryFilter)
    }
    return [...filtered].sort((a, b) => {
      /* pendingDelete 항목은 맨 뒤 */
      if (a.pendingDelete && !b.pendingDelete) return 1
      if (!a.pendingDelete && b.pendingDelete) return -1
      const od = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (od !== 0) return od
      const ta = new Date(a.startDate).getTime()
      const tb = new Date(b.startDate).getTime()
      return a.status === 'done' ? tb - ta : ta - tb
    })
  }, [tripsWithStatus, filter, countryFilter])

  const sortedInvited = useMemo(() => {
    const withStatus = invitedTrips.map(t => ({ ...t, status: getStatus(t) }))
    let filtered = filter === 'all' ? withStatus : withStatus.filter(t => t.status === filter)
    if (countryFilter) {
      filtered = filtered.filter(t => parseTripCountry(t.city) === countryFilter)
    }
    return filtered.sort((a, b) => {
      const od = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (od !== 0) return od
      return a.status === 'done'
        ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        : new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })
  }, [invitedTrips, filter, countryFilter])

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

  const handleFilter     = (f: Filter)     => { setFilter(f); setPage(1) }
  const handleRoleFilter = (r: RoleFilter) => { setRoleFilter(r); setPage(1) }
  const handlePage       = (p: number)     => setPage(Math.max(1, Math.min(p, totalPages)))

  const handleSeedSample = async () => {
    if (!user || seedLoading) return
    setSeedLoading(true)
    try {
      const { seedSampleTrip } = await import('@/lib/seedSampleTrip')
      await seedSampleTrip(user.uid, user.displayName ?? '나')
      await fetchTrips(user.uid)
    } catch (e) {
      console.error('샘플 여행 생성 실패:', e)
    } finally {
      setSeedLoading(false)
    }
  }

  const handleLeaveInvited = async (e: React.MouseEvent, trip: InvitedTrip) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || !confirm('이 여행에서 탈퇴하시겠습니까?')) return

    setInvitedTrips(prev => prev.filter(t => t.id !== trip.id))

    try {
      const tripSnap = await getDoc(doc(db, 'users', trip.ownerUid, 'trips', trip.id))
      if (tripSnap.exists()) {
        const members = (tripSnap.data().members ?? []) as Array<{ id: string } & Record<string, unknown>>
        const updatedMembers = members.map(m =>
          m.id === user.uid ? { ...m, left: true } : m
        )
        await updateDoc(doc(db, 'users', trip.ownerUid, 'trips', trip.id), { members: updatedMembers })
      }
      await deleteDoc(doc(db, 'users', user.uid, 'invitedTrips', trip.id))
    } catch { /* silent */ }
  }

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return

    const now = Date.now()
    /* 로컬 상태 즉시 딤 처리 */
    setTrips(prev => prev.map(t =>
      t.id === tripId ? { ...t, pendingDelete: true, deletedAt: { toMillis: () => now } } : t
    ))

    /* Firestore 소프트 딜리트 마킹 */
    await updateDoc(doc(db, 'users', user.uid, 'trips', tripId), {
      pendingDelete: true,
      deletedAt:     serverTimestamp(),
    }).catch(() => {})
  }

  const handleRestore = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return

    /* 로컬 상태 즉시 복원 */
    setTrips(prev => prev.map(t =>
      t.id === tripId ? { ...t, pendingDelete: false, deletedAt: null } : t
    ))

    await updateDoc(doc(db, 'users', user.uid, 'trips', tripId), {
      pendingDelete: false,
      deletedAt:     null,
    }).catch(() => {})
  }

  const openCardEdit = (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault()
    e.stopPropagation()
    setEditTarget(trip)
  }

  const handleCopyTrip = async (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || copyingId) return
    setCopyingId(trip.id)
    try {
      const origSnap = await getDoc(doc(db, 'users', user.uid, 'trips', trip.id))
      if (!origSnap.exists()) return
      const origData = origSnap.data()

      const newViewCode = generateCode()
      const newEditCode = generateCode()
      // 복사 시 멤버는 방장(현재 유저)만 유지, 초대 코드 초기화
      const ownerMember = (origData.members ?? []).find((m: { role: string }) => m.role === 'owner')
      const newTripRef = await addDoc(collection(db, 'users', user.uid, 'trips'), {
        ...origData,
        title:         `${origData.title || origData.city} (복사)`,
        viewCode:      newViewCode,
        editCode:      newEditCode,
        members:       ownerMember ? [ownerMember] : [],
        joinCode:      null,
        joinPin:       null,
        pendingDelete: false,
        deletedAt:     null,
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
      })

      await Promise.all([
        setDoc(doc(db, 'shareIndex', newViewCode), { uid: user.uid, tripId: newTripRef.id, canEdit: false }),
        setDoc(doc(db, 'shareIndex', newEditCode), { uid: user.uid, tripId: newTripRef.id, canEdit: true }),
      ])

      const totalDays = (origData.days as number) || (origData.nights as number) + 1
      const batch = writeBatch(db)
      for (let d = 1; d <= totalDays; d++) {
        const dayId = `d${d}`
        const itemsSnap = await getDocs(collection(db, 'users', user.uid, 'trips', trip.id, 'days', dayId, 'items'))
        for (const itemDoc of itemsSnap.docs) {
          const newRef = doc(collection(db, 'users', user.uid, 'trips', newTripRef.id, 'days', dayId, 'items'))
          batch.set(newRef, itemDoc.data())
        }
      }
      await batch.commit()

      router.push(`/trips/${newTripRef.id}`)
    } catch { /* silent */ } finally {
      setCopyingId(null)
    }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: '전체' },
    { key: 'ongoing',  label: '여행중' },
    { key: 'upcoming', label: '예정' },
    { key: 'done',     label: '완료' },
  ]

  const totalTrips = tripsWithStatus.length + invitedTrips.length

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      <AppNavbar active="trips" onExcel={() => setShowExcel(true)} onReport={() => setShowReport(true)} />

      <AnnouncementModal />

      {showReview && <ServiceRatingModal onClose={() => setShowReview(false)} />}

      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-16 pt-6 sm:pt-10 pb-16">

        {/* 국가 필터 칩 */}
        {countryFilter && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">필터:</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
              {countryFilter}
              <button onClick={() => router.push('/trips')} className="ml-0.5 hover:text-blue-900 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              내 일정
            </h1>
          </div>
          {dbLoading
            ? <p className="text-sm text-gray-400">불러오는 중…</p>
            : <p className="text-sm text-gray-500">총 {totalTrips}개의 여행 · {totalNights}박 계획 중</p>
          }
        </div>

        {/* 필터 영역 */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
          {/* 상태 필터 — 스와이프 스크롤 */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 flex-1 min-w-0">
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

          {/* 역할 필터 — 보조 필터 (사각형 select) */}
          <div className="relative flex-shrink-0">
            <select
              value={roleFilter}
              onChange={e => handleRoleFilter(e.target.value as RoleFilter)}
              className="appearance-none pl-3 pr-7 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 bg-gray-50 cursor-pointer hover:border-gray-300 hover:bg-white transition-colors focus:outline-none focus:border-blue-400"
            >
              <option value="all">전체 역할</option>
              <option value="owner">방장</option>
              <option value="member">게스트</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
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
        ) : totalTrips === 0 ? (
          /* ── 첫 방문 온보딩 가이드 ── */
          <div className="flex flex-col items-center py-16 px-4">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  첫 여행을 계획해보세요
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Voyalogue로 여행 일정, 예산, 체크리스트를<br />한 곳에서 관리하세요.
                </p>
              </div>

              {/* 사용 방법 단계 */}
              <div className="space-y-3 mb-8">
                {[
                  { step: '01', title: '여행 만들기',    desc: '목적지와 날짜를 입력해 여행을 생성하세요.',      color: 'bg-blue-500' },
                  { step: '02', title: '일정 추가',       desc: '날짜별로 식사·장소·교통 일정을 기록하세요.',    color: 'bg-violet-500' },
                  { step: '03', title: '멤버 초대',       desc: '링크를 공유해 친구·가족과 함께 계획하세요.',    color: 'bg-emerald-500' },
                  { step: '04', title: '여행 후 별점',    desc: '방문한 장소에 별점을 남겨 추억을 기록하세요.', color: 'bg-amber-500' },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full ${color} text-white text-[11px] font-extrabold flex items-center justify-center`}>
                      {step}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none mb-1">{title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/trips/new"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm"
              >
                <MapPin className="w-4 h-4" />
                첫 여행 만들기
              </Link>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={handleSeedSample}
                disabled={seedLoading}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 text-gray-500 hover:text-blue-600 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seedLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                    </svg>
                    샘플 여행 생성 중…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    샘플 여행으로 둘러보기
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-400">
                도쿄 2박 3일 · 기능 체험용 샘플 데이터 · 언제든 삭제 가능
              </p>

            </div>
          </div>
        ) : sorted.length === 0 && (roleFilter === 'owner' || (roleFilter === 'all' && sortedInvited.length === 0)) ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <MapPin className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-medium">해당하는 여행이 없어요.</p>
          </div>
        ) : roleFilter === 'member' && sortedInvited.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <MapPin className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-medium">해당하는 초대된 여행이 없어요.</p>
          </div>
        ) : roleFilter !== 'member' && sorted.length > 0 ? (
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

                /* 대표 사진이 있으면 배경으로, 없으면 그라데이션 */
                const hasCover = !!trip.coverPhotoURL
                const cardBgStyle = hasCover
                  ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%), url(${trip.coverPhotoURL})`,
                      backgroundSize: 'cover',
                      backgroundPosition: `center ${trip.coverPhotoPosition ?? 50}%`,
                    }
                  : { background: gradientStyle(trip.gradient) }
                const effClrTitle  = hasCover ? 'text-white'                    : clrTitle
                const effClrSub    = hasCover ? 'text-white/85'                 : clrSub
                const effClrDate   = hasCover ? 'text-white/75'                 : clrDate
                const effClrIcon   = hasCover ? 'text-white/80'                 : clrIcon
                const effClrBtn    = hasCover ? 'bg-black/20 hover:bg-black/40 text-white' : clrBtn
                const effClrToggle = hasCover ? 'bg-white/20 hover:bg-white/30 text-white ring-1 ring-white/20' : clrToggle

                const isPending = !!trip.pendingDelete
                const deletedAtMs = trip.deletedAt?.toMillis() ?? Date.now()
                const remainHours = Math.max(1, Math.ceil(((deletedAtMs + 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)))

                return (
                  <div key={trip.id} className={`group relative ${isPending ? '' : 'cursor-pointer'}`}
                    onClick={isPending ? undefined : () => window.location.href = `/trips/${trip.id}`}>
                    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                      isPending ? 'border-red-200' : isOngoing ? 'border-green-300 ring-1 ring-green-200 group-hover:shadow-md group-hover:-translate-y-0.5' : 'border-gray-200 group-hover:shadow-md group-hover:-translate-y-0.5'
                    }`} style={isPending ? { filter: 'grayscale(80%)', opacity: 0.45 } : {}}>
                      <div className="h-[120px] sm:h-[130px] p-4 sm:p-5 flex flex-col justify-between relative"
                        style={cardBgStyle}>
                        <div className="flex items-start justify-between">
                          <Crown className={`w-5 h-5 sm:w-6 sm:h-6 ${effClrIcon}`} />
                          {!isPending && (
                            <div className="flex items-center gap-1.5">
                              {trip.isSample && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-sm">
                                  샘플
                                </span>
                              )}
                              {isOngoing && (
                                <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${hasCover || !isDark ? 'text-white bg-white/20' : 'text-gray-800 bg-black/10'}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />여행 중
                                </span>
                              )}
                              {!hasCover && (
                                <button
                                  onClick={e => toggleTextColor(e, trip)}
                                  title={isDark ? '흰색 텍스트로 전환' : '검은색 텍스트로 전환'}
                                  className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black transition-all ${effClrToggle}`}
                                >
                                  A
                                </button>
                              )}
                              {!hasCover && (
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
                                  <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${effClrToggle}`}>
                                    <Palette className="w-3.5 h-3.5" />
                                  </div>
                                </label>
                              )}
                              <button
                                onClick={e => handleDelete(e, trip.id)}
                                className="sm:opacity-0 sm:group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full transition-all bg-red-500 hover:bg-red-600 text-white shadow-sm"
                                title="여행 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-bold text-base leading-snug ${effClrTitle}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {trip.title || trip.city}
                          </p>
                          {trip.title && (
                            <p className={`text-xs font-medium mt-0.5 ${effClrSub}`}>{trip.city}</p>
                          )}
                          <p className={`text-xs mt-1 font-medium ${effClrDate}`}>{formatRange(trip.startDate, trip.endDate)}</p>
                        </div>
                      </div>
                      <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-2">
                        <span className={`text-sm font-semibold flex-1 ${isPending ? 'text-gray-400' : 'text-gray-700'}`}>{trip.nights}박 {trip.days}일</span>
                        {!isPending && (
                          <>
                            <button
                              onClick={e => openCardEdit(e, trip)}
                              title="여행 수정"
                              className="sm:opacity-0 sm:group-hover:opacity-100 w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0"
                            >
                              <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              onClick={e => handleCopyTrip(e, trip)}
                              title="여행 복사"
                              className="sm:opacity-0 sm:group-hover:opacity-100 w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0"
                              disabled={copyingId === trip.id}
                            >
                              {copyingId === trip.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Copy className="w-3.5 h-3.5" />
                              }
                            </button>
                          </>
                        )}
                        {isPending
                          ? <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 bg-red-100 text-red-500">삭제 예정</span>
                          : <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                        }
                      </div>
                    </div>
                    {isPending && (
                      <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-red-500 text-white shadow-md">
                          {remainHours}시간 후 삭제
                        </span>
                        <button
                          onClick={e => handleRestore(e, trip.id)}
                          className="text-[11px] font-bold px-4 py-1.5 rounded-full bg-white text-gray-800 hover:bg-gray-50 shadow-lg transition-all pointer-events-auto"
                        >
                          복원하기
                        </button>
                      </div>
                    )}
                  </div>
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
        ) : null}


        {/* 초대받은 여행 */}
        {!dbLoading && roleFilter !== 'owner' && sortedInvited.length > 0 && (
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
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{sortedInvited.length}</span>
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {sortedInvited.map(trip => {
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
                const isTreasurer = trip.myRole === 'treasurer'
                const activeMembers = (trip.members ?? []).filter(m => !m.left)
                const visibleMembers = activeMembers
                  .slice(0, 4)
                  .map(m => m.id === user?.uid
                    ? { ...m, photoURL: user.photoURL ?? m.photoURL, name: user.displayName ?? m.name }
                    : m
                  )
                const extraCount = Math.max(0, activeMembers.length - 4)
                const isPending    = !!trip.pendingDelete
                const deletedAtMs  = trip.deletedAt?.toMillis() ?? Date.now()
                const remainHours  = Math.max(1, Math.ceil(((deletedAtMs + 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)))
                const hasCover = !!trip.coverPhotoURL
                const invCardBgStyle = hasCover
                  ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%), url(${trip.coverPhotoURL})`,
                      backgroundSize: 'cover',
                      backgroundPosition: `center ${trip.coverPhotoPosition ?? 50}%`,
                    }
                  : { background: gradientStyle(trip.gradient) }
                const invClrTitle = hasCover ? 'text-white'    : clrTitle
                const invClrSub   = hasCover ? 'text-white/85' : clrSub
                const invClrDate  = hasCover ? 'text-white/75' : clrDate
                const invClrIcon  = hasCover ? 'text-white/80' : clrIcon

                return (
                  <div key={trip.id} className={`group relative ${!isPending ? 'cursor-pointer' : ''}`}
                    onClick={!isPending ? () => window.location.href = `/share/${trip.viewCode}` : undefined}>
                    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                      isPending ? 'border-red-200' : isOngoing ? 'border-green-300 ring-1 ring-green-200 group-hover:shadow-md group-hover:-translate-y-0.5' : 'border-indigo-100 ring-1 ring-indigo-50 group-hover:shadow-md group-hover:-translate-y-0.5'
                    }`} style={isPending ? { filter: 'grayscale(80%)', opacity: 0.45 } : {}}>
                      <div className="h-[120px] sm:h-[130px] p-4 sm:p-5 flex flex-col justify-between relative"
                        style={invCardBgStyle}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <User className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${invClrIcon}`} />
                            {isTreasurer ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white shadow-sm">
                                <Wallet className="w-2.5 h-2.5" />총무
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm text-white bg-white/20">
                                게스트
                              </span>
                            )}
                          </div>
                          {!isPending && (
                            <div className="flex items-center gap-1.5">
                              {isOngoing && (
                                <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm text-white bg-white/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />여행 중
                                </span>
                              )}
                              <button
                                onClick={e => handleLeaveInvited(e, trip)}
                                className="sm:opacity-0 sm:group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full transition-all bg-red-500 hover:bg-red-600 text-white shadow-sm"
                                title="여행 탈퇴"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-bold text-base leading-snug ${invClrTitle}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {trip.title || trip.city}
                          </p>
                          {trip.title && (
                            <p className={`text-xs font-medium mt-0.5 ${invClrSub}`}>{trip.city}</p>
                          )}
                          <p className={`text-xs mt-1 font-medium ${invClrDate}`}>{formatRange(trip.startDate, trip.endDate)}</p>
                        </div>
                      </div>
                      <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">{trip.nights}박 {trip.days}일</span>
                        {/* 멤버 아바타 스택 — 클릭 시 멤버 목록 팝업 */}
                        {visibleMembers.length > 0 ? (
                          <button
                            onClick={e => { e.preventDefault(); setMemberPopupTrip(trip) }}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                          >
                            <div className="flex -space-x-1.5">
                              {visibleMembers.map(m => (
                                <PersonAvatar
                                  key={m.id}
                                  name={m.name ?? '?'}
                                  photoURL={m.photoURL}
                                  size={22}
                                  stacked
                                  ringColor="white"
                                />
                              ))}
                              {extraCount > 0 && (
                                <div className="w-[22px] h-[22px] rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-500">
                                  +{extraCount}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{activeMembers.length}명</span>
                          </button>
                        ) : (
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                        )}
                      </div>
                    </div>
                    {isPending && (
                      <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-red-500 text-white shadow-md">
                          {remainHours}시간 후 삭제
                        </span>
                        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/90 text-gray-600 shadow">
                          방장이 여행을 삭제했습니다
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {showExcel && user && (
        <ExcelModal
          onClose={() => setShowExcel(false)}
          trips={[
            ...tripsWithStatus as LiveTrip[],
            ...invitedTrips.map(t => ({
              ...t,
              status:    getStatus(t),
              isInvited: true  as const,
            })) as LiveTrip[],
          ]}
          uid={user.uid}
        />
      )}

      {/* 여행 카드 수정 모달 */}
      {editTarget && user && (
        <TripEditModal
          city={editTarget.city}
          title={editTarget.title}
          startDate={editTarget.startDate}
          endDate={editTarget.endDate}
          people={editTarget.people}
          currency={editTarget.currency}
          budgetKRW={editTarget.budget}
          coverPhotoURL={editTarget.coverPhotoURL}
          coverPhotoPosition={editTarget.coverPhotoPosition}
          uid={user.uid}
          tripId={editTarget.id}
          onClose={() => setEditTarget(null)}
          onSave={async (data: TripEditFormData) => {
            await updateDoc(doc(db, 'users', user.uid, 'trips', editTarget.id), {
              title:         data.title || null,
              startDate:     data.startDate,
              endDate:       data.endDate,
              nights:        data.nights,
              days:          data.days,
              people:        data.people,
              currency:      data.currency || null,
              budget:        data.budgetKRW,
              coverPhotoURL:      data.coverPhotoURL ?? null,
              coverPhotoPosition: data.coverPhotoPosition ?? 50,
            })
            setTrips(prev => prev.map(t => t.id === editTarget.id
              ? { ...t,
                  title:              data.title || undefined,
                  startDate:          data.startDate,
                  endDate:            data.endDate,
                  nights:             data.nights,
                  days:               data.days,
                  people:             data.people,
                  currency:           data.currency,
                  budget:             data.budgetKRW,
                  coverPhotoURL:      data.coverPhotoURL,
                  coverPhotoPosition: data.coverPhotoPosition,
                }
              : t
            ))
          }}
        />
      )}

      {showReport && user && (
        <ReportModal user={user} onClose={() => setShowReport(false)} />
      )}

      {/* 초대받은 여행 멤버 목록 팝업 */}
      {memberPopupTrip && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => setMemberPopupTrip(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:w-[360px] mx-0 sm:mx-4 shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">{memberPopupTrip.title || memberPopupTrip.city}</p>
                <p className="text-xs text-gray-400 mt-0.5">여행 멤버 {memberPopupTrip.members?.length ?? 0}명</p>
              </div>
              <button
                onClick={() => setMemberPopupTrip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3 max-h-[60dvh] overflow-y-auto divide-y divide-gray-50">
              {(memberPopupTrip.members ?? []).map((m, i) => {
                const resolved = m.id === user?.uid
                  ? { ...m, photoURL: user.photoURL ?? m.photoURL, name: user.displayName ?? m.name }
                  : m
                const roleLabel = resolved.role === 'owner' ? '방장' : resolved.role === 'treasurer' ? '총무' : '멤버'
                const roleCls   = m.role === 'owner'
                  ? 'bg-indigo-100 text-indigo-700'
                  : m.role === 'treasurer'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
                const ci = resolved.hexColor ? undefined : (resolved.colorIndex ?? ((i % (CLAY.length - 1)) + 1))
                const ringC = resolved.hexColor ?? CLAY[ci ?? 1]?.base
                return (
                  <div key={m.id} className="flex items-center gap-3 py-3">
                    <PersonAvatar
                      name={resolved.name ?? '?'}
                      photoURL={resolved.photoURL}
                      size={36}
                      colorIndex={ci}
                      hexColor={resolved.hexColor}
                      ringColor={ringC}
                    />
                    <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{resolved.name ?? '알 수 없음'}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${roleCls}`}>{roleLabel}</span>
                  </div>
                )
              })}
            </div>
            <div className="px-5 pb-5 pt-2">
              <button
                onClick={() => setMemberPopupTrip(null)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function TripsPage() {
  return (
    <AuthGuard>
      <Suspense>
        <TripsContent />
      </Suspense>
    </AuthGuard>
  )
}
