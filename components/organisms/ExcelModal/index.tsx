'use client'

import { useState } from 'react'
import { collection, getDocs, getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { X, Download, FileSpreadsheet, Check, Loader2, Crown, User } from 'lucide-react'
import { exportToExcel, type TripRow, type ItemRow, type BudgetRow } from '@/utils/excel'
import { getRatesInKRW, toKRW } from '@/lib/exchangeRate'
import { CURRENCY_SYMBOLS } from '@/lib/currencyMap'

const STATUS_LABEL: Record<string, string> = {
  ongoing: '여행중', upcoming: '예정', done: '완료',
}
const STATUS_CLS: Record<string, string> = {
  여행중: 'bg-green-100 text-green-700',
  예정:   'bg-blue-100 text-blue-700',
  완료:   'bg-gray-100 text-gray-500',
}

export type LiveTrip = {
  id:        string
  city:      string
  title?:    string
  startDate: string
  endDate:   string
  nights:    number
  days:      number
  gradient?: string
  status:    string
  members?:  Array<{ id: string; name: string; role: string; left?: boolean }>
  /* 초대받은 여행 전용 */
  isInvited?: boolean
  ownerUid?:  string
}

export function ExcelModal({
  onClose,
  trips,
  uid,
}: {
  onClose: () => void
  trips:   LiveTrip[]
  uid:     string
}) {
  const [selected,  setSelected]  = useState<Set<string>>(new Set(trips.map(t => t.id)))
  const [exporting, setExporting] = useState(false)

  const allChecked = selected.size === trips.length
  const toggleAll  = () =>
    setSelected(allChecked ? new Set() : new Set(trips.map(t => t.id)))
  const toggleOne  = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  /* ── 내보내기 ── */
  const handleExport = async () => {
    if (selected.size === 0) return
    setExporting(true)
    try {
      const rates = await getRatesInKRW().catch(() => ({} as Record<string, number>))
      const selectedTrips = trips.filter(t => selected.has(t.id))

      const tripRows:   TripRow[]   = []
      const itemRows:   ItemRow[]   = []
      const budgetRows: BudgetRow[] = []

      for (const trip of selectedTrips) {
        /* ── 멤버 uid→name 맵 ── */
        const memberMap = new Map<string, string>()
        const allMembers = (trip.members ?? []).filter(m => !m.left)
        allMembers.forEach(m => memberMap.set(m.id, m.name))

        /* ── 방장 이름 ── */
        const owner      = allMembers.find(m => m.role === 'owner')
        const ownerName  = owner?.name ?? '-'

        /* ── 멤버 목록 (방장 제외) ── */
        const nonOwners  = allMembers.filter(m => m.role !== 'owner').map(m => m.name)
        const memberList = nonOwners.length > 0 ? nonOwners.join(', ') : '혼자'

        const tripTitle = trip.title || trip.city

        /* ── Trip row ── */
        tripRows.push({
          title:      tripTitle,
          city:       trip.city,
          ownerName,
          startDate:  trip.startDate,
          endDate:    trip.endDate,
          nights:     trip.nights,
          days:       trip.days,
          memberList,
        })

        /* ── Firestore 경로: 초대받은 여행은 ownerUid 기준 ── */
        const ownerUid = (trip.isInvited && trip.ownerUid) ? trip.ownerUid : uid

        /* ── 여행 메타(예산) 로드 ── */
        const tripDocSnap = await getDoc(doc(db, 'users', ownerUid, 'trips', trip.id))
        const tripMeta    = tripDocSnap.data() ?? {}
        const totalBudget: number             = Number(tripMeta.budget ?? 0)
        const dayBudgets:  Record<string, number> = tripMeta.dayBudgets ?? {}

        const daysSnap = await getDocs(
          collection(db, 'users', ownerUid, 'trips', trip.id, 'days')
        )

        /* 일별 실지출 집계용 */
        type DayMeta = { dayId: string; dayLabel: string; date: string; dayNum: number; actualKRW: number }
        const dayActuals: DayMeta[] = []

        for (const daySnap of daysSnap.docs) {
          const dayData  = daySnap.data()
          const dayLabel = String(dayData.label ?? daySnap.id)
          const dayNum   = parseInt(dayLabel.replace(/\D/g, '')) || 0
          const date     = String(dayData.date ?? '')

          const itmsSnap = await getDocs(
            collection(db, 'users', ownerUid, 'trips', trip.id, 'days', daySnap.id, 'items')
          )

          let dayActualKRW = 0

          for (const itm of itmsSnap.docs) {
            const d        = itm.data()
            const price    = Number(d.price    ?? 0)
            const currency = String(d.currency ?? 'KRW')
            const sym      = CURRENCY_SYMBOLS[currency] ?? currency

            const priceLocal = price === 0 ? '0' : `${sym}${price.toLocaleString()}`
            const priceKRW   = currency === 'KRW'
              ? price
              : Math.round(toKRW(price, currency, rates))

            dayActualKRW += priceKRW

            const participantIds: string[] = Array.isArray(d.participantIds) ? d.participantIds : []
            let participants: string
            if (participantIds.length === 0) {
              participants = allMembers.length > 0 ? '전체' : ownerName
            } else {
              participants = participantIds
                .map(pid => memberMap.get(pid) ?? pid.slice(0, 6))
                .join(', ')
            }

            itemRows.push({
              tripTitle,
              city:         trip.city,
              day:          dayLabel,
              date,
              timeSlot:     String(d.timeSlot ?? '미정'),
              name:         String(d.name     ?? ''),
              category:     String(d.cat      ?? '기타'),
              priceLocal,
              priceKRW,
              comment:      String(d.comment  ?? ''),
              participants,
              _dayNum:      dayNum,
              _order:       Number(d.order    ?? 0),
            })
          }

          dayActuals.push({ dayId: daySnap.id, dayLabel, date, dayNum, actualKRW: dayActualKRW })
        }

        /* ── 예산 분석 rows 생성 ── */
        const totalActual = dayActuals.reduce((s, d) => s + d.actualKRW, 0)

        const calcStatus = (budget: number, actual: number, pct: number | null) => {
          if (budget === 0) return '미설정'
          if (pct === null) return '미설정'
          if (pct > 100) return '초과'
          if (pct >= 90) return '적정'
          return '절약'
        }

        /* 전체 요약 행 */
        const overallPct = totalBudget > 0 ? Math.round(totalActual / totalBudget * 100) : null
        budgetRows.push({
          tripTitle,
          division:  '전체',
          date:      `${trip.startDate} ~ ${trip.endDate}`,
          budgetKRW: totalBudget,
          actualKRW: totalActual,
          diffKRW:   totalBudget > 0 ? totalBudget - totalActual : 0,
          usagePct:  overallPct,
          status:    calcStatus(totalBudget, totalActual, overallPct),
        })

        /* 일별 행 (dayNum 오름차순) */
        const sortedDays = [...dayActuals].sort((a, b) => a.dayNum - b.dayNum)
        for (const day of sortedDays) {
          const db2    = dayBudgets[day.dayId] ?? 0
          const dayPct = db2 > 0 ? Math.round(day.actualKRW / db2 * 100) : null
          budgetRows.push({
            tripTitle,
            division:  day.dayLabel,
            date:      day.date,
            budgetKRW: db2,
            actualKRW: day.actualKRW,
            diffKRW:   db2 > 0 ? db2 - day.actualKRW : 0,
            usagePct:  dayPct,
            status:    calcStatus(db2, day.actualKRW, dayPct),
          })
        }
      }

      exportToExcel({ trips: tripRows, items: itemRows, budgets: budgetRows })
    } finally {
      setExporting(false)
    }
  }

  const statusLabel = (s: string) => STATUS_LABEL[s] ?? s

  /* ── 분리: 내 여행 / 초대받은 여행 ── */
  const ownTrips     = trips.filter(t => !t.isInvited)
  const invitedTrips = trips.filter(t =>  t.isInvited)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-[520px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92svh] sm:max-h-[88vh]">

        {/* 모바일 핸들 */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ── 헤더 ── */}
        <div className="px-6 pt-3 sm:pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">엑셀 내보내기</h2>
                <p className="text-xs text-gray-400 mt-0.5">선택한 여행 데이터를 .xlsx 파일로 저장합니다</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 콘텐츠 ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-4">

          {/* 시트 구조 안내 */}
          <div className="bg-blue-50 rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-xs font-bold text-blue-700">내보내기 시트 구성</p>
            <div className="flex flex-col gap-1.5">
              {[
                {
                  sheet: '여행 목록',
                  cols:  '여행 제목 · 도시 · 방장 · 시작일 · 종료일 · 박/일수 · 멤버',
                },
                {
                  sheet: '일정',
                  cols:  '여행 · 날 · 날짜 · 시간대(아침→점심→저녁→미정) · 장소 · 카테고리 · 비용(통화·원화) · 메모 · 참여 멤버',
                },
                {
                  sheet: '예산 분석',
                  cols:  '여행 · 구분(전체/Day N) · 날짜 · 예산(원) · 실지출(원) · 잔여/초과(원) · 사용률 · 판정(절약·적정·초과·미설정)',
                },
              ].map(({ sheet, cols }) => (
                <div key={sheet} className="flex items-start gap-2">
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5">
                    {sheet}
                  </span>
                  <span className="text-[11px] text-blue-600 leading-relaxed">{cols}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 전체 선택 헤더 */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">여행 선택</p>
            <button
              onClick={toggleAll}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              {allChecked ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          {/* ── 내 여행 ── */}
          {ownTrips.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Crown className="w-3.5 h-3.5 text-indigo-500" />
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">내 여행</p>
              </div>
              {ownTrips.map(trip => (
                <TripCheckRow
                  key={trip.id}
                  trip={trip}
                  checked={selected.has(trip.id)}
                  onToggle={() => toggleOne(trip.id)}
                  statusLabel={statusLabel}
                />
              ))}
            </div>
          )}

          {/* ── 초대받은 여행 ── */}
          {invitedTrips.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">초대받은 여행</p>
              </div>
              {invitedTrips.map(trip => (
                <TripCheckRow
                  key={trip.id}
                  trip={trip}
                  checked={selected.has(trip.id)}
                  onToggle={() => toggleOne(trip.id)}
                  statusLabel={statusLabel}
                  invited
                />
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            {selected.size}개 여행 선택됨 · 일정 아이템과 참여 멤버 정보가 함께 포함됩니다
          </p>
        </div>

        {/* ── 푸터 ── */}
        <div
          className="px-6 pb-6 sm:pb-6 pt-2 flex-shrink-0 border-t border-gray-100"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleExport}
            disabled={selected.size === 0 || exporting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {exporting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중…</>
              : <><Download className="w-4 h-4" /> {selected.size}개 여행 엑셀로 내보내기</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 여행 선택 행 ── */
function TripCheckRow({
  trip, checked, onToggle, statusLabel, invited = false,
}: {
  trip:        LiveTrip
  checked:     boolean
  onToggle:    () => void
  statusLabel: (s: string) => string
  invited?:    boolean
}) {
  const label    = statusLabel(trip.status)
  const statusCls = STATUS_CLS[label] ?? 'bg-gray-100 text-gray-500'

  return (
    <label
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
        checked
          ? 'border-blue-300 bg-blue-50/50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* 체크박스 */}
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
      />

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {trip.title || trip.city}
          </p>
          {invited && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0">
              초대
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate">
          {trip.city !== (trip.title || trip.city) ? `${trip.city} · ` : ''}
          {trip.startDate.slice(5).replace('-', '/')} – {trip.endDate.slice(5).replace('-', '/')} · {trip.nights}박
        </p>
      </div>

      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusCls}`}>
        {label}
      </span>
    </label>
  )
}
