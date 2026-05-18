'use client'

import { useState, useEffect } from 'react'
import { getRatesInKRW } from '@/lib/exchangeRate'
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/lib/currencyMap'

export type TripEditFormData = {
  title:     string
  startDate: string
  endDate:   string
  nights:    number
  days:      number
  people:    number
  currency:  string
  budgetKRW: number
}

type Props = {
  city:       string
  title?:     string
  startDate:  string
  endDate:    string
  people?:    number
  currency?:  string
  budgetKRW?: number
  onClose:    () => void
  onSave:     (data: TripEditFormData) => Promise<void>
}

export function TripEditModal({
  city,
  title:     initTitle    = '',
  startDate: initStart,
  endDate:   initEnd,
  people:    initPeople   = 2,
  currency:  initCurrency = 'KRW',
  budgetKRW: initBudgetKRW = 0,
  onClose, onSave,
}: Props) {
  const [rates,  setRates]  = useState<Record<string, number>>({ KRW: 1 })
  const [form,   setForm]   = useState({
    title:     initTitle,
    startDate: initStart,
    endDate:   initEnd,
    people:    initPeople,
    currency:  initCurrency,
    budget:    0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getRatesInKRW().then(r => {
      setRates(r)
      const rate = r[initCurrency] || 1
      setForm(f => ({ ...f, budget: initBudgetKRW > 0 ? Math.round(initBudgetKRW / rate) : 0 }))
    }).catch(() => {
      setForm(f => ({ ...f, budget: initBudgetKRW }))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nights = form.startDate && form.endDate
    ? Math.max(0, Math.round(
        (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000
      ))
    : 0

  const handleSave = async () => {
    if (!form.startDate || !form.endDate || saving) return
    setSaving(true)
    try {
      const rate = rates[form.currency] || 1
      await onSave({
        title:     form.title.trim(),
        startDate: form.startDate,
        endDate:   form.endDate,
        nights,
        days:      nights + 1,
        people:    Math.max(1, form.people),
        currency:  form.currency,
        budgetKRW: Math.max(0, Math.round((form.budget || 0) * rate)),
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
        className="bg-white rounded-2xl p-6 w-[360px] mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-900 mb-5">여행 정보 편집</h3>
        <div className="flex flex-col gap-4">

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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">시작일</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">종료일</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">인원수</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, people: Math.max(1, f.people - 1) }))}
                disabled={form.people <= 1}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors text-lg font-light disabled:opacity-30"
              >−</button>
              <span className="flex-1 text-center text-sm font-bold text-gray-900">{form.people}명</span>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, people: Math.min(20, f.people + 1) }))}
                disabled={form.people >= 20}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors text-lg font-light disabled:opacity-30"
              >+</button>
            </div>
          </div>

          {form.startDate && form.endDate && (
            <p className="text-xs text-gray-400 text-center">{nights}박 {nights + 1}일</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">
              예산 <span className="font-normal text-gray-400">({CURRENCY_SYMBOLS[form.currency] ?? form.currency}, 선택)</span>
            </label>
            <input
              type="number"
              value={form.budget || ''}
              onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) || 0 }))}
              placeholder="전체 여행 예산 입력"
              min={0}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
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
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
