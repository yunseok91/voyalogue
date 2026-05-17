'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MapPin, Megaphone } from 'lucide-react'
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

type NotifMessage = {
  id:        string
  title:     string
  body:      string
  createdAt: Timestamp
  read:      boolean
  type?:     'trip' | 'admin'
  tripPath?: string | null
}

export function NotificationBell() {
  const { user }  = useAuthStore()
  const router    = useRouter()
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<NotifMessage[]>([])
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

  /* 바깥 클릭 닫기 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = messages.filter(m => !m.read).length

  const handleClick = async (msg: NotifMessage) => {
    if (!user) return
    if (!msg.read) {
      updateDoc(doc(db, 'users', user.uid, 'messages', msg.id), { read: true }).catch(() => {})
    }
    setOpen(false)
    if (msg.tripPath) router.push(msg.tripPath)
  }

  const formatDate = (ts: Timestamp) => {
    try {
      const d = ts.toDate()
      return `${d.getMonth() + 1}.${d.getDate()}`
    } catch { return '' }
  }

  if (!user) return null

  return (
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">알림</p>
            {unread > 0 && (
              <span className="text-[11px] text-blue-600 font-semibold">{unread}개 미읽음</span>
            )}
          </div>
          {messages.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">새 알림이 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {messages.map(msg => {
                const isTrip  = msg.type === 'trip'
                const Icon    = isTrip ? MapPin : Megaphone
                const iconCls = isTrip ? 'text-blue-500 bg-blue-50' : 'text-amber-500 bg-amber-50'
                return (
                  <button
                    key={msg.id}
                    onClick={() => handleClick(msg)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!msg.read ? 'bg-blue-50/30' : ''}`}
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
                      </div>
                      {!msg.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
