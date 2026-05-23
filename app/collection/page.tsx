'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { Plus, Globe, Trash2 } from 'lucide-react'
import { collection, getDocs, orderBy, query, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AppNavbar } from '@/components/AppNavbar'
import { AuthGuard } from '@/components/AuthGuard'
import { ReportModal } from '@/components/ReportModal'
import { useScrollLock } from '@/hooks/useScrollLock'

type Trip = {
  id:             string
  city:           string
  country?:       string
  startDate:      string
  endDate:        string
  nights:         number
  gradient:       string
  pendingDelete?: boolean
  deletedAt?:     { toMillis(): number } | null
}

type CountryGroup = {
  key:           string
  countryCode:   string
  tripCount:     number
  lastDate:      string
  upcoming:      boolean
  pendingDelete: boolean
  deletedAtMs:   number
}

/* 국가명 → ISO 3166-1 alpha-2 코드 */
const COUNTRY_CODES: Record<string, string> = {
  '한국': 'kr', '대한민국': 'kr',
  '일본': 'jp',
  '중국': 'cn',
  '미국': 'us',
  '영국': 'gb',
  '프랑스': 'fr',
  '독일': 'de',
  '이탈리아': 'it',
  '스페인': 'es',
  '포르투갈': 'pt',
  '네덜란드': 'nl',
  '벨기에': 'be',
  '스위스': 'ch',
  '오스트리아': 'at',
  '체코': 'cz',
  '헝가리': 'hu',
  '폴란드': 'pl',
  '그리스': 'gr',
  '터키': 'tr', '튀르키예': 'tr',
  '러시아': 'ru',
  '태국': 'th',
  '베트남': 'vn',
  '캄보디아': 'kh',
  '라오스': 'la',
  '미얀마': 'mm',
  '싱가포르': 'sg',
  '말레이시아': 'my',
  '인도네시아': 'id',
  '필리핀': 'ph',
  '홍콩': 'hk',
  '대만': 'tw',
  '마카오': 'mo',
  '인도': 'in',
  '네팔': 'np',
  '스리랑카': 'lk',
  '몰디브': 'mv',
  '호주': 'au',
  '뉴질랜드': 'nz',
  '캐나다': 'ca',
  '멕시코': 'mx',
  '브라질': 'br',
  '아르헨티나': 'ar',
  '페루': 'pe',
  '칠레': 'cl',
  '모로코': 'ma',
  '이집트': 'eg',
  '남아프리카': 'za', '남아공': 'za',
  '두바이': 'ae', 'UAE': 'ae', '아랍에미리트': 'ae',
  '이스라엘': 'il',
  '요르단': 'jo',
  '쿠바': 'cu',
  '코스타리카': 'cr',
  '스웨덴': 'se',
  '노르웨이': 'no',
  '덴마크': 'dk',
  '핀란드': 'fi',
  '아이슬란드': 'is',
  '크로아티아': 'hr',
  '슬로베니아': 'si',
  '세르비아': 'rs',
  '루마니아': 'ro',
  '불가리아': 'bg',
  '우크라이나': 'ua',
  '조지아': 'ge',
  '아르메니아': 'am',
  '몽골': 'mn',
  '카자흐스탄': 'kz',
  '우즈베키스탄': 'uz',
  '에티오피아': 'et',
  '케냐': 'ke',
  '탄자니아': 'tz',
  '파나마': 'pa',
  '콜롬비아': 'co',
}

function getCountryCode(name: string): string {
  return COUNTRY_CODES[name.trim()] ?? 'un'
}

function flagUrl(code: string): string {
  return `https://flagcdn.com/w640/${code.toLowerCase()}.png`
}

function parseCountry(trip: Trip): string {
  const raw = trip.country || trip.city || ''
  if (trip.country?.trim()) return trip.country.trim()
  const parts = raw.split(',').map(s => s.trim())
  return parts[1] ?? ''
}

function formatYearMonth(date: string) {
  return date.slice(0, 7).replace('-', '.')
}

const TODAY = new Date()

function CollectionContent() {
  const { user } = useAuthStore()
  const [trips,         setTrips]         = useState<Trip[]>([])
  const [loading,       setLoading]       = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [showReport,    setShowReport]    = useState(false)
  useScrollLock(!!confirmDelete || showReport)

  useEffect(() => {
    if (!user) return
    const MS_24H = 24 * 60 * 60 * 1000
    getDocs(query(collection(db, 'users', user.uid, 'trips'), orderBy('startDate', 'desc')))
      .then(snap => {
        const now = Date.now()
        const toHardDelete: string[] = []
        const all = snap.docs.map(d => {
          const data = d.data() as Omit<Trip, 'id'>
          if (data.pendingDelete && data.deletedAt) {
            if (now - data.deletedAt.toMillis() >= MS_24H) {
              toHardDelete.push(d.id)
              return null
            }
          }
          return { ...data, id: d.id } as Trip
        }).filter(Boolean) as Trip[]
        setTrips(all)
        for (const id of toHardDelete) {
          deleteDoc(doc(db, 'users', user.uid, 'trips', id)).catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const countries = useMemo<CountryGroup[]>(() => {
    type Entry = { group: CountryGroup; total: number; pendingCount: number }
    const map = new Map<string, Entry>()
    for (const trip of trips) {
      const name = parseCountry(trip)
      if (!name) continue
      const isUpcoming = new Date(trip.endDate) >= TODAY
      const isPending  = !!trip.pendingDelete
      const deletedMs  = trip.deletedAt?.toMillis() ?? 0
      if (!map.has(name)) {
        map.set(name, {
          group: {
            key:           name,
            countryCode:   getCountryCode(name),
            tripCount:     1,
            lastDate:      trip.startDate,
            upcoming:      isUpcoming,
            pendingDelete: false,
            deletedAtMs:   deletedMs,
          },
          total:        1,
          pendingCount: isPending ? 1 : 0,
        })
      } else {
        const entry = map.get(name)!
        entry.group.tripCount++
        entry.total++
        if (isPending) entry.pendingCount++
        if (trip.startDate > entry.group.lastDate) entry.group.lastDate = trip.startDate
        if (isUpcoming) entry.group.upcoming = true
        if (deletedMs && deletedMs < entry.group.deletedAtMs) entry.group.deletedAtMs = deletedMs
      }
    }
    return Array.from(map.values()).map(({ group, total, pendingCount }) => ({
      ...group,
      pendingDelete: pendingCount > 0 && pendingCount === total,
    })).sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  }, [trips])

  const handleDeleteCountry = async (countryKey: string) => {
    if (!user) return
    setDeleting(true)
    const now = Date.now()
    setTrips(prev => prev.map(t =>
      parseCountry(t) === countryKey
        ? { ...t, pendingDelete: true, deletedAt: { toMillis: () => now } }
        : t
    ))
    const toSoftDelete = trips.filter(t => parseCountry(t) === countryKey)
    for (const trip of toSoftDelete) {
      await updateDoc(doc(db, 'users', user.uid, 'trips', trip.id), {
        pendingDelete: true,
        deletedAt:     serverTimestamp(),
      }).catch(() => {})
    }
    setDeleting(false)
    setConfirmDelete(null)
  }

  const handleRestoreCountry = async (countryKey: string) => {
    if (!user) return
    setTrips(prev => prev.map(t =>
      parseCountry(t) === countryKey
        ? { ...t, pendingDelete: false, deletedAt: null }
        : t
    ))
    const toRestore = trips.filter(t => parseCountry(t) === countryKey)
    for (const trip of toRestore) {
      await updateDoc(doc(db, 'users', user.uid, 'trips', trip.id), {
        pendingDelete: false,
        deletedAt:     null,
      }).catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AppNavbar active="collection" onReport={() => setShowReport(true)} />
      {showReport && user && <ReportModal user={user} onClose={() => setShowReport(false)} />}

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-gray-900">삭제 예정으로 이동할까요?</h3>
              <p className="text-sm font-semibold text-amber-600">24시간 이내 복원 가능합니다</p>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                <span className="font-semibold text-gray-800">{confirmDelete}</span>의 모든 여행 일정이
                24시간 후 자동으로 삭제됩니다.
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteCountry(confirmDelete)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-16">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="page-heading mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              내 여행 컬렉션
            </h1>
            <p className="text-sm text-gray-500">방문했거나 계획 중인 나라들을 모아보세요.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-3 text-center">
              <p className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {loading ? '–' : countries.filter(c => !c.pendingDelete).length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">방문 나라</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-3 text-center">
              <p className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {loading ? '–' : trips.filter(t => !t.pendingDelete).length}
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
        ) : countries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Globe className="w-10 h-10" />
            <p className="text-sm font-medium">아직 여행 기록이 없어요</p>
            <Link href="/trips/new" className="mt-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              첫 여행 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {countries.map(country => {
              const isPending   = country.pendingDelete
              const remainHours = Math.max(1, Math.ceil(
                ((country.deletedAtMs + 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)
              ))
              const cardInner = (
                <div className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 ${
                  isPending
                    ? 'border-red-200'
                    : 'border-gray-200 hover:shadow-xl hover:border-gray-300'
                }`} style={isPending ? { filter: 'grayscale(80%)', opacity: 0.45 } : {}}>
                  {/* 국기 배경 */}
                  <div className="h-[130px] sm:h-[175px] relative overflow-hidden">
                    <img
                      src={flagUrl(country.countryCode)}
                      alt={country.key}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${!isPending ? 'group-hover:scale-105' : ''}`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="relative h-full flex flex-col justify-between p-4 sm:p-5">
                      <Globe className="w-5 h-5 text-white/70 drop-shadow" />
                      <div>
                        <p
                          className="text-white font-bold text-xl sm:text-2xl leading-tight"
                          style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
                        >
                          {country.key}
                        </p>
                        <p className="text-white/75 text-xs sm:text-sm mt-0.5 font-medium">
                          {country.tripCount}번의 여행
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 카드 하단 */}
                  <div className="px-4 sm:px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] sm:text-xs text-gray-400">
                        {formatYearMonth(country.lastDate)}
                      </p>
                      {!isPending && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          country.upcoming ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {country.upcoming ? '예정' : '방문'}
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-500">
                          삭제 예정
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )

              return (
                <div key={country.key} className="relative group">
                  {isPending ? (
                    <div>{cardInner}</div>
                  ) : (
                    <Link href={`/trips?country=${encodeURIComponent(country.key)}`}>
                      {cardInner}
                    </Link>
                  )}

                  {/* pending 오버레이 */}
                  {isPending && (
                    <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-red-500 text-white shadow-md">
                        {remainHours}시간 후 삭제
                      </span>
                      <button
                        onClick={() => handleRestoreCountry(country.key)}
                        className="text-[11px] font-bold px-4 py-1.5 rounded-full bg-white text-gray-800 hover:bg-gray-50 shadow-lg transition-all pointer-events-auto"
                      >
                        복원하기
                      </button>
                    </div>
                  )}

                  {/* 삭제 버튼 — pending 아닐 때만 표시 */}
                  {!isPending && (
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(country.key) }}
                      className="absolute bottom-2.5 right-3 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                    </button>
                  )}
                </div>
              )
            })}

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
  return (
    <AuthGuard>
      <Suspense>
        <CollectionContent />
      </Suspense>
    </AuthGuard>
  )
}
