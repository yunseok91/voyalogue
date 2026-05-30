'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2, Move, ChevronRight } from 'lucide-react'
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/lib/currencyMap'

export type TripEditFormData = {
  title:               string
  startDate:           string
  endDate:             string
  nights:              number
  days:                number
  people:              number
  currency:            string
  budgetKRW:           number
  dayBudgets:          Record<string, number>
  coverPhotoURL?:      string
  coverPhotoPosition?: number
}

type DayMeta = { dayId: string; label: string; date: string }

type Props = {
  city:           string
  title?:         string
  startDate:      string
  endDate:        string
  people?:        number
  currency?:      string
  budgetKRW?:     number
  dayMetas?:           DayMeta[]
  initialDayBudgets?:  Record<string, number>
  coverPhotoURL?:      string
  coverPhotoPosition?: number
  uid?:                string
  tripId?:             string
  onClose:        () => void
  onSave:         (data: TripEditFormData) => Promise<void>
}

export function TripEditModal({
  city,
  title:               initTitle    = '',
  startDate:           initStart,
  endDate:             initEnd,
  people:              initPeople   = 2,
  currency:            initCurrency = 'KRW',
  budgetKRW:           initBudgetKRW = 0,
  dayMetas,
  initialDayBudgets    = {},
  coverPhotoURL:       initCoverURL,
  coverPhotoPosition:  initCoverPos = 50,
  uid,
  tripId,
  onClose, onSave,
}: Props) {
  const [form, setForm] = useState({
    title:     initTitle,
    startDate: initStart,
    endDate:   initEnd,
    people:    initPeople,
    currency:  initCurrency,
    budget:    Math.round((initBudgetKRW ?? 0) / 10000),
  })
  const [dayBudgetsLocal, setDayBudgetsLocal] = useState<Record<string, number>>(initialDayBudgets)
  const [showDayBudgets,  setShowDayBudgets]  = useState(
    Object.keys(initialDayBudgets).length > 0
  )
  const [coverPhotoFile,     setCoverPhotoFile]     = useState<File | null>(null)
  const [coverPhotoPreview,  setCoverPhotoPreview]  = useState<string | null>(initCoverURL ?? null)
  const [coverPhotoPosition, setCoverPhotoPosition] = useState(initCoverPos ?? 50)
  const [coverRemoved,       setCoverRemoved]       = useState(false)
  const [saving,             setSaving]             = useState(false)
  const [dragging,           setDragging]           = useState(false)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const dragStartY     = useRef(0)
  const dragStartPos   = useRef(50)

  const nights = form.startDate && form.endDate
    ? Math.max(0, Math.round(
        (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000
      ))
    : 0

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverPhotoFile(file)
    setCoverRemoved(false)
    const url = URL.createObjectURL(file)
    setCoverPhotoPreview(url)
    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    setCoverPhotoFile(null)
    setCoverPhotoPreview(null)
    setCoverRemoved(true)
  }

  const handleSave = async () => {
    if (!form.startDate || !form.endDate || saving) return
    setSaving(true)
    try {
      let finalCoverURL: string | undefined = coverRemoved ? undefined : (initCoverURL ?? undefined)

      /* 새 사진 선택 시 Firebase Storage에 업로드 */
      if (coverPhotoFile && uid && tripId) {
        const [{ storage }, { ref, uploadBytes, getDownloadURL }] = await Promise.all([
          import('@/lib/firebase'),
          import('firebase/storage'),
        ])
        const ext = coverPhotoFile.name.split('.').pop() ?? 'jpg'
        const storageRef = ref(storage, `users/${uid}/trips/${tripId}/cover.${ext}`)
        await uploadBytes(storageRef, coverPhotoFile)
        finalCoverURL = await getDownloadURL(storageRef)
      }

      await onSave({
        title:         form.title.trim(),
        startDate:     form.startDate,
        endDate:       form.endDate,
        nights,
        days:          nights + 1,
        people:        Math.max(1, form.people),
        currency:      form.currency,
        budgetKRW:     Math.max(0, (form.budget || 0) * 10000),
        dayBudgets:    dayBudgetsLocal,
        coverPhotoURL:      finalCoverURL,
        coverPhotoPosition: coverPhotoPreview ? coverPhotoPosition : undefined,
      })
      onClose()
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-xl max-h-[90dvh] overflow-y-auto overflow-x-hidden"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-900 mb-5">여행 정보 편집</h3>
        <div className="flex flex-col gap-4">

          {/* 대표 사진 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">
              대표 사진 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            {coverPhotoPreview ? (
              <div className="flex flex-col gap-2">
                {/* 드래그로 위치 조정 */}
                <div
                  className={`relative -mx-6 h-[120px] sm:h-[130px] overflow-hidden select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  onMouseDown={e => {
                    e.preventDefault()
                    setDragging(true)
                    dragStartY.current   = e.clientY
                    dragStartPos.current = coverPhotoPosition
                    const onMove = (ev: MouseEvent) => {
                      const delta = (dragStartY.current - ev.clientY) / 2
                      setCoverPhotoPosition(p => Math.min(100, Math.max(0, dragStartPos.current + delta)))
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
                    e.stopPropagation()
                    dragStartY.current   = e.touches[0].clientY
                    dragStartPos.current = coverPhotoPosition
                  }}
                  onTouchMove={e => {
                    e.stopPropagation()
                    const delta = (dragStartY.current - e.touches[0].clientY) / 2
                    setCoverPhotoPosition(Math.min(100, Math.max(0, dragStartPos.current + delta)))
                  }}
                  style={{ touchAction: 'none' }}
                >
                  <img
                    src={coverPhotoPreview}
                    alt="커버"
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none"
                    style={{ objectPosition: `center ${coverPhotoPosition}%` }}
                  />
                  {/* 위치 조정 힌트 */}
                  {!dragging && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full opacity-80">
                        <Move className="w-3 h-3" />드래그로 위치 조정
                      </div>
                    </div>
                  )}
                  {/* 변경/제거 버튼 — 우상단 */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-auto">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white/90 rounded-full text-xs font-semibold text-gray-700 hover:bg-white transition-colors shadow-sm"
                    >
                      <ImagePlus className="w-3 h-3" />변경
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRemovePhoto() }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-red-500/90 rounded-full text-xs font-semibold text-white hover:bg-red-500 transition-colors shadow-sm"
                    >
                      <X className="w-3 h-3" />제거
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1 transition-colors text-gray-400 hover:text-blue-500"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs font-medium">사진 업로드</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* 여행 제목 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500">
                여행 제목 <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <span className={`text-[11px] font-medium tabular-nums ${(form.title?.length ?? 0) >= 18 ? 'text-orange-500' : 'text-gray-300'}`}>
                {form.title?.length ?? 0}/20
              </span>
            </div>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 20) }))}
              maxLength={20}
              placeholder={city}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {/* 시작일 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">시작일</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full max-w-full min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none"
            />
          </div>

          {/* 종료일 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">종료일</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              className="w-full max-w-full min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none"
            />
          </div>

          {form.startDate && form.endDate && (
            <p className="text-xs text-gray-400 text-center -mt-2">{nights}박 {nights + 1}일</p>
          )}

          {/* 현지 통화 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">현지 통화</label>
            <select
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white"
            >
              {Object.entries(CURRENCY_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{CURRENCY_SYMBOLS[code]} {code} — {name}</option>
              ))}
            </select>
          </div>

          {/* 인원수 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">인원수</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, people: Math.max(1, f.people - 1) }))}
                disabled={form.people <= 1}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-light disabled:opacity-30"
              >−</button>
              <span className="flex-1 text-center text-sm font-bold text-gray-900">{form.people}명</span>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, people: Math.min(20, f.people + 1) }))}
                disabled={form.people >= 20}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-light disabled:opacity-30"
              >+</button>
            </div>
          </div>

          {/* 예산 — 만원 단위 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">
              예산 <span className="font-normal text-gray-400">(만원 단위, 선택)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.budget || ''}
                onChange={e => setForm(f => ({ ...f, budget: Math.max(0, parseInt(e.target.value) || 0) }))}
                placeholder="0"
                min={0}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
              <span className="text-sm font-medium text-gray-500 flex-shrink-0">만원</span>
            </div>
            {form.budget > 0 && (
              <p className="text-xs text-blue-600 font-medium">= {(form.budget * 10000).toLocaleString()}원</p>
            )}
            <div className="flex gap-1.5 flex-wrap">
              {[10, 30, 50, 100, 200].map(v => (
                <button key={v} type="button"
                  onClick={() => setForm(f => ({ ...f, budget: v }))}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    form.budget === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                  }`}>
                  {v}만
                </button>
              ))}
            </div>
          </div>

          {/* 일별 예산 (선택) — dayMetas 있을 때만 표시 */}
          {dayMetas && dayMetas.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowDayBudgets(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors w-fit"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showDayBudgets ? 'rotate-90' : ''}`} />
                일별 예산
                <span className="font-normal text-gray-400">(선택)</span>
                {Object.keys(dayBudgetsLocal).length > 0 && !showDayBudgets && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold">
                    {Object.keys(dayBudgetsLocal).length}일 설정됨
                  </span>
                )}
              </button>

              {showDayBudgets && (() => {
                const totalBudgetWon  = form.budget * 10000
                const hasTotalBudget  = form.budget > 0
                const allocated       = Object.values(dayBudgetsLocal).reduce((s, v) => s + v, 0)
                const allocatedMan    = Math.round(allocated / 10000)
                const remaining       = hasTotalBudget ? totalBudgetWon - allocated : Infinity
                const remainingMan    = hasTotalBudget ? Math.round(remaining / 10000) : 0
                const isOver          = hasTotalBudget && remaining < 0
                const allocPct        = hasTotalBudget && totalBudgetWon > 0
                  ? Math.min(100, Math.round((allocated / totalBudgetWon) * 100))
                  : 0

                return (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-3">

                    {/* 배정 현황 바 (총 예산 설정 시) */}
                    {hasTotalBudget && (
                      <div className="flex flex-col gap-1.5 pb-3 border-b border-gray-200">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 font-semibold">일별 배정</span>
                          <span className={`font-bold ${isOver ? 'text-red-500' : 'text-gray-700'}`}>
                            {allocatedMan}만 / {form.budget}만원
                            {isOver
                              ? <span className="ml-1 text-red-500">({Math.abs(remainingMan)}만원 초과)</span>
                              : remainingMan > 0
                              ? <span className="ml-1 text-gray-400">({remainingMan}만원 남음)</span>
                              : null
                            }
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isOver ? 'bg-red-400' : allocPct >= 85 ? 'bg-amber-400' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, allocPct)}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const avg = Math.floor(form.budget / dayMetas!.length)
                            const next: Record<string, number> = {}
                            dayMetas!.forEach(dm => { next[dm.dayId] = avg * 10000 })
                            setDayBudgetsLocal(next)
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline text-right w-full"
                        >
                          균등 분배 ({Math.floor(form.budget / dayMetas!.length)}만원/일)
                        </button>
                      </div>
                    )}

                    {/* 날별 입력 */}
                    {dayMetas!.map(dm => {
                      const val      = Math.round((dayBudgetsLocal[dm.dayId] ?? 0) / 10000)
                      const otherSum = allocated - (dayBudgetsLocal[dm.dayId] ?? 0)
                      const maxMan   = hasTotalBudget
                        ? Math.max(0, Math.floor((totalBudgetWon - otherSum) / 10000))
                        : undefined
                      const isThisOver = hasTotalBudget && maxMan !== undefined && val > maxMan

                      return (
                        <div key={dm.dayId} className="flex items-center gap-2">
                          <div className="flex flex-col w-16 flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-700">{dm.label}</span>
                            {dm.date && (
                              <span className="text-[10px] text-gray-400">
                                {dm.date.slice(5).replace('-', '/')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1" />
                          <input
                            type="number"
                            value={val || ''}
                            onChange={e => {
                              let n = Math.max(0, parseInt(e.target.value) || 0)
                              if (maxMan !== undefined) n = Math.min(n, maxMan)
                              setDayBudgetsLocal(prev => {
                                const next = { ...prev }
                                if (n === 0) delete next[dm.dayId]
                                else next[dm.dayId] = n * 10000
                                return next
                              })
                            }}
                            placeholder="미설정"
                            min={0}
                            max={maxMan}
                            className={`w-24 px-3 py-2 rounded-lg border text-sm text-right text-gray-900 outline-none transition-all bg-white placeholder:text-left ${
                              isThisOver
                                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/10'
                                : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                            }`}
                          />
                          <div className="flex flex-col items-end w-10 flex-shrink-0">
                            <span className="text-xs text-gray-500">만원</span>
                            {hasTotalBudget && maxMan !== undefined && val === 0 && remaining > 0 && (
                              <span className="text-[9px] text-gray-400">최대{maxMan}만</span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* 전체 초기화 */}
                    {Object.keys(dayBudgetsLocal).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDayBudgetsLocal({})}
                        className="w-fit ml-auto text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                      >
                        일별 예산 전체 초기화
                      </button>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.startDate || !form.endDate}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />저장 중</>
              : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
