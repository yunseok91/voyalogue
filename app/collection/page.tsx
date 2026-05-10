'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Plus, Globe, MapPin, Trash2, Palette } from 'lucide-react'
import { collection, getDocs, orderBy, query, doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AppNavbar } from '@/components/AppNavbar'
import { AuthGuard } from '@/components/AuthGuard'
import { THEME_COLORS, gradientStyle } from '@/lib/tripGradient'

type Trip = {
  id:        string
  city:      string
  country:   string
  startDate: string
  endDate:   string
  nights:    number
  gradient:  string
}

type CityGroup = {
  key:        string
  city:       string
  country:    string
  gradient:   string
  tripCount:  number
  lastDate:   string
  upcoming:   boolean
}

type CitySettings = {
  gradient?: string
  hidden?:   boolean
}

const TODAY = new Date()

function parseCity(raw: string) {
  const parts = raw.split(',').map(s => s.trim())
  return { city: parts[0] ?? raw, country: parts[1] ?? '' }
}

function formatYearMonth(date: string) {
  return date.slice(0, 7).replace('-', '.')
}

function CollectionContent() {
  const { user } = useAuthStore()
  const [trips, setTrips]                 = useState<Trip[]>([])
  const [loading, setLoading]             = useState(true)
  const [settings, setSettings]           = useState<Record<string, CitySettings>>({})
  const [hovered, setHovered]             = useState<string | null>(null)
  const [colorPicker, setColorPicker]     = useState<string | null>(null)
  const [deletingKey, setDeletingKey]     = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'trips'),
      orderBy('startDate', 'desc')
    )
    getDocs(q)
      .then(snap => setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trip))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const ref = doc(db, 'users', user.uid, 'meta', 'citySettings')
        const snap = await getDoc(ref)
        if (snap.exists()) setSettings(snap.data() as Record<string, CitySettings>)
      } catch { /* silent */ }
    }
    load()
  }, [user])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setColorPicker(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const saveSetting = async (key: string, patch: Partial<CitySettings>) => {
    if (!user) return
    const next = { ...settings, [key]: { ...settings[key], ...patch } }
    setSettings(next)
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'meta', 'citySettings'),
        next,
        { merge: true }
      )
    } catch { /* silent */ }
  }

  const handleColorSelect = async (key: string, themeId: string) => {
    const theme = THEME_COLORS.find(t => t.id === themeId)
    if (!theme) return
    const gradient = `${theme.from},${theme.to}`
    await saveSetting(key, { gradient })
    setColorPicker(null)
  }

  const handleDelete = async (key: string) => {
    setDeletingKey(key)
    await saveSetting(key, { hidden: true })
    setDeletingKey(null)
  }

  const cities = useMemo<CityGroup[]>(() => {
    const map = new Map<string, CityGroup>()
    for (const trip of trips) {
      const { city, country } = parseCity(trip.city)
      const key = city
      if (settings[key]?.hidden) continue
      const end = new Date(trip.endDate)
      const isUpcoming = end >= TODAY

      if (!map.has(key)) {
        map.set(key, {
          key, city,
          country: trip.country || country,
          gradient: settings[key]?.gradient ?? trip.gradient,
          tripCount: 1,
          lastDate: trip.startDate,
          upcoming: isUpcoming,
        })
      } else {
        const g = map.get(key)!
        g.tripCount++
        if (trip.startDate > g.lastDate) {
          g.lastDate = trip.startDate
          if (!settings[key]?.gradient) g.gradient = trip.gradient
        }
        if (isUpcoming) g.upcoming = true
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  }, [trips, settings])

  return (
    <div className="min-h-screen bg-[#F5F5F3]" style={{ fontFamily: 'Inter, sans-serif' }}>

      <AppNavbar active="collection" />

      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-16">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="page-heading mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              내 여행 컬렉션
            </h1>
            <p className="text-sm text-gray-500">방문했거나 계획 중인 도시들을 모아보세요.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-3 text-center">
              <p className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {loading ? '–' : cities.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">방문 도시</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-3 text-center">
              <p className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {loading ? '–' : trips.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">총 여행</p>
            </div>
          </div>
        </div>

        {/* 스켈레톤 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-[120px] sm:h-[160px] bg-gray-200" />
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="h-3 w-14 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {cities.map(city => (
              <div
                key={city.key}
                className="relative group"
                onMouseEnter={() => setHovered(city.key)}
                onMouseLeave={() => { setHovered(null); setColorPicker(null) }}
              >
                <Link href="/trips">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                    <div
                      className="h-[120px] sm:h-[160px] flex flex-col justify-between p-4 sm:p-5"
                      style={{ background: gradientStyle(city.gradient) }}
                    >
                      <div className="flex items-center justify-between">
                        <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" />
                        {city.upcoming && (
                          <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                            예정
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-bold text-base sm:text-xl leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {city.city}
                        </p>
                        <p className="text-white/70 text-xs sm:text-sm">{city.country}</p>
                      </div>
                    </div>
                    <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">{city.tripCount}번의 여행</p>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                          {formatYearMonth(city.lastDate)} {city.upcoming ? '예정' : '방문'}
                        </p>
                      </div>
                      <Globe className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </Link>

                {/* 액션 버튼 (호버 시) */}
                {hovered === city.key && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {/* 색상 변경 버튼 */}
                    <div className="relative" ref={colorPicker === city.key ? pickerRef : undefined}>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setColorPicker(prev => prev === city.key ? null : city.key) }}
                        className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors"
                        title="배경 색상 변경"
                      >
                        <Palette className="w-3.5 h-3.5 text-gray-600" />
                      </button>

                      {/* 색상 팝업 */}
                      {colorPicker === city.key && (
                        <div
                          className="absolute top-9 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20"
                          onClick={e => e.preventDefault()}
                        >
                          <p className="text-[10px] font-semibold text-gray-400 mb-2 whitespace-nowrap">배경 색상</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {THEME_COLORS.map(theme => {
                              const current = city.gradient
                              const isActive = current === `${theme.from},${theme.to}` ||
                                current?.startsWith(`from-${theme.id}`)
                              return (
                                <button
                                  key={theme.id}
                                  onClick={e => { e.preventDefault(); e.stopPropagation(); handleColorSelect(city.key, theme.id) }}
                                  title={theme.label}
                                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                    isActive ? 'border-gray-800 scale-110' : 'border-transparent'
                                  }`}
                                  style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(city.key) }}
                      disabled={deletingKey === city.key}
                      className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="컬렉션에서 제거"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* 새 여행 추가 카드 */}
            <Link href="/trips/new">
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all min-h-[200px] sm:min-h-[260px] flex flex-col items-center justify-center gap-3 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-400 group-hover:text-blue-500 transition-colors">
                  새 여행 추가
                </p>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

export default function CollectionPage() {
  return <AuthGuard><CollectionContent /></AuthGuard>
}
