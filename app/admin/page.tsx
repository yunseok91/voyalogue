'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, limit, where, collectionGroup } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Timestamp } from 'firebase/firestore'
import { Users, MapPin, Flag, Megaphone } from 'lucide-react'

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
  tripCount: number
  pendingReports: number
  activeAnnouncements: number
}

export default function AdminDashboard() {
  const [stats, setStats]               = useState<Stats>({ userCount: 0, tripCount: 0, pendingReports: 0, activeAnnouncements: 0 })
  const [recentUsers, setRecentUsers]   = useState<RecentUser[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [usersSnap, reportsSnap, announcementsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'reports')),
          getDocs(collection(db, 'announcements')),
        ])

        const pendingReports      = reportsSnap.docs.filter(d => d.data().status === 'pending').length
        const activeAnnouncements = announcementsSnap.docs.filter(d => d.data().active === true).length

        let tripCount = 0
        for (const userDoc of usersSnap.docs) {
          const tripsSnap = await getDocs(collection(db, 'users', userDoc.id, 'trips'))
          tripCount += tripsSnap.size
        }

        setStats({
          userCount: usersSnap.size,
          tripCount,
          pendingReports,
          activeAnnouncements,
        })

        const sortedUsers = usersSnap.docs
          .map(d => ({ uid: d.id, ...d.data() } as RecentUser))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis() ?? 0
            const tb = b.createdAt?.toMillis() ?? 0
            return tb - ta
          })
          .slice(0, 5)
        setRecentUsers(sortedUsers)

        const sortedReports = reportsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as RecentReport))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis() ?? 0
            const tb = b.createdAt?.toMillis() ?? 0
            return tb - ta
          })
          .slice(0, 5)
        setRecentReports(sortedReports)
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: '전체 사용자', value: stats.userCount,          icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: '전체 여행',   value: stats.tripCount,          icon: MapPin,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '미처리 신고', value: stats.pendingReports,     icon: Flag,       color: 'text-red-600',    bg: 'bg-red-50' },
    { label: '활성 공지',   value: stats.activeAnnouncements, icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  const STATUS_LABEL: Record<string, string> = {
    pending:   '미처리',
    resolved:  '처리완료',
    dismissed: '기각',
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        대시보드
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-xl mb-3" />
              <div className="h-7 w-12 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  )
}
