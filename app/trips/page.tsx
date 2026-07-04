'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, ChevronLeft, ChevronRight, Trash2, Palette, X, Info, Zap, Wrench, Crown, User, ChevronDown, Edit2, Users, Wallet, Car, LogOut, Copy, Loader2, Megaphone } from 'lucide-react'
import { collection, orderBy, query, where, doc, deleteDoc, getDocs, updateDoc, getDoc, addDoc, serverTimestamp, writeBatch, setDoc, onSnapshot } from 'firebase/firestore'
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
import { PWAInstallBanner } from '@/components/PWAInstallBanner'

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
  coverPhotoScale?:    number
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
  isInvited:   true
  viewCode:    string
  ownerUid:    string
  myRole:      'member' | 'treasurer'
  myIsDriver?: boolean
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


/* ── 운영자 메시지 팝업 ── */
type AdminMsg = { id: string; title: string; body: string; read: boolean; type?: string }

function AdminMessageModal() {
  const { user } = useAuthStore()
  const [queue,     setQueue]     = useState<AdminMsg[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'messages'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as AdminMsg))
        .filter(m => m.type === 'admin' && !m.read)
      setQueue(msgs)
    }, () => {})
    return unsub
  }, [user?.uid])

  const visible = queue.filter(m => !dismissed.has(m.id))
  const current = visible[0]
  if (!current) return null

  const handleConfirm = () => {
    if (!user) return
    updateDoc(doc(db, 'users', user.uid, 'messages', current.id), { read: true }).catch(() => {})
  }

  const handleDismiss = () => {
    setDismissed(prev => new Set(prev).add(current.id))
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-violet-500" />
        {/* 헤더 */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-3">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-violet-50">
            <Megaphone className="w-5 h-5 text-violet-500" />
          </div>
          <div className="pt-0.5">
            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5 bg-violet-100 text-violet-700">
              운영자 메시지
            </span>
            <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{current.title}</h3>
          </div>
        </div>
        {/* 본문 */}
        <div className="px-6 pb-5">
          <p className="text-sm text-gray-600 leading-[1.8] whitespace-pre-wrap">{current.body}</p>
        </div>
        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center mb-3 leading-snug">
            메시지를 읽으셨나요?<br />
            <span className="text-violet-400 font-semibold">확인했어요</span>를 누르면 이 메시지를 다시 표시하지 않아요
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              나중에 볼게요
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
            >
              확인했어요 ✓
            </button>
          </div>
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
  const { user, resolvedPhotoURL } = useAuthStore()
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
            const myMember   = members.find(m => m.id === uid) as { id: string; role: string; isDriver?: boolean } | undefined
            const myRole: 'member' | 'treasurer' = myMember?.role === 'treasurer' ? 'treasurer' : 'member'
            const myIsDriver = !!(myMember?.isDriver || myMember?.role === 'driver')
            return { id: ref.tripId, ...data, isInvited: true as const, viewCode: ref.viewCode, ownerUid: ref.ownerUid, myRole, myIsDriver } as InvitedTrip
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

    if (!window.confirm('여행을 삭제하시겠습니까?\n24시간 후에 완전히 삭제됩니다.')) return

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

    if (!window.confirm('여행을 복제하시겠습니까?')) return

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
      <AdminMessageModal />
      <PWAInstallBanner />

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
              className="appearance-none pl-4 pr-7 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 bg-white cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all focus:outline-none focus:border-blue-400"
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
              <div key={i} className="bg-gray-200 rounded-2xl h-[190px] sm:h-[200px] animate-pulse" />
            ))}
          </div>
        ) : totalTrips === 0 ? (
          /* ── 첫 방문 온보딩 가이드 ── */
          <div className="flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-md">

              {/* 환영 헤더 */}
              <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600 px-8 pt-10 pb-8 text-center">
                {/* 배경 장식 */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
                    <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {user?.displayName ? `${user.displayName.split(' ')[0]}님, 환영해요!` : '환영합니다!'}
                  </h2>
                  <p className="text-sm text-white/80 leading-relaxed">
                    첫 여행을 만들고 특별한 추억을<br />기록해보세요
                  </p>
                </div>
              </div>

              {/* 사용 방법 단계 */}
              <div className="space-y-2.5 mb-6">
                {[
                  { step: '01', title: '여행 만들기',   desc: '목적지와 날짜를 입력해 여행을 생성하세요.',     color: 'bg-blue-500' },
                  { step: '02', title: '일정 추가',      desc: '날짜별로 식사·장소·교통 일정을 기록하세요.',   color: 'bg-violet-500' },
                  { step: '03', title: '멤버 초대',      desc: '링크를 공유해 친구·가족과 함께 계획하세요.',   color: 'bg-emerald-500' },
                  { step: '04', title: '여행 후 별점',   desc: '방문한 장소에 별점을 남겨 추억을 기록하세요.', color: 'bg-amber-500' },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full ${color} text-white text-[11px] font-extrabold flex items-center justify-center`}>
                      {step}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none mb-0.5">{title}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/trips/new"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold transition-all shadow-md"
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
                const badge = isOngoing  ? '여행중'
                            : isUpcoming ? `D-${getDday(trip.startDate)}`
                            :              '완료'
                const isPending   = !!trip.pendingDelete
                const isDone      = !isOngoing && !isUpcoming && !isPending
                const deletedAtMs = trip.deletedAt?.toMillis() ?? Date.now()
                const remainHours = Math.max(1, Math.ceil(((deletedAtMs + 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)))
                const hasCover    = !!trip.coverPhotoURL
                const coverScale  = trip.coverPhotoScale ?? 1
                const cardBgStyle = hasCover
                  ? {
                      backgroundImage:    `url(${trip.coverPhotoURL})`,
                      backgroundSize:     coverScale > 1 ? `${coverScale * 100}% auto` : 'cover',
                      backgroundPosition: `center ${trip.coverPhotoPosition ?? 50}%`,
                    }
                  : { background: gradientStyle(trip.gradient) }

                const nightsLabel = trip.nights === 0 ? '당일치기' : `${trip.nights}박 ${trip.days}일`
                const dateRange   = formatRange(trip.startDate, trip.endDate)

                return (
                  <div
                    key={trip.id}
                    className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 ${
                      isPending
                        ? 'border-red-100 opacity-50 grayscale pointer-events-none'
                        : isDone
                        ? 'cursor-pointer border-gray-100 shadow-sm opacity-70 hover:opacity-100 hover:shadow-xl hover:-translate-y-0.5'
                        : isOngoing
                        ? 'cursor-pointer border-green-200 ring-2 ring-green-300/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5'
                        : 'cursor-pointer border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                    onClick={isPending ? undefined : () => window.location.href = `/trips/${trip.id}`}
                  >
                    {/* 이미지 영역 */}
                    <div className="relative h-[180px] sm:h-[196px] overflow-hidden">
                      <div className="absolute inset-0" style={{
                        ...cardBgStyle,
                        ...(isDone ? { filter: 'grayscale(50%) brightness(0.8)' } : {}),
                      }} />

                      {/* 여행중 배지 — 좌상단 */}
                      {isOngoing && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500 text-white shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
                            여행중
                          </span>
                        </div>
                      )}
                      {trip.isSample && (
                        <div className="absolute top-3 left-3 z-10 ml-[80px]">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">샘플</span>
                        </div>
                      )}

                      {/* 컨트롤 버튼 — hover 시 우상단 */}
                      {!isPending && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {!hasCover && (
                            <label onClick={e => e.stopPropagation()} className="cursor-pointer relative flex" title="색상 변경">
                              <input type="color" defaultValue={parseGradientHex(trip.gradient).from}
                                onChange={e => handleColorApply(e.target.value, trip.id)}
                                style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                              />
                              <div className="w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-sm flex items-center justify-center">
                                <Palette className="w-3.5 h-3.5" />
                              </div>
                            </label>
                          )}
                          <button onClick={e => openCardEdit(e, trip)} title="수정"
                            className="w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-sm flex items-center justify-center">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => handleCopyTrip(e, trip)} title="복사" disabled={copyingId === trip.id}
                            className="w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-sm flex items-center justify-center">
                            {copyingId === trip.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={e => handleDelete(e, trip.id)} title="삭제"
                            className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm flex items-center justify-center">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 정보 바 — 흰 배경 */}
                    <div className="px-4 py-3.5">
                      <p className="font-bold text-[15px] text-gray-900 leading-tight truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {trip.title || trip.city}
                      </p>
                      {trip.title && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{trip.city}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-700">{nightsLabel}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{dateRange}</p>
                        </div>
                        {isPending
                          ? <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-500 flex-shrink-0">삭제 예정</span>
                          : isUpcoming
                          ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">{badge}</span>
                          : isDone
                          ? <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 flex-shrink-0">완료</span>
                          : null
                        }
                      </div>
                    </div>

                    {/* 삭제 예정 오버레이 */}
                    {isPending && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-auto">
                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-red-500 text-white shadow-md">{remainHours}시간 후 삭제</span>
                        <button onClick={e => handleRestore(e, trip.id)}
                          className="text-[11px] font-bold px-4 py-1.5 rounded-full bg-white text-gray-800 hover:bg-gray-50 shadow-lg transition-all">
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
                const isDone = !isOngoing && !isUpcoming
                const badge = isOngoing  ? '여행중'
                            : isUpcoming ? `D-${getDday(trip.startDate)}`
                            :              '완료'
                const isTreasurer   = trip.myRole === 'treasurer'
                const myIsDriver    = !!(trip as InvitedTrip).myIsDriver
                const activeMembers = (trip.members ?? []).filter(m => !m.left)
                const visibleMembers = activeMembers
                  .slice(0, 4)
                  .map(m => m.id === user?.uid
                    ? { ...m, photoURL: resolvedPhotoURL || user.photoURL || m.photoURL, name: user.displayName ?? m.name }
                    : m
                  )
                const extraCount  = Math.max(0, activeMembers.length - 4)
                const isPending   = !!trip.pendingDelete
                const deletedAtMs = trip.deletedAt?.toMillis() ?? Date.now()
                const remainHours = Math.max(1, Math.ceil(((deletedAtMs + 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)))
                const hasCover    = !!trip.coverPhotoURL
                const coverScale  = (trip as Trip & { coverPhotoScale?: number }).coverPhotoScale ?? 1
                const invBgStyle  = hasCover
                  ? {
                      backgroundImage:    `url(${trip.coverPhotoURL})`,
                      backgroundSize:     coverScale > 1 ? `${coverScale * 100}% auto` : 'cover',
                      backgroundPosition: `center ${trip.coverPhotoPosition ?? 50}%`,
                    }
                  : { background: gradientStyle(trip.gradient) }

                const nightsLabel = trip.nights === 0 ? '당일치기' : `${trip.nights}박 ${trip.days}일`
                const dateRange   = formatRange(trip.startDate, trip.endDate)

                return (
                  <div
                    key={trip.id}
                    className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 ${
                      isPending
                        ? 'border-red-100 opacity-50 grayscale pointer-events-none'
                        : isDone
                        ? 'cursor-pointer border-gray-100 shadow-sm opacity-70 hover:opacity-100 hover:shadow-xl hover:-translate-y-0.5'
                        : isOngoing
                        ? 'cursor-pointer border-green-200 ring-2 ring-green-300/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5'
                        : 'cursor-pointer border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                    onClick={!isPending ? () => window.location.href = `/share/${trip.viewCode}` : undefined}
                  >
                    {/* 이미지 영역 */}
                    <div className="relative h-[180px] sm:h-[196px] overflow-hidden">
                      <div className="absolute inset-0" style={{
                        ...invBgStyle,
                        ...(isDone ? { filter: 'grayscale(50%) brightness(0.8)' } : {}),
                      }} />

                      {/* 여행중 배지 — 좌상단 */}
                      {isOngoing && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500 text-white shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
                            여행중
                          </span>
                        </div>
                      )}

                      {/* 역할 배지 — 좌상단 (여행중 아닐 때) */}
                      {!isOngoing && (
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1">
                          {isTreasurer && (
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/90 text-white backdrop-blur-sm">
                              <Wallet className="w-2.5 h-2.5" />총무
                            </span>
                          )}
                          {myIsDriver && (
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white backdrop-blur-sm">
                              <Car className="w-2.5 h-2.5" />운전자
                            </span>
                          )}
                          {!isTreasurer && !myIsDriver && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white/90">게스트</span>
                          )}
                        </div>
                      )}

                      {/* 탈퇴 버튼 — 우상단 hover */}
                      {!isPending && (
                        <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button onClick={e => handleLeaveInvited(e, trip)} title="여행 탈퇴"
                            className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm flex items-center justify-center">
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 정보 바 — 흰 배경 */}
                    <div className="px-4 py-3.5">
                      <p className="font-bold text-[15px] text-gray-900 leading-tight truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {trip.title || trip.city}
                      </p>
                      {trip.title && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{trip.city}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{nightsLabel}</p>
                            {visibleMembers.length > 0 && (
                              <button onClick={e => { e.preventDefault(); e.stopPropagation(); setMemberPopupTrip(trip) }}
                                className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
                                <div className="flex -space-x-1">
                                  {visibleMembers.map(m => (
                                    <PersonAvatar key={m.id} name={m.name ?? '?'} photoURL={m.photoURL} size={18} stacked ringColor="white" />
                                  ))}
                                  {extraCount > 0 && (
                                    <div className="w-[18px] h-[18px] rounded-full bg-gray-200 border border-white flex items-center justify-center text-[8px] font-bold text-gray-500">+{extraCount}</div>
                                  )}
                                </div>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{dateRange}</p>
                        </div>
                        {isPending
                          ? <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-500 flex-shrink-0">삭제 예정</span>
                          : isUpcoming
                          ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">{badge}</span>
                          : isDone
                          ? <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 flex-shrink-0">완료</span>
                          : null
                        }
                      </div>
                    </div>

                    {/* 삭제 예정 오버레이 */}
                    {isPending && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-red-500 text-white shadow-md">{remainHours}시간 후 삭제</span>
                        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/90 text-gray-600 shadow">방장이 여행을 삭제했습니다</span>
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
          coverPhotoScale={editTarget.coverPhotoScale}
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
              coverPhotoScale:    data.coverPhotoScale ?? 1,
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
                  coverPhotoScale:    data.coverPhotoScale,
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
                  ? { ...m, photoURL: resolvedPhotoURL || user.photoURL || m.photoURL, name: user.displayName ?? m.name }
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
