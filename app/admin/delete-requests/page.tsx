'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, orderBy, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'

type DeleteRequest = {
  id: string
  uid: string
  email: string
  displayName: string
  status: 'pending' | 'approved' | 'denied'
  requestedAt: Timestamp | null
}

type Filter = 'all' | 'pending' | 'done'

async function deleteUserAllData(uid: string) {
  const tripsSnap = await getDocs(collection(db, 'users', uid, 'trips'))
  for (const tripDoc of tripsSnap.docs) {
    const daysSnap = await getDocs(collection(db, 'users', uid, 'trips', tripDoc.id, 'days'))
    for (const dayDoc of daysSnap.docs) {
      const itemsSnap = await getDocs(collection(db, 'users', uid, 'trips', tripDoc.id, 'days', dayDoc.id, 'items'))
      for (const item of itemsSnap.docs) {
        await deleteDoc(doc(db, 'users', uid, 'trips', tripDoc.id, 'days', dayDoc.id, 'items', item.id))
      }
      await deleteDoc(doc(db, 'users', uid, 'trips', tripDoc.id, 'days', dayDoc.id))
    }
    await deleteDoc(doc(db, 'users', uid, 'trips', tripDoc.id))
  }
  const msgsSnap = await getDocs(collection(db, 'users', uid, 'messages'))
  for (const m of msgsSnap.docs) await deleteDoc(doc(db, 'users', uid, 'messages', m.id))
  const metaSnap = await getDocs(collection(db, 'users', uid, 'meta'))
  for (const m of metaSnap.docs) await deleteDoc(doc(db, 'users', uid, 'meta', m.id))
  await setDoc(doc(db, 'users', uid), { deleted: true, deletedAt: serverTimestamp() })
}

export default function DeleteRequestsPage() {
  const [requests,  setRequests]  = useState<DeleteRequest[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<Filter>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [toast,     setToast]     = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'deleteRequests'), orderBy('requestedAt', 'desc')))
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as DeleteRequest)))
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleApprove = async (req: DeleteRequest) => {
    if (!confirm(`"${req.displayName || req.email}"의 모든 데이터를 삭제하고 탈퇴 처리할까요?\n이 작업은 되돌릴 수 없습니다.`)) return
    setProcessing(req.id)
    try {
      await deleteUserAllData(req.uid)
      await updateDoc(doc(db, 'deleteRequests', req.id), {
        status:      'approved',
        processedAt: new Date(),
      })
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
      showToast('탈퇴 처리가 완료됐습니다')
    } catch (err) {
      console.error(err)
      showToast('처리 실패 — 권한을 확인하세요')
    } finally {
      setProcessing(null)
    }
  }

  const handleDeny = async (req: DeleteRequest) => {
    if (!confirm(`"${req.displayName || req.email}"의 탈퇴 요청을 거절할까요?`)) return
    setProcessing(req.id)
    try {
      await updateDoc(doc(db, 'deleteRequests', req.id), { status: 'denied' })
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'denied' } : r))
      showToast('탈퇴 요청이 거절됐습니다')
    } catch {
      showToast('처리 실패')
    } finally {
      setProcessing(null)
    }
  }

  const filtered = requests.filter(r => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'done')    return r.status !== 'pending'
    return true
  })

  const counts = {
    all:     requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    done:    requests.filter(r => r.status !== 'pending').length,
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'pending', label: '대기중' },
    { key: 'done',    label: '처리완료' },
    { key: 'all',     label: '전체' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        탈퇴 요청
      </h1>
      <p className="text-sm text-gray-500 mb-6">승인 시 해당 유저의 모든 Firestore 데이터가 삭제됩니다. Firebase Auth 계정은 별도 콘솔에서 삭제하세요.</p>

      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === key
                ? 'bg-rose-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-600'
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                  <div className="h-3 w-56 bg-gray-100 rounded" />
                </div>
                <div className="h-8 w-28 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">탈퇴 요청 없음</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(r => (
              <div key={r.id} className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {r.status === 'pending'  && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600"><Clock className="w-3 h-3" /> 대기중</span>}
                    {r.status === 'approved' && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600"><CheckCircle className="w-3 h-3" /> 탈퇴완료</span>}
                    {r.status === 'denied'   && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><XCircle className="w-3 h-3" /> 거절</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{r.displayName || '(이름 없음)'}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {r.requestedAt ? new Date(r.requestedAt.toMillis()).toLocaleString('ko') : '-'}
                    <span className="ml-1.5 text-gray-200">UID: {r.uid.slice(0, 10)}…</span>
                  </p>
                </div>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(r)}
                      disabled={processing === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full transition-colors disabled:opacity-40"
                    >
                      {processing === r.id
                        ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Trash2 className="w-3.5 h-3.5" /> 탈퇴 승인</>
                      }
                    </button>
                    <button
                      onClick={() => handleDeny(r)}
                      disabled={processing === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-full transition-colors disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mt-3">총 {filtered.length}건</p>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg z-[200]">
          {toast}
        </div>
      )}
    </div>
  )
}
