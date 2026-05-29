'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, MapPin, Megaphone, X, Trash2 } from 'lucide-react'
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

type NotifMessage = {
  id:        string
  title:     string
  body:      string
  createdAt: Timestamp
  read:      boolean
  type?:     'trip' | 'notice' | 'admin'
  tripPath?: string | null
}

export function NotificationBell() {
  const { user }   = useAuthStore()
  const router     = useRouter()
  const pathname   = usePathname()
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<NotifMessage[]>([])
  const [adminModal, setAdminModal] = useState<NotifMessage | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  /* 실시간 알림 구독 */
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'messages'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.slice(0, 20).map(d => ({ id: d.id, ...d.data() } as NotifMessage)))
    }, () => {})
    return unsub
  }, [user?.uid])

  /* 바깥 클릭 + 스크롤 시 닫기 */
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onMouse)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onMouse)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const unread = messages.filter(m => !m.read).length

  const handleClick = async (msg: NotifMessage) => {
    if (!user) return
    if (msg.type === 'admin') {
      // 어드민 메시지: 드롭다운 닫고 전용 모달 열기 (읽음 처리는 확인 버튼에서)
      setOpen(false)
      setAdminModal(msg)
      return
    }
    if (!msg.read) {
      updateDoc(doc(db, 'users', user.uid, 'messages', msg.id), { read: true }).catch(() => {})
    }
    if (msg.tripPath) {
      setOpen(false)
      const currentFull = pathname + window.location.search
      if (currentFull === msg.tripPath) return
      router.push(msg.tripPath)
    }
  }

  const handleAdminConfirm = () => {
    if (!user || !adminModal) return
    updateDoc(doc(db, 'users', user.uid, 'messages', adminModal.id), { read: true }).catch(() => {})
    setAdminModal(null)
  }

  const handleDelete = (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation()
    if (!user) return
    deleteDoc(doc(db, 'users', user.uid, 'messages', msgId)).catch(() => {})
  }

  const handleDeleteAll = async () => {
    if (!user || messages.length === 0) return
    const batch = writeBatch(db)
    messages.forEach(m => batch.delete(doc(db, 'users', user.uid, 'messages', m.id)))
    await batch.commit().catch(() => {})
  }

  const formatDate = (ts: Timestamp) => {
    try {
      const d = ts.toDate()
      return `${d.getMonth() + 1}.${d.getDate()}`
    } catch { return '' }
  }

  if (!user) return null

  return (
    <>
    {/* 운영자 메시지 모달 */}
    {adminModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-violet-500" />
          <div className="flex items-start justify-between px-6 pt-5 pb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-violet-50">
                <Megaphone className="w-5 h-5 text-violet-500" />
              </div>
              <div className="pt-0.5">
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5 bg-violet-100 text-violet-700">
                  운영자 메시지
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{adminModal.title}</h3>
              </div>
            </div>
            <button
              onClick={() => setAdminModal(null)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0 ml-2 -mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 pb-5">
            <p className="text-sm text-gray-600 leading-[1.8] whitespace-pre-wrap">{adminModal.body}</p>
          </div>
          <div className="flex justify-end px-6 py-3.5 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleAdminConfirm}
              className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="
          fixed sm:absolute
          inset-x-3 sm:inset-x-auto
          top-[60px] sm:top-full sm:right-0
          sm:mt-2 sm:w-80
          bg-white rounded-2xl border border-gray-200 shadow-lg z-50 overflow-hidden
        ">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">알림
              {unread > 0 && <span className="ml-1.5 text-[11px] text-blue-600 font-semibold">{unread}개 미읽음</span>}
            </p>
            {messages.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
              >
                <Trash2 className="w-3 h-3" /> 전체 삭제
              </button>
            )}
          </div>
          {messages.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">새 알림이 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {messages.map(msg => {
                const isTrip   = msg.type === 'trip'
                const isAdmin  = msg.type === 'admin'
                const isNotice = msg.type === 'notice'
                const Icon     = isTrip ? MapPin : Megaphone
                const iconCls  = isTrip
                  ? 'text-blue-500 bg-blue-50'
                  : isAdmin
                  ? 'text-violet-500 bg-violet-50'
                  : isNotice
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-gray-500 bg-gray-50'
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleClick(msg)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!msg.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconCls}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-semibold truncate leading-snug ${!msg.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {msg.title}
                          </p>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">{msg.body}</p>
                        {isAdmin && (
                          <p className="text-[10px] text-violet-400 mt-0.5">눌러서 전체 보기</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                        {!msg.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        <button
                          onClick={e => handleDelete(e, msg.id)}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
