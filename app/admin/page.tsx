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
}

type DayTrend = { date: string; label: string; count: number }

function toDateStr(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  return ts.toDate().toISOString().slice(0, 10)
}

export default function AdminDashboard() {
  const [stats, setStats]               = useState<Stats>({ userCount: 0, todayUsers: 0, tripCount: 0, aiTripCount: 0, directTripCount: 0, pendingReports: 0, activeAnnouncements: 0 })
  const [recentUsers, setRecentUsers]   = useState<RecentUser[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [trend, setTrend]               = useState<DayTrend[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10)

        const [usersSnap, reportsSnap, announcementsSnap, allTripsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'reports')),
          getDocs(collection(db, 'announcements')),
          getDocs(collectionGroup(db, 'trips')),
        ])

        const pendingReports      = reportsSnap.docs.filter(d => d.data().status === 'pending').length
        const activeAnnouncements = announcementsSnap.docs.filter(d => d.data().active === true).length
        const todayUsers          = usersSnap.docs.filter(d => toDateStr(d.data().createdAt) === today).length
        const aiTripCount         = allTripsSnap.docs.filter(d => d.data().aiGenerated === true).length
        const directTripCount     = allTripsSnap.size - aiTripCount

        setStats({
          userCount:         usersSnap.size,
          todayUsers,
          tripCount:         allTripsSnap.size,
          aiTripCount,
          directTripCount,
          pendingReports,
          activeAnnouncements,
        })

        /* 최근 7일 가입 추이 */
        const days: DayTrend[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          const dateStr = d.toISOString().slice(0, 10)
          const label = i === 6 ? '오늘' : `${d.getMonth() + 1}/${d.getDate()}`
          const count = usersSnap.docs.filter(doc => toDateStr(doc.data().createdAt) === dateStr).length
          return { date: dateStr, label, count }
        })
        setTrend(days)

        const sortedUsers = usersSnap.docs
          .map(d => ({ uid: d.id, ...d.data() } as RecentUser))
          .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
          .slice(0, 5)
        setRecentUsers(sortedUsers)

        const sortedReports = reportsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as RecentReport))
          .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
          .slice(0, 5)
        setRecentReports(sortedReports)
      } catch { /* silent */ } finally {
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
          { label: '사용자 관리',   href: '/admin/users',            icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: '신고 관리',     href: '/admin/reports',          icon: Flag,       color: 'text-red-600',    bg: 'bg-red-50'    },
          { label: '공지 관리',     href: '/admin/announcements',    icon: Megaphone,  color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: '서비스 후기',   href: '/admin/reviews',          icon: Star,       color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'AI 질문 관리',  href: '/admin/ai-questions',     icon: Sparkles,   color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: '탈퇴 요청',     href: '/admin/delete-requests',  icon: UserPlus,   color: 'text-rose-600',   bg: 'bg-rose-50'   },
        ].map(({ label, href, icon: Icon, color, bg }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition-all">
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
