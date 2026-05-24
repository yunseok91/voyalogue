'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileSpreadsheet, User, LogOut, Plane, BookOpen, Headset, Download } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '@/features/auth/store'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { NotificationBell } from '@/components/NotificationBell'
import { useRouter } from 'next/navigation'
import { useScrollLock } from '@/hooks/useScrollLock'

type ActiveTab = 'trips' | 'collection' | 'profile'

export function AppNavbar({
  active,
  onExcel,
  onReport,
}: {
  active:    ActiveTab
  onExcel?:  () => void
  onReport?: () => void
}) {
  const { user, avatarColor, setAvatarColor, avatarHexColor, setAvatarHexColor } = useAuthStore()
  const router = useRouter()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Y'
  const [dropdownOpen, setDropdownOpen]           = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  useScrollLock(showLogoutConfirm)
  const [firestorePhotoURL, setFirestorePhotoURL] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (typeof data.avatarColor === 'number') setAvatarColor(data.avatarColor)
        if (typeof data.avatarHexColor === 'string') setAvatarHexColor(data.avatarHexColor)
        if (typeof data.photoURL === 'string' && data.photoURL) setFirestorePhotoURL(data.photoURL)
      }
    })
  }, [user?.uid])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
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

  return (
    <>
      <nav className="nav-bar justify-between flex-shrink-0 relative">
        {/* 로고 + 탭 (왼쪽 정렬) */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-600" />
            <span className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Voyalogue
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">BETA</span>
          </Link>

          <div className="hidden lg:flex items-center gap-5 text-sm">
            {active === 'trips'
              ? <span className="text-blue-600 font-semibold">내 여행</span>
              : <Link href="/trips" className="text-gray-500 hover:text-gray-900 transition-colors">내 여행</Link>
            }
            {active === 'collection'
              ? <span className="text-blue-600 font-semibold">컬렉션</span>
              : <Link href="/collection" className="text-gray-500 hover:text-gray-900 transition-colors">컬렉션</Link>
            }
          </div>
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* 엑셀 · 신고 — 데스크톱만 노출, 모바일은 드롭다운으로 */}
          {onExcel && (
            <button
              onClick={onExcel}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 text-gray-600 rounded-full text-sm font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
              엑셀
            </button>
          )}

          <NotificationBell />

          {onReport && (
            <button
              onClick={onReport}
              title="문의 / 버그 신고"
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500 transition-colors"
            >
              <Headset className="w-4 h-4" />
            </button>
          )}

          <Link
            href="/trips/new"
            data-tour="create-trip"
            className="flex items-center gap-1.5 px-2.5 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden lg:inline whitespace-nowrap">새 여행 만들기</span>
          </Link>

          {/* 아바타 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="rounded-full hover:opacity-85 transition-opacity flex-shrink-0"
            >
              <PersonAvatar
                name={displayName}
                photoURL={user?.photoURL || firestorePhotoURL || undefined}
                size={36}
                colorIndex={avatarHexColor ? undefined : (avatarColor ?? 0)}
                hexColor={avatarHexColor ?? undefined}
                ringColor={
                  avatarHexColor
                    ? avatarHexColor
                    : avatarColor !== null
                      ? CLAY[avatarColor % CLAY.length]?.base
                      : undefined
                }
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-200 shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                </div>
                {/* 모바일 전용 탭 메뉴 */}
                <div className="lg:hidden border-b border-gray-100">
                  <Link
                    href="/trips"
                    onClick={() => setDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${active === 'trips' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Plane className={`w-4 h-4 ${active === 'trips' ? 'text-blue-500' : 'text-gray-400'}`} />
                    내 여행
                    {active === 'trips' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </Link>
                  <Link
                    href="/collection"
                    onClick={() => setDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${active === 'collection' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <BookOpen className={`w-4 h-4 ${active === 'collection' ? 'text-blue-500' : 'text-gray-400'}`} />
                    컬렉션
                    {active === 'collection' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </Link>
                  {/* 엑셀 내보내기 — 모바일 */}
                  {onExcel && (
                    <button
                      onClick={() => { setDropdownOpen(false); onExcel() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-500" />
                      엑셀 내보내기
                    </button>
                  )}
                  {/* 문의 / 신고 — 모바일 */}
                  {onReport && (
                    <button
                      onClick={() => { setDropdownOpen(false); onReport() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Headset className="w-4 h-4 text-blue-400" />
                      문의 / 버그 신고
                    </button>
                  )}
                </div>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${active === 'profile' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <User className={`w-4 h-4 ${active === 'profile' ? 'text-blue-500' : 'text-gray-400'}`} />
                  마이페이지
                  {active === 'profile' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
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
