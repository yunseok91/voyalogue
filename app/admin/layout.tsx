'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Megaphone, Flag } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

const NAV = [
  { href: '/admin',               icon: LayoutDashboard, label: '대시보드' },
  { href: '/admin/users',         icon: Users,           label: '사용자' },
  { href: '/admin/announcements', icon: Megaphone,       label: '공지사항' },
  { href: '/admin/reports',       icon: Flag,            label: '신고 관리' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router    = useRouter()
  const pathname  = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/trips'); return }

    getDoc(doc(db, 'admins', user.uid)).then(snap => {
      if (!snap.exists()) router.replace('/trips')
      else setChecking(false)
    }).catch(() => router.replace('/trips'))
  }, [user, loading, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 min-h-screen py-6 px-3 gap-1 flex-shrink-0">
        <div className="px-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600" />
            <span className="font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Admin</span>
          </div>
        </div>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </aside>

      {/* 콘텐츠 */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>

        {/* 모바일 하단 탭 */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-40">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
