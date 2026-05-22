'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Calendar, Minus, Plus, MapPin, ChevronRight, Loader2, Sparkles, ImagePlus, X } from 'lucide-react'
import { collection, addDoc, setDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'
import { THEME_COLORS } from '@/lib/tripGradient'
import { generateCode } from '@/lib/inviteCode'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { AiTripPlanner } from '@/components/AiTripPlanner'
import { useScrollLock } from '@/hooks/useScrollLock'

/* ── 타입 ──────────────────────────────────── */
type Country = {
  cca2:    string   // 'jp', 'fr' …
  name:    string   // 한국어 국가명
  capital: string   // 수도
  region:  string   // 'Asia', 'Europe' …
  flagSvg: string   // SVG URL
}

type Suggestion =
  | { kind: 'country'; country: Country }
  | { kind: 'city';    city: string; countryName: string; countryCode: string }

/* ── 국기 컴포넌트 ──────────────────────────── */
function Flag({ svg, alt = '', className = '' }: { svg: string; alt?: string; className?: string }) {
  if (!svg) return <div className={`w-5 h-4 bg-gray-200 rounded-[2px] flex-shrink-0 ${className}`} />
  return (
    <img src={svg} alt={alt} width={24} height={16}
      className={`rounded-[2px] object-cover flex-shrink-0 shadow-sm ${className}`} />
  )
}

/* ── 한국 주요 도시 (정적 데이터) ──────────── */
const KR_CITIES = [
  '서울', '부산', '제주', '인천', '대구', '대전', '광주', '울산', '수원',
  '경주', '여수', '통영', '전주', '강릉', '속초', '춘천', '가평', '남해',
  '거제', '안동', '포항', '목포', '순천', '군산', '보령', '태안', '양양',
  '평창', '정선', '충주', '공주', '부여', '담양', '하동', '사천', '고성',
  '울릉도', '독도', '보성', '장흥', '해남', '진도', '완도', '고흥',
].map(city => ({
  kind: 'city' as const,
  city,
  countryName: '한국',
  countryCode: 'kr',
}))

/* ── 모듈 레벨 캐시 ── */
let countriesCache: Country[] | null = null

/* ── 상수 ──────────────────────────────────── */
const POPULAR_CODES = ['jp', 'fr', 'th', 'sg', 'us', 'es', 'id', 'kr', 'gb', 'vn', 'it', 'au']

const EXISTING_TRIPS = [
  { label: '파리, 프랑스', date: '2026.07.15 – 07.20  ·  5박 6일', from: '#8B5CF6', to: '#6D28D9' },
  { label: '제주, 한국',   date: '2026.03.20 – 03.23  ·  3박 4일', from: '#10B981', to: '#059669' },
]

/* ── 유틸 ──────────────────────────────────── */
function calcNights(start: string, end: string) {
  if (!start || !end) return null
  const s = new Date(start), e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null
  const nights = Math.round((e.getTime() - s.getTime()) / 86400000)
  return { nights, days: nights + 1 }
}

/* ── 한국 도시 로컬 검색 ── */
function searchKrCities(q: string) {
  return KR_CITIES.filter(c => c.city.includes(q)).slice(0, 5)
}

/* ── Google Places로 도시 검색 (한글/영문 모두 지원) ── */
async function fetchCitiesGoogle(
  q: string,
  countries: Country[],
  signal?: AbortSignal,
): Promise<Extract<Suggestion, { kind: 'city' }>[]> {
  if (signal?.aborted) return []
  try { await loadGoogleMaps() } catch { return [] }

  return new Promise(resolve => {
    let settled = false
    const finish = (v: Extract<Suggestion, { kind: 'city' }>[]) => {
      if (settled) return
      settled = true
      resolve(v)
    }
    signal?.addEventListener('abort', () => finish([]))

    const svc = new google.maps.places.AutocompleteService()
    svc.getPlacePredictions({ input: q, types: ['(cities)'] }, (preds, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !preds) { finish([]); return }
      const seen = new Set<string>()
      const results: Extract<Suggestion, { kind: 'city' }>[] = []
      for (const p of preds.slice(0, 5)) {
        const city        = p.terms[0]?.value
        const countryName = p.terms[p.terms.length - 1]?.value || ''
        if (!city) continue
        const key = `${city}|${countryName}`
        if (seen.has(key)) continue
        seen.add(key)
        const found = countries.find(c => c.name === countryName)
        results.push({ kind: 'city', city, countryName, countryCode: found?.cca2 ?? '' })
      }
      finish(results)
    })
  })
}

/* ── 컴포넌트 ──────────────────────────────── */
function NewTripContent() {
  const router  = useRouter()
  const { user } = useAuthStore()

  /* RestCountries 데이터 */
  const [countries, setCountries] = useState<Country[]>([])
  const [rcLoading, setRcLoading] = useState(true)

  /* 폼 상태 */
  const [query, setQuery]             = useState('')
  const [selected, setSelected]       = useState<{ label: string; countryCode: string; flagSvg: string } | null>(null)
  const [startDate, setStart]         = useState('')
  const [endDate, setEnd]             = useState('')
  const [people, setPeople]           = useState(2)
  const [budget, setBudget]           = useState(0)
  const [themeIdx, setTheme]          = useState(0)
  const [customColor, setCustom]      = useState('#6366F1')
  const [useCustom, setUseCustom]     = useState(false)
  const [tripTitle, setTitle]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [showAiPlanner, setShowAiPlanner] = useState(false)
  useScrollLock(showAiPlanner)
  const [coverPhotoFile,    setCoverPhotoFile]    = useState<File | null>(null)
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  /* 자동완성 상태 */
  const [citySuggestions, setCitySug] = useState<Extract<Suggestion, { kind: 'city' }>[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const [open, setOpen]               = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef    = useRef<AbortController | null>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)

  /* ── RestCountries: 캐시 우선, 없으면 1회 fetch ── */
  useEffect(() => {
    if (countriesCache) {
      setCountries(countriesCache)
      setRcLoading(false)
      return
    }
    fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,capital,translations,region')
      .then(r => r.json())
      .then((data: any[]) => {
        const list: Country[] = data
          .map(d => ({
            cca2:    d.cca2?.toLowerCase() ?? '',
            name:    d.translations?.kor?.common || d.name?.common || '',
            capital: d.capital?.[0] ?? '',
            region:  d.region ?? '',
            flagSvg: d.flags?.svg ?? '',
          }))
          .filter(c => c.name && c.cca2)
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        countriesCache = list
        setCountries(list)
      })
      .catch(() => {})
      .finally(() => setRcLoading(false))
  }, [])

  /* ── 언마운트 시 진행 중인 fetch 취소 ── */
  useEffect(() => () => { abortRef.current?.abort() }, [])

  /* ── 인기 여행지 (RestCountries 로드 후) ── */
  const popularCountries = useMemo(
    () => POPULAR_CODES.map(code => countries.find(c => c.cca2 === code)).filter(Boolean) as Country[],
    [countries]
  )

  /* ── 국가 로컬 필터 ── */
  const countryMatches = useMemo<Country[]>(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return countries
      .filter(c =>
        c.name.includes(query.trim()) ||
        c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.cca2 === q
      )
      .slice(0, 5)
  }, [query, countries])

  /* ── 테마 컬러 ── */
  const activeFrom = useCustom ? customColor : THEME_COLORS[themeIdx].from
  const activeTo   = useCustom ? customColor : THEME_COLORS[themeIdx].to

  /* ── 박수 계산 ── */
  const nightInfo = useMemo(() => calcNights(startDate, endDate), [startDate, endDate])

  /* ── 미리보기 ── */
  const previewLabel   = selected?.label   || query || '도시를 선택하세요'
  const previewFlagSvg = selected?.flagSvg || ''
  const previewSub     = query
    ? (startDate && endDate ? `${startDate} – ${endDate.slice(5)}` : '날짜 미정')
    : '나라 · 날짜 미정'
  const previewNight   = nightInfo ? (nightInfo.nights === 0 ? '당일치기' : `${nightInfo.nights}박 ${nightInfo.days}일`) : '0박 0일'
  const canSubmit      = query.trim() && startDate && endDate && nightInfo !== null

  /* ── 도시 검색: 한국 도시 즉시 + Google Places 디바운스 ── */
  const handleQueryChange = useCallback((val: string) => {
    setQuery(val)
    setSelected(null)
    setOpen(true)
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (val.length < 1) { setCitySug([]); setCityLoading(false); return }

    // 한국 도시 즉시 로컬 필터
    setCitySug(searchKrCities(val))

    if (val.length < 2) { setCityLoading(false); return }

    setCityLoading(true)
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const krResults  = searchKrCities(val)
        const krNames    = new Set(krResults.map(c => c.city))
        const overseas   = await fetchCitiesGoogle(val, countries, ctrl.signal)
        if (!ctrl.signal.aborted) {
          const filtered = overseas.filter(o => o.countryCode !== 'kr' && !krNames.has(o.city))
          setCitySug([...krResults, ...filtered])
          setCityLoading(false)
        }
      } catch {
        // AbortError: 다음 쿼리가 이어받으므로 무시
      }
    }, 350)
  }, [countries])

  /* ── 국가 선택 ── */
  const selectCountry = (c: Country) => {
    const label = c.capital ? `${c.capital}, ${c.name}` : c.name
    setQuery(label)
    setSelected({ label, countryCode: c.cca2, flagSvg: c.flagSvg })
    setOpen(false)
  }

  /* ── 도시 선택 ── */
  const selectCity = (s: Extract<Suggestion, { kind: 'city' }>) => {
    const label = s.countryName ? `${s.city}, ${s.countryName}` : s.city
    const found  = countries.find(c => c.cca2 === s.countryCode)
    setQuery(label)
    setSelected({ label, countryCode: s.countryCode, flagSvg: found?.flagSvg ?? '' })
    setOpen(false)
  }

  /* ── 외부 클릭 닫기 ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* ── 제출: Firestore에 여행 저장 ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !user) return
    setLoading(true)

    const nights = nightInfo!.nights
    const days   = nightInfo!.days

    /* gradient 결정 — "#from,#to" hex 형식으로 저장 */
    const gradient = useCustom
      ? `${customColor},${customColor}`
      : `${THEME_COLORS[themeIdx].from},${THEME_COLORS[themeIdx].to}`

    try {
      const viewCode = generateCode()
      const editCode = generateCode()
      const ref = await addDoc(collection(db, 'users', user.uid, 'trips'), {
        city:      query.trim(),
        country:   selected?.label.split(', ')[1] ?? '',
        startDate,
        endDate,
        nights,
        days,
        gradient,
        people,
        budget:    Math.max(0, budget || 0) * 10000,
        title:     tripTitle.trim() || '',
        viewCode,
        editCode,
        members:   [{ id: user.uid, name: user.displayName ?? '나', role: 'owner', ...(user.photoURL ? { photoURL: user.photoURL } : {}) }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await Promise.all([
        setDoc(doc(db, 'shareIndex', viewCode), { uid: user.uid, tripId: ref.id, canEdit: false }),
        setDoc(doc(db, 'shareIndex', editCode), { uid: user.uid, tripId: ref.id, canEdit: true }),
      ])

      /* 대표 사진 업로드 */
      if (coverPhotoFile) {
        try {
          const [{ storage }, { ref: storRef, uploadBytes, getDownloadURL }] = await Promise.all([
            import('@/lib/firebase'),
            import('firebase/storage'),
          ])
          const ext = coverPhotoFile.name.split('.').pop() ?? 'jpg'
          const photoRef = storRef(storage, `users/${user.uid}/trips/${ref.id}/cover.${ext}`)
          await uploadBytes(photoRef, coverPhotoFile)
          const coverPhotoURL = await getDownloadURL(photoRef)
          await updateDoc(doc(db, 'users', user.uid, 'trips', ref.id), { coverPhotoURL })
        } catch { /* silent */ }
      }

      localStorage.setItem('showServiceReview', '1')
      router.push(`/trips/${ref.id}`)
    } catch {
      setLoading(false)
    }
  }

  /* ── 드롭다운 렌더링 결정 ── */
  const showPopular   = query.length < 2
  const hasCountries  = countryMatches.length > 0
  const hasCities     = citySuggestions.length > 0
  const showEmpty     = !showPopular && !hasCountries && !hasCities && !cityLoading

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {showAiPlanner && <AiTripPlanner onClose={() => setShowAiPlanner(false)} />}


      {/* Navbar */}
      <nav className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-10 relative flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-blue-600" />
          <span className="font-bold text-lg text-gray-900 hidden sm:block" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
        </div>
        <Link href="/trips" className="ml-3 sm:ml-6 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0">
          ← <span className="hidden sm:inline">내 여행으로</span><span className="sm:hidden">뒤로</span>
        </Link>
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-900 whitespace-nowrap">새 여행 만들기</span>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* ── 왼쪽: 폼 ─────────────────────────── */}
        <div className="w-full lg:w-[720px] flex-shrink-0 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
          <form onSubmit={handleSubmit} className="px-4 sm:px-10 lg:px-20 py-6 sm:py-8 lg:py-10 flex flex-col gap-8">

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-gray-900 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                새 여행 만들기
              </h1>
              <p className="mt-2 text-sm text-gray-500">여행 정보를 입력하고 일정을 바로 시작하세요.</p>

              {/* AI 플래너 배너 */}
              <button
                type="button"
                onClick={() => setShowAiPlanner(true)}
                className="mt-4 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white transition-all shadow-md shadow-blue-500/20 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold leading-tight">AI로 여행 일정 자동 생성</p>
                  <p className="text-xs text-white/70 mt-0.5">몇 가지 질문에 답하면 AI가 일정을 짜줘요</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">또는 직접 입력</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>

            {/* ── 도시/국가 검색 ── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-700">
                어디로 여행하시나요? <span className="text-blue-600">*</span>
              </label>
              <div ref={wrapperRef} className="relative">
                <div className="relative">
                  {cityLoading
                    ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-blue-500 animate-spin" />
                    : <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  }
                  <input
                    type="text"
                    data-tour="city-search"
                    placeholder={rcLoading ? '국가 데이터 로딩 중…' : '국가·도시 검색  (예: 일본, 파리, 뉴욕…)'}
                    value={query}
                    onChange={e => handleQueryChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    autoComplete="off"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* ── 드롭다운 ── */}
                {open && (
                  <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

                    {/* 인기 여행지 (입력 전) */}
                    {showPopular && (
                      <>
                        <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          인기 여행지
                        </p>
                        <ul className="py-1 max-h-72 overflow-y-auto">
                          {popularCountries.map(c => (
                            <li key={c.cca2}>
                              <button type="button" onMouseDown={() => selectCountry(c)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                                <Flag svg={c.flagSvg} alt={c.name} />
                                <span className="text-sm text-gray-800 font-medium flex-1">{c.name}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">{c.capital}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {/* 검색 결과 */}
                    {!showPopular && (
                      <div className="max-h-80 overflow-y-auto">

                        {/* 국가 섹션 */}
                        {hasCountries && (
                          <>
                            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">나라</p>
                            <ul className="pb-1">
                              {countryMatches.map(c => (
                                <li key={c.cca2}>
                                  <button type="button" onMouseDown={() => selectCountry(c)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                                    <Flag svg={c.flagSvg} alt={c.name} />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm text-gray-800 font-medium">{c.name}</span>
                                      {c.capital && (
                                        <span className="ml-2 text-xs text-gray-400">{c.capital}</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-300 uppercase flex-shrink-0">{c.region}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {/* 도시 섹션 */}
                        {(hasCities || cityLoading) && (
                          <>
                            {(hasCountries) && <div className="h-px bg-gray-100 mx-4" />}
                            <p className="px-4 pt-2.5 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              도시
                              {cityLoading && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                            </p>
                            {hasCities && (
                              <ul className="pb-1">
                                {citySuggestions.map((s, i) => {
                                  const found = countries.find(c => c.cca2 === s.countryCode)
                                  return (
                                    <li key={i}>
                                      <button type="button" onMouseDown={() => selectCity(s)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                                        <Flag svg={found?.flagSvg ?? ''} alt={s.countryName} />
                                        <span className="text-sm text-gray-800 font-medium flex-1">{s.city}</span>
                                        {s.countryName && (
                                          <span className="text-xs text-gray-400 flex-shrink-0">{s.countryName}</span>
                                        )}
                                      </button>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </>
                        )}

                        {showEmpty && (
                          <p className="px-4 py-5 text-sm text-gray-400 text-center">검색 결과가 없어요.</p>
                        )}
                      </div>
                    )}

                    {/* 직접 추가 */}
                    {query.trim().length >= 1 && (
                      <div className={showPopular || hasCountries || hasCities ? 'border-t border-gray-100' : ''}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            const label = query.trim()
                            setQuery(label)
                            setSelected({ label, countryCode: '', flagSvg: '' })
                            setOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm text-blue-600 font-semibold">"{query.trim()}" 직접 추가하기</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── 여행 기간 ── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-700">
                여행 기간 <span className="text-blue-600">*</span>
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-gray-400">출발일</span>
                  <div className="relative min-w-0">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
                      className="w-full max-w-full min-w-0 pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-gray-400">종료일</span>
                  <div className="relative min-w-0">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEnd(e.target.value)}
                      className="w-full max-w-full min-w-0 pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none" />
                  </div>
                </div>
              </div>
              {nightInfo && (
                <p className="text-xs text-blue-600 font-semibold pl-1">
                  {nightInfo.nights === 0 ? '당일치기 일정' : `${nightInfo.nights}박 ${nightInfo.days}일 일정`}
                </p>
              )}
            </div>

            {/* ── 여행 인원 ── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-700">여행 인원</label>
              <div className="flex items-center w-fit bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setPeople(p => Math.max(1, p - 1))}
                  className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center text-base font-bold text-gray-900">{people}명</span>
                <button type="button" onClick={() => setPeople(p => Math.min(20, p + 1))}
                  className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── 여행 예산 ── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-700">여행 예산 <span className="text-gray-400 font-normal">(만원 단위, 선택)</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={budget || ''}
                  onChange={e => setBudget(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <span className="text-sm font-medium text-gray-500 flex-shrink-0">만원</span>
              </div>
              {budget > 0 && (
                <p className="text-xs text-blue-600 font-medium pl-1">
                  = {(budget * 10000).toLocaleString()}원
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {[10, 30, 50, 100, 200].map(v => (
                  <button key={v} type="button" onClick={() => setBudget(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      budget === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                    }`}>
                    {v}만원
                  </button>
                ))}
              </div>
            </div>

            {/* ── 대표 사진 · 테마 컬러 ── */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-700">대표 사진 · 테마 컬러</label>

              {/* 사진 업로드 */}
              {coverPhotoPreview ? (
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={coverPhotoPreview} alt="커버" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => coverFileRef.current?.click()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/90 rounded-full text-xs font-semibold text-gray-700 hover:bg-white transition-colors">
                      <ImagePlus className="w-3 h-3" />변경
                    </button>
                    <button type="button" onClick={() => { setCoverPhotoFile(null); setCoverPhotoPreview(null) }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500/90 rounded-full text-xs font-semibold text-white hover:bg-red-500 transition-colors">
                      <X className="w-3 h-3" />제거
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => coverFileRef.current?.click()}
                  className="w-full h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1 transition-colors text-gray-400 hover:text-blue-500">
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-xs font-medium">사진 업로드 (선택)</span>
                </button>
              )}
              <input ref={coverFileRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setCoverPhotoFile(file)
                  setCoverPhotoPreview(URL.createObjectURL(file))
                  e.target.value = ''
                }} />

              {/* 색상 — 대표 사진 없을 때 */}
              {!coverPhotoPreview && (
                <>
                  <p className="text-xs text-gray-400">또는 카드 색상을 선택하세요.</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {THEME_COLORS.slice(0, 5).map((c, i) => (
                      <button key={c.id} type="button"
                        onClick={() => { setTheme(i); setUseCustom(false) }}
                        className="relative w-10 h-10 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                        {!useCustom && themeIdx === i && (
                          <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-blue-600" />
                        )}
                      </button>
                    ))}
                    <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
                    <label className="relative w-10 h-10 rounded-full cursor-pointer transition-transform hover:scale-110 flex-shrink-0 overflow-hidden" title="직접 색상 선택">
                      <input type="color" value={customColor}
                        onChange={e => { setCustom(e.target.value); setUseCustom(true) }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="w-full h-full rounded-full flex items-center justify-center"
                        style={{ background: useCustom ? customColor : 'conic-gradient(from 0deg, #f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #f43f5e)' }}>
                        {!useCustom && (
                          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                            <circle cx="10" cy="10" r="2.5" fill="white" opacity="0.9" />
                            <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
                          </svg>
                        )}
                      </div>
                      {useCustom && <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-blue-600 pointer-events-none" />}
                    </label>
                    {useCustom && <span className="text-xs font-mono text-gray-500">{customColor.toUpperCase()}</span>}
                  </div>
                </>
              )}
            </div>

            {/* ── 여행 제목 (선택) ── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-gray-700">
                  여행 제목 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <span className={`text-[11px] font-medium tabular-nums ${tripTitle.length >= 18 ? 'text-orange-500' : 'text-gray-300'}`}>
                  {tripTitle.length}/20
                </span>
              </div>
              <input type="text" placeholder="예: 도쿄의 봄, 파리 첫 여행…" value={tripTitle}
                onChange={e => setTitle(e.target.value.slice(0, 20))}
                maxLength={20}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
            </div>

            {/* ── CTA ── */}
            <button type="submit" disabled={!canSubmit || loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-base font-bold transition-colors flex items-center justify-center gap-2">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>여행 만들기 <ChevronRight className="w-5 h-5" /></>
              }
            </button>
          </form>
        </div>

        {/* ── 오른쪽: 미리보기 패널 ──────────────── */}
        <div className="hidden lg:flex flex-1 bg-[#EFF6FF] flex-col items-center justify-center px-8 lg:px-16 gap-6 overflow-y-auto py-10">
          <div className="w-full max-w-[440px] flex flex-col gap-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">미리보기</p>

            <div className="w-full rounded-3xl overflow-hidden border border-white/60 shadow-lg bg-white">
              <div className="h-44 p-6 flex flex-col justify-between transition-all duration-300"
                style={coverPhotoPreview ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%), url(${coverPhotoPreview})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : { background: `linear-gradient(135deg, ${activeFrom}, ${activeTo})` }}>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-6 h-6 text-white/80" />
                  {previewFlagSvg && (
                    <img src={previewFlagSvg} alt="" width={28} height={20}
                      className="rounded-[3px] object-cover shadow-md border border-white/20" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {previewLabel}
                  </p>
                  <p className="text-sm text-white/70 mt-0.5">{previewSub}</p>
                </div>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{previewNight}</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">{people}명</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">내 여행 목록에 추가됩니다</p>
            <div className="flex flex-col gap-2">
              {EXISTING_TRIPS.map((t, i) => (
                <div key={i} className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-white flex"
                  style={{ opacity: i === 0 ? 0.5 : 0.25 }}>
                  <div className="w-16 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }} />
                  <div className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.date}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                생성 후 플래너 화면으로 이동합니다
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewTripPage() {
  return <AuthGuard><NewTripContent /></AuthGuard>
}
