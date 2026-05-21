'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2, Move } from 'lucide-react'
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
  coverPhotoURL?:      string
  coverPhotoPosition?: number
}

type Props = {
  city:           string
  title?:         string
  startDate:      string
  endDate:        string
  people?:        number
  currency?:      string
  budgetKRW?:     number
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
                  className={`relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
                    dragStartY.current   = e.touches[0].clientY
                    dragStartPos.current = coverPhotoPosition
                  }}
                  onTouchMove={e => {
                    const delta = (dragStartY.current - e.touches[0].clientY) / 2
                    setCoverPhotoPosition(Math.min(100, Math.max(0, dragStartPos.current + delta)))
                  }}
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
