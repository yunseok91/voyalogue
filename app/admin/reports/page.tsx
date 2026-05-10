'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, Timestamp, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

type ReportStatus = 'pending' | 'resolved' | 'dismissed'
type ReportFilter = 'all' | 'pending' | 'resolved'

type Report = {
  id: string
  reporterUid: string
  reason: string
  targetType: 'trip' | 'user' | 'content'
  targetId: string
  detail?: string
  createdAt: Timestamp
  status: ReportStatus
}

const STATUS_META: Record<ReportStatus, { label: string; icon: typeof Clock; cls: string }> = {
  pending:   { label: '미처리',  icon: Clock,        cls: 'bg-red-50 text-red-600' },
  resolved:  { label: '처리완료', icon: CheckCircle,  cls: 'bg-green-50 text-green-600' },
  dismissed: { label: '기각',    icon: XCircle,      cls: 'bg-gray-100 text-gray-500' },
}

const FILTER_TABS: { key: ReportFilter; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'pending',  label: '미처리' },
  { key: 'resolved', label: '처리완료' },
]

export default function AdminReportsPage() {
  const [reports, setReports]   = useState<Report[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<ReportFilter>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')))
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Report))
        const sorted = [
          ...all.filter(r => r.status === 'pending'),
          ...all.filter(r => r.status !== 'pending'),
        ]
        setReports(sorted)
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleStatus = async (id: string, status: ReportStatus) => {
    setUpdating(id)
    try {
      await updateDoc(doc(db, 'reports', id), { status })
      setReports(prev => {
        const updated = prev.map(r => r.id === id ? { ...r, status } : r)
        return [
          ...updated.filter(r => r.status === 'pending'),
          ...updated.filter(r => r.status !== 'pending'),
        ]
      })
    } catch { /* silent */ } finally {
      setUpdating(null)
    }
  }

  const filtered = reports.filter(r => {
    if (filter === 'pending')  return r.status === 'pending'
    if (filter === 'resolved') return r.status === 'resolved' || r.status === 'dismissed'
    return true
  })

  const counts = {
    all:      reports.length,
    pending:  reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status !== 'pending').length,
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        신고 관리
      </h1>

      <div className="flex items-center gap-2 mb-4">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
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

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                  <div className="h-3 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-8 w-20 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">신고 없음</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(r => {
              const meta = STATUS_META[r.status]
              const Icon = meta.icon
              return (
                <div key={r.id} className="px-5 py-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {r.targetType}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{r.reason}</p>
                    {r.detail && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.detail}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[11px] text-gray-400">신고자: {r.reporterUid.slice(0, 10)}…</p>
                      <p className="text-[11px] text-gray-400">대상: {r.targetId.slice(0, 10)}…</p>
                      {r.createdAt && (
                        <p className="text-[11px] text-gray-300">
                          {new Date(r.createdAt.toMillis()).toLocaleDateString('ko')}
                        </p>
                      )}
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleStatus(r.id, 'resolved')}
                        disabled={updating === r.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-full transition-colors disabled:opacity-40"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        처리완료
                      </button>
                      <button
                        onClick={() => handleStatus(r.id, 'dismissed')}
                        disabled={updating === r.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-full transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        기각
                      </button>
                    </div>
                  )}

                  {r.status !== 'pending' && (
                    <button
                      onClick={() => handleStatus(r.id, 'pending')}
                      disabled={updating === r.id}
                      className="flex-shrink-0 text-[11px] text-gray-400 hover:text-gray-600 underline transition-colors disabled:opacity-40"
                    >
                      미처리로
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mt-3">총 {filtered.length}건</p>
      )}
    </div>
  )
}
