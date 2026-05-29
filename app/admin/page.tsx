'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, collectionGroup, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, MapPin, Flag, Megaphone, Star, Sparkles, PencilLine, UserPlus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type RecentUser = {
  uid: string
  displayName: string
  email: string
  createdAt: Timestamp | null
}

type RecentReport = {
  id: string
  reporterUid: string
  reason: string
  targetType: string
  status: string
  createdAt: Timestamp | null
}

type Stats = {
  userCount: number
  todayUsers: number
  tripCount: number
  aiTripCount: number
  directTripCount: number
  pendingReports: number
  activeAnnouncements: number
  pendingDeleteRequests: number
  unfeaturedReviews: number
}

type DayTrend = { date: string; label: string; count: number }

function toDateStr(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  return ts.toDate().toISOString().slice(0, 10)
}

export default function AdminDashboard() {
  const [stats, setStats]               = useState<Stats>({ userCount: 0, todayUsers: 0, tripCount: 0, aiTripCount: 0, directTripCount: 0, pendingReports: 0, activeAnnouncements: 0, pendingDeleteRequests: 0, unfeaturedReviews: 0 })
  const [recentUsers, setRecentUsers]   = useState<RecentUser[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [trend, setTrend]               = useState<DayTrend[]>([])
  const [loading, setLoading]           = useState(true)
  const [error,   setError]             = useState<string | null>(null)

  useEffect(() => {
    const safe = async <T,>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> => {
      try { return await fn() }
      catch (e) { console.warn(`[admin] ${label}:`, e instanceof Error ? e.message : e); return fallback }
    }

    const load = async () => {
      setError(null)
      try {
        const today = new Date().toISOString().slice(0, 10)

        const [usersSnap, reportsSnap, announcementsSnap, deleteReqSnap, reviewsSnap, allTripsSnap] =
          await Promise.all([
            safe(() => getDocs(collection(db, 'users')),           { docs: [], size: 0 } as any, 'users'),
            safe(() => getDocs(collection(db, 'reports')),         { docs: [], size: 0 } as any, 'reports'),
            safe(() => getDocs(collection(db, 'announcements')),   { docs: [], size: 0 } as any, 'announcements'),
            safe(() => getDocs(collection(db, 'deleteRequests')),  { docs: [], size: 0 } as any, 'deleteRequests'),
            safe(() => getDocs(collection(db, 'serviceReviews')),  { docs: [], size: 0 } as any, 'serviceReviews'),
            safe(() => getDocs(collectionGroup(db, 'trips')),      { docs: [], size: 0 } as any, 'trips'),
          ])

        const todayUsers            = usersSnap.docs.filter((d: any) => toDateStr(d.data().createdAt) === today).length
        const pendingReports        = reportsSnap.docs.filter((d: any) => d.data().status === 'pending').length
        const activeAnnouncements   = announcementsSnap.docs.filter((d: any) => d.data().active === true).length
        const pendingDeleteRequests = deleteReqSnap.docs.filter((d: any) => d.data().status === 'pending').length
        const unfeaturedReviews     = reviewsSnap.docs.filter((d: any) => !d.data().featured).length
        const tripCount             = allTripsSnap.size
        const aiTripCount           = allTripsSnap.docs.filter((d: any) => d.data().aiGenerated === true).length

        setStats({
          userCount: usersSnap.size,
          todayUsers,
          tripCount,
          aiTripCount,
          directTripCount: tripCount - aiTripCount,
          pendingReports,
          activeAnnouncements,
          pendingDeleteRequests,
          unfeaturedReviews,
        })

        const days: DayTrend[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          const dateStr = d.toISOString().slice(0, 10)
          const label   = i === 6 ? '오늘' : `${d.getMonth() + 1}/${d.getDate()}`
          const count   = usersSnap.docs.filter((doc: any) => toDateStr(doc.data().createdAt) === dateStr).length
          return { date: dateStr, label, count }
        })
        setTrend(days)

        setRecentUsers(
          usersSnap.docs
            .map((d: any) => ({ uid: d.id, ...d.data() } as RecentUser))
            .sort((a: RecentUser, b: RecentUser) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
            .slice(0, 5)
        )
        setRecentReports(
          reportsSnap.docs
            .map((d: any) => ({ id: d.id, ...d.data() } as RecentReport))
            .sort((a: RecentReport, b: RecentReport) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
            .slice(0, 5)
        )
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('Admin dashboard load error:', msg)
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STATUS_LABEL: Record<string, string> = {
    pending:   '미처리',
    resolved:  '처리완료',
    dismissed: '기각',
  }

  const maxTrend = Math.max(...trend.map(t => t.count), 1)

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        대시보드
      </h1>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-2">
          <span className="text-red-500 font-bold text-sm flex-shrink-0">오류</span>
          <p className="text-sm text-red-700 break-all">{error}</p>
        </div>
      )}

      {/* ── 사용자 통계 ── */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">사용자</p>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-xl mb-3" />
              <div className="h-7 w-12 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stats.userCount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">전체 사용자</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stats.todayUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">오늘 가입</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 col-span-2 lg:col-span-1">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
              <Flag className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stats.pendingReports.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">미처리 신고</p>
          </div>
        </div>
      )}

      {/* ── 여행 통계 ── */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">여행</p>
      {loading ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-xl mb-3" />
              <div className="h-7 w-12 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stats.tripCount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">전체 여행</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stats.aiTripCount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">AI 생성</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
              <PencilLine className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stats.directTripCount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">직접 생성</p>
          </div>
        </div>
      )}

      {/* ── 7일 가입 추이 ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">최근 7일 가입 추이</h2>
        </div>
        {loading ? (
          <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <div className="flex items-end gap-2 h-28">
            {trend.map(t => (
              <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-gray-700">{t.count > 0 ? t.count : ''}</span>
                <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${t.label === '오늘' ? 'bg-blue-500' : 'bg-blue-200'}`}
                    style={{ height: `${Math.max(4, (t.count / maxTrend) * 80)}px` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 최근 가입 사용자 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">최근 가입 사용자</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">데이터 없음</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentUsers.map(u => (
                <div key={u.uid} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.displayName || '(이름 없음)'}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {u.createdAt ? new Date(u.createdAt.toMillis()).toLocaleDateString('ko') : '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 신고 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">최근 신고</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentReports.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">데이터 없음</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentReports.map(r => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.reason}</p>
                    <p className="text-xs text-gray-400 truncate">{r.targetType} · {r.reporterUid.slice(0, 8)}…</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    r.status === 'pending'   ? 'bg-red-50 text-red-600'
                    : r.status === 'resolved' ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: '사용자 관리',   href: '/admin/users',            icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50',   badge: stats.todayUsers          },
          { label: '신고 관리',     href: '/admin/reports',          icon: Flag,       color: 'text-red-600',    bg: 'bg-red-50',    badge: stats.pendingReports      },
          { label: '공지 관리',     href: '/admin/announcements',    icon: Megaphone,  color: 'text-orange-600', bg: 'bg-orange-50', badge: 0                         },
          { label: '서비스 후기',   href: '/admin/reviews',          icon: Star,       color: 'text-amber-600',  bg: 'bg-amber-50',  badge: stats.unfeaturedReviews   },
          { label: 'AI 질문 관리',  href: '/admin/ai-questions',     icon: Sparkles,   color: 'text-violet-600', bg: 'bg-violet-50', badge: 0                         },
          { label: '탈퇴 요청',     href: '/admin/delete-requests',  icon: UserPlus,   color: 'text-rose-600',   bg: 'bg-rose-50',   badge: stats.pendingDeleteRequests},
        ].map(({ label, href, icon: Icon, color, bg, badge }) => (
          <Link key={href} href={href}
            className="relative bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition-all">
            {badge > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm z-10">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className="text-sm font-semibold text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
