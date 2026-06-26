'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Car, Fuel, X, Upload, ImageIcon, MapPin, Navigation, Clock, Move, ZoomIn } from 'lucide-react'
import { formatKRW } from '@/lib/exchangeRate'
import Image from 'next/image'

function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min}분`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'KRW') return formatKRW(amount)
  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency', currency,
      maximumFractionDigits: 0, minimumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currency}`
  }
}

function getCurrencyUnit(currency: string): string {
  if (currency === 'KRW') return '원'
  const symbols: Record<string, string> = {
    USD: 'USD', EUR: 'EUR', JPY: 'JPY', GBP: 'GBP',
    CNY: 'CNY', AUD: 'AUD', CAD: 'CAD', THB: 'THB', VND: 'VND',
  }
  return symbols[currency] ?? currency
}

type PlaceSuggestion = { name: string; address: string; lat: number; lng: number }

function PlaceInput({
  icon, placeholder, value, onChange, onSelect,
}: {
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSelect: (p: PlaceSuggestion) => void
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading,     setLoading]     = useState(false)
  const [open,        setOpen]        = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/place-search?q=${encodeURIComponent(q)}`)
      const data: PlaceSuggestion[] = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(v: string) {
    onChange(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(v), 400)
  }

  function select(p: PlaceSuggestion) {
    onChange(p.name)
    onSelect(p)
    setSuggestions([])
    setOpen(false)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-gray-300"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((p, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => select(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-sky-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
              <p className="text-xs text-gray-400 truncate">{p.address}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export type DrivingCostData = {
  km:             number
  fuel:           number
  toll:           number
  driverBenefit:  boolean
  receipts?:      string[]
  coverPosition?: number
  origin?:        string
  destination?:   string
  originCoords?:  { lat: number; lng: number }
  destCoords?:    { lat: number; lng: number }
}

type MemberInfo = { id: string; name: string; role: string; isDriver?: boolean }

type Props = {
  members:           MemberInfo[]
  canEdit:           boolean
  canAttachReceipt:  boolean
  data?:             DrivingCostData
  currency?:         string          // 여행 통화 (기본값: 'KRW')
  onSave:            (data: DrivingCostData) => Promise<void>
  onUploadReceipt?:  (file: File) => Promise<string>
  onDeleteReceipt?:  (url: string) => Promise<void>
}

export function DrivingCostSection({
  members, canEdit, canAttachReceipt, data,
  currency = 'KRW',
  onSave, onUploadReceipt, onDeleteReceipt,
}: Props) {
  const [open,          setOpen]          = useState(false)
  const [km,            setKm]            = useState(data?.km   ?? 0)
  const [fuel,          setFuel]          = useState(data?.fuel ?? 0)
  const [toll,          setToll]          = useState(data?.toll ?? 0)
  const [driverBenefit, setDriverBenefit] = useState(data?.driverBenefit ?? false)
  const [saving,        setSaving]        = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [origin,        setOrigin]        = useState('')
  const [destination,   setDestination]   = useState('')
  const [originCoords,  setOriginCoords]  = useState<{ lat: number; lng: number } | null>(null)
  const [destCoords,    setDestCoords]    = useState<{ lat: number; lng: number } | null>(null)
  const [fetching,      setFetching]      = useState(false)
  const [routeError,    setRouteError]    = useState<string | null>(null)
  const [routeInfo,     setRouteInfo]     = useState<{ km: number; toll: number; duration: number } | null>(null)
  const [lightboxIdx,   setLightboxIdx]   = useState<number | null>(null)
  const [dragging,      setDragging]      = useState(false)
  const [coverPosY,     setCoverPosY]     = useState(50)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const dragStartY    = useRef(0)
  const dragStartPos  = useRef(50)

  const driver            = members.find(m => m.isDriver === true || m.role === 'driver')
  const activeMemberCount = members.length
  const isKRW             = currency === 'KRW'
  const unit              = getCurrencyUnit(currency)
  const fmt               = (n: number) => formatAmount(n, currency)

  if (!driver && !canEdit) return null
  const total             = (fuel || 0) + (toll || 0)
  const splitCount        = driverBenefit && driver ? activeMemberCount - 1 : activeMemberCount
  const perPerson         = splitCount > 0 && total > 0 ? Math.round(total / splitCount) : 0
  const receipts          = data?.receipts ?? []

  function openModal() {
    setKm(data?.km   ?? 0)
    setFuel(data?.fuel ?? 0)
    setToll(data?.toll ?? 0)
    setDriverBenefit(data?.driverBenefit ?? false)
    setOrigin(data?.origin ?? '')
    setDestination(data?.destination ?? '')
    setOriginCoords(data?.originCoords ?? null)
    setDestCoords(data?.destCoords ?? null)
    setRouteError(null)
    setRouteInfo(data?.km ? { km: data.km, toll: data.toll ?? 0, duration: 0 } : null)
    setCoverPosY(data?.coverPosition ?? 50)
    setOpen(true)
  }

  function baseData(): DrivingCostData {
    return {
      km, fuel, toll, driverBenefit,
      receipts:      data?.receipts,
      coverPosition: coverPosY,
      origin,        destination,
      originCoords:  originCoords ?? undefined,
      destCoords:    destCoords   ?? undefined,
    }
  }

  async function fetchRoute() {
    if (!originCoords || !destCoords) {
      setRouteError('출발지와 도착지를 목록에서 선택해주세요.')
      return
    }
    setFetching(true)
    setRouteError(null)
    setRouteInfo(null)
    try {
      const params = new URLSearchParams({
        originLat: String(originCoords.lat),
        originLng: String(originCoords.lng),
        destLat:   String(destCoords.lat),
        destLng:   String(destCoords.lng),
      })
      const res  = await fetch(`/api/driving-cost?${params}`)
      const json = await res.json()
      if (!res.ok) { setRouteError(json.error ?? '경로를 계산할 수 없습니다.'); return }
      const kmVal   = Math.round(json.distance / 1000)
      const tollVal = json.toll ?? 0
      setKm(kmVal)
      setToll(tollVal)
      setRouteInfo({ km: kmVal, toll: tollVal, duration: json.duration })
      // 저장 실패가 경로 계산 성공 메시지를 덮지 않도록 분리
      onSave({ ...baseData(), km: kmVal, toll: tollVal }).catch(() => {})
    } catch {
      setRouteError('경로 계산 중 오류가 발생했습니다.')
    } finally {
      setFetching(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(baseData())
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !onUploadReceipt) return
    e.target.value = ''
    setUploading(true)
    try {
      for (const file of files) await onUploadReceipt(file)
    } finally {
      setUploading(false)
    }
  }

  const summaryTotal = (data?.fuel ?? 0) + (data?.toll ?? 0)

  return (
    <>
      {/* ── 트리거 버튼 ── */}
      <button
        onClick={openModal}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
            <Fuel className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">운전 경비</p>
            {summaryTotal > 0 ? (
              <p className="text-xs text-sky-600 font-semibold mt-0.5">
                {fmt(summaryTotal)}
                {(() => {
                  const d2 = data!
                  const act = members.length
                  const sc  = d2.driverBenefit && driver ? act - 1 : act
                  const pp  = sc > 0 ? Math.round(summaryTotal / sc) : 0
                  return pp > 0 ? ` · 인당 ${fmt(pp)}` : ''
                })()}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">기름값 · {isKRW ? '톨비' : '기타 요금'} · 이미지 첨부</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {receipts.length > 0 && (
            <div className="flex items-center gap-0.5 bg-violet-50 px-1.5 py-0.5 rounded-full">
              <ImageIcon className="w-2.5 h-2.5 text-violet-600" />
              <span className="text-[11px] text-violet-600 font-semibold">{receipts.length}</span>
            </div>
          )}
          <span className="text-xs text-sky-500 font-semibold">
            {canEdit ? '편집' : canAttachReceipt ? '영수증' : '보기'}
          </span>
        </div>
      </button>

      {/* ── 팝업 모달 ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]">

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Fuel className="w-4 h-4 text-sky-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900">운전 경비</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* ── 대표 이미지 (스크롤 영역 밖, 헤더 바로 아래) ── */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex-shrink-0 border-b border-gray-200">
              {receipts.length > 0 ? (
                <div
                  className={`relative w-full h-48 bg-gray-100 overflow-hidden select-none ${dragging ? 'cursor-grabbing' : canAttachReceipt ? 'cursor-grab' : 'cursor-zoom-in'}`}
                  onClick={!canAttachReceipt ? () => setLightboxIdx(0) : undefined}
                  onMouseDown={e => {
                    if (!canAttachReceipt) return
                    e.preventDefault()
                    setDragging(true)
                    dragStartY.current  = e.clientY
                    dragStartPos.current = coverPosY
                    const onMove = (ev: MouseEvent) => {
                      const delta = (dragStartY.current - ev.clientY) / 2
                      setCoverPosY(Math.min(100, Math.max(0, dragStartPos.current + delta)))
                    }
                    const onUp = () => {
                      setDragging(false)
                      window.removeEventListener('mousemove', onMove)
                      window.removeEventListener('mouseup', onUp)
                    }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}
                  onTouchStart={e => {
                    if (!canAttachReceipt) return
                    e.stopPropagation()
                    dragStartY.current   = e.touches[0].clientY
                    dragStartPos.current = coverPosY
                  }}
                  onTouchMove={e => {
                    if (!canAttachReceipt) return
                    e.stopPropagation()
                    const delta = (dragStartY.current - e.touches[0].clientY) / 2
                    setCoverPosY(Math.min(100, Math.max(0, dragStartPos.current + delta)))
                  }}
                  style={{ touchAction: 'none' }}
                >
                  <Image
                    src={receipts[0]} alt="대표 이미지" fill
                    className="object-cover pointer-events-none"
                    style={{ objectPosition: `center ${coverPosY}%` }}
                    sizes="100vw"
                    draggable={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                  {/* 위치 조정 힌트 */}
                  {canAttachReceipt && !dragging && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full opacity-80">
                        <Move className="w-3 h-3" />드래그로 위치 조정
                      </div>
                    </div>
                  )}

                  {/* 확대 보기 버튼 (에디터 모드) */}
                  {canAttachReceipt && (
                    <button
                      onClick={e => { e.stopPropagation(); setLightboxIdx(0) }}
                      className="absolute bottom-2.5 right-2.5 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
                      title="크게 보기"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}

                  {/* 변경 / 제거 버튼 */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 pointer-events-auto">
                    {canAttachReceipt && onUploadReceipt && receipts.length < 5 && (
                      <button
                        onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                        disabled={uploading}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white/90 rounded-full text-xs font-semibold text-gray-700 hover:bg-white transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" />
                        {uploading ? '업로드 중...' : '추가'}
                      </button>
                    )}
                    {(canEdit || canAttachReceipt) && onDeleteReceipt && (
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteReceipt(receipts[0]) }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-red-500/90 rounded-full text-xs font-semibold text-white hover:bg-red-500 transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3" />제거
                      </button>
                    )}
                  </div>
                </div>
              ) : canAttachReceipt ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-40 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-sky-50 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400">{uploading ? '업로드 중...' : '대표 이미지 첨부'}</p>
                </button>
              ) : null}
            </div>

            {/* 스크롤 컨텐츠 */}
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4 scroll-smooth">

              {/* ── 경로 자동 계산 (국내/KRW만) ── */}
              {canEdit && isKRW && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">경로 자동 계산 <span className="font-normal text-gray-400">(선택)</span></p>
                  <div className="flex flex-col gap-1.5">
                    <PlaceInput
                      icon={<MapPin className="w-3.5 h-3.5 text-sky-400" />}
                      placeholder="출발지 (예: 판교역)"
                      value={origin}
                      onChange={v => { setOrigin(v); setOriginCoords(null) }}
                      onSelect={p => { setOrigin(p.name); setOriginCoords({ lat: p.lat, lng: p.lng }) }}
                    />
                    <PlaceInput
                      icon={<Navigation className="w-3.5 h-3.5 text-rose-400" />}
                      placeholder="도착지 (예: 속초 해수욕장)"
                      value={destination}
                      onChange={v => { setDestination(v); setDestCoords(null) }}
                      onSelect={p => { setDestination(p.name); setDestCoords({ lat: p.lat, lng: p.lng }) }}
                    />
                    <button
                      type="button"
                      onClick={fetchRoute}
                      disabled={fetching || !originCoords || !destCoords}
                      className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {fetching ? '계산 중...' : '거리 · 톨비 자동 계산'}
                    </button>
                  </div>
                  {routeError && (
                    <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{routeError}</p>
                  )}
                  {routeInfo && (
                    <div className="bg-sky-50 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-bold text-sky-900">{routeInfo.km} km</span>
                          <span className="text-gray-300">·</span>
                          <span className="font-semibold text-sky-700">톨비 {fmt(routeInfo.toll)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock className="w-3 h-3" />{formatDuration(routeInfo.duration)}</span>
                        </div>
                        <p className="text-[11px] text-sky-500">거리와 톨비가 아래 필드에 자동 입력되었습니다.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 입력 필드 ── */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">총 주행 거리</label>
                  <div className="relative">
                    <input
                      type="number" min="0"
                      value={km || ''}
                      onChange={e => setKm(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      disabled={!canEdit}
                      className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">km</span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">기름값 <span className="font-normal text-gray-400">(수동 입력)</span></label>
                    <div className="relative">
                      <input
                        type="number" min="0"
                        value={fuel || ''}
                        onChange={e => setFuel(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        disabled={!canEdit}
                        className="w-full pl-3 pr-7 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{unit}</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">{isKRW ? '톨비' : '기타 요금'}</label>
                    <div className="relative">
                      <input
                        type="number" min="0"
                        value={toll || ''}
                        onChange={e => setToll(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        disabled={!canEdit}
                        className="w-full pl-3 pr-7 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{unit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 합계 ── */}
              {total > 0 && (
                <div className="bg-sky-50 rounded-xl px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-sky-700">기름값</span>
                    <span className="font-semibold text-sky-900">{fmt(fuel)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-sky-700">{isKRW ? '톨비' : '기타 요금'}</span>
                    <span className="font-semibold text-sky-900">{fmt(toll)}</span>
                  </div>
                  <div className="h-px bg-sky-200 my-0.5" />
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-sky-900">총 운전 경비</span>
                    <span className="text-base font-bold text-sky-700">{fmt(total)}</span>
                  </div>
                </div>
              )}

              {/* ── 운전자 혜택 ── */}
              {total > 0 && (
                <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${driverBenefit ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700">
                      운전자 혜택
                      {driver
                        ? <span className="ml-1 font-normal text-gray-400">({driver.name})</span>
                        : <span className="ml-1 font-normal text-gray-400">(운전자 미지정)</span>
                      }
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {driverBenefit && driver
                        ? `${driver.name} 0 · 나머지 ${splitCount}인 ${fmt(perPerson)}/인`
                        : activeMemberCount > 0
                        ? `${activeMemberCount}인 균등 ${fmt(perPerson)}/인`
                        : ''}
                    </p>
                  </div>
                  {canEdit && driver ? (
                    <button
                      type="button"
                      onClick={() => setDriverBenefit(v => !v)}
                      className={`relative rounded-full flex-shrink-0 transition-colors duration-200 ${driverBenefit ? 'bg-amber-400' : 'bg-gray-200'}`}
                      style={{ height: 28, width: 48 }}
                    >
                      <span
                        className="absolute bg-white rounded-full shadow-sm"
                        style={{
                          width: 20, height: 20, top: 4,
                          left: driverBenefit ? 24 : 4,
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${driverBenefit ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {driverBenefit ? 'ON' : 'OFF'}
                    </span>
                  )}
                </div>
              )}

              {/* ── 추가 영수증 그리드 (2번째 이미지부터) ── */}
              {(receipts.length > 1 || (canAttachReceipt && receipts.length > 0)) && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">영수증 · 사진</p>
                  <div className="grid grid-cols-3 gap-2">
                    {receipts.slice(1).map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                        <Image
                          src={url} alt={`이미지 ${i + 2}`} fill
                          className="object-cover cursor-pointer"
                          sizes="33vw"
                          onClick={() => setLightboxIdx(i + 1)}
                        />
                        {(canEdit || canAttachReceipt) && onDeleteReceipt && (
                          <button
                            onClick={() => onDeleteReceipt(url)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        )}
                      </div>
                    ))}
                    {canAttachReceipt && onUploadReceipt && receipts.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-sky-300 hover:bg-sky-50 transition-colors"
                      >
                        <Upload className="w-5 h-5 text-gray-300" />
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* ── 저장 버튼 (owner/treasurer만) ── */}
            {canEdit && (
              <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 라이트박스 ── */}
      {lightboxIdx !== null && receipts[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! - 1) }}
            >
              <span className="text-white text-lg font-light">‹</span>
            </button>
          )}
          {lightboxIdx < receipts.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! + 1) }}
            >
              <span className="text-white text-lg font-light">›</span>
            </button>
          )}
          <div
            className="relative w-full h-full max-w-2xl mx-16 my-16"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={receipts[lightboxIdx]} alt="확대 이미지" fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {receipts.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {receipts.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i) }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === lightboxIdx ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
