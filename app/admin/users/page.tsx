'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, doc, deleteDoc, Timestamp, updateDoc, addDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Ban, MessageSquare, Trash2, Search, ChevronDown, ChevronUp, MapPin, X, Send, Users, RotateCcw, Plane } from 'lucide-react'

type UserRow = {
  uid: string
  displayName: string
  email: string
  createdAt: Timestamp | null
  tripCount: number
  suspended: boolean
  deleted?: boolean
}

type TripItem = {
  id: string
  city: string
  title?: string
  startDate: string
  endDate: string
}

type MsgModal = { uid: string; displayName: string } | null

type BetaSettings = {
  betaEnabled: boolean
  maxUsers: number
  userCount: number
}

async function deleteUserTrips(uid: string) {
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
}

export default function AdminUsersPage() {
  const [users, setUsers]         = useState<UserRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [trips, setTrips]         = useState<Record<string, TripItem[]>>({})
  const [tripsLoading, setTripsLoading] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const [seeding, setSeeding]     = useState<string | null>(null)
  const [toggling, setToggling]   = useState<string | null>(null)
  const [msgModal, setMsgModal]   = useState<MsgModal>(null)
  const [msgTitle, setMsgTitle]   = useState('')
  const [msgBody, setMsgBody]     = useState('')
  const [sending, setSending]     = useState(false)
  const [toast, setToast]         = useState('')

  const [beta, setBeta]           = useState<BetaSettings | null>(null)
  const [betaMaxInput, setBetaMaxInput] = useState('')
  const [betaSaving, setBetaSaving]     = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const rows: UserRow[] = await Promise.all(
          snap.docs.map(async d => {
            const data = d.data()
            const tripsSnap = await getDocs(collection(db, 'users', d.id, 'trips'))
            return {
              uid:         d.id,
              displayName: data.displayName ?? '',
              email:       data.email ?? '',
              createdAt:   data.createdAt ?? null,
              tripCount:   tripsSnap.size,
              suspended:   data.suspended === true,
              deleted:     data.deleted === true,
            }
          })
        )
        setUsers(rows.filter(r => !r.deleted))
      } catch { /* silent */ } finally {
        setLoading(false)
      }

      try {
        const betaSnap = await getDoc(doc(db, 'config', 'betaSettings'))
        if (betaSnap.exists()) {
          const d = betaSnap.data() as Partial<BetaSettings>
          const settings: BetaSettings = {
            betaEnabled: d.betaEnabled ?? true,
            maxUsers:    d.maxUsers    ?? 1500,
            userCount:   d.userCount   ?? 0,
          }
          setBeta(settings)
          setBetaMaxInput(String(settings.maxUsers))
        } else {
          const defaults: BetaSettings = { betaEnabled: true, maxUsers: 1500, userCount: 0 }
          setBeta(defaults)
          setBetaMaxInput('1500')
        }
      } catch { /* 권한 없으면 베타 카드 숨김 */ }
    }
    load()
  }, [])

  const handleBetaSave = async () => {
    if (!beta) return
    const max = parseInt(betaMaxInput, 10)
    if (isNaN(max) || max < 1) return
    setBetaSaving(true)
    try {
      await setDoc(doc(db, 'config', 'betaSettings'), {
        betaEnabled: beta.betaEnabled,
        maxUsers:    max,
        userCount:   beta.userCount,
      })
      setBeta(prev => prev ? { ...prev, maxUsers: max } : prev)
      showToast('베타 설정이 저장되었습니다')
    } catch { showToast('저장 실패') } finally {
      setBetaSaving(false)
    }
  }

  const handleBetaToggle = async () => {
    if (!beta) return
    const next = !beta.betaEnabled
    try {
      await setDoc(doc(db, 'config', 'betaSettings'), { betaEnabled: next }, { merge: true })
      setBeta(prev => prev ? { ...prev, betaEnabled: next } : prev)
      showToast(next ? '베타 한도 체크 활성화' : '베타 한도 체크 비활성화')
    } catch { showToast('저장 실패') }
  }

  const filtered = users.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleExpand = async (uid: string) => {
    if (expanded === uid) { setExpanded(null); return }
    setExpanded(uid)
    if (trips[uid]) return
    setTripsLoading(uid)
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'trips'))
      setTrips(prev => ({
        ...prev,
        [uid]: snap.docs.map(d => ({ id: d.id, ...d.data() } as TripItem)),
      }))
    } catch { /* silent */ } finally {
      setTripsLoading(null)
    }
  }

  /* 데이터 초기화: 여행 전체 삭제 + onboarding 리셋 (계정 유지) */
  const handleReset = async (u: UserRow) => {
    if (!confirm(`"${u.displayName || u.uid.slice(0, 8)}"의 여행 데이터를 전부 삭제하고 온보딩을 리셋할까요?\n계정은 유지됩니다.`)) return
    setResetting(u.uid)
    try {
      await deleteUserTrips(u.uid)
      const msgsSnap = await getDocs(collection(db, 'users', u.uid, 'messages'))
      for (const m of msgsSnap.docs) {
        await deleteDoc(doc(db, 'users', u.uid, 'messages', m.id))
      }
      const metaSnap = await getDocs(collection(db, 'users', u.uid, 'meta'))
      for (const m of metaSnap.docs) {
        await deleteDoc(doc(db, 'users', u.uid, 'meta', m.id))
      }
      await updateDoc(doc(db, 'users', u.uid), { onboardingDone: false })
      setUsers(prev => prev.map(row => row.uid === u.uid ? { ...row, tripCount: 0 } : row))
      setTrips(prev => ({ ...prev, [u.uid]: [] }))
      showToast('데이터가 초기화되었습니다')
    } catch (err) {
      console.error('초기화 실패:', err)
      showToast('초기화 실패')
    } finally {
      setResetting(null)
    }
  }

  /* 샘플여행 복원 */
  const handleSeedSample = async (u: UserRow) => {
    if (!confirm(`"${u.displayName || u.uid.slice(0, 8)}"에게 도쿄 샘플여행을 추가할까요?`)) return
    setSeeding(u.uid)
    try {
      const { seedSampleTrip } = await import('@/lib/seedSampleTrip')
      await seedSampleTrip(u.uid, u.displayName || '나')
      const snap = await getDocs(collection(db, 'users', u.uid, 'trips'))
      setUsers(prev => prev.map(row => row.uid === u.uid ? { ...row, tripCount: snap.size } : row))
      setTrips(prev => ({
        ...prev,
        [u.uid]: snap.docs.map(d => ({ id: d.id, ...d.data() } as TripItem)),
      }))
      showToast('샘플여행이 추가되었습니다')
    } catch (err) {
      console.error('샘플여행 추가 실패:', err)
      showToast('샘플여행 추가 실패')
    } finally {
      setSeeding(null)
    }
  }

  /* 계정 + 데이터 전체 삭제 */
  const handleDelete = async (uid: string) => {
    if (!confirm(`사용자 ${uid.slice(0, 8)}… 의 모든 데이터를 삭제할까요?`)) return
    setDeleting(uid)
    try {
      await deleteUserTrips(uid)
      const msgsSnap = await getDocs(collection(db, 'users', uid, 'messages'))
      for (const m of msgsSnap.docs) {
        await deleteDoc(doc(db, 'users', uid, 'messages', m.id))
      }
      const metaSnap = await getDocs(collection(db, 'users', uid, 'meta'))
      for (const m of metaSnap.docs) {
        await deleteDoc(doc(db, 'users', uid, 'meta', m.id))
      }
      // 완전 삭제 대신 deleted 플래그로 교체 — Firebase Auth 세션을 가진 유저도 AuthProvider에서 즉시 차단
      await setDoc(doc(db, 'users', uid), { deleted: true, deletedAt: serverTimestamp() })
      setUsers(prev => prev.filter(u => u.uid !== uid))
      if (expanded === uid) setExpanded(null)
      showToast('사용자가 삭제되었습니다')
    } catch (err) {
      console.error('사용자 삭제 실패:', err)
      showToast('삭제 실패: 권한을 확인하거나 다시 시도하세요')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleSuspend = async (u: UserRow) => {
    setToggling(u.uid)
    try {
      const next = !u.suspended
      await updateDoc(doc(db, 'users', u.uid), { suspended: next })
      setUsers(prev => prev.map(row => row.uid === u.uid ? { ...row, suspended: next } : row))
    } catch { /* silent */ } finally {
      setToggling(null)
    }
  }

  const openMsgModal = (u: UserRow) => {
    setMsgModal({ uid: u.uid, displayName: u.displayName })
    setMsgTitle('')
    setMsgBody('')
  }

  const closeMsgModal = () => {
    setMsgModal(null)
    setMsgTitle('')
    setMsgBody('')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSendMessage = async () => {
    if (!msgModal || !msgTitle.trim() || !msgBody.trim()) return
    setSending(true)
    try {
      await addDoc(collection(db, 'users', msgModal.uid, 'messages'), {
        title: msgTitle.trim(),
        body: msgBody.trim(),
        type: 'admin',
        read: false,
        createdAt: serverTimestamp(),
      })
      showToast('메시지가 전송되었습니다')
      closeMsgModal()
    } catch { /* silent */ } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        사용자 관리
      </h1>

      {/* ── 베타 설정 카드 ── */}
      {beta && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">베타 설정</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">BETA</span>
            </div>
            <button
              onClick={handleBetaToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${beta.betaEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${beta.betaEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">현재 가입자</span>
            <span className="text-2xl font-extrabold text-gray-900">{users.length}</span>
            <span className="text-sm text-gray-400">/ {beta.maxUsers}명</span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all ${
                users.length / beta.maxUsers > 0.9 ? 'bg-red-500' :
                users.length / beta.maxUsers > 0.7 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (users.length / beta.maxUsers) * 100).toFixed(1)}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 flex-shrink-0">최대 인원</label>
            <input
              type="number"
              min={1}
              value={betaMaxInput}
              onChange={e => setBetaMaxInput(e.target.value)}
              className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={handleBetaSave}
              disabled={betaSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {betaSaving ? '저장 중…' : '저장'}
            </button>
          </div>
          {!beta.betaEnabled && (
            <p className="text-xs text-gray-400 mt-2">한도 체크가 꺼져 있습니다. 신규 가입자 제한이 없습니다.</p>
          )}
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="h-4 w-40 bg-gray-100 rounded" />
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-4 w-8 bg-gray-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">사용자 없음</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(u => (
              <div key={u.uid}>
                <div
                  className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpand(u.uid)}
                >
                  <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.displayName || '(이름 없음)'}</p>
                      {u.suspended && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 flex-shrink-0">정지중</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>여행 {u.tripCount}개</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleSuspend(u) }}
                      disabled={toggling === u.uid}
                      title={u.suspended ? '정지 해제' : '정지'}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-40 ${
                        u.suspended
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        <span>{u.suspended ? '해제' : '정지'}</span>
                      </div>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); openMsgModal(u) }}
                      title="메시지 전송"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(u.uid) }}
                      disabled={deleting === u.uid}
                      title="계정+데이터 전체 삭제"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expanded === u.uid
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>

                {expanded === u.uid && (
                  <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                    {/* ── 관리 액션 ── */}
                    <div className="flex items-center gap-2 mt-3 mb-3 flex-wrap">
                      <button
                        onClick={() => handleReset(u)}
                        disabled={resetting === u.uid}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {resetting === u.uid ? '초기화 중…' : '데이터 초기화'}
                      </button>
                      <button
                        onClick={() => handleSeedSample(u)}
                        disabled={seeding === u.uid}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-40"
                      >
                        <Plane className="w-3 h-3" />
                        {seeding === u.uid ? '추가 중…' : '샘플여행 복원'}
                      </button>
                    </div>

                    {/* ── 여행 목록 ── */}
                    <p className="text-xs font-semibold text-gray-500 mb-2">여행 목록</p>
                    {tripsLoading === u.uid ? (
                      <p className="text-xs text-gray-400">불러오는 중…</p>
                    ) : (trips[u.uid] ?? []).length === 0 ? (
                      <p className="text-xs text-gray-400">여행 없음</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(trips[u.uid] ?? []).map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs text-gray-700">
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">{t.title || t.city}</span>
                            <span className="text-gray-400">{t.startDate} – {t.endDate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mt-3">{filtered.length}명</p>
      )}

      {/* 메시지 전송 모달 */}
      {msgModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]"
          onClick={closeMsgModal}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[400px] mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                메시지 전송
                <span className="ml-2 text-sm font-normal text-gray-400">{msgModal.displayName || msgModal.uid.slice(0, 8)}</span>
              </h3>
              <button onClick={closeMsgModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">제목 <span className="font-normal text-gray-400">({msgTitle.length}/50)</span></label>
                <input
                  type="text"
                  maxLength={50}
                  value={msgTitle}
                  onChange={e => setMsgTitle(e.target.value)}
                  placeholder="메시지 제목을 입력하세요"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">내용 <span className="font-normal text-gray-400">({msgBody.length}/200)</span></label>
                <textarea
                  maxLength={200}
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  placeholder="메시지 내용을 입력하세요"
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={closeMsgModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending || !msgTitle.trim() || !msgBody.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg z-[200]">
          {toast}
        </div>
      )}
    </div>
  )
}