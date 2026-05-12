'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileSpreadsheet, User, LogOut, Bell } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc, getDoc, query, orderBy } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { useAuthStore } from '@/features/auth/store'
import { PersonAvatar } from '@/components/PersonAvatar'
import { useRouter } from 'next/navigation'

type ActiveTab = 'trips' | 'collection' | 'profile'

type AdminMessage = {
  id: string
  title: string
  body: string
  createdAt: Timestamp
  read: boolean
}

export function AppNavbar({
  active,
  onExcel,
}: {
  active:   ActiveTab
  onExcel?: () => void
}) {
  const { user, avatarColor, setAvatarColor, avatarHexColor, setAvatarHexColor } = useAuthStore()
  const router = useRouter()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Y'
  const [dropdownOpen, setDropdownOpen]           = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [bellOpen, setBellOpen]         = useState(false)
  const [messages, setMessages]         = useState<AdminMessage[]>([])
  const [unreadCount, setUnreadCount]   = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || avatarColor !== null) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (typeof data.avatarColor === 'number') setAvatarColor(data.avatarColor)
        if (typeof data.avatarHexColor === 'string') setAvatarHexColor(data.avatarHexColor)
      }
    })
  }, [user?.uid])

  useEffect(() => {
    if (!user) return
    const fetchMessages = async () => {
      try {
        const q = query(collection(db, 'users', user.uid, 'messages'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const msgs = snap.docs.slice(0, 10).map(d => ({ id: d.id, ...d.data() } as AdminMessage))
        setMessages(msgs)
        setUnreadCount(msgs.filter(m => !m.read).length)
      } catch { /* silent */ }
    }
    fetchMessages()
  }, [user?.uid])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setShowLogoutConfirm(false)
    router.push('/auth')
  }

  const handleReadMessage = async (msg: AdminMessage) => {
    if (!user || msg.read) return
    try {
      await updateDoc(doc(db, 'users', user.uid, 'messages', msg.id), { read: true })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }

  const formatMsgDate = (ts: Timestamp) => {
    try {
      const d = ts.toDate()
      return `${d.getMonth() + 1}.${d.getDate()}`
    } catch {
      return ''
    }
  }

  return (
    <>
      <nav className="nav-bar justify-between flex-shrink-0">
        {/* 로고 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-blue-600" />
          <span className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Voyalogue
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">BETA</span>
        </div>

        {/* 가운데 탭 */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          {active === 'trips'
            ? <span className="text-blue-600 font-semibold">내 여행</span>
            : <Link href="/trips" className="text-gray-500 hover:text-gray-900 transition-colors">내 여행</Link>
          }
          {active === 'collection'
            ? <span className="text-blue-600 font-semibold">컬렉션</span>
            : <Link href="/collection" className="text-gray-500 hover:text-gray-900 transition-colors">컬렉션</Link>
          }
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {onExcel && (
            <button
              onClick={onExcel}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 text-gray-600 rounded-full text-sm font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">엑셀</span>
            </button>
          )}

          {/* 벨 알림 */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(v => !v)}
              className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900">알림</p>
                </div>
                {messages.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">새 알림이 없습니다</div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                    {messages.map(msg => (
                      <button
                        key={msg.id}
                        onClick={() => handleReadMessage(msg)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!msg.read ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {!msg.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                              <p className="text-sm font-semibold text-gray-900 truncate">{msg.title}</p>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{msg.body}</p>
                          </div>
                          <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">{formatMsgDate(msg.createdAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            href="/trips/new"
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">새 여행 만들기</span>
          </Link>

          {/* 아바타 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="rounded-full hover:opacity-85 transition-opacity flex-shrink-0"
            >
              <PersonAvatar
                name={displayName}
                photoURL={user?.photoURL ?? undefined}
                size={36}
                colorIndex={avatarHexColor ? undefined : (avatarColor ?? 0)}
                hexColor={avatarHexColor ?? undefined}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-200 shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  마이페이지
                </Link>
                <button
                  onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[320px] mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">로그아웃</h3>
            <p className="text-sm text-gray-500 mb-5">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                아니오
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
