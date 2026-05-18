'use client'

import { useState, useRef, useCallback } from 'react'
import {
  collection, getDocs, addDoc, setDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  X, Download, Upload, FileSpreadsheet,
  CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, Loader2, Check,
} from 'lucide-react'
import {
  exportToExcel, importFromExcel,
  type ExcelData, type TripRow, type ItemRow,
} from '@/utils/excel'

const GRADIENTS = [
  'from-amber-500 to-orange-600', 'from-violet-500 to-violet-700',
  'from-blue-500 to-blue-700',    'from-slate-500 to-slate-700',
  'from-rose-500 to-rose-700',    'from-teal-500 to-teal-700',
  'from-emerald-500 to-emerald-700', 'from-orange-500 to-orange-700',
  'from-cyan-500 to-cyan-700',    'from-sky-500 to-sky-700',
]

const STATUS_LABEL: Record<string, string> = {
  ongoing: '여행중', upcoming: '예정', done: '완료',
}

const STATUS_CLS: Record<string, string> = {
  '여행중': 'bg-green-100 text-green-700',
  '예정':   'bg-blue-100 text-blue-700',
  '완료':   'bg-gray-100 text-gray-500',
}

type LiveTrip = {
  id:        string
  city:      string
  startDate: string
  endDate:   string
  nights:    number
  days:      number
  gradient?: string
  status:    string
}

type Tab = 'export' | 'import'

type ImportState =
  | { phase: 'idle' }
  | { phase: 'dragging' }
  | { phase: 'loading' }
  | { phase: 'preview'; data: ExcelData; filename: string }
  | { phase: 'error';   message: string }
  | { phase: 'saving' }
  | { phase: 'done';    count: number }

export function ExcelModal({
  onClose,
  trips,
  uid,
}: {
  onClose: () => void
  trips:   LiveTrip[]
  uid:     string
}) {
  const [tab, setTab]             = useState<Tab>('export')
  const [selected, setSelected]   = useState<Set<string>>(new Set(trips.map(t => t.id)))
  const [exporting, setExporting] = useState(false)
  const [importState, setImport]  = useState<ImportState>({ phase: 'idle' })
  const [expanded, setExpanded]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const allChecked = selected.size === trips.length
  const toggleAll  = () =>
    setSelected(allChecked ? new Set() : new Set(trips.map(t => t.id)))
  const toggleOne  = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  /* ── 내보내기: Firestore에서 아이템 fetch 후 Excel 생성 ── */
  const handleExport = async () => {
    if (selected.size === 0) return
    setExporting(true)
    try {
      const selectedTrips = trips.filter(t => selected.has(t.id))
      const items: ItemRow[] = []

      for (const trip of selectedTrips) {
        const daysSnap = await getDocs(
          collection(db, 'users', uid, 'trips', trip.id, 'days')
        )
        for (const daySnap of daysSnap.docs) {
          const dayData  = daySnap.data()
          const itmsSnap = await getDocs(
            collection(db, 'users', uid, 'trips', trip.id, 'days', daySnap.id, 'items')
          )
          for (const itm of itmsSnap.docs) {
            const d = itm.data()
            items.push({
              tripId:   trip.id,
              city:     trip.city,
              day:      String(dayData.label ?? daySnap.id),
              date:     String(dayData.date  ?? ''),
              timeSlot: String(d.timeSlot    ?? '미정'),
              name:     String(d.name        ?? ''),
              category: String(d.cat         ?? '기타'),
              price:    Number(d.price       ?? 0),
              comment:  String(d.comment     ?? ''),
              rating:   Number(d.rating      ?? 0),
            })
          }
        }
      }

      const tripRows: TripRow[] = selectedTrips.map(t => ({
        id:        t.id,
        city:      t.city,
        startDate: t.startDate,
        endDate:   t.endDate,
        nights:    t.nights,
        days:      t.days,
        gradient:  t.gradient,
        status:    STATUS_LABEL[t.status] ?? t.status,
      }))

      exportToExcel({ trips: tripRows, items })
    } finally {
      setExporting(false)
    }
  }

  /* ── 파일 처리 공통 ── */
  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setImport({ phase: 'error', message: '.xlsx 또는 .xls 파일만 지원합니다.' })
      return
    }
    setImport({ phase: 'loading' })
    const result = await importFromExcel(file)
    if (result.ok) {
      setImport({ phase: 'preview', data: result.data, filename: file.name })
    } else {
      setImport({ phase: 'error', message: result.error })
    }
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setImport({ phase: 'idle' })
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  /* ── 가져오기 확정: Firestore에 저장 ── */
  const handleImport = async () => {
    if (importState.phase !== 'preview') return
    setImport({ phase: 'saving' })
    const { trips: importedTrips, items: importedItems } = importState.data

    try {
      for (let ti = 0; ti < importedTrips.length; ti++) {
        const t = importedTrips[ti]
        const gradient = GRADIENTS[ti % GRADIENTS.length]

        const tripRef = await addDoc(
          collection(db, 'users', uid, 'trips'),
          {
            city:      t.city,
            country:   '',
            startDate: t.startDate,
            endDate:   t.endDate,
            nights:    t.nights,
            days:      t.days,
            gradient,
            budget:    0,
            people:    2,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        )

        const startMs = new Date(t.startDate).getTime()
        for (let di = 0; di < t.days; di++) {
          const dayDate  = new Date(startMs + di * 86400000).toISOString().slice(0, 10)
          const dayLabel = `Day ${di + 1}`
          const dayId    = `d${di + 1}`

          await setDoc(
            doc(db, 'users', uid, 'trips', tripRef.id, 'days', dayId),
            { label: dayLabel, date: dayDate }
          )

          const dayItems = importedItems.filter(
            i => i.tripId === t.id && i.day === dayLabel
          )
          for (let ii = 0; ii < dayItems.length; ii++) {
            const item = dayItems[ii]
            await addDoc(
              collection(db, 'users', uid, 'trips', tripRef.id, 'days', dayId, 'items'),
              {
                name:     item.name,
                timeSlot: item.timeSlot,
                cat:      item.category,
                price:    item.price,
                currency: 'KRW',
                comment:  item.comment,
                order:    ii,
                rating:   item.rating,
                lat:      null,
                lng:      null,
              }
            )
          }
        }
      }

      setImport({ phase: 'done', count: importedTrips.length })
    } catch {
      setImport({ phase: 'error', message: '저장 중 오류가 발생했습니다. 다시 시도해 주세요.' })
    }
  }

  const statusLabel = (s: string) => STATUS_LABEL[s] ?? s

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-[540px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92svh] sm:max-h-[90vh]">

        {/* 모바일 드래그 핸들 */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ── 헤더 ── */}
        <div className="px-6 pt-3 sm:pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">엑셀 내보내기 / 가져오기</h2>
                <p className="text-xs text-gray-400 mt-0.5">여행 데이터를 .xlsx 파일로 백업하거나 불러옵니다</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 탭 */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {([
              { key: 'export' as Tab, label: '내보내기', icon: Download },
              { key: 'import' as Tab, label: '가져오기', icon: Upload },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setImport({ phase: 'idle' }) }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 콘텐츠 ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* ──── 내보내기 탭 ──── */}
          {tab === 'export' && (
            <>
              <div className="bg-blue-50 rounded-2xl p-4 flex flex-col gap-1.5">
                <p className="text-xs font-bold text-blue-700">내보내기 형식</p>
                <div className="flex flex-col gap-1">
                  {[
                    { sheet: '여행 목록', cols: '여행ID · 도시 · 시작일 · 종료일 · 박수 · 상태' },
                    { sheet: '일정',     cols: '여행ID · 도시 · 날 · 시간대 · 장소명 · 카테고리 · 비용 · 메모 · 별점' },
                  ].map(({ sheet, cols }) => (
                    <div key={sheet} className="flex items-start gap-2">
                      <span className="text-[11px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5">
                        {sheet}
                      </span>
                      <span className="text-[11px] text-blue-600">{cols}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">여행 선택</p>
                <button
                  onClick={toggleAll}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {allChecked ? '전체 해제' : '전체 선택'}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {trips.map(trip => (
                  <label
                    key={trip.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      selected.has(trip.id)
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected.has(trip.id) ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {selected.has(trip.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected.has(trip.id)}
                      onChange={() => toggleOne(trip.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{trip.city}</p>
                      <p className="text-[11px] text-gray-400">
                        {trip.startDate.slice(5).replace('-', '/')} – {trip.endDate.slice(5).replace('-', '/')} · {trip.nights}박
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      STATUS_CLS[statusLabel(trip.status)] ?? 'bg-gray-100 text-gray-500'
                    }`}>
                      {statusLabel(trip.status)}
                    </span>
                  </label>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center">
                {selected.size}개 여행 선택됨 · 일정 아이템도 함께 내보냅니다
              </p>
            </>
          )}

          {/* ──── 가져오기 탭 ──── */}
          {tab === 'import' && (
            <>
              <div className="bg-amber-50 rounded-2xl p-4 flex flex-col gap-1.5">
                <p className="text-xs font-bold text-amber-700">주의사항</p>
                <ul className="flex flex-col gap-0.5">
                  {[
                    'Voyalogue에서 내보낸 .xlsx 파일만 정상 인식됩니다.',
                    '"여행 목록"과 "일정" 시트가 모두 있어야 합니다.',
                    '가져온 데이터는 기존 여행 목록에 추가됩니다.',
                  ].map(t => (
                    <li key={t} className="text-[11px] text-amber-700 flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>

              {(importState.phase === 'idle' || importState.phase === 'dragging' || importState.phase === 'error') && (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setImport({ phase: 'dragging' }) }}
                    onDragLeave={() => setImport({ phase: 'idle' })}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                      importState.phase === 'dragging'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                      importState.phase === 'dragging' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Upload className={`w-7 h-7 transition-colors ${
                        importState.phase === 'dragging' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        {importState.phase === 'dragging' ? '여기에 놓아주세요' : '클릭하거나 파일을 끌어다 놓으세요'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">.xlsx · .xls 파일 지원</p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="sr-only"
                      onChange={onFileChange}
                    />
                  </div>

                  {importState.phase === 'error' && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{importState.message}</p>
                    </div>
                  )}
                </>
              )}

              {(importState.phase === 'loading' || importState.phase === 'saving') && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-500">
                    {importState.phase === 'loading' ? '파일 분석 중…' : 'Firestore에 저장 중…'}
                  </p>
                </div>
              )}

              {importState.phase === 'preview' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-700">파일 읽기 성공</p>
                      <p className="text-xs text-emerald-600 truncate">{importState.filename}</p>
                    </div>
                    <button
                      onClick={() => setImport({ phase: 'idle' })}
                      className="text-xs text-emerald-600 hover:underline flex-shrink-0"
                    >
                      다시 선택
                    </button>
                  </div>

                  <div className="flex gap-3">
                    {[
                      { label: '여행', count: importState.data.trips.length },
                      { label: '일정 항목', count: importState.data.items.length },
                    ].map(({ label, count }) => (
                      <div key={label} className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center">
                        <p className="text-xl font-extrabold text-gray-900">{count}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">불러올 여행</p>
                    {importState.data.trips.map(trip => {
                      const tripItems = importState.data.items.filter(i => i.tripId === trip.id)
                      const isOpen = expanded === trip.id
                      return (
                        <div key={trip.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                            onClick={() => setExpanded(isOpen ? null : trip.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{trip.city}</p>
                              <p className="text-[11px] text-gray-400">
                                {trip.startDate} – {trip.endDate} · {trip.nights}박
                              </p>
                            </div>
                            {tripItems.length > 0 && (
                              <span className="text-[11px] text-gray-400 flex-shrink-0">
                                일정 {tripItems.length}개
                              </span>
                            )}
                            {isOpen
                              ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            }
                          </button>
                          {isOpen && tripItems.length > 0 && (
                            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex flex-col gap-1">
                              {tripItems.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 py-1">
                                  <span className="text-gray-400 flex-shrink-0 w-8">{item.day.replace('Day ', 'D')}</span>
                                  <span className="flex-1 truncate font-medium">{item.name}</span>
                                  <span className="text-gray-400 flex-shrink-0">{item.timeSlot}</span>
                                </div>
                              ))}
                              {tripItems.length > 5 && (
                                <p className="text-[11px] text-gray-400 pb-1">+{tripItems.length - 5}개 더</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {importState.phase === 'done' && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-gray-900">가져오기 완료</p>
                    <p className="text-sm text-gray-500 mt-1">{importState.count}개 여행이 추가되었습니다.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-colors"
                  >
                    확인
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 푸터 ── */}
        {!(tab === 'import' && (importState.phase === 'done' || importState.phase === 'saving' || importState.phase === 'loading')) && (
          <div className="px-6 pb-6 sm:pb-6 pt-2 flex-shrink-0 border-t border-gray-100" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            {tab === 'export' ? (
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
            ) : importState.phase === 'preview' ? (
              <button
                onClick={handleImport}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> {importState.data.trips.length}개 여행 가져오기
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-2xl text-sm font-bold cursor-not-allowed"
              >
                파일을 선택하면 활성화됩니다
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
