'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, addDoc, doc, getDoc, Timestamp, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CheckCircle, XCircle, Clock, MessageSquare, Send, Ban } from 'lucide-react'

type ReportStatus = 'pending' | 'resolved' | 'dismissed' | 'replied'
type ReportFilter = 'all' | 'pending' | 'resolved'

type Report = {
  id: string
  reporterUid: string
  reporterEmail?: string
  reason: string
  targetType: 'trip' | 'user' | 'content' | 'feedback'
  targetId: string
  detail?: string
  createdAt: Timestamp
  status: ReportStatus
}

const STATUS_META: Record<ReportStatus, { label: string; icon: typeof Clock; cls: string }> = {
  pending:   { label: '미처리',  icon: Clock,        cls: 'bg-red-50 text-red-600' },
  resolved:  { label: '처리완료', icon: CheckCircle,  cls: 'bg-green-50 text-green-600' },
  dismissed: { label: '기각',    icon: XCircle,      cls: 'bg-gray-100 text-gray-500' },
  replied:   { label: '답글완료', icon: MessageSquare, cls: 'bg-blue-50 text-blue-600' },
}

const FILTER_TABS: { key: ReportFilter; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'pending',  label: '미처리' },
  { key: 'resolved', label: '처리완료' },
]

export default function AdminReportsPage() {
  const [reports,  setReports]  = useState<Report[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<ReportFilter>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [replyTarget,  setReplyTarget]  = useState<string | null>(null)
  const [replyText,    setReplyText]    = useState('')
  const [replying,     setReplying]     = useState(false)
  const [suspending,   setSuspending]   = useState<string | null>(null)
  const [suspended,    setSuspended]    = useState<Set<string>>(new Set())

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

  const handleReply = async (report: Report) => {
    if (!replyText.trim() || replying) return
    setReplying(true)
    try {
      await addDoc(collection(db, 'users', report.reporterUid, 'messages'), {
        title: '문의 답변이 도착했어요',
        body:  replyText.trim(),
        createdAt: serverTimestamp(),
        read: false,
      })
      await updateDoc(doc(db, 'reports', report.id), {
        status:  'replied',
        replyAt: serverTimestamp(),
      })
      setReports(prev => {
        const updated = prev.map(r => r.id === report.id ? { ...r, status: 'replied' as ReportStatus } : r)
        return [
          ...updated.filter(r => r.status === 'pending'),
          ...updated.filter(r => r.status !== 'pending'),
        ]
      })
      setReplyTarget(null)
      setReplyText('')
    } catch { /* silent */ } finally {
      setReplying(false)
    }
  }

  const handleSuspendUser = async (report: Report) => {
    const targetUid = report.targetType === 'user' ? report.targetId : null
    if (!targetUid) return
    setSuspending(report.id)
    try {
      const userSnap = await getDoc(doc(db, 'users', targetUid))
      const alreadySuspended = userSnap.data()?.suspended === true
      await updateDoc(doc(db, 'users', targetUid), { suspended: !alreadySuspended })
      setSuspended(prev => {
        const next = new Set(prev)
        if (alreadySuspended) next.delete(report.id)
        else next.add(report.id)
        return next
      })
    } catch { /* silent */ } finally {
      setSuspending(null)
    }
  }

  const filtered = reports.filter(r => {
    if (filter === 'pending')  return r.status === 'pending'
    if (filter === 'resolved') return r.status !== 'pending'
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
              const isFeedback = r.targetType === 'feedback'
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isFeedback ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isFeedback ? '문의' : r.targetType}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{r.reason}</p>
                      {r.detail && (
                        <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{r.detail}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {r.reporterEmail
                          ? <p className="text-[11px] text-gray-400">{r.reporterEmail}</p>
                          : <p className="text-[11px] text-gray-400">신고자: {r.reporterUid.slice(0, 10)}…</p>
                        }
                        {!isFeedback && (
                          <p className="text-[11px] text-gray-400">대상: {r.targetId.slice(0, 10)}…</p>
                        )}
                        {r.createdAt && (
                          <p className="text-[11px] text-gray-300">
                            {new Date(r.createdAt.toMillis()).toLocaleDateString('ko')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {/* 유저 신고 → 정지 버튼 */}
                      {r.targetType === 'user' && (
                        <button
                          onClick={() => handleSuspendUser(r)}
                          disabled={suspending === r.id}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors disabled:opacity-40 ${
                            suspended.has(r.id)
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {suspended.has(r.id) ? '정지해제' : '정지'}
                        </button>
                      )}

                      {r.status === 'pending' && (
                        <>
                          {isFeedback && (
                            <button
                              onClick={() => { setReplyTarget(r.id); setReplyText('') }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-full transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              답글
                            </button>
                          )}
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
                        </>
                      )}

                      {r.status === 'replied' && isFeedback && (
                        <button
                          onClick={() => { setReplyTarget(r.id); setReplyText('') }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-full transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          재답글
                        </button>
                      )}

                      {r.status !== 'pending' && r.status !== 'replied' && (
                        <button
                          onClick={() => handleStatus(r.id, 'pending')}
                          disabled={updating === r.id}
                          className="flex-shrink-0 text-[11px] text-gray-400 hover:text-gray-600 underline transition-colors disabled:opacity-40"
                        >
                          미처리로
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 답글 입력 폼 */}
                  {replyTarget === r.id && (
                    <div className="mt-3 flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="사용자에게 전달할 답변을 입력하세요."
                        rows={3}
                        className="flex-1 px-3 py-2 rounded-xl border border-blue-200 text-sm outline-none focus:border-blue-500 resize-none transition-all"
                      />
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleReply(r)}
                          disabled={replying || !replyText.trim()}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-40"
                        >
                          {replying
                            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><Send className="w-3.5 h-3.5" /> 전송</>
                          }
                        </button>
                        <button
                          onClick={() => { setReplyTarget(null); setReplyText('') }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
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
