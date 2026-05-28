'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, MapPin, Plus, X,
  GripVertical, Star, Wallet, ChevronRight,
  Edit2, Trash2, Users, Map, Loader2,
  Share2, Crown, Link2, Copy, Check, Camera,
  Plane, BedDouble, Pencil, Receipt, Megaphone, ScrollText,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  MeasuringStrategy, useDroppable, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {
  onSnapshot, getDocs, doc, collection, getDoc,
  addDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, writeBatch,
  query, orderBy, Timestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'
import { TripMap, type MapItem, type AvatarMember, type DayGroup, DAY_COLORS } from '@/components/TripMap'
import { detectCurrencies, CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/lib/currencyMap'
import { getRatesInKRW, toKRW, formatLocal, formatKRW } from '@/lib/exchangeRate'
import { gradientStyle } from '@/lib/tripGradient'
import { generateCode } from '@/lib/inviteCode'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { notifyTripMembers } from '@/lib/tripNotification'
import { NotificationBell } from '@/components/NotificationBell'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { FixedScheduleSection } from '@/components/FixedScheduleSection'
import { TripEditModal, type TripEditFormData } from '@/components/TripEditModal'
import { ReportModal } from '@/components/ReportModal'
import { TripNavbar } from '@/components/TripNavbar'
import { InfoTooltip } from '@/components/InfoTooltip'

/* ── 타입 ── */
type TimeSlot = '아침' | '점심' | '저녁' | '미정'
type Category = '식사' | '장소' | '쇼핑' | '교통' | '기타'

type PlanItem = {
  id:           string
  name:         string
  timeSlot:     TimeSlot
  startTime?:   string   // HH:MM (optional)
  cat:          Category
  price:        number
  currency:     string
  comment:      string
  order:        number
  lat:          number
  lng:          number
  rating:       number
  ratings?:     Record<string, number>
  participants:    number
  participantIds?: string[]
  payerId?:        string
  receipts?:       string[]
}

type MemberRole = 'owner' | 'treasurer' | 'member'

type Member = {
  id:           string
  name:         string
  photoURL?:    string
  role:         MemberRole
  colorIndex?:  number
  hexColor?:    string
  inviteCode?:  string
  left?:        boolean
}

type CheckItem = { id: string; label: string; done: boolean }

type FlightItem = {
  id:          string
  name:        string
  type:        'inbound' | 'outbound'
  dayId:       string
  departTime:  string
  arriveTime:  string
  lat?:        number
  lng?:        number
  price?:               number
  currency?:            string
  includeInSettlement?: boolean
  payerId?:             string
  participantIds?:      string[]
}

type AccommodationItem = {
  id:               string
  name:             string
  checkInDayId:     string
  checkInTime:      string
  checkOutDayId:    string
  checkOutTime:     string
  lat?:             number
  lng?:             number
  price?:               number
  currency?:            string
  includeInSettlement?: boolean
  payerId?:             string
  participantIds?:      string[]
}

type TripMeta = {
  city:            string
  title?:          string
  startDate:       string
  endDate:         string
  nights:          number
  days:            number
  people:          number
  gradient:        string
  budget:          number
  viewCode:        string
  editCode:        string
  joinCode?:       string
  joinPin?:        string
  members:         Member[]
  checklist?:      CheckItem[]
  flights?:        FlightItem[]
  accommodations?: AccommodationItem[]
  currency?:       string
  dayRates?:       Record<string, number>
  dayBudgets?:     Record<string, number>   // dayId → KRW
  coverPhotoURL?:       string
  coverPhotoPosition?:  number
  notice?:         string  // legacy — kept for migration
}

type NoticeItem = {
  id:        string
  content:   string
  createdAt: Timestamp | null
  updatedAt?: Timestamp | null
}

type Day = {
  dayId: string
  label: string
  date:  string
}

const TIME_SLOTS: TimeSlot[] = ['아침', '점심', '저녁', '미정']
const CATEGORIES: Category[] = ['식사', '장소', '쇼핑', '교통', '기타']

const CAT_COLORS: Record<Category, string> = {
  식사: 'bg-orange-100 text-orange-700',
  장소: 'bg-blue-100 text-blue-700',
  쇼핑: 'bg-pink-100 text-pink-700',
  교통: 'bg-teal-100 text-teal-700',
  기타: 'bg-gray-100 text-gray-500',
}

const CAT_DOTS: Record<Category, string> = {
  식사: 'bg-orange-500',
  장소: 'bg-blue-500',
  쇼핑: 'bg-pink-500',
  교통: 'bg-teal-500',
  기타: 'bg-gray-400',
}

const CAT_DISPLAY: Record<Category, string> = {
  식사: '식사',
  장소: '관광',
  쇼핑: '쇼핑',
  교통: '교통',
  기타: '기타',
}

const SLOT_STYLES: Record<TimeSlot, string> = {
  아침: 'border-amber-300 text-amber-700 bg-amber-50',
  점심: 'border-green-300 text-green-700 bg-green-50',
  저녁: 'border-violet-300 text-violet-700 bg-violet-50',
  미정: 'border-gray-200 text-gray-500 bg-gray-50',
}

const SLOT_DOT: Record<TimeSlot, string> = {
  아침: 'bg-amber-400',
  점심: 'bg-green-500',
  저녁: 'bg-violet-500',
  미정: 'bg-gray-400',
}

/* HH:MM → { label: "오전 9:30" | "오후 2:30", isPM: bool } */
function parseItemTime(hhmm: string): { label: string; isPM: boolean } {
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  const isPM = h >= 12
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { label: `${isPM ? '오후' : '오전'} ${h12}:${m}`, isPM }
}

function formatDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}(${['일','월','화','수','목','금','토'][dt.getDay()]})`
}

function buildDaysFromMeta(meta: TripMeta): Day[] {
  const start = new Date(meta.startDate)
  return Array.from({ length: meta.days }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return { dayId: `d${i + 1}`, label: `Day ${i + 1}`, date: d.toISOString().slice(0, 10) }
  })
}

/* ── 이미지 압축 (max 1000px / JPEG 70%) ── */
async function compressImage(file: File): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1000
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(b => { URL.revokeObjectURL(url); resolve(b!) }, 'image/jpeg', 0.7)
    }
    img.src = url
  })
}

/* ── 환율 위젯 ── */
function RateWidget({
  currency, liveRate, customRate, onSave, onReset,
}: {
  currency:   string
  liveRate:   number
  customRate?: number
  onSave:     (rate: number) => void
  onReset:    () => void
}) {
  const [editing, setEditing] = useState(false)
  const [input,   setInput]   = useState('')
  const isCustom = customRate !== undefined
  const displayRate = customRate ?? liveRate
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency

  const submit = () => {
    const n = parseFloat(input.replace(/,/g, ''))
    if (!isNaN(n) && n > 0) { onSave(n); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
        <span className="text-[11px] text-gray-500">{symbol}1 = ₩</span>
        <input
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setEditing(false) }}
          className="w-20 border border-blue-300 rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500"
          autoFocus
        />
        <button onClick={submit} className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[11px] font-semibold">저장</button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-[11px]">취소</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className={`text-[11px] font-medium ${isCustom ? 'text-orange-600' : 'text-gray-500'}`}>
        {symbol}1 = ₩{displayRate.toLocaleString('ko-KR', {
          maximumFractionDigits: displayRate >= 100 ? 0 : displayRate >= 10 ? 1 : 2,
          minimumFractionDigits: 0,
        })}
      </span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isCustom ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
        {isCustom ? '고정' : '실시간'}
      </span>
      <button
        onClick={() => { setInput(String(displayRate)); setEditing(true) }}
        className="text-gray-300 hover:text-blue-500 transition-colors"
        title="환율 수정"
      >
        <Pencil className="w-2.5 h-2.5" />
      </button>
      {isCustom && (
        <button onClick={onReset} className="text-[10px] text-orange-400 hover:text-orange-600 transition-colors">
          초기화
        </button>
      )}
    </div>
  )
}

/* ── 별점 ── */
function calcAvg(ratings: Record<string, number> = {}) {
  const vals = Object.values(ratings).filter(v => v > 0)
  return { avg: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0, count: vals.length }
}

function StarRow({
  myRating,
  ratings = {},
  onChange,
}: {
  myRating: number
  ratings?: Record<string, number>
  onChange?: (v: number) => void
}) {
  const { avg, count } = calcAvg(ratings)
  return (
    <span className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(v => (
          <Star key={v}
            className={`w-3.5 h-3.5 transition-colors ${v <= myRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'} ${onChange ? 'cursor-pointer' : ''}`}
            onClick={e => { e.stopPropagation(); onChange?.(v === myRating ? 0 : v) }}
          />
        ))}
      </span>
      {count >= 1 && (
        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
          avg {avg.toFixed(1)} · {count}명
        </span>
      )}
    </span>
  )
}

/* ── 아이템 행 ── */
function ItemRow({ item, myUid, onDelete, onEdit, onQuickEdit, onChangeCat, onRate, onFocusMap, onViewReceipts, onUploadReceipt, mapIndex, rates, totalPeople, memberIds, canEdit, dragHandleProps }: {
  item:              PlanItem
  myUid:             string
  onDelete:          (id: string) => void
  onEdit:            (item: PlanItem) => void
  onQuickEdit:       (item: PlanItem) => void
  onChangeCat:       (id: string, cat: Category) => void
  onRate:            (id: string, v: number) => void
  onFocusMap:        (id: string) => void
  onViewReceipts:    (receipts: string[]) => void
  onUploadReceipt?:  (files: FileList) => void
  mapIndex?:         number
  rates:             Record<string, number>
  totalPeople:       number
  memberIds?:        string[]
  canEdit:           boolean
  dragHandleProps?:  Record<string, unknown>
}) {
  const [showCatPick,  setShowCatPick]  = useState(false)
  const [showPP,       setShowPP]       = useState(false)
  const catRef    = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showCatPick) return
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatPick(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCatPick])

  /* ÷N 툴팁 2.5초 후 자동 닫기 */
  useEffect(() => {
    if (!showPP) return
    const t = setTimeout(() => setShowPP(false), 2500)
    return () => clearTimeout(t)
  }, [showPP])

  const validSet     = memberIds ? new Set(memberIds) : null
  const actualPart   = item.participantIds
    ? (validSet ? item.participantIds.filter(id => validSet.has(id)).length : item.participantIds.length) || totalPeople
    : (item.participants ?? totalPeople)
  const perPersonKRW = item.price > 0
    ? Math.round(toKRW(item.price, item.currency, rates) / actualPart)
    : 0

  return (
    <div
      className="group flex items-start gap-2 px-3 py-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => { if (item.lat && item.lng) onFocusMap(item.id) }}
    >
      {/* 드래그 핸들 */}
      <span
        {...dragHandleProps}
        onClick={e => e.stopPropagation()}
        className="touch-none cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5 p-0.5"
      >
        <GripVertical className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors" />
      </span>

      <div className="flex-1 min-w-0">
        {/* 이름 + 맵 인덱스 배지 + 카테고리 (클릭 가능) */}
        <div className="flex items-start gap-2 mb-1">
          {mapIndex !== undefined && item.lat && item.lng && (
            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5 ${SLOT_DOT[item.timeSlot]}`}>
              {mapIndex}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900 leading-snug flex-1 min-w-0 break-words">
            {item.name}
          </span>

          {/* 카테고리 배지 — 클릭하면 카테고리 변경 팝업 */}
          <div className="relative flex-shrink-0" ref={catRef}>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowCatPick(v => !v) }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full hover:opacity-75 transition-opacity ${CAT_COLORS[item.cat]}`}
            >
              {CAT_DISPLAY[item.cat] ?? item.cat}
            </button>

            {showCatPick && (
              <div
                className="absolute right-0 top-7 z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2"
                style={{ width: 148 }}
                onMouseDown={e => e.stopPropagation()}
              >
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => { onChangeCat(item.id, c); setShowCatPick(false) }}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-colors text-left ${
                        c === item.cat
                          ? 'bg-gray-900 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c === item.cat ? 'bg-white' : CAT_DOTS[c]}`} />
                      {CAT_DISPLAY[c]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메모 — 시각적으로 구분되는 스타일 */}
        {item.comment && (
          <div className="flex mb-1.5 mt-1">
            <div className="w-0.5 rounded-full bg-amber-300 flex-shrink-0 mr-2" />
            <p className="text-xs text-amber-800 leading-snug italic">{item.comment}</p>
          </div>
        )}

        {/* 메타 행 */}
        <div className="flex flex-col gap-1 mt-1">
          {/* 1행: 시간대 도트 + 시각 + 별점 */}
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SLOT_DOT[item.timeSlot]}`}
              title={item.timeSlot}
            />
            {item.startTime && (() => {
              const { label, isPM } = parseItemTime(item.startTime)
              return (
                <span className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums leading-none ${isPM ? 'bg-orange-50 text-orange-500' : 'bg-sky-50 text-sky-500'}`}>
                  {label}
                </span>
              )
            })()}
            <StarRow
              myRating={item.ratings?.[myUid] ?? 0}
              ratings={item.ratings}
              onChange={v => onRate(item.id, v)}
            />
          </div>

          {/* 2행: ÷N (좌) + 금액 (우) */}
          {(item.price > 0 || (totalPeople > 1)) && (
            <div className="flex items-center gap-2">
              {totalPeople > 1 && item.price > 0 && (
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setShowPP(v => !v) }}
                  className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-all whitespace-nowrap text-blue-600 bg-blue-50 hover:bg-blue-100"
                >
                  <Users className="w-2.5 h-2.5 flex-shrink-0" />
                  <span>÷{actualPart}</span>
                  {showPP && perPersonKRW > 0 && (
                    <span className="ml-0.5">= {formatKRW(perPersonKRW)}</span>
                  )}
                </button>
              )}
              {item.price > 0 && (
                <div className="flex flex-col items-end ml-auto gap-0.5">
                  <span className="text-xs font-semibold text-emerald-600 leading-none">
                    {item.currency === 'KRW' ? formatKRW(item.price) : formatLocal(item.price, item.currency)}
                  </span>
                  {item.currency !== 'KRW' && rates[item.currency] && (
                    <span className="text-[10px] text-gray-400 leading-none">
                      약 {formatKRW(Math.round(item.price * rates[item.currency]))}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3행: 사진 아이콘 */}
          <div className="flex items-center gap-1.5">
            {item.receipts && item.receipts.length > 0 && (
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onViewReceipts(item.receipts!) }}
                className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-colors flex-shrink-0 text-violet-600 bg-violet-50 hover:bg-violet-100"
              >
                <Camera className="w-2.5 h-2.5" />
                <span>{item.receipts.length}</span>
              </button>
            )}
            {(!item.receipts || item.receipts.length < 3) && (
              <>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); cameraRef.current?.click() }}
                  className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-colors flex-shrink-0 text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600"
                  title="사진 업로드"
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.length) { onUploadReceipt?.(e.target.files); e.target.value = '' }
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 권한별 버튼 */}
      {canEdit && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onQuickEdit(item) }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
            title="내역 작성"
          >
            <Receipt className="w-3 h-3" />
            <span>내역</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit(item) }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            title="수정"
          >
            <Edit2 className="w-3 h-3" />
            <span>수정</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Sortable 아이템 행 ── */
function SortableItemRow({ item, myUid, onDelete, onEdit, onQuickEdit, onChangeCat, onRate, onFocusMap, onViewReceipts, onUploadReceipt, mapIndex, rates, totalPeople, memberIds, canEdit }: {
  item:             PlanItem
  myUid:            string
  onDelete:         (id: string) => void
  onEdit:           (item: PlanItem) => void
  onQuickEdit:      (item: PlanItem) => void
  onChangeCat:      (id: string, cat: Category) => void
  onRate:           (id: string, v: number) => void
  onFocusMap:       (id: string) => void
  onViewReceipts:   (receipts: string[]) => void
  onUploadReceipt?: (files: FileList) => void
  mapIndex?:        number
  rates:            Record<string, number>
  totalPeople:      number
  memberIds?:       string[]
  canEdit:          boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity:  isDragging ? 0.4 : 1,
        zIndex:   isDragging ? 50 : undefined,
        position: 'relative',
      }}
    >
      <ItemRow
        item={item}
        myUid={myUid}
        onDelete={onDelete}
        onEdit={onEdit}
        onQuickEdit={onQuickEdit}
        onChangeCat={onChangeCat}
        onRate={onRate}
        onFocusMap={onFocusMap}
        onViewReceipts={onViewReceipts}
        onUploadReceipt={onUploadReceipt}
        mapIndex={mapIndex}
        rates={rates}
        totalPeople={totalPeople}
        memberIds={memberIds}
        canEdit={canEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

/* ── 빈 시간대 드롭존 ── */
function SlotDropZone({ slot }: { slot: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot}` })
  return (
    <div
      ref={setNodeRef}
      className={`h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
        isOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <span className={`text-[11px] ${isOver ? 'text-blue-500 font-semibold' : 'text-gray-300'}`}>
        {isOver ? '여기에 놓기' : '일정을 드래그하세요'}
      </span>
    </div>
  )
}

/* ── 통화별 빠른 금액 버튼 ── */
function getQuickAmounts(currency: string): { value: number; label: string }[] {
  switch (currency) {
    case 'KRW': return [
      { value: 5000, label: '5천' }, { value: 10000, label: '1만' },
      { value: 30000, label: '3만' }, { value: 50000, label: '5만' },
      { value: 100000, label: '10만' },
    ]
    case 'JPY': return [
      { value: 500, label: '¥500' }, { value: 1000, label: '¥1,000' },
      { value: 3000, label: '¥3,000' }, { value: 5000, label: '¥5,000' },
      { value: 10000, label: '¥10,000' },
    ]
    case 'VND': return [
      { value: 50000, label: '₫5만' }, { value: 100000, label: '₫10만' },
      { value: 200000, label: '₫20만' }, { value: 500000, label: '₫50만' },
      { value: 1000000, label: '₫100만' },
    ]
    case 'THB': return [
      { value: 100, label: '฿100' }, { value: 200, label: '฿200' },
      { value: 500, label: '฿500' }, { value: 1000, label: '฿1K' },
      { value: 2000, label: '฿2K' },
    ]
    case 'CNY': return [
      { value: 20, label: '¥20' }, { value: 50, label: '¥50' },
      { value: 100, label: '¥100' }, { value: 200, label: '¥200' },
      { value: 500, label: '¥500' },
    ]
    default: {
      const s = CURRENCY_SYMBOLS[currency] ?? currency
      return [
        { value: 5, label: `${s}5` }, { value: 10, label: `${s}10` },
        { value: 20, label: `${s}20` }, { value: 50, label: `${s}50` },
        { value: 100, label: `${s}100` },
      ]
    }
  }
}

/* ── 장소 추가 패널 ── */
type AddMode = 'normal' | 'flight' | 'accommodation'

function AddItemPanel({ onAdd, onClose, defaultCurrency, currencies, people, members, uid, tripId, days, activeDayId, onAddFlight, onAddAccommodation, defaultPlace, tripCity }: {
  onAdd:                (item: Omit<PlanItem, 'id' | 'order'>) => void
  onClose:              () => void
  defaultCurrency:      string
  currencies:           string[]
  people:               number
  members:              Member[]
  uid:                  string
  tripId:               string
  days:                 Day[]
  activeDayId:          string
  onAddFlight:          (fs: Omit<FlightItem, 'id'>[]) => Promise<void>
  onAddAccommodation:   (a: Omit<AccommodationItem, 'id'>) => Promise<void>
  defaultPlace?:        { name: string; lat: number; lng: number }
  tripCity?:            string
}) {
  const { avatarColor, avatarHexColor, user: authUser } = useAuthStore()
  const [mode,          setMode]          = useState<AddMode>('normal')
  const [showDone,      setShowDone]      = useState(false)
  const [addedName,     setAddedName]     = useState('')
  const [name,          setName]          = useState(defaultPlace?.name ?? '')
  const [timeSlot,       setTimeSlot]       = useState<TimeSlot>('미정')
  const [startTime,      setStartTime]      = useState('')
  const [cat,            setCat]            = useState<Category>('장소')
  const [price,          setPrice]          = useState('')
  const [currency,       setCurrency]       = useState(defaultCurrency)
  const [comment,        setComment]        = useState('')
  const [lat,            setLat]            = useState<number | null>(defaultPlace?.lat ?? null)
  const [lng,            setLng]            = useState<number | null>(defaultPlace?.lng ?? null)
  const [coordsFromMap,  setCoordsFromMap]  = useState(!!defaultPlace)
  const [participantIds, setParticipantIds] = useState<string[]>(() => {
    const ids = members.map(m => m.id)
    if (!ids.includes(uid)) return [uid, ...ids]
    return ids
  })
  const [payerId,        setPayerId]        = useState<string | undefined>(() => members.find(m => m.role === 'owner')?.id)
  const [showPayer,      setShowPayer]      = useState(false)
  const [receiptFiles,    setReceiptFiles]    = useState<File[]>([])
  const [receiptPreviews, setReceiptPreviews] = useState<string[]>([])
  const [uploading,       setUploading]       = useState(false)
  const [panelRates,      setPanelRates]      = useState<Record<string, number>>({ KRW: 1 })
  useEffect(() => { getRatesInKRW().then(setPanelRates).catch(() => {}) }, [])
  /* 비행기 */
  const [flightName,  setFlightName]  = useState('')
  const [inEnabled,   setInEnabled]   = useState(true)
  const [inDayId,     setInDayId]     = useState(activeDayId)
  const [inDepart,    setInDepart]    = useState('')
  const [inArrive,    setInArrive]    = useState('')
  const [outEnabled,  setOutEnabled]  = useState(false)
  const [outDayId,    setOutDayId]    = useState(days[days.length - 1]?.dayId ?? activeDayId)
  const [outDepart,   setOutDepart]   = useState('')
  const [outArrive,   setOutArrive]   = useState('')
  /* 숙소 */
  const [accName,       setAccName]       = useState('')
  const [checkInDayId,  setCheckInDayId]  = useState(activeDayId)
  const [checkInTime,   setCheckInTime]   = useState('')
  const [checkOutDayId, setCheckOutDayId] = useState(days[days.length - 1]?.dayId ?? activeDayId)
  const [checkOutTime,  setCheckOutTime]  = useState('')
  /* 위치 */
  const [flightLat,  setFlightLat]  = useState<number | null>(null)
  const [flightLng,  setFlightLng]  = useState<number | null>(null)
  const [accLat,     setAccLat]     = useState<number | null>(null)
  const [accLng,     setAccLng]     = useState<number | null>(null)
  /* 비행기/숙소 비용 */
  const [flightPrice,          setFlightPrice]          = useState('')
  const [flightCurrency,       setFlightCurrency]       = useState(defaultCurrency)
  const [flightIncludeInSettlement, setFlightIncludeInSettlement] = useState(true)
  const [accPrice,             setAccPrice]             = useState('')
  const [accCurrency,          setAccCurrency]          = useState(defaultCurrency)
  const [accIncludeInSettlement,   setAccIncludeInSettlement]   = useState(true)
  const [showFlightPriceInfo,  setShowFlightPriceInfo]  = useState(false)
  const [showAccPriceInfo,     setShowAccPriceInfo]     = useState(false)

  const inputRef       = useRef<HTMLInputElement>(null)
  const flightInputRef = useRef<HTMLInputElement>(null)
  const accInputRef    = useRef<HTMLInputElement>(null)
  const flightMapRef   = useRef<HTMLDivElement>(null)
  const accMapRef      = useRef<HTMLDivElement>(null)
  const ok = name.trim().length > 0

  const handleReceiptAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - receiptFiles.length
    const toAdd = files.slice(0, remaining)
    setReceiptFiles(prev => [...prev, ...toAdd])
    setReceiptPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const handleReceiptRemove = (i: number) => {
    URL.revokeObjectURL(receiptPreviews[i])
    setReceiptFiles(prev => prev.filter((_, j) => j !== i))
    setReceiptPreviews(prev => prev.filter((_, j) => j !== i))
  }

  /* Google Places Autocomplete — 여행지 위치 바이어스 적용 */
  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) =>
      loadGoogleMaps()
    ).then(() => {
      if (!inputRef.current) return
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['name', 'geometry'],
      })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete!.getPlace()
        if (place.name) setName(place.name)
        if (place.geometry?.location) {
          setLat(place.geometry.location.lat())
          setLng(place.geometry.location.lng())
          setCoordsFromMap(false)
        } else {
          setLat(null); setLng(null); setCoordsFromMap(false)
        }
      })
      /* 여행지 geocoding → setBounds로 검색 바이어스 설정 */
      if (tripCity) {
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ address: tripCity }, (results, status) => {
          if (status === 'OK' && results?.[0] && autocomplete) {
            autocomplete.setBounds(results[0].geometry.viewport)
          }
        })
      }
    }).catch(() => {})
    return () => {
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete)
    }
  }, [tripCity])

  /* 비행기 Places Autocomplete */
  useEffect(() => {
    if (mode !== 'flight') return
    let ac: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!flightInputRef.current) return
      ac = new google.maps.places.Autocomplete(flightInputRef.current, {
        fields: ['name', 'geometry'],
        types: ['airport'],
      })
      ac.addListener('place_changed', () => {
        const p = ac!.getPlace()
        if (p.name) setFlightName(p.name)
        if (p.geometry?.location) {
          setFlightLat(p.geometry.location.lat())
          setFlightLng(p.geometry.location.lng())
        }
      })
    }).catch(() => {})
    return () => { if (ac) google.maps.event.clearInstanceListeners(ac) }
  }, [mode])

  /* 숙소 Places Autocomplete */
  useEffect(() => {
    if (mode !== 'accommodation') return
    /* 더블클릭으로 열렸으면 해당 좌표를 숙소 좌표로 자동 적용 */
    if (defaultPlace && accLat === null) {
      setAccLat(defaultPlace.lat)
      setAccLng(defaultPlace.lng)
      if (defaultPlace.name) setAccName(defaultPlace.name)
    }
    let ac: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!accInputRef.current) return
      ac = new google.maps.places.Autocomplete(accInputRef.current, {
        fields: ['name', 'geometry'],
      })
      ac.addListener('place_changed', () => {
        const p = ac!.getPlace()
        if (p.name) setAccName(p.name)
        if (p.geometry?.location) {
          setAccLat(p.geometry.location.lat())
          setAccLng(p.geometry.location.lng())
        }
      })
    }).catch(() => {})
    return () => { if (ac) google.maps.event.clearInstanceListeners(ac) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  /* 비행기 미니맵 */
  useEffect(() => {
    if (flightLat === null || flightLng === null || !flightMapRef.current) return
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      const el = flightMapRef.current; if (!el) return
      const gMap = new google.maps.Map(el, {
        center: { lat: flightLat, lng: flightLng },
        zoom: 14,
        disableDefaultUI: true,
        gestureHandling: 'none',
      })
      new google.maps.Marker({ position: { lat: flightLat, lng: flightLng }, map: gMap })
    }).catch(() => {})
  }, [flightLat, flightLng])

  /* 숙소 미니맵 */
  useEffect(() => {
    if (accLat === null || accLng === null || !accMapRef.current) return
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      const el = accMapRef.current; if (!el) return
      const gMap = new google.maps.Map(el, {
        center: { lat: accLat, lng: accLng },
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'none',
      })
      new google.maps.Marker({ position: { lat: accLat, lng: accLng }, map: gMap })
    }).catch(() => {})
  }, [accLat, accLng])

  const showDoneScreen = (name: string) => { setAddedName(name); setShowDone(true) }

  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      if (mode === 'flight') {
        if (!flightName.trim()) return
        if (!inEnabled && !outEnabled) return
        const loc = flightLat !== null ? { lat: flightLat, lng: flightLng ?? 0 } : {}
        const fCostBase = Number(flightPrice) > 0
          ? { price: Number(flightPrice), currency: flightCurrency, includeInSettlement: flightIncludeInSettlement }
          : {}
        const toAdd: Omit<FlightItem, 'id'>[] = []
        // 가격은 첫 번째 세그먼트에만 저장 (이중 계산 방지)
        if (inEnabled)  toAdd.push({ name: flightName.trim(), type: 'inbound',  dayId: inDayId,  departTime: inDepart,  arriveTime: inArrive,  ...loc, ...fCostBase })
        if (outEnabled) toAdd.push({ name: flightName.trim(), type: 'outbound', dayId: outDayId, departTime: outDepart, arriveTime: outArrive, ...loc, ...(inEnabled ? {} : fCostBase) })
        await onAddFlight(toAdd)
        setFlightName(''); setInDepart(''); setInArrive(''); setOutDepart(''); setOutArrive('')
        setFlightLat(null); setFlightLng(null); setFlightPrice(''); setFlightIncludeInSettlement(true)
        showDoneScreen(flightName.trim()); return
      }
      if (mode === 'accommodation') {
        if (!accName.trim()) return
        const aCost = Number(accPrice) > 0
          ? { price: Number(accPrice), currency: accCurrency, includeInSettlement: accIncludeInSettlement }
          : {}
        await onAddAccommodation({ name: accName.trim(), checkInDayId, checkInTime, checkOutDayId, checkOutTime,
          ...(accLat !== null ? { lat: accLat, lng: accLng ?? 0 } : {}), ...aCost })
        setAccName(''); setCheckInTime(''); setCheckOutTime(''); setAccLat(null); setAccLng(null)
        setAccPrice(''); setAccIncludeInSettlement(true)
        showDoneScreen(accName.trim()); return
      }
      if (!ok) return
      setUploading(true)
      const receiptURLs: string[] = []
      if (receiptFiles.length > 0) {
        const [{ storage }, { ref: sRef, uploadBytes, getDownloadURL }] = await Promise.all([
          import('@/lib/firebase'),
          import('firebase/storage'),
        ])
        const ts = Date.now()
        await Promise.all(receiptFiles.map(async (file, i) => {
          const blob = await compressImage(file)
          const r = sRef(storage, `users/${uid}/trips/${tripId}/receipts/${ts}_${i}.jpg`)
          await uploadBytes(r, blob)
          receiptURLs.push(await getDownloadURL(r))
        }))
      }
      receiptPreviews.forEach(u => URL.revokeObjectURL(u))
      onAdd({
        name: name.trim(), timeSlot, cat,
        price: Number(price) || 0, currency,
        comment, rating: 0,
        lat: lat ?? 0, lng: lng ?? 0,
        participants: participantIds.length || people,
        participantIds,
        ...(payerId ? { payerId } : {}),
        ...(startTime ? { startTime } : {}),
        ...(receiptURLs.length > 0 ? { receipts: receiptURLs } : {}),
      })
      setReceiptFiles([]); setReceiptPreviews([]); setUploading(false)
      const doneName = name.trim()
      setName(''); setPrice(''); setComment(''); setLat(null); setLng(null); setCoordsFromMap(false); setStartTime('')
      showDoneScreen(doneName)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = "w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
  const selectCls = "w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white"

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[88vh]">

        {/* 고정 헤더 */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">일정 추가</h3>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 모드 탭 */}
          <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
            {(['normal', 'flight', 'accommodation'] as AddMode[]).map(m => {
              const labels: Record<AddMode, string> = { normal: '장소 / 일정', flight: '비행기', accommodation: '숙소' }
              return (
                <button key={m} type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {labels[m]}
                </button>
              )
            })}
          </div>
        </div>

        {/* 등록 완료 화면 */}
        {showDone && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900 mb-1">정상적으로 등록됐습니다.</p>
              {addedName && <p className="text-sm text-gray-400">{addedName}</p>}
            </div>
            <div className="flex flex-col gap-2.5 w-full mt-1">
              <button
                type="button"
                onClick={() => setShowDone(false)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-colors"
              >
                추가 등록하기
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 border border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 스크롤 영역 — showDone 때도 DOM 유지해 autocomplete 살려둠 */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 ${showDone ? 'hidden' : ''}`}>
        <form onSubmit={submit} className="flex flex-col gap-4" onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}>

          {/* ── 비행기 폼 ── */}
          {mode === 'flight' && (
            <>
              {/* 항공명 검색 */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-gray-600">
                  항공명
                  {flightLat !== null && <span className="ml-1.5 text-blue-500 font-normal">위치 확인됨</span>}
                </label>
                <input ref={flightInputRef} type="text" placeholder="예: 나리타 공항, 인천국제공항…" value={flightName}
                  onChange={e => { setFlightName(e.target.value); setFlightLat(null); setFlightLng(null) }}
                  autoFocus className={inputCls} />
                <div
                  ref={flightMapRef}
                  className="rounded-xl overflow-hidden transition-all duration-300"
                  style={{ height: flightLat !== null ? 148 : 0 }}
                />
              </div>

              {/* 입국 섹션 */}
              <div className={`flex flex-col gap-2.5 p-3.5 rounded-xl border transition-colors ${inEnabled ? 'border-sky-200 bg-sky-50/40' : 'border-gray-100 bg-gray-50/60 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-sky-700">입국</span>
                  <button type="button" onClick={() => setInEnabled(v => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${inEnabled ? 'bg-sky-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${inEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
                {inEnabled && (
                  <>
                    <select value={inDayId} onChange={e => setInDayId(e.target.value)} className={selectCls}>
                      {days.map(d => (
                        <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-[11px] font-semibold text-gray-500">출발 시간</label>
                        <input type="time" value={inDepart} onChange={e => setInDepart(e.target.value)} className={`${inputCls} appearance-none`} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-[11px] font-semibold text-gray-500">도착 시간</label>
                        <input type="time" value={inArrive} onChange={e => setInArrive(e.target.value)} className={`${inputCls} appearance-none`} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 출국 섹션 */}
              <div className={`flex flex-col gap-2.5 p-3.5 rounded-xl border transition-colors ${outEnabled ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100 bg-gray-50/60 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-orange-600">출국</span>
                  <button type="button" onClick={() => setOutEnabled(v => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${outEnabled ? 'bg-orange-400' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${outEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
                {outEnabled && (
                  <>
                    <select value={outDayId} onChange={e => setOutDayId(e.target.value)} className={selectCls}>
                      {days.map(d => (
                        <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-[11px] font-semibold text-gray-500">출발 시간</label>
                        <input type="time" value={outDepart} onChange={e => setOutDepart(e.target.value)} className={`${inputCls} appearance-none`} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-[11px] font-semibold text-gray-500">도착 시간</label>
                        <input type="time" value={outArrive} onChange={e => setOutArrive(e.target.value)} className={`${inputCls} appearance-none`} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-gray-600">예상 비용 (선택)</span>
                    <div className="relative">
                      <button type="button" onClick={() => setShowFlightPriceInfo(v => !v)}
                        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center hover:bg-gray-300 transition-colors">
                        i
                      </button>
                      {showFlightPriceInfo && (
                        <>
                          <div className="fixed inset-0 z-[9]" onClick={() => setShowFlightPriceInfo(false)} />
                          <div className="absolute left-0 top-6 z-10 w-64 bg-gray-900 text-white text-[11px] rounded-2xl p-3.5 shadow-xl leading-relaxed">
                            <p className="font-semibold text-white mb-1.5">정산 포함 안내</p>
                            <p className="text-gray-300">· <span className="text-white font-semibold">체크</span> — 정산 금액 팝업에 비행기 비용이 1/n 분배로 누적됩니다.</p>
                            <p className="mt-1.5 text-gray-300">· <span className="text-white font-semibold">미체크</span> — 카드에만 표시되며 계산에 포함되지 않습니다.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={flightIncludeInSettlement}
                      onChange={e => setFlightIncludeInSettlement(e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    <span className="text-[12px] font-medium text-gray-600">정산에 포함</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <select value={flightCurrency} onChange={e => setFlightCurrency(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                    {[defaultCurrency, ...Object.keys(CURRENCY_SYMBOLS).filter(c => c !== defaultCurrency)].map(c => (
                      <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c} {CURRENCY_NAMES[c] ? `· ${CURRENCY_NAMES[c]}` : ''}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="0" value={flightPrice} onChange={e => setFlightPrice(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
              <button type="submit" disabled={!flightName.trim() || (!inEnabled && !outEnabled) || submitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '비행기 추가'}
              </button>
            </>
          )}

          {/* ── 숙소 폼 ── */}
          {mode === 'accommodation' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-gray-600">
                  숙소명
                  {accLat !== null && <span className="ml-1.5 text-blue-500 font-normal">위치 확인됨</span>}
                </label>
                <input ref={accInputRef} type="text" placeholder="예: 도쿄 힐튼, APA 호텔…" value={accName}
                  onChange={e => { setAccName(e.target.value); setAccLat(null); setAccLng(null) }}
                  autoFocus className={inputCls} />
                <div
                  ref={accMapRef}
                  className="rounded-xl overflow-hidden transition-all duration-300"
                  style={{ height: accLat !== null ? 148 : 0 }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[12px] font-semibold text-gray-600">체크인 날짜</label>
                  <select value={checkInDayId} onChange={e => setCheckInDayId(e.target.value)} className={selectCls}>
                    {days.map(d => (
                      <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[12px] font-semibold text-gray-600">체크인 시간</label>
                  <input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} className={`${inputCls} appearance-none`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[12px] font-semibold text-gray-600">체크아웃 날짜</label>
                  <select value={checkOutDayId} onChange={e => setCheckOutDayId(e.target.value)} className={selectCls}>
                    {days.map(d => (
                      <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[12px] font-semibold text-gray-600">체크아웃 시간</label>
                  <input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} className={`${inputCls} appearance-none`} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-gray-600">예상 비용 (선택)</span>
                    <div className="relative">
                      <button type="button" onClick={() => setShowAccPriceInfo(v => !v)}
                        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center hover:bg-gray-300 transition-colors">
                        i
                      </button>
                      {showAccPriceInfo && (
                        <>
                          <div className="fixed inset-0 z-[9]" onClick={() => setShowAccPriceInfo(false)} />
                          <div className="absolute left-0 top-6 z-10 w-64 bg-gray-900 text-white text-[11px] rounded-2xl p-3.5 shadow-xl leading-relaxed">
                            <p className="font-semibold text-white mb-1.5">정산 포함 안내</p>
                            <p className="text-gray-300">· <span className="text-white font-semibold">체크</span> — 정산 금액 팝업에 숙소 비용이 1/n 분배로 누적됩니다.</p>
                            <p className="mt-1.5 text-gray-300">· <span className="text-white font-semibold">미체크</span> — 카드에만 표시되며 계산에 포함되지 않습니다.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={accIncludeInSettlement}
                      onChange={e => setAccIncludeInSettlement(e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    <span className="text-[12px] font-medium text-gray-600">정산에 포함</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <select value={accCurrency} onChange={e => setAccCurrency(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                    {[defaultCurrency, ...Object.keys(CURRENCY_SYMBOLS).filter(c => c !== defaultCurrency)].map(c => (
                      <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c} {CURRENCY_NAMES[c] ? `· ${CURRENCY_NAMES[c]}` : ''}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="0" value={accPrice} onChange={e => setAccPrice(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
              <button type="submit" disabled={!accName.trim() || submitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">
                숙소 추가
              </button>
            </>
          )}

          {/* ── 일반 일정 폼 ── */}
          {mode === 'normal' && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-gray-600">
                    항목명 *
                    {lat !== null && <span className="ml-1.5 text-blue-500 font-normal">위치 확인됨</span>}
                  </label>
                  {lat === null && name.trim().length > 0 && (
                    <span className="text-[11px] text-gray-400">위치 없이 추가 가능</span>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="장소 검색 또는 직접 입력 (예: 택시, 교통카드, 기념품…)"
                  value={name}
                  onChange={e => { setName(e.target.value); if (!coordsFromMap) { setLat(null); setLng(null) } }}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-gray-600">시간대</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">시각</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {TIME_SLOTS.map(t => (
                    <button key={t} type="button" onClick={() => setTimeSlot(t)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                        timeSlot === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:border-blue-400'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${timeSlot === t ? 'bg-white' : SLOT_DOT[t]}`} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-gray-600">카테고리</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCat(c)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                        cat === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>{CAT_DISPLAY[c]}</button>
                  ))}
                </div>
              </div>
              {members.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-gray-600">참석 인원</label>
                    <span className="text-[11px] text-gray-400">
                      {participantIds.length}명 참석
                      {participantIds.length > 0 && Number(price) > 0 && (
                        <span className="ml-1 text-blue-500">· 1인 부담 = 총액 ÷ {participantIds.length}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {members.map((m, mi) => {
                      const selected = participantIds.includes(m.id)
                      const ci = m.role === 'owner'
                        ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                        : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                      const hexC    = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                      const photoURL = m.role === 'owner' ? (auth.currentUser?.photoURL ?? authUser?.photoURL ?? m.photoURL) : m.photoURL
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setParticipantIds(prev =>
                            selected ? prev.filter(id => id !== m.id) : [...prev, m.id]
                          )}
                          className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-blue-400 bg-blue-50/60'
                              : 'border-gray-100 bg-gray-50 opacity-35'
                          }`}
                        >
                          <PersonAvatar name={m.name} size={28} colorIndex={ci} hexColor={hexC} photoURL={photoURL ?? undefined} ringColor={photoURL ? (hexC ?? CLAY[ci ?? 1]?.base) : undefined} />
                          <span className="text-[9px] font-semibold text-gray-700 max-w-[44px] truncate">{m.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {/* 결제자 선택 (선택사항) */}
              {members.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPayer(v => !v)}
                    className="flex items-center justify-between text-[12px] font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      결제자
                      <span className="text-[10px] font-normal text-gray-400">(선택)</span>
                      {payerId && (() => {
                        const p = members.find(m => m.id === payerId)
                        return p ? <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{p.name}</span> : null
                      })()}
                    </span>
                    <span className="text-[10px] text-gray-400">{showPayer ? '▲' : '▼'}</span>
                  </button>
                  {showPayer && (
                    <div className="flex gap-2 flex-wrap">
                      {members.map((m, mi) => {
                        const selected = payerId === m.id
                        const ci = m.role === 'owner'
                          ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                          : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                        const hexC = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                        const photoURL = m.role === 'owner' ? (auth.currentUser?.photoURL ?? authUser?.photoURL ?? m.photoURL) : m.photoURL
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPayerId(prev => prev === m.id ? undefined : m.id)}
                            className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border-2 transition-all ${
                              selected ? 'border-emerald-400 bg-emerald-50/60' : 'border-gray-100 bg-gray-50 opacity-45'
                            }`}
                          >
                            <PersonAvatar name={m.name} size={28} colorIndex={ci} hexColor={hexC} photoURL={photoURL ?? undefined} ringColor={photoURL ? (hexC ?? CLAY[ci ?? 1]?.base) : undefined} />
                            <span className="text-[9px] font-semibold text-gray-700 max-w-[44px] truncate">{m.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-gray-600">예상 비용</label>
                <div className="flex gap-2">
                  {currencies.length > 1 ? (
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white"
                    >
                      {currencies.map(c => (
                        <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c}</option>
                      ))}
                      <option value="KRW">₩ KRW</option>
                    </select>
                  ) : (
                    <div className="flex items-center px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 whitespace-nowrap">
                      {CURRENCY_SYMBOLS[currency] ?? currency} {currency}
                    </div>
                  )}
                  <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                </div>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {getQuickAmounts(currency).map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => setPrice(String(value))}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
                {currency !== 'KRW' && parseFloat(price) > 0 && panelRates[currency] && (
                  <p className="text-xs font-semibold text-blue-600 mt-1">
                    약 {formatKRW(Math.round(parseFloat(price) * panelRates[currency]))}
                  </p>
                )}
                {currencies.length <= 1 && currency !== 'KRW' && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    현지 통화({CURRENCY_NAMES[currency] ?? currency})로 입력하세요
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-gray-600">메모 (선택)</label>
                <input type="text" placeholder="예: 영업시간, 예약 필요 여부…" value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-slate-600 italic placeholder:not-italic placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-600">
                  영수증 첨부 <span className="font-normal text-gray-400">(최대 3장)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {receiptPreviews.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleReceiptRemove(i)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                  {receiptPreviews.length < 3 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer gap-0.5 transition-colors flex-shrink-0">
                      <Camera className="w-4 h-4 text-gray-400" />
                      <span className="text-[9px] text-gray-400">추가</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleReceiptAdd} />
                    </label>
                  )}
                </div>
              </div>
              <button type="submit" disabled={!ok || uploading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                {uploading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />업로드 중…</>
                  : '추가하기'}
              </button>
            </>
          )}
        </form>
        </div>{/* /스크롤 영역 */}
      </div>
    </div>
  )
}

/* ── 빠른 입력 시트 (카드 클릭 → 비용·메모·사진만) ── */
function QuickItemSheet({ item, onUpdate, onClose, currencies, uid, tripId, leftWidth, isDesktop, tabsBottom }: {
  item:       PlanItem
  onUpdate:   (id: string, updates: Partial<Omit<PlanItem, 'id' | 'order'>>) => Promise<void>
  onClose:    () => void
  currencies: string[]
  uid:        string
  tripId:     string
  leftWidth:  number
  isDesktop:  boolean
  tabsBottom: number
}) {
  const [price,       setPrice]       = useState(item.price > 0 ? String(item.price) : '')
  const [currency,    setCurrency]    = useState(item.currency)
  const [comment,     setComment]     = useState(item.comment)
  const [receipts,    setReceipts]    = useState<string[]>(item.receipts ?? [])
  const [newFiles,    setNewFiles]    = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [saving,      setSaving]      = useState(false)

  const handleReceiptAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - receipts.length - newFiles.length
    const toAdd = files.slice(0, remaining)
    setNewFiles(prev => [...prev, ...toAdd])
    setNewPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeExisting = (i: number) => setReceipts(prev => prev.filter((_, j) => j !== i))
  const removeNew = (i: number) => {
    URL.revokeObjectURL(newPreviews[i])
    setNewFiles(prev => prev.filter((_, j) => j !== i))
    setNewPreviews(prev => prev.filter((_, j) => j !== i))
  }

  const submit = async () => {
    setSaving(true)
    try {
      const uploadedURLs: string[] = []
      if (newFiles.length > 0) {
        const [{ storage }, { ref: sRef, uploadBytes, getDownloadURL }] = await Promise.all([
          import('@/lib/firebase'),
          import('firebase/storage'),
        ])
        const ts = Date.now()
        await Promise.all(newFiles.map(async (file, i) => {
          const blob = await compressImage(file)
          const r = sRef(storage, `users/${uid}/trips/${tripId}/receipts/${ts}_${i}.jpg`)
          await uploadBytes(r, blob)
          uploadedURLs.push(await getDownloadURL(r))
        }))
      }
      newPreviews.forEach(u => URL.revokeObjectURL(u))
      await onUpdate(item.id, {
        price:    Number(price) || 0,
        currency,
        comment,
        receipts: [...receipts, ...uploadedURLs],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const panelContent = (
    <>
      {/* 핸들 바 — 모바일만 */}
      {!isDesktop && (
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>
      )}

      {/* 헤더 */}
      <div className={`flex items-center justify-between px-4 pb-3 ${isDesktop ? 'pt-4' : 'pt-2'}`}>
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-[11px] font-semibold text-gray-400 mb-0.5">비용 · 메모 · 사진</p>
          <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto px-4 pb-4 flex flex-col gap-3 max-h-[55dvh]">
        {/* 비용 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">비용</label>
          <div className="flex gap-2">
            {currencies.length > 1 ? (
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white flex-shrink-0">
                {currencies.map(c => <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c}</option>)}
                <option value="KRW">₩ KRW</option>
              </select>
            ) : (
              <div className="flex items-center px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 whitespace-nowrap flex-shrink-0">
                {CURRENCY_SYMBOLS[currency] ?? currency} {currency}
              </div>
            )}
            <input
              type="number"
              inputMode="decimal"
              placeholder="금액 입력"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* 메모 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">메모</label>
          <input
            type="text"
            placeholder="영업시간, 예약 여부 등"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm italic text-slate-600 placeholder:not-italic placeholder:text-gray-400 outline-none focus:border-blue-500 transition-all"
          />
        </div>

        {/* 사진 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">사진 <span className="font-normal text-gray-400">(최대 3장)</span></label>
        <div className="flex gap-2 flex-wrap">
          {receipts.map((url, i) => (
            <div key={`ex-${i}`} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExisting(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          {newPreviews.map((url, i) => (
            <div key={`new-${i}`} className="relative w-14 h-14 rounded-xl overflow-hidden border border-blue-200 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeNew(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          {receipts.length + newFiles.length < 3 && (
            <label className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer gap-0.5 transition-colors flex-shrink-0">
              <Camera className="w-4 h-4 text-gray-400" />
              <span className="text-[9px] text-gray-400">추가</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleReceiptAdd} />
            </label>
          )}
        </div>
        </div>{/* /사진 */}

        {/* 저장 */}
        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />저장 중…</>
            : '저장'}
        </button>
      </div>
    </>
  )

  /* 데스크탑: 지도 영역 좌상단 플로팅 카드 (딤드 없음) */
  if (isDesktop) {
    return (
      <div
        className="fixed z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
        style={{
          left: leftWidth + 12,
          top: tabsBottom + 12,
          width: 340,
          maxHeight: `calc(100dvh - ${tabsBottom + 28}px)`,
        }}
      >
        {panelContent}
      </div>
    )
  }

  /* 모바일: 딤드 + 바텀 시트 (일정 탭 유지) */
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col">
        {panelContent}
      </div>
    </div>
  )
}

/* ── 아이템 수정 패널 ── */
function EditItemPanel({ item, onUpdate, onDelete, onClose, currencies, people, members, uid, tripId }: {
  item:      PlanItem
  onUpdate:  (id: string, updates: Partial<Omit<PlanItem, 'id' | 'order'>>) => Promise<void>
  onDelete:  (id: string) => void
  onClose:   () => void
  currencies: string[]
  people:    number
  members:   Member[]
  uid:       string
  tripId:    string
}) {
  const { avatarColor, avatarHexColor, user: authUser } = useAuthStore()
  const [name,           setName]           = useState(item.name)
  const [timeSlot,       setTimeSlot]       = useState<TimeSlot>(item.timeSlot)
  const [startTime,      setStartTime]      = useState(item.startTime ?? '')
  const [cat,            setCat]            = useState<Category>(item.cat)
  const [price,          setPrice]          = useState(item.price > 0 ? String(item.price) : '')
  const [currency,       setCurrency]       = useState(item.currency)
  const [comment,        setComment]        = useState(item.comment)
  const [lat,            setLat]            = useState<number>(item.lat)
  const [lng,            setLng]            = useState<number>(item.lng)
  const [participantIds, setParticipantIds] = useState<string[]>(() => {
    const validIds = new Set(members.map(m => m.id))
    if (item.participantIds?.length) {
      const filtered = item.participantIds.filter(id => validIds.has(id))
      if (!filtered.includes(uid)) return [uid, ...filtered]
      return filtered
    }
    const allIds = members.map(m => m.id)
    if (!allIds.includes(uid)) return [uid, ...allIds]
    return allIds
  })
  const [payerId,        setPayerId]        = useState<string | undefined>(item.payerId ?? members.find(m => m.role === 'owner')?.id)
  const [showPayer,      setShowPayer]      = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [receipts,     setReceipts]     = useState<string[]>(item.receipts ?? [])
  const [newFiles,     setNewFiles]     = useState<File[]>([])
  const [newPreviews,  setNewPreviews]  = useState<string[]>([])
  const [editRates,    setEditRates]    = useState<Record<string, number>>({ KRW: 1 })
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { getRatesInKRW().then(setEditRates).catch(() => {}) }, [])

  const handleReceiptAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - receipts.length - newFiles.length
    const toAdd = files.slice(0, remaining)
    setNewFiles(prev => [...prev, ...toAdd])
    setNewPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeExisting = (i: number) => setReceipts(prev => prev.filter((_, j) => j !== i))

  const removeNew = (i: number) => {
    URL.revokeObjectURL(newPreviews[i])
    setNewFiles(prev => prev.filter((_, j) => j !== i))
    setNewPreviews(prev => prev.filter((_, j) => j !== i))
  }

  const ok = name.trim().length > 0

  /* Google Places Autocomplete */
  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) =>
      loadGoogleMaps()
    ).then(() => {
      if (!inputRef.current) return
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['name', 'geometry'],
      })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete!.getPlace()
        if (place.name) setName(place.name)
        if (place.geometry?.location) {
          setLat(place.geometry.location.lat())
          setLng(place.geometry.location.lng())
        }
      })
    }).catch(() => {})
    return () => {
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete)
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    setSaving(true)
    try {
      const uploadedURLs: string[] = []
      if (newFiles.length > 0) {
        const [{ storage }, { ref: sRef, uploadBytes, getDownloadURL }] = await Promise.all([
          import('@/lib/firebase'),
          import('firebase/storage'),
        ])
        const ts = Date.now()
        await Promise.all(newFiles.map(async (file, i) => {
          const blob = await compressImage(file)
          const r = sRef(storage, `users/${uid}/trips/${tripId}/receipts/${ts}_${i}.jpg`)
          await uploadBytes(r, blob)
          uploadedURLs.push(await getDownloadURL(r))
        }))
      }
      newPreviews.forEach(u => URL.revokeObjectURL(u))
      const finalReceipts = [...receipts, ...uploadedURLs]
      await onUpdate(item.id, {
        name: name.trim(), timeSlot, cat,
        ...(startTime ? { startTime } : { startTime: '' }),
        price: Number(price) || 0, currency,
        comment, lat, lng,
        participants: participantIds.length || people,
        participantIds,
        payerId: payerId ?? null as unknown as undefined,
        receipts: finalReceipts.length > 0 ? finalReceipts : [],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">일정 수정</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-gray-600">
              장소명 {lat !== 0 && lng !== 0 && <span className="text-blue-500 font-normal">위치 확인됨</span>}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setLat(0); setLng(0) }}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-gray-600">시간대</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">시각</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {TIME_SLOTS.map(t => (
                <button key={t} type="button" onClick={() => setTimeSlot(t)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                    timeSlot === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${timeSlot === t ? 'bg-white' : SLOT_DOT[t]}`} />
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-gray-600">카테고리</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                    cat === c
                      ? `${CAT_COLORS[c]} border-transparent`
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${CAT_DOTS[c]}`} />
                  {CAT_DISPLAY[c]}
                </button>
              ))}
            </div>
          </div>
          {members.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-gray-600">참석 인원</label>
                <span className="text-[11px] text-gray-400">
                  {participantIds.length}명 참석
                  {participantIds.length > 0 && Number(price) > 0 && (
                    <span className="ml-1 text-blue-500">· 1인 부담 = 총액 ÷ {participantIds.length}</span>
                  )}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {members.map((m, mi) => {
                  const selected = participantIds.includes(m.id)
                  const ci = m.role === 'owner'
                    ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                    : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                  const hexC     = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                  const photoURL = m.role === 'owner' ? (auth.currentUser?.photoURL ?? authUser?.photoURL ?? m.photoURL) : m.photoURL
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setParticipantIds(prev =>
                        selected ? prev.filter(id => id !== m.id) : [...prev, m.id]
                      )}
                      className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-blue-400 bg-blue-50/60'
                          : 'border-gray-100 bg-gray-50 opacity-35'
                      }`}
                    >
                      <PersonAvatar name={m.name} size={28} colorIndex={ci} hexColor={hexC} photoURL={photoURL ?? undefined} ringColor={hexC ?? (ci !== undefined ? CLAY[ci % CLAY.length]?.base : undefined)} />
                      <span className="text-[9px] font-semibold text-gray-700 max-w-[44px] truncate">{m.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {/* 결제자 선택 (선택사항) */}
          {members.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setShowPayer(v => !v)}
                className="flex items-center justify-between text-[12px] font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  결제자
                  <span className="text-[10px] font-normal text-gray-400">(선택)</span>
                  {payerId && (() => {
                    const p = members.find(m => m.id === payerId)
                    return p ? <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{p.name}</span> : null
                  })()}
                </span>
                <span className="text-[10px] text-gray-400">{showPayer ? '▲' : '▼'}</span>
              </button>
              {showPayer && (
                <div className="flex gap-2 flex-wrap">
                  {members.map((m, mi) => {
                    const selected = payerId === m.id
                    const ci = m.role === 'owner'
                      ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                      : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                    const hexC = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                    const photoURL = m.role === 'owner' ? (auth.currentUser?.photoURL ?? authUser?.photoURL ?? m.photoURL) : m.photoURL
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayerId(prev => prev === m.id ? undefined : m.id)}
                        className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border-2 transition-all ${
                          selected ? 'border-emerald-400 bg-emerald-50/60' : 'border-gray-100 bg-gray-50 opacity-45'
                        }`}
                      >
                        <PersonAvatar name={m.name} size={28} colorIndex={ci} hexColor={hexC} photoURL={photoURL ?? undefined} ringColor={hexC ?? (ci !== undefined ? CLAY[ci % CLAY.length]?.base : undefined)} />
                        <span className="text-[9px] font-semibold text-gray-700 max-w-[44px] truncate">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-gray-600">예상 비용</label>
            <div className="flex gap-2">
              {currencies.length > 1 ? (
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                  {currencies.map(c => <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c}</option>)}
                  <option value="KRW">₩ KRW</option>
                </select>
              ) : (
                <div className="flex items-center px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 whitespace-nowrap">
                  {CURRENCY_SYMBOLS[currency] ?? currency} {currency}
                </div>
              )}
              <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
            </div>
            {currency !== 'KRW' && parseFloat(price) > 0 && editRates[currency] && (
              <p className="text-xs font-semibold text-blue-600 mt-1">
                약 {formatKRW(Math.round(parseFloat(price) * editRates[currency]))}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-gray-600">메모 (선택)</label>
            <input type="text" placeholder="예: 영업시간, 예약 필요 여부…" value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-slate-600 italic placeholder:not-italic placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
          </div>

          {/* 영수증 첨부 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-600">
              영수증 첨부 <span className="font-normal text-gray-400">(최대 3장)</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {receipts.map((url, i) => (
                <div key={`ex-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExisting(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              {newPreviews.map((url, i) => (
                <div key={`new-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-blue-200 flex-shrink-0">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNew(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              {receipts.length + newFiles.length < 3 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer gap-0.5 transition-colors flex-shrink-0">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="text-[9px] text-gray-400">추가</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleReceiptAdd} />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onDelete(item.id); onClose() }}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
            <button type="submit" disabled={!ok || saving}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />저장 중…</>
                : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── 체크리스트 기본값 ── */
const DOMESTIC_DEFAULTS = ['신분증', '지갑 / 현금', '핸드폰 충전기', '보조배터리', '여벌 옷', '세면도구', '상비약', '이어폰']
const OVERSEAS_DEFAULTS = ['여권', '항공권 (출력 또는 모바일)', '해외여행자 보험', '환전 / 해외 카드', '핸드폰 충전기 + 어댑터', '보조배터리', '여벌 옷', '세면도구', '상비약', '이어폰', '여권 사본']

/* ── 플래너 본체 ── */
function PlannerContent({ tripId }: { tripId: string }) {
  const { user, avatarColor, avatarHexColor, preferredCurrency, setAvatarColor, setAvatarHexColor, setOnboardingPaused } = useAuthStore()
  const uid    = user!.uid
  const router       = useRouter()
  const searchParams = useSearchParams()

  /* 유저 색상 로드 (AppNavbar 없는 이 페이지에서 직접 접근 시 null 방지) */
  useEffect(() => {
    if (!user || (avatarColor !== null || avatarHexColor !== null)) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (!snap.exists()) return
      const d = snap.data()
      if (typeof d.avatarColor    === 'number') setAvatarColor(d.avatarColor)
      if (typeof d.avatarHexColor === 'string') setAvatarHexColor(d.avatarHexColor)
    }).catch(() => {})
  }, [user?.uid])

  /* 여행 메타 */
  const [meta,        setMeta]        = useState<TripMeta | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)

  /* 일별 아이템 */
  const [dayItems,    setDayItems]    = useState<Record<string, PlanItem[]>>({})
  const unsubsRef = useRef<Record<string, () => void>>({})

  /* UI 상태 */
  const [activeDayIdx,  setActiveDayIdx]  = useState(-1)   // -1 = 전체 일정
  const [showAdd,       setShowAdd]       = useState(false)
  const [editItem,      setEditItem]      = useState<PlanItem | null>(null)
  const [quickItem,     setQuickItem]     = useState<PlanItem | null>(null)
  const [showChecklist, setChecklist]     = useState(false)
  const [showNotice,      setShowNotice]      = useState(false)
  const [notices,         setNotices]         = useState<NoticeItem[]>([])
  const [noticesLoading,  setNoticesLoading]  = useState(false)
  const [noticeComposing, setNoticeComposing] = useState(false)
  const [noticeEditId,    setNoticeEditId]    = useState<string | null>(null)
  const [noticeInput,     setNoticeInput]     = useState('')
  const [mobileTab,     setMobileTab]     = useState<'schedule' | 'map'>('schedule')
  const [mapMounted,    setMapMounted]    = useState(false)  // lazy mount — 처음 지도 탭 열릴 때 true
  const [isDesktop,     setIsDesktop]     = useState(false)  // window >= 1024, reactive to resize
  const [showEdit,      setShowEdit]      = useState(false)
  const [checkInput,    setCheckInput]    = useState('')
  const [checkEditId,   setCheckEditId]   = useState<string | null>(null)
  const [checkEditVal,  setCheckEditVal]  = useState('')
  const [showMembers,   setShowMembers]   = useState(false)
  const [copied,        setCopied]        = useState<'view' | 'edit' | 'join' | null>(null)
  const [joinPinInput,  setJoinPinInput]  = useState('')
  const [pinSaved,      setPinSaved]      = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmoji,setNewMemberEmoji]= useState('😊')
  const [colorPickForId,  setColorPickForId]  = useState<string | null>(null)
  const [colorPickHex,    setColorPickHex]    = useState('')
  const [lightbox,        setLightbox]        = useState<{ receipts: string[]; idx: number } | null>(null)
  const [showSettlement,  setShowSettlement]  = useState(false)
  const [showReport,      setShowReport]      = useState(false)

  /* 온보딩 */
  const [memberTipDismissed,   setMemberTipDismissed]   = useState(() => {
    try { return localStorage.getItem('member_panel_tip_seen') === '1' } catch { return false }
  })
  const [showWelcome,          setShowWelcome]          = useState(false)
  const [showTreasurerPrompt,  setShowTreasurerPrompt]  = useState(false)
  const [pendingTreasurer,     setPendingTreasurer]     = useState(false)

  // 웰컴/총무 모달이 열려있는 동안 온보딩 콜아웃 숨김
  useEffect(() => {
    setOnboardingPaused(showWelcome || showTreasurerPrompt)
  }, [showWelcome, showTreasurerPrompt, setOnboardingPaused])
  useEffect(() => {
    try {
      const hasTreasurer = !!localStorage.getItem('showTreasurerPrompt')
      if (hasTreasurer) localStorage.removeItem('showTreasurerPrompt')
      if (localStorage.getItem('showWelcome')) {
        localStorage.removeItem('showWelcome')
        setShowWelcome(true)
        if (hasTreasurer) setPendingTreasurer(true)
      } else if (hasTreasurer) {
        setShowTreasurerPrompt(true)
      }
    } catch {}
  }, [])


  /* 환율 */
  const [rates,    setRates]    = useState<Record<string, number>>({ KRW: 1 })
  const [dayRates,   setDayRates]   = useState<Record<string, number>>({})
  const [dayBudgets, setDayBudgets] = useState<Record<string, number>>({})

  /* 비행기 / 숙소 수정 */
  const [editingFlight,    setEditingFlight]    = useState<FlightItem | null>(null)
  const [editingAcc,       setEditingAcc]       = useState<AccommodationItem | null>(null)
  const [showPayerFlight,        setShowPayerFlight]        = useState(false)
  const [showPayerAcc,           setShowPayerAcc]           = useState(false)
  const [showParticipantsFlight, setShowParticipantsFlight] = useState(false)
  const [showParticipantsAcc,    setShowParticipantsAcc]    = useState(false)
  const [expandedMemberId,       setExpandedMemberId]       = useState<string | null>(null)
  const editFlightInputRef = useRef<HTMLInputElement>(null)
  const editAccInputRef    = useRef<HTMLInputElement>(null)

  /* 모달 열릴 때 배경 스크롤 잠금 */
  const anyModalOpen = showAdd || !!editItem || showEdit || showMembers || showSettlement || !!lightbox || !!editingFlight || !!editingAcc || showReport
  useScrollLock(anyModalOpen)


  /* 지도 포커스 */
  const [focusItemId,   setFocusItemId]   = useState<string | undefined>(undefined)
  const [focusTrigger,  setFocusTrigger]  = useState(0)

  /* 지도 검색 / 더블클릭 → 일정 추가 */
  const [pendingPlace,  setPendingPlace]  = useState<{ name: string; lat: number; lng: number } | undefined>(undefined)
  const [showMapHint,   setShowMapHint]   = useState(true)
  const mapSearchRef    = useRef<HTMLInputElement>(null)
  const mapSearchAcRef  = useRef<google.maps.places.Autocomplete | null>(null)
  const dayTabsRef      = useRef<HTMLDivElement>(null)
  const dayTabsScrollRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  const onDayTabsMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = dayTabsScrollRef.current
    if (!el) return
    dragState.current = { isDragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  const onDayTabsMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = dayTabsScrollRef.current
    if (!el || !dragState.current.isDragging) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX)
  }, [])

  const onDayTabsMouseUp = useCallback(() => {
    const el = dayTabsScrollRef.current
    if (!el) return
    dragState.current.isDragging = false
    el.style.cursor = ''
    el.style.userSelect = ''
  }, [])

  const handleMapDblClick = useCallback((lat: number, lng: number, name?: string) => {
    setPendingPlace({ name: name ?? '', lat, lng })
    setShowMapHint(false)
  }, [])

  useEffect(() => {
    if (!showMapHint) return
    const t = setTimeout(() => setShowMapHint(false), 6000)
    return () => clearTimeout(t)
  }, [showMapHint])

  /* 좌우 패널 리사이즈 */
  const [leftWidth, setLeftWidth] = useState(420)
  const isDraggingRef   = useRef(false)
  const dragStartXRef   = useRef(0)
  const dragStartWRef   = useRef(420)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current  = true
    dragStartXRef.current  = e.clientX
    dragStartWRef.current  = leftWidth
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [leftWidth])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const next = Math.min(720, Math.max(280, dragStartWRef.current + e.clientX - dragStartXRef.current))
      setLeftWidth(next)
    }
    const onUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current          = false
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
  }, [])

  const handleFocusMap = (itemId: string) => {
    setFocusItemId(itemId)
    setFocusTrigger(t => t + 1)
    setMobileTab('map')
  }

  /* DnD — restrictToFirstScrollableAncestor: 스크롤 상단 이동 버그 방지 */
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  /* ── isDesktop: window resize에 반응 ── */
  useEffect(() => {
    const check = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (desktop) setMapMounted(true)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ── 지도 패널 검색 Autocomplete: input이 DOM에 마운트될 때 초기화 ── */
  const initMapSearchAc = useCallback((el: HTMLInputElement | null) => {
    // el이 null = 언마운트: 기존 인스턴스 정리
    if (!el) {
      if (mapSearchAcRef.current) {
        google.maps.event.clearInstanceListeners(mapSearchAcRef.current)
        mapSearchAcRef.current = null
      }
      return
    }
    // ref 동기화
    ;(mapSearchRef as React.MutableRefObject<HTMLInputElement | null>).current = el
    // 이미 초기화됐으면 재초기화 안 함
    if (mapSearchAcRef.current) return
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!el.isConnected) return   // 이미 언마운트된 경우 스킵
      const ac = new google.maps.places.Autocomplete(el, { fields: ['name', 'geometry'] })
      mapSearchAcRef.current = ac
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        setPendingPlace({
          name: place.name ?? '',
          lat:  place.geometry.location.lat(),
          lng:  place.geometry.location.lng(),
        })
        el.value = ''
      })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── 여행 메타 1회 로드 ── */
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid, 'trips', tripId))
        if (snap.exists()) {
          const data = snap.data() as TripMeta
          setMeta(data)
          setDayRates(data.dayRates ?? {})
          setDayBudgets(data.dayBudgets ?? {})
          if (data.joinPin) setJoinPinInput(data.joinPin)
          return
        }
        /* 이 유저의 trips에 없으면 초대된 여행인지 확인 */
        const invSnap = await getDoc(doc(db, 'users', uid, 'invitedTrips', tripId))
        if (invSnap.exists()) {
          const { viewCode } = invSnap.data() as { viewCode: string }
          router.replace(`/share/${viewCode}`)
          return
        }
        /* 어디도 해당 없으면 목록으로 */
        router.replace('/trips')
      } catch {
        router.replace('/trips')
      } finally {
        setMetaLoading(false)
      }
    }
    load()
  }, [uid, tripId])

  /* ── shareIndex 지연 등록 (기존 여행 마이그레이션 포함) ── */
  useEffect(() => {
    if (!meta) return
    setDoc(doc(db, 'shareIndex', meta.viewCode), { uid, tripId, canEdit: false })
    setDoc(doc(db, 'shareIndex', meta.editCode), { uid, tripId, canEdit: true })
    if (meta.joinCode) {
      setDoc(doc(db, 'shareIndex', meta.joinCode), { uid, tripId, canEdit: true, type: 'join', ...(meta.joinPin ? { pin: meta.joinPin } : {}) })
    }
  }, [meta?.viewCode, meta?.editCode, meta?.joinCode, meta?.joinPin])

  /* ── 오너 이름 동기화: displayName이 있으면 '나' 플레이스홀더 덮어쓰기 ── */
  useEffect(() => {
    if (!meta || !user?.displayName) return
    const owner = (meta.members ?? []).find(m => m.role === 'owner')
    if (!owner || owner.name === user.displayName) return
    const updated = meta.members.map(m =>
      m.role === 'owner' ? { ...m, name: user.displayName! } : m
    )
    setMeta(prev => prev ? { ...prev, members: updated } : prev)
    updateDoc(doc(db, 'users', uid, 'trips', tripId), { members: updated }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.members?.find(m => m.role === 'owner')?.name, user?.displayName])

  /* ── 통화 감지 & 환율 로드 ── */
  const tripCurrencies = useMemo(
    () => {
      if (meta?.currency) return [meta.currency]
      return meta ? detectCurrencies(meta.city) : ['KRW']
    },
    [meta]
  )
  const primaryCurrency = tripCurrencies[0]

  useEffect(() => {
    if (primaryCurrency === 'KRW') return
    getRatesInKRW().then(setRates)
  }, [primaryCurrency])

  /* ── 날짜 목록 (메타에서 계산) ── */
  const days: Day[] = useMemo(
    () => meta ? buildDaysFromMeta(meta) : [],
    [meta]
  )

  /* ── 당일 자동 선택 (여행 기간 내인 경우에만, 아니면 전체 유지) ── */
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (!days.length || autoSelectedRef.current) return
    autoSelectedRef.current = true
    const today = new Date().toISOString().slice(0, 10)
    const idx   = days.findIndex(d => d.date === today)
    if (idx !== -1) setActiveDayIdx(idx)
    // 여행 기간이 아니면 -1(전체) 유지
  }, [days])

  /* ── owner photoURL Firestore 동기화 (1회) ── */
  useEffect(() => {
    if (!meta || !user?.photoURL) return
    const owner = meta.members?.find(m => m.role === 'owner')
    if (!owner || owner.photoURL === user.photoURL) return
    const updated = meta.members.map(m =>
      m.role === 'owner' ? { ...m, photoURL: user.photoURL! } : m
    )
    updateDoc(doc(db, 'users', uid, 'trips', tripId), { members: updated }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.members?.find(m => m.role === 'owner')?.photoURL, user?.photoURL])

  /* ── 전체 Day items 1회 로드 ── */
  useEffect(() => {
    if (!days.length) return
    Promise.all(
      days.map(day =>
        getDocs(collection(db, 'users', uid, 'trips', tripId, 'days', day.dayId, 'items'))
          .then(snap => ({
            dayId:     day.dayId,
            items:     snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanItem[],
            fromCache: snap.metadata.fromCache,
            empty:     snap.empty,
          }))
      )
    ).then(results => {
      setDayItems(prev => {
        const next = { ...prev }
        results.forEach(r => {
          if (r.empty && r.fromCache) return  // 빈 캐시 결과 무시
          next[r.dayId] = r.items
        })
        return next
      })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length, uid, tripId])

  /* ── 활성 Day items만 실시간 구독 ── */
  useEffect(() => {
    if (!days.length) return
    const day = days[activeDayIdx]
    if (!day) return

    Object.values(unsubsRef.current).forEach(u => u())
    unsubsRef.current = {}

    const col = collection(db, 'users', uid, 'trips', tripId, 'days', day.dayId, 'items')
    const unsub = onSnapshot(col, snap => {
      // 캐시 미스 직후 빈 스냅샷 무시 — 서버 데이터가 곧 도착하므로 마커 깜빡임 방지
      if (snap.empty && snap.metadata.fromCache) return
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanItem[]
      setDayItems(prev => ({ ...prev, [day.dayId]: items }))
    })
    unsubsRef.current[day.dayId] = unsub

    return () => { Object.values(unsubsRef.current).forEach(u => u()) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDayIdx, uid, tripId])

  const activeDay    = days[activeDayIdx]
  const currentItems = activeDay ? (dayItems[activeDay.dayId] ?? []) : []
  const ownerId      = (meta?.members ?? []).find(m => m.role === 'owner')?.id ?? uid

  /* 공지사항 로드 */
  useEffect(() => {
    if (!showNotice) return
    setNoticesLoading(true)
    getDocs(query(
      collection(db, 'users', ownerId, 'trips', tripId, 'notices'),
      orderBy('createdAt', 'desc'),
    )).then(snap => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as NoticeItem)))
    }).catch(() => {}).finally(() => setNoticesLoading(false))
  }, [showNotice, ownerId, tripId])

  /* ?notice=1 쿼리로 진입 시 공지 패널 자동 오픈 */
  useEffect(() => {
    if (searchParams.get('notice') !== '1') return
    setNoticeComposing(false)
    setNoticeEditId(null)
    setNoticeInput('')
    setShowNotice(true)
    router.replace(`/trips/${tripId}`, { scroll: false })
  }, [searchParams, tripId, router])

  // 정산 포함 고정비용 (예산 바 제외, 정산 팝업에만 반영)
  const settlementFixedKRW = useMemo(() => {
    const flightsKRW = (meta?.flights ?? []).reduce(
      (s, f) => s + (f.price && f.includeInSettlement ? toKRW(f.price, f.currency ?? 'KRW', rates) : 0), 0
    )
    const accKRW = (meta?.accommodations ?? []).reduce(
      (s, a) => s + (a.price && a.includeInSettlement ? toKRW(a.price, a.currency ?? 'KRW', rates) : 0), 0
    )
    return flightsKRW + accKRW
  }, [meta?.flights, meta?.accommodations, rates])

  // totalSpent = 일정 항목만 (예산 바용)
  const totalSpent = useMemo(
    () => Object.values(dayItems).flat().reduce((s, i) => s + toKRW(i.price, i.currency, rates), 0),
    [dayItems, rates]
  )
  const perPersonSpent = useMemo(
    () => Object.values(dayItems).flat().reduce(
      (s, i) => {
        const count = i.participantIds?.length ?? i.participants ?? meta?.people ?? 1
        return s + toKRW(i.price, i.currency, rates) / count
      },
      0
    ),
    [dayItems, rates, meta]
  )

  const memberSpent = useMemo(() => {
    if (!meta?.members?.length) return {} as Record<string, number>
    const result: Record<string, number> = {}
    meta.members.forEach(m => { result[m.id] = 0 })
    Object.entries(dayItems).forEach(([dayId, items]) => {
      const custom = primaryCurrency !== 'KRW' ? dayRates[dayId] : undefined
      const r = custom ? { ...rates, [primaryCurrency]: custom } : rates
      items.forEach(item => {
      const krw = toKRW(item.price || 0, item.currency || 'KRW', r)
      if (!krw || krw <= 0) return
      const allIds   = item.participantIds ?? []
      const validIds = allIds.filter(id => result[id] !== undefined)
      if (allIds.length > 0) {
        const divisor = validIds.length > 0 ? validIds.length : allIds.length
        const share = krw / divisor
        validIds.forEach(id => { result[id] += share })
      } else {
        const share = krw / meta.members.length
        meta.members.forEach(m => { result[m.id] += share })
      }
      })
    })
    // 비행기: participantIds 기반 분배
    const activeIds = new Set(meta.members.filter(m => !m.left).map(m => m.id));
    (meta.flights ?? []).forEach(f => {
      if (!f.price || !f.includeInSettlement) return
      const krw = toKRW(f.price, f.currency ?? 'KRW', rates)
      const pIds = (f.participantIds ?? []).filter(id => activeIds.has(id))
      if (pIds.length > 0) {
        const share = krw / pIds.length
        pIds.forEach(id => { result[id] = (result[id] ?? 0) + share })
      } else {
        const share = krw / meta.members.length
        meta.members.forEach(m => { result[m.id] += share })
      }
    });
    // 숙소: participantIds 기반 분배
    (meta.accommodations ?? []).forEach(a => {
      if (!a.price || !a.includeInSettlement) return
      const krw = toKRW(a.price, a.currency ?? 'KRW', rates)
      const pIds = (a.participantIds ?? []).filter(id => activeIds.has(id))
      if (pIds.length > 0) {
        const share = krw / pIds.length
        pIds.forEach(id => { result[id] = (result[id] ?? 0) + share })
      } else {
        const share = krw / meta.members.length
        meta.members.forEach(m => { result[m.id] += share })
      }
    })
    return result
  }, [dayItems, rates, meta])

  const hasUnevenParticipants = useMemo(() => {
    const amounts = Object.values(memberSpent)
    if (amounts.length <= 1) return false
    const first = amounts[0]
    return amounts.some(a => Math.abs(a - first) > 1)
  }, [memberSpent])

  /* 결제자별 실제 결제 금액 합산 (일정 항목 + 비행기 + 숙소) */
  const memberPaid = useMemo(() => {
    if (!meta?.members?.length) return {} as Record<string, number>
    const result: Record<string, number> = {}
    meta.members.forEach(m => { result[m.id] = 0 })
    const ownerIdForPaid = (meta.members ?? []).find(m => m.role === 'owner')?.id ?? uid
    Object.entries(dayItems).forEach(([dayId, items]) => {
      const custom = primaryCurrency !== 'KRW' ? dayRates[dayId] : undefined
      const r = custom ? { ...rates, [primaryCurrency]: custom } : rates
      items.forEach(item => {
        const pid = item.payerId ?? ownerIdForPaid
        if (result[pid] === undefined) return
        result[pid] += toKRW(item.price || 0, item.currency || 'KRW', r)
      })
    });
    (meta.flights ?? []).forEach(f => {
      if (!f.price || !f.includeInSettlement) return
      const pid = f.payerId ?? ownerIdForPaid
      if (result[pid] === undefined) return
      result[pid] += toKRW(f.price, f.currency ?? 'KRW', rates)
    });
    (meta.accommodations ?? []).forEach(a => {
      if (!a.price || !a.includeInSettlement) return
      const pid = a.payerId ?? ownerIdForPaid
      if (result[pid] === undefined) return
      result[pid] += toKRW(a.price, a.currency ?? 'KRW', rates)
    })
    return result
  }, [dayItems, rates, meta?.members, meta?.flights, meta?.accommodations])

  /* 멤버별 결제 항목 목록 (정산 팝업 아코디언용) */
  type PaidItemEntry = { type: 'item' | 'flight' | 'acc'; name: string; krw: number; perPersonKrw: number; participantCount: number }
  const memberPaidItems = useMemo(() => {
    if (!meta?.members?.length) return {} as Record<string, PaidItemEntry[]>
    const result: Record<string, PaidItemEntry[]> = {}
    meta.members.forEach(m => { result[m.id] = [] })
    const totalActive = meta.members.filter(m => !m.left).length
    const activeSet   = new Set(meta.members.filter(m => !m.left).map(m => m.id))

    const ownerIdForItems = meta.members.find(m => m.role === 'owner')?.id ?? ''
    Object.values(dayItems).flat().forEach(item => {
      const pid = item.payerId ?? ownerIdForItems
      if (!result[pid]) return
      const krw = toKRW(item.price || 0, item.currency || 'KRW', rates)
      if (!krw) return
      const validIds = (item.participantIds ?? []).filter(id => activeSet.has(id))
      const participantCount = validIds.length > 0 ? validIds.length : (item.participantIds?.length ? item.participantIds.length : totalActive)
      result[pid].push({ type: 'item', name: item.name, krw, perPersonKrw: krw / participantCount, participantCount })
    });
    (meta.flights ?? []).forEach(f => {
      if (!f.price || !f.includeInSettlement) return
      const pid = f.payerId ?? ownerIdForItems
      if (!result[pid]) return
      const krw = toKRW(f.price, f.currency ?? 'KRW', rates)
      const pIds = (f.participantIds ?? []).filter(id => activeSet.has(id))
      const participantCount = pIds.length > 0 ? pIds.length : totalActive
      result[pid].push({ type: 'flight', name: f.name, krw, perPersonKrw: krw / participantCount, participantCount })
    });
    (meta.accommodations ?? []).forEach(a => {
      if (!a.price || !a.includeInSettlement) return
      const pid = a.payerId ?? ownerIdForItems
      if (!result[pid]) return
      const krw = toKRW(a.price, a.currency ?? 'KRW', rates)
      const pIds = (a.participantIds ?? []).filter(id => activeSet.has(id))
      const participantCount = pIds.length > 0 ? pIds.length : totalActive
      result[pid].push({ type: 'acc', name: a.name, krw, perPersonKrw: krw / participantCount, participantCount })
    })
    return result
  }, [dayItems, rates, meta])

  /* 멤버별 참여 항목 목록 (정산 팝업 아코디언 👥 섹션용) */
  const memberParticipatedItems = useMemo(() => {
    if (!meta?.members?.length) return {} as Record<string, PaidItemEntry[]>
    const result: Record<string, PaidItemEntry[]> = {}
    meta.members.forEach(m => { result[m.id] = [] })
    const activeSet = new Set(meta.members.filter(m => !m.left).map(m => m.id))

    Object.values(dayItems).flat().forEach(item => {
      if (!item.price) return
      const krw = toKRW(item.price || 0, item.currency || 'KRW', rates)
      if (!krw) return
      const validIds = (item.participantIds ?? []).filter(id => activeSet.has(id))
      const participantIds = validIds.length > 0 ? validIds : [...activeSet]
      const participantCount = participantIds.length
      participantIds.forEach(id => {
        if (!result[id]) return
        result[id].push({ type: 'item', name: item.name, krw, perPersonKrw: krw / participantCount, participantCount })
      })
    });
    (meta.flights ?? []).forEach(f => {
      if (!f.price || !f.includeInSettlement) return
      const krw = toKRW(f.price, f.currency ?? 'KRW', rates)
      const pIds = (f.participantIds ?? []).filter(id => activeSet.has(id))
      const participantIds = pIds.length > 0 ? pIds : [...activeSet]
      const participantCount = participantIds.length
      participantIds.forEach(id => {
        if (!result[id]) return
        result[id].push({ type: 'flight', name: f.name, krw, perPersonKrw: krw / participantCount, participantCount })
      })
    });
    (meta.accommodations ?? []).forEach(a => {
      if (!a.price || !a.includeInSettlement) return
      const krw = toKRW(a.price, a.currency ?? 'KRW', rates)
      const pIds = (a.participantIds ?? []).filter(id => activeSet.has(id))
      const participantIds = pIds.length > 0 ? pIds : [...activeSet]
      const participantCount = participantIds.length
      participantIds.forEach(id => {
        if (!result[id]) return
        result[id].push({ type: 'acc', name: a.name, krw, perPersonKrw: krw / participantCount, participantCount })
      })
    })
    return result
  }, [dayItems, rates, meta])

  /* 결제 집계 대상 항목 수 (방장 기본 결제자이므로 가격 있는 모든 항목 포함) */
  const paidItemCount = useMemo(() => {
    const itemCount   = Object.values(dayItems).flat().filter(i => i.price > 0).length
    const flightCount = (meta?.flights ?? []).filter(f => f.price && f.includeInSettlement).length
    const accCount    = (meta?.accommodations ?? []).filter(a => a.price && a.includeInSettlement).length
    return itemCount + flightCount + accCount
  }, [dayItems, meta?.flights, meta?.accommodations])

  /* 최소 이체 계산 — 순잔액(paid - spent) 기반 greedy */
  const settlementTransfers = useMemo(() => {
    if (!meta?.members?.length || paidItemCount === 0) return []
    const net: Record<string, number> = {}
    meta.members.forEach(m => {
      net[m.id] = Math.round((memberPaid[m.id] ?? 0) - (memberSpent[m.id] ?? 0))
    })
    const creditors = Object.entries(net).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1])
    const debtors   = Object.entries(net).filter(([, v]) => v < -1).sort((a, b) => a[1] - b[1])
    const transfers: { from: string; to: string; amount: number }[] = []
    let ci = 0, di = 0
    const cAmts = creditors.map(([, v]) => v)
    const dAmts  = debtors.map(([, v]) => v)
    while (ci < creditors.length && di < debtors.length) {
      const amount = Math.min(cAmts[ci], -dAmts[di])
      if (amount > 0) transfers.push({ from: debtors[di][0], to: creditors[ci][0], amount })
      cAmts[ci] -= amount
      dAmts[di]  += amount
      if (cAmts[ci] < 1) ci++
      if (-dAmts[di] < 1) di++
    }
    return transfers
  }, [meta?.members, memberPaid, memberSpent, paidItemCount])

  /* 정산 모달이 열릴 때 모든 Day 데이터 최신화 */
  useEffect(() => {
    if (!showSettlement || !days.length) return
    // 게스트도 방장의 Firestore 경로에서 읽어야 아이템이 있음
    const fetchUid = ownerId || uid
    Promise.all(
      days.map(day =>
        getDocs(collection(db, 'users', fetchUid, 'trips', tripId, 'days', day.dayId, 'items'))
          .then(snap => ({
            dayId:     day.dayId,
            items:     snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanItem[],
            empty:     snap.empty,
            fromCache: snap.metadata.fromCache,
          }))
      )
    ).then(results => {
      setDayItems(prev => {
        const next = { ...prev }
        results.forEach(r => {
          if (r.empty && r.fromCache) return
          // 아이템이 있을 때만 덮어씀 — 빈 결과로 기존 데이터를 지우지 않음
          // (활성 Day의 실시간 리스너가 삭제 동기화를 담당)
          if (r.items.length > 0) next[r.dayId] = r.items
        })
        return next
      })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettlement])

  const avgPerPerson = (meta?.members?.length ?? 1) > 1 && totalSpent > 0
    ? totalSpent / (meta?.members?.length ?? 1)
    : 0

  /* 일별 지출 합계 (탭 표시용) */
  const daySpentMap = useMemo(() => {
    const map: Record<string, number> = {}
    days.forEach(d => {
      const items = dayItems[d.dayId] ?? []
      const custom = primaryCurrency !== 'KRW' ? dayRates[d.dayId] : undefined
      const r = custom ? { ...rates, [primaryCurrency]: custom } : rates
      map[d.dayId] = items.reduce((s, i) => s + toKRW(i.price, i.currency, r), 0)
    })
    return map
  }, [dayItems, rates, dayRates, primaryCurrency, days])

  /* 현재 Day의 유효 환율 (고정값 우선, 없으면 실시간) */
  const effectiveRates = useMemo(() => {
    if (primaryCurrency === 'KRW' || !activeDay) return rates
    const custom = dayRates[activeDay.dayId]
    return custom ? { ...rates, [primaryCurrency]: custom } : rates
  }, [rates, dayRates, activeDay, primaryCurrency])

  const daySpent = currentItems.reduce((s, i) => s + toKRW(i.price, i.currency, effectiveRates), 0)
  const rawBudgetPct = meta ? Math.round((totalSpent / (meta.budget || 1)) * 100) : 0
  const budgetPct    = Math.min(100, rawBudgetPct)
  const overageKRW   = meta && rawBudgetPct > 100 ? totalSpent - meta.budget : 0

  /* ── 아이템 추가 ── */
  const handleAdd = async (partial: Omit<PlanItem, 'id' | 'order'>) => {
    if (!activeDay || !meta) return
    const tempId = `temp_${Date.now()}`
    const newItem: PlanItem = { ...partial, id: tempId, order: currentItems.length } as PlanItem
    setDayItems(prev => ({ ...prev, [activeDay.dayId]: [...(prev[activeDay.dayId] ?? []), newItem] }))
    await setDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId),
      { label: activeDay.label, date: activeDay.date },
      { merge: true }
    )
    const ref = await addDoc(
      collection(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items'),
      { ...partial, order: currentItems.length, createdAt: serverTimestamp() }
    )
    /* temp ID → 실제 Firestore ID로 즉시 교체 (onSnapshot 대기 없이 수정 가능하도록) */
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: (prev[activeDay.dayId] ?? []).map(i =>
        i.id === tempId ? { ...i, id: ref.id } : i
      ),
    }))
    /* 멤버들에게 알림 */
    notifyTripMembers({
      ownerUid: uid,
      members:  meta.members ?? [],
      actorUid: user?.uid ?? null,
      title:    `${user?.displayName ?? '방장'}이(가) 일정을 추가했습니다`,
      body:     `${meta.title || meta.city} · ${partial.name}`,
      tripPath: `/trips/${tripId}`,
      viewCode: meta.viewCode,
    })
  }

  /* ── 아이템 삭제 ── */
  const handleDelete = async (itemId: string) => {
    if (!activeDay || !meta) return
    const itemName = (dayItems[activeDay.dayId] ?? []).find(i => i.id === itemId)?.name ?? ''
    setDayItems(prev => ({ ...prev, [activeDay.dayId]: (prev[activeDay.dayId] ?? []).filter(i => i.id !== itemId) }))
    await deleteDoc(doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId))
    notifyTripMembers({
      ownerUid: uid,
      members:  meta.members ?? [],
      actorUid: user?.uid ?? null,
      title:    `${user?.displayName ?? '방장'}이(가) 일정을 삭제했습니다`,
      body:     `${meta.title || meta.city} · ${itemName}`,
      tripPath: `/trips/${tripId}`,
      viewCode: meta.viewCode,
    })
  }

  /* ── 아이템 수정 (범용) ── */
  const handleUpdate = async (itemId: string, updates: Partial<Omit<PlanItem, 'id' | 'order'>>) => {
    if (!activeDay || !meta) return
    const itemName = updates.name ?? (dayItems[activeDay.dayId] ?? []).find(i => i.id === itemId)?.name ?? ''
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: (prev[activeDay.dayId] ?? []).map(i => i.id === itemId ? { ...i, ...updates } : i),
    }))
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId),
      updates
    )
    notifyTripMembers({
      ownerUid: uid,
      members:  meta.members ?? [],
      actorUid: user?.uid ?? null,
      title:    `${user?.displayName ?? '방장'}이(가) 일정을 수정했습니다`,
      body:     `${meta.title || meta.city} · ${itemName}`,
      tripPath: `/trips/${tripId}`,
      viewCode: meta.viewCode,
    })
  }

  /* ── 카테고리 빠른 변경 ── */
  const handleChangeCat = async (itemId: string, cat: Category) => {
    if (!activeDay) return
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId),
      { cat }
    )
  }

  /* ── 드래그 후 순서 변경 (시간대 간 이동 포함) ── */
  const handleReorder = async (activeId: string, overId: string) => {
    if (!activeDay) return
    const sorted   = [...currentItems].sort((a, b) => a.order - b.order)
    const oldIdx   = sorted.findIndex(i => i.id === activeId)
    const newIdx   = sorted.findIndex(i => i.id === overId)
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return

    const draggedItem = sorted[oldIdx]
    const targetItem  = sorted[newIdx]

    /* cross-slot: 슬롯 변경만 수행, arrayMove 금지 (교체 버그 방지) */
    if (draggedItem.timeSlot !== targetItem.timeSlot) {
      await handleMoveToSlot(activeId, targetItem.timeSlot as TimeSlot)
      return
    }

    /* same-slot: 순서 변경 */
    const reordered = arrayMove(sorted, oldIdx, newIdx)
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: reordered.map((item, idx) => ({ ...item, order: idx })),
    }))
    const batch = writeBatch(db)
    reordered.forEach((item, idx) => {
      batch.update(
        doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', item.id),
        { order: idx }
      )
    })
    await batch.commit()
  }

  /* ── 빈 슬롯으로 드롭 시 시간대만 변경 ── */
  const handleMoveToSlot = async (activeId: string, targetSlot: TimeSlot) => {
    if (!activeDay) return
    const item = currentItems.find(i => i.id === activeId)
    if (!item || item.timeSlot === targetSlot) return
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: (prev[activeDay.dayId] ?? []).map(i =>
        i.id === activeId ? { ...i, timeSlot: targetSlot } : i
      ),
    }))
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', activeId),
      { timeSlot: targetSlot }
    )
  }

  /* ── 일별 환율 고정 ── */
  const handleSetDayRate = async (dayId: string, rate: number | null) => {
    const next = { ...dayRates }
    if (rate === null || rate <= 0) delete next[dayId]
    else next[dayId] = rate
    setDayRates(next)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { dayRates: next })
  }

  /* ── 별점 (멤버별 개인 투표 → ratings.{uid}) ── */
  const handleRate = async (itemId: string, stars: number) => {
    if (!activeDay) return
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: (prev[activeDay.dayId] ?? []).map(i =>
        i.id !== itemId ? i : { ...i, ratings: { ...(i.ratings ?? {}), [uid]: stars } }
      ),
    }))
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId),
      { [`ratings.${uid}`]: stars }
    )
  }

  /* ── 사진 즉시 업로드 (아이템 행 카메라 아이콘 클릭) ── */
  const handleUploadReceipts = async (itemId: string, files: FileList) => {
    if (!activeDay || !files.length) return
    const item = currentItems.find(i => i.id === itemId)
    if (!item) return
    const existing = item.receipts ?? []
    const canAdd = 3 - existing.length
    if (canAdd <= 0) return
    const toUpload = Array.from(files).slice(0, canAdd)
    const [{ storage }, { ref: sRef, uploadBytes, getDownloadURL }] = await Promise.all([
      import('@/lib/firebase'),
      import('firebase/storage'),
    ])
    const ts = Date.now()
    const newURLs: string[] = []
    await Promise.all(toUpload.map(async (file, i) => {
      const blob = await compressImage(file)
      const r = sRef(storage, `users/${uid}/trips/${tripId}/receipts/${ts}_${i}.jpg`)
      await uploadBytes(r, blob)
      newURLs.push(await getDownloadURL(r))
    }))
    const updatedReceipts = [...existing, ...newURLs]
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId),
      { receipts: updatedReceipts }
    )
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: (prev[activeDay.dayId] ?? []).map(i =>
        i.id === itemId ? { ...i, receipts: updatedReceipts } : i
      ),
    }))
  }

  /* ── 비행기 / 숙소 고정 일정 ── */
  const handleAddFlight = async (fs: Omit<FlightItem, 'id'>[]) => {
    if (!meta) return
    const newFlights: FlightItem[] = fs.map(f => ({ ...f, id: generateCode(8) }))
    const flights = [...(meta.flights ?? []), ...newFlights]
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { flights })
    setMeta({ ...meta, flights })
  }

  const handleDeleteFlight = async (id: string) => {
    if (!meta) return
    const flights = (meta.flights ?? []).filter(f => f.id !== id)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { flights })
    setMeta({ ...meta, flights })
  }

  const handleAddAccommodation = async (a: Omit<AccommodationItem, 'id'>) => {
    if (!meta) return
    const newAcc: AccommodationItem = { ...a, id: generateCode(8) }
    const accommodations = [...(meta.accommodations ?? []), newAcc]
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { accommodations })
    setMeta({ ...meta, accommodations })
  }

  const handleDeleteAccommodation = async (id: string) => {
    if (!meta) return
    const accommodations = (meta.accommodations ?? []).filter(a => a.id !== id)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { accommodations })
    setMeta({ ...meta, accommodations })
  }

  const handleUpdateFlight = async (updated: FlightItem) => {
    if (!meta) return
    const flights = (meta.flights ?? []).map(f => f.id === updated.id ? updated : f)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { flights })
    setMeta({ ...meta, flights })
    setEditingFlight(null)
  }

  const handleUpdateAccommodation = async (updated: AccommodationItem) => {
    if (!meta) return
    const accommodations = (meta.accommodations ?? []).map(a => a.id === updated.id ? updated : a)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { accommodations })
    setMeta({ ...meta, accommodations })
    setEditingAcc(null)
  }

  /* ── 멤버 관리 ── */
  const copyLink = async (type: 'view' | 'edit') => {
    if (!meta) return
    const code = type === 'view' ? meta.viewCode : meta.editCode
    const url  = `${window.location.origin}/share/${code}`
    await navigator.clipboard.writeText(url)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const saveJoinPin = async (pin: string) => {
    if (!meta || pin.length !== 4) return
    const code = meta.joinCode ?? generateCode(10)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { joinCode: code, joinPin: pin })
    await setDoc(doc(db, 'shareIndex', code), { uid, tripId, canEdit: true, type: 'join', pin })
    setMeta(prev => prev ? { ...prev, joinCode: code, joinPin: pin } : prev)
    setPinSaved(true)
    setTimeout(() => setPinSaved(false), 2000)
  }

  const copyJoinLink = async () => {
    if (!meta) return
    let code = meta.joinCode
    if (!code) {
      code = generateCode(10)
      await updateDoc(doc(db, 'users', uid, 'trips', tripId), { joinCode: code })
      await setDoc(doc(db, 'shareIndex', code), { uid, tripId, canEdit: true, type: 'join', ...(meta.joinPin ? { pin: meta.joinPin } : {}) })
      setMeta(prev => prev ? { ...prev, joinCode: code! } : prev)
    }
    const url = `${window.location.origin}/share/${code}`
    await navigator.clipboard.writeText(url)
    setCopied('join')
    setTimeout(() => setCopied(null), 2000)
  }

  const addMember = async () => {
    if (!newMemberName.trim() || !meta) return
    const activeCount = (meta.members ?? []).filter(m => !m.left).length
    if (activeCount >= (meta.people || 1)) return
    const members = [...(meta.members ?? []), {
      id: generateCode(6), name: newMemberName.trim(), role: 'member' as const,
    }]
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { members })
    setMeta({ ...meta, members })
    setNewMemberName('')
  }

  const removeMember = async (id: string) => {
    if (!meta) return
    if (!window.confirm('멤버를 삭제하시겠습니까?')) return
    const removed = meta.members.find(m => m.id === id)
    const members = meta.members.filter(m => m.id !== id)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { members })
    setMeta({ ...meta, members })
    /* 제외된 멤버에게 알림 (클릭 시 이동 없음) */
    if (removed && removed.id.length >= 15) {
      addDoc(collection(db, 'users', removed.id, 'messages'), {
        title: '여행에서 제외되었습니다',
        body:  meta.title || meta.city,
        type:  'trip',
        tripPath: null,
        read:  false,
        createdAt: serverTimestamp(),
      }).catch(() => {})
    }
  }

  const setTreasurer = async (id: string) => {
    if (!meta) return
    const isAlready = meta.members.find(m => m.id === id)?.role === 'treasurer'
    const members = meta.members.map(m => ({
      ...m,
      role: m.role === 'owner' ? 'owner' as const
          : m.id === id ? (isAlready ? 'member' as const : 'treasurer' as const)
          : m.role as MemberRole,
    }))
    const needNewCode = !isAlready && !meta.editCode
    const newEditCode = needNewCode ? generateCode() : meta.editCode
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), {
      members,
      ...(needNewCode ? { editCode: newEditCode } : {}),
    })
    if (needNewCode && newEditCode) {
      await setDoc(doc(db, 'shareIndex', newEditCode), { uid, tripId, canEdit: true })
    }
    setMeta({ ...meta, members, ...(needNewCode ? { editCode: newEditCode } : {}) })
  }

  const setMemberColor = async (memberId: string, colorIndex: number) => {
    if (!meta) return
    const members = meta.members.map(m => {
      if (m.id !== memberId) return m
      const { hexColor: _h, ...rest } = m
      return { ...rest, colorIndex }
    })
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { members })
    setMeta({ ...meta, members })
  }

  const setMemberCustomColor = async (memberId: string, hex: string) => {
    if (!meta) return
    const members = meta.members.map(m => {
      if (m.id !== memberId) return m
      const { colorIndex: _c, ...rest } = m
      return { ...rest, hexColor: hex }
    })
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { members })
    setMeta({ ...meta, members })
  }


  /* ── 수정 모달 자동완성 (비행기) ── */
  useEffect(() => {
    if (!editingFlight) return
    let ac: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!editFlightInputRef.current) return
      ac = new google.maps.places.Autocomplete(editFlightInputRef.current, {
        fields: ['name', 'geometry'], types: ['airport'],
      })
      ac.addListener('place_changed', () => {
        const p = ac!.getPlace()
        if (!p.name) return
        const lat = p.geometry?.location?.lat()
        const lng = p.geometry?.location?.lng()
        setEditingFlight(prev => prev ? {
          ...prev,
          name: p.name!,
          ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
        } : prev)
      })
    }).catch(() => {})
    return () => { if (ac) google.maps.event.clearInstanceListeners(ac) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingFlight?.id])

  useEffect(() => {
    setShowPayerFlight(!!editingFlight?.payerId)
    setShowParticipantsFlight(!!(editingFlight?.participantIds?.length))
  }, [editingFlight?.id])

  /* ── 수정 모달 자동완성 (숙소) ── */
  useEffect(() => {
    if (!editingAcc) return
    let ac: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!editAccInputRef.current) return
      ac = new google.maps.places.Autocomplete(editAccInputRef.current, {
        fields: ['name', 'geometry'], types: ['lodging'],
      })
      ac.addListener('place_changed', () => {
        const p = ac!.getPlace()
        if (!p.name) return
        const lat = p.geometry?.location?.lat()
        const lng = p.geometry?.location?.lng()
        setEditingAcc(prev => prev ? {
          ...prev,
          name: p.name!,
          ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
        } : prev)
      })
    }).catch(() => {})
    return () => { if (ac) google.maps.event.clearInstanceListeners(ac) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAcc?.id])

  useEffect(() => {
    setShowPayerAcc(!!editingAcc?.payerId)
    setShowParticipantsAcc(!!(editingAcc?.participantIds?.length))
  }, [editingAcc?.id])

  /* ── 여행 정보 편집 ── */
  const openEdit = () => setShowEdit(true)

  /* ── 체크리스트 ── */
  const checkItems = meta?.checklist ?? []

  const toggleCheck = async (id: string) => {
    if (!meta) return
    const checklist = checkItems.map(c => c.id === id ? { ...c, done: !c.done } : c)
    setMeta({ ...meta, checklist })
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist })
  }

  const addCheckItem = async () => {
    if (!checkInput.trim() || !meta) return
    const label = checkInput.trim()
    const checklist = [...checkItems, { id: `${Date.now()}`, label, done: false }]
    setMeta({ ...meta, checklist })
    setCheckInput('')
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist })
    notifyTripMembers({
      ownerUid: uid,
      members:  meta.members ?? [],
      actorUid: user?.uid ?? null,
      title:    `${user?.displayName ?? '방장'}이(가) 체크리스트를 추가했습니다`,
      body:     `${meta.title || meta.city} · ${label}`,
      tripPath: `/trips/${tripId}`,
      viewCode: meta.viewCode,
    })
  }

  const deleteCheckItem = async (id: string) => {
    if (!meta) return
    const checklist = checkItems.filter(c => c.id !== id)
    setMeta({ ...meta, checklist })
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist })
  }

  const saveCheckEdit = async (id: string) => {
    if (!checkEditVal.trim() || !meta) return
    const checklist = checkItems.map(c => c.id === id ? { ...c, label: checkEditVal.trim() } : c)
    setMeta({ ...meta, checklist })
    setCheckEditId(null)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist })
  }

  const loadChecklistDefaults = async (type: 'domestic' | 'overseas') => {
    if (!meta) return
    const labels = type === 'domestic' ? DOMESTIC_DEFAULTS : OVERSEAS_DEFAULTS
    const checklist: CheckItem[] = labels.map((label, i) => ({ id: `${Date.now()}_${i}`, label, done: false }))
    setMeta({ ...meta, checklist })
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist })
  }

  /* 시간대 순 정렬된 그룹 */
  const grouped = useMemo(() => {
    const g: Record<TimeSlot, PlanItem[]> = { 아침: [], 점심: [], 저녁: [], 미정: [] }
    currentItems.forEach(i => g[i.timeSlot as TimeSlot]?.push(i))
    Object.keys(g).forEach(k => g[k as TimeSlot].sort((a, b) => a.order - b.order))
    return g
  }, [currentItems])

  /* 지도에 넘길 아이템 (순서대로) */
  const mapItems = useMemo<MapItem[]>(() => {
    const sorted = [...currentItems].sort((a, b) => {
      const slotOrder: Record<TimeSlot, number> = { 아침: 0, 점심: 1, 저녁: 2, 미정: 3 }
      const sd = slotOrder[a.timeSlot] - slotOrder[b.timeSlot]
      return sd !== 0 ? sd : a.order - b.order
    })
    const items: MapItem[] = sorted.map(i => ({ id: i.id, name: i.name, lat: i.lat, lng: i.lng, timeSlot: i.timeSlot, cat: i.cat }))

    const adId = activeDay?.dayId
    if (adId && meta) {
      /* 비행기 마커 */
      for (const f of (meta.flights ?? [])) {
        if (f.dayId === adId && f.lat && f.lng) {
          items.push({ id: f.id, name: f.name, lat: f.lat, lng: f.lng ?? 0, timeSlot: '비행기', markerType: 'special' })
        }
      }
      /* 숙소 마커 (체크인/체크아웃 날짜) */
      for (const acc of (meta.accommodations ?? [])) {
        if (!acc.lat || !acc.lng) continue
        if (acc.checkInDayId === adId) {
          items.push({ id: `${acc.id}_in`, name: acc.name, lat: acc.lat, lng: acc.lng, timeSlot: '숙소', markerType: 'special' })
        } else if (acc.checkOutDayId === adId) {
          // 체크아웃 날도 _in id 사용 — markerMapRef에 _in으로 등록된 마커로 포커스
          items.push({ id: `${acc.id}_in`, name: acc.name, lat: acc.lat, lng: acc.lng, timeSlot: '숙소', markerType: 'special' })
        }
      }
    }
    return items
  }, [currentItems, activeDay?.dayId, meta?.flights, meta?.accommodations])

  /* 아이템 ID → 지도 마커 번호 (1-based) — TripMap과 동일하게 유효 좌표만 카운트 */
  const mapIndexMap = useMemo(() => {
    const m: Record<string, number> = {}
    let n = 0
    mapItems.forEach(item => {
      if (item.markerType === 'special') return
      const lat = Number(item.lat), lng = Number(item.lng)
      if (isFinite(lat) && isFinite(lng) && (lat !== 0 || lng !== 0)) m[item.id] = ++n
    })
    return m
  }, [mapItems])

  /* 전체 Day 그룹 (multi-day 지도용) */
  const allDayGroups = useMemo<DayGroup[]>(() => {
    if (!days.length || !meta) return []
    const slotOrder: Record<string, number> = { 아침: 0, 점심: 1, 저녁: 2, 미정: 3 }
    return days.map((day, idx) => {
      const color = DAY_COLORS[idx % DAY_COLORS.length]
      const raw = (dayItems[day.dayId] ?? [])
        .slice()
        .sort((a, b) => (slotOrder[a.timeSlot] ?? 3) - (slotOrder[b.timeSlot] ?? 3) || a.order - b.order)
      const items: MapItem[] = raw.map(i => ({ id: i.id, name: i.name, lat: i.lat, lng: i.lng, timeSlot: i.timeSlot, cat: i.cat }))
      for (const f of (meta.flights ?? [])) {
        if (f.dayId === day.dayId && f.lat && f.lng)
          items.push({ id: f.id, name: f.name, lat: f.lat, lng: f.lng ?? 0, timeSlot: '비행기', markerType: 'special' })
      }
      for (const acc of (meta.accommodations ?? [])) {
        if (!acc.lat || !acc.lng) continue
        const inIdx  = days.findIndex(d => d.dayId === acc.checkInDayId)
        const outIdx = days.findIndex(d => d.dayId === acc.checkOutDayId)
        // 체크인~체크아웃 직전 날까지 모든 날에 등록 → 숙박중 Day 선택 시 active opacity 유지
        // TripMap에서 같은 id 중복은 "한 그룹이라도 active면 1.0" 으로 처리
        if (idx >= inIdx && idx < outIdx)
          items.push({ id: `${acc.id}_in`, name: acc.name, lat: acc.lat, lng: acc.lng, timeSlot: '숙소', markerType: 'special' })
      }
      return { dayId: day.dayId, label: day.label, color, items }
    })
  }, [days, dayItems, meta?.flights, meta?.accommodations])

  /* 지도 멤버 아바타 색상 목록 */
  const mapAvatarMembers = useMemo<AvatarMember[]>(() => {
    return (meta?.members ?? []).map((m, mi) => {
      const ci = m.role === 'owner'
        ? (avatarHexColor ? undefined : (avatarColor ?? 0))
        : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
      const hexC = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
      const clay = ci !== undefined ? CLAY[ci % CLAY.length] : CLAY[0]
      const photoURL = m.role === 'owner' ? (auth.currentUser?.photoURL ?? user?.photoURL ?? m.photoURL) : m.photoURL
      return { name: m.name, baseColor: hexC ?? clay.base, photoURL: photoURL ?? undefined }
    })
  }, [meta?.members, avatarColor, avatarHexColor, user?.photoURL])

  /* 전체 아이템 ID 목록 (DnD 전체 컨텍스트용) */
  const allItemIds = useMemo(() => {
    const slotOrder: Record<TimeSlot, number> = { 아침: 0, 점심: 1, 저녁: 2, 미정: 3 }
    return [...currentItems]
      .sort((a, b) => {
        const sd = slotOrder[a.timeSlot] - slotOrder[b.timeSlot]
        return sd !== 0 ? sd : a.order - b.order
      })
      .map(i => i.id)
  }, [currentItems])

  /* ── 로딩 ── */
  if (metaLoading || !meta) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── 첫 여행 웰컴 모달 ── */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative">
            {/* 상단 그라데이션 헤더 */}
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 px-8 pt-10 pb-8 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  첫 여행을 만들었어요!
                </h2>
                <p className="text-sm text-white/80 mt-1 leading-relaxed">
                  설레는 여행의 시작이에요.<br />일정을 추가하고 소중한 기억을 기록해보세요.
                </p>
              </div>
            </div>
            {/* 본문 */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-0.5">총무 기능을 활용해보세요</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    멤버 초대 후 총무를 지정하면 여행 경비 관리와 정산을 한 사람이 맡아 깔끔하게 처리할 수 있어요.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowWelcome(false); if (pendingTreasurer) { setPendingTreasurer(false); setShowTreasurerPrompt(true) } }}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-sm transition-colors"
              >
                일정 만들러 가기
              </button>
            </div>
            <button
              onClick={() => { setShowWelcome(false); if (pendingTreasurer) { setPendingTreasurer(false); setShowTreasurerPrompt(true) } }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── 총무 지정 프롬프트 ── */}
      {showTreasurerPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-8 sm:pb-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-7 pb-6 flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-amber-500" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    총무를 지정하시겠어요?
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    방장이 총무를 여러 명 지정할 수 있어요. 멤버를 초대한 뒤 설정할 수도 있어요.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowTreasurerPrompt(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm hover:bg-gray-50 transition-colors"
                >
                  나중에
                </button>
                <button
                  onClick={() => { setShowTreasurerPrompt(false); setShowMembers(true) }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm transition-colors"
                >
                  멤버 관리 열기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <TripNavbar
        tripId={tripId}
        ownerId={uid}
        city={meta.city}
        title={meta.title}
        gradient={meta.gradient}
        coverPhotoURL={meta.coverPhotoURL}
        coverPhotoPosition={meta.coverPhotoPosition}
        startDate={meta.startDate}
        endDate={meta.endDate}
        nights={meta.nights}
        isOwner
        user={user}
        members={(meta.members ?? []).filter(m => !m.left).map(m =>
          m.role === 'owner'
            ? { ...m, photoURL: user?.photoURL ?? m.photoURL,
                colorIndex: avatarHexColor ? undefined : (avatarColor ?? 0),
                hexColor: avatarHexColor ?? undefined }
            : m
        )}
        onMemberClick={() => { setShowMembers(true); getDoc(doc(db, 'users', uid, 'trips', tripId)).then(snap => { if (snap.exists()) setMeta(snap.data() as TripMeta) }).catch(() => {}) }}
        onChecklistToggle={() => setChecklist(v => !v)}
        onReportClick={() => setShowReport(true)}
        onNoticeClick={() => { setNoticeComposing(false); setNoticeEditId(null); setNoticeInput(''); setShowNotice(true) }}
        onEditTrip={openEdit}
      />

      {/* ── Day 탭 + 모바일 지도/일정 토글 ── */}
      <div ref={dayTabsRef} className="bg-white border-b border-gray-200 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-stretch">
          {/* 스크롤 가능한 Day 탭 영역 */}
          <div
            ref={dayTabsScrollRef}
            className="flex-1 min-w-0 overflow-x-auto scrollbar-hide pl-4 sm:pl-6"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', cursor: 'grab' }}
            onMouseDown={onDayTabsMouseDown}
            onMouseMove={onDayTabsMouseMove}
            onMouseUp={onDayTabsMouseUp}
            onMouseLeave={onDayTabsMouseUp}
          >
          <div className="flex items-end" style={{ minWidth: (days.length + 1) * 72 }}>
            {/* 전체 일정 탭 — 구조를 Day 탭과 동일하게 맞춰 얼라인 유지 */}
            <div className="flex flex-col items-center flex-shrink-0 pt-2" style={{ minWidth: 64, marginRight: 4 }}>
              {/* 아바타 행 자리 (항상 22px 높이 유지) */}
              <div style={{ height: 22, marginBottom: 8 }} />
              <button
                onClick={() => setActiveDayIdx(-1)}
                className={`w-full pb-3 text-center border-b-2 transition-colors ${
                  activeDayIdx === -1 ? 'border-blue-600' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <span className={`block text-xs font-bold leading-none ${
                  activeDayIdx === -1 ? 'text-blue-600' : 'text-gray-400'
                }`}>전체</span>
                <span className={`block text-[10px] font-medium mt-1 ${activeDayIdx === -1 ? 'text-blue-500' : 'text-gray-300'}`}>
                  일정
                </span>
                {/* 전체 총금액 */}
                <span className={`block text-[10px] mt-0.5 tabular-nums font-bold ${totalSpent > 0 ? 'text-blue-600' : 'invisible'}`}>
                  {totalSpent > 0
                    ? (primaryCurrency !== 'KRW' && rates[primaryCurrency]
                        ? formatLocal(Math.round(totalSpent / rates[primaryCurrency]), primaryCurrency)
                        : formatKRW(totalSpent))
                    : '-'}
                </span>
              </button>
            </div>

            {days.map((d, i) => {
              const isActive = i === activeDayIdx
              const isToday  = d.date === new Date().toISOString().slice(0, 10)
              const members  = meta?.members ?? []
              const MAX_VISIBLE = 5
              const visible  = members.slice(0, MAX_VISIBLE)
              const overflow = members.length - MAX_VISIBLE
              const overlap  = members.length <= 3 ? -4 : -6
              const spent    = daySpentMap[d.dayId] ?? 0

              return (
                <div key={d.dayId} className="flex flex-col items-center flex-shrink-0 pt-2" style={{ minWidth: 76, marginRight: 4 }}>
                  {/* 멤버 아바타 행: 활성 탭만, 비활성은 높이 유지 */}
                  <div className="flex items-center justify-center mb-2" style={{ height: 22 }}>
                    {isActive && visible.length > 0 && (
                      <>
                        {visible.map((m, mi) => {
                          const mPhoto = m.role === 'owner' ? (auth.currentUser?.photoURL ?? user?.photoURL ?? m.photoURL) : m.photoURL
                          const mHex   = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                          const mCi    = m.role === 'owner'
                            ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                            : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                          const mRing  = mHex ?? (mCi !== undefined ? CLAY[mCi % CLAY.length]?.base : undefined)
                          return (
                            <div
                              key={m.id}
                              className="flex-shrink-0 rounded-full"
                              style={{ marginLeft: mi === 0 ? 0 : overlap, zIndex: visible.length - mi }}
                            >
                              <PersonAvatar
                                name={m.name}
                                photoURL={mPhoto}
                                colorIndex={mCi}
                                hexColor={mHex}
                                size={18}
                                ringColor={mRing}
                              />
                            </div>
                          )
                        })}
                        {overflow > 0 && (
                          <div
                            className="flex-shrink-0 w-[18px] h-[18px] rounded-full bg-gray-100 ring-[1.5px] ring-white flex items-center justify-center text-[8px] font-bold text-gray-500"
                            style={{ marginLeft: overlap, zIndex: 0 }}
                          >
                            +{overflow}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 탭 버튼 */}
                  <button
                    onClick={() => setActiveDayIdx(i)}
                    className={`w-full pb-3 text-center border-b-2 transition-colors ${
                      isActive ? 'border-blue-600' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className={`flex items-center justify-center gap-1 text-xs font-bold leading-none ${
                      isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'
                    }`}>
                      {d.label}
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
                    </span>
                    <span className={`block text-[10px] font-medium mt-1 ${isActive ? 'text-blue-500' : 'text-gray-300'}`}>
                      {formatDate(d.date)}
                    </span>
                    {/* 금액 행 — 항상 같은 높이 유지, 없으면 invisible */}
                    <span className={`block text-[10px] font-bold mt-0.5 tabular-nums ${
                      spent > 0
                        ? (isActive ? 'text-blue-600' : 'text-gray-400')
                        : 'invisible'
                    }`}>
                      {spent > 0
                        ? (primaryCurrency !== 'KRW' && rates[primaryCurrency]
                            ? formatLocal(Math.round(spent / (dayRates[d.dayId] ?? rates[primaryCurrency])), primaryCurrency)
                            : formatKRW(spent))
                        : '-'}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
          </div>{/* /overflow-x-auto */}


          {/* 오른쪽 고정: 여행 리포트 버튼 */}
          <div className="flex-shrink-0 flex items-center bg-white pr-3">
            <div className="w-px self-stretch bg-gray-100 mx-3" />
            <Link
              href={`/trips/${tripId}/summary`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors"
              title="여행 리포트"
            >
              <ScrollText className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <span className="text-[11px] font-bold text-violet-600 whitespace-nowrap">여행 리포트</span>
            </Link>
          </div>

        </div>{/* /flex items-stretch */}

        <div className="flex lg:hidden border-t border-gray-100">
          <button onClick={() => setMobileTab('schedule')}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${mobileTab === 'schedule' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
            일정
          </button>
          <button onClick={() => { setMobileTab('map'); setMapMounted(true) }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${mobileTab === 'map' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
            <Map className="w-3.5 h-3.5" /> 지도
          </button>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 일정 패널 ── */}
        <div
          className={`${mobileTab === 'map' ? 'hidden' : 'flex'} lg:flex w-full flex-shrink-0 flex-col bg-[#F8FAFC] overflow-hidden lg:border-r border-gray-200`}
          style={{ width: isDesktop ? leftWidth : undefined }}
        >

          <div className="px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeDayIdx === -1 ? '전체 일정' : `${activeDay?.label} · ${activeDay ? formatDate(activeDay.date) : ''}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeDayIdx === -1
                  ? `${days.length}일 · ${Object.values(dayItems).flat().length}개 일정`
                  : currentItems.length > 0 ? `${currentItems.length}개 일정` : '일정을 추가해보세요'}
                {activeDayIdx === -1 && totalSpent > 0 && ` · ${
                  primaryCurrency !== 'KRW' && rates[primaryCurrency]
                    ? formatLocal(Math.round(totalSpent / rates[primaryCurrency]), primaryCurrency)
                    : formatKRW(totalSpent)
                }`}
                {activeDayIdx !== -1 && daySpent > 0 && ` · ${
                  primaryCurrency !== 'KRW' && effectiveRates[primaryCurrency]
                    ? formatLocal(Math.round(daySpent / effectiveRates[primaryCurrency]), primaryCurrency)
                    : formatKRW(daySpent)
                }`}
              </p>
              {/* 전체 일정 + 해외: KRW 환산 표시 */}
              {activeDayIdx === -1 && totalSpent > 0 && primaryCurrency !== 'KRW' && rates[primaryCurrency] && (
                <p className="text-[11px] text-gray-400 mt-0.5">약 {formatKRW(totalSpent)}</p>
              )}
              {primaryCurrency !== 'KRW' && rates[primaryCurrency] > 0 && activeDay && (
                <RateWidget
                  currency={primaryCurrency}
                  liveRate={rates[primaryCurrency]}
                  customRate={dayRates[activeDay.dayId]}
                  onSave={rate => handleSetDayRate(activeDay.dayId, rate)}
                  onReset={() => handleSetDayRate(activeDay.dayId, null)}
                />
              )}
              {/* 일별 예산 상태 뱃지 — 예산 설정 시 표시 */}
              {activeDayIdx !== -1 && activeDay && dayBudgets[activeDay.dayId] > 0 && (() => {
                const budget = dayBudgets[activeDay.dayId]
                const pct    = Math.round(daySpent / budget * 100)
                const { label, cls } = pct >= 100
                  ? { label: `+${formatKRW(daySpent - budget)} 초과`, cls: 'bg-red-50 text-red-500' }
                  : pct >= 85
                  ? { label: `${formatKRW(budget - daySpent)} 남음`, cls: 'bg-amber-50 text-amber-600' }
                  : { label: `${formatKRW(budget - daySpent)} 남음`, cls: 'bg-emerald-50 text-emerald-600' }
                return (
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cls}`}>
                    일 예산 {pct}% · {label}
                  </span>
                )
              })()}
            </div>
            {activeDayIdx !== -1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => { setPendingPlace(undefined); setShowAdd(true) }}
                  data-tour="add-item"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors">
                  <Plus className="w-3.5 h-3.5" /> 추가
                </button>
                <InfoTooltip text="식사·장소·쇼핑·교통·기타 카테고리로 일정을 추가하세요. 금액·영수증·참여자·별점도 함께 기록할 수 있어요." width={220} />
              </div>
            )}
          </div>

          {/* 아이템 목록 — DnD 스크롤 버그 방지: MeasuringStrategy.Always + restrictToFirstScrollableAncestor */}
          <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto px-5 pb-5 flex flex-col gap-4">

            {/* ── 전체 일정 요약 뷰 ── */}
            {activeDayIdx === -1 && (
              <div className="flex flex-col gap-3">
                {allDayGroups.every(g => g.items.filter(i => !('markerType' in i && i.markerType === 'special')).length === 0) && (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-400">아직 일정이 없어요</p>
                      <p className="text-xs text-gray-300 mt-1">위에서 Day를 선택하고 첫 번째 장소를 추가해보세요</p>
                    </div>
                  </div>
                )}
                {allDayGroups.map((g, gi) => {
                  const dayItems_ = g.items.filter(i => !('markerType' in i && i.markerType === 'special'))
                  if (dayItems_.length === 0) return null
                  return (
                    <div key={g.dayId}>
                      <button
                        onClick={() => setActiveDayIdx(gi)}
                        className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                        <span className="text-xs font-bold text-gray-700">{g.label}</span>
                        <span className="text-[10px] text-gray-400">{dayItems_.length}개</span>
                      </button>
                      <div className="flex flex-col gap-1 pl-4">
                        {dayItems_.map((item, ii) => (
                          <div key={item.id} className="flex items-center gap-2 py-1">
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: g.color }}>{ii + 1}</span>
                            <span className="text-xs text-gray-600 truncate">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── 고정 일정 (비행기 / 숙소) ── */}
            {activeDay && activeDayIdx !== -1 && (
              <FixedScheduleSection
                flights={meta.flights ?? []}
                accommodations={meta.accommodations ?? []}
                activeDay={activeDay}
                days={days}
                onEditFlight={f => setEditingFlight({ ...f, payerId: f.payerId ?? ownerId })}
                onDeleteFlight={handleDeleteFlight}
                onEditAcc={a => setEditingAcc({ ...a, payerId: a.payerId ?? ownerId })}
                onDeleteAcc={handleDeleteAccommodation}
                onFocusMap={handleFocusMap}
              />
            )}

            {activeDayIdx !== -1 && currentItems.length === 0 && (
              <div onClick={() => { setPendingPlace(undefined); setShowAdd(true) }}
                className="flex flex-col items-center justify-center py-16 gap-3 cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-dashed border-gray-200 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors font-medium">
                  + 첫 번째 일정을 추가하세요
                </p>
              </div>
            )}
            {activeDayIdx !== -1 && currentItems.length > 0 && (
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToFirstScrollableAncestor]}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragEnd={(e: DragEndEvent) => {
                  const { active, over } = e
                  if (!over || active.id === over.id) return
                  const overId = String(over.id)
                  if (overId.startsWith('slot:')) {
                    handleMoveToSlot(String(active.id), overId.replace('slot:', '') as TimeSlot)
                  } else {
                    handleReorder(String(active.id), overId)
                  }
                }}
              >
                <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
                  {TIME_SLOTS.map(slot => {
                    const slotItems = grouped[slot]
                    if (slot === '미정' && !slotItems.length) return null
                    const slotKRW = slotItems.reduce((s, i) => s + toKRW(i.price, i.currency, rates), 0)
                    const slotLocalStr = slotKRW > 0 && primaryCurrency !== 'KRW' && rates[primaryCurrency]
                      ? formatLocal(Math.round(slotKRW / rates[primaryCurrency]), primaryCurrency)
                      : ''
                    const slotKRWStr = slotKRW > 0 ? formatKRW(slotKRW) : ''
                    return (
                      <div key={slot} className="flex flex-col gap-2 mt-1">
                        {/* 시간대 구분선 */}
                        <div className="flex items-center gap-2.5 py-1.5">
                          <div className="flex-1 h-px bg-gray-200" />
                          <div className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full border ${SLOT_STYLES[slot]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${SLOT_DOT[slot]}`} />
                            <span className="text-[11px] font-bold">{slot}</span>
                            {(slotLocalStr || slotKRWStr) && (
                              <>
                                <span className="text-[10px] text-emerald-600 font-semibold ml-0.5">
                                  {slotLocalStr || slotKRWStr}
                                </span>
                                {slotLocalStr && slotKRWStr && (
                                  <span className="text-[10px] text-gray-400">약 {slotKRWStr}</span>
                                )}
                              </>
                            )}
                            <span className="text-[10px] text-gray-400">{slotItems.length}개</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        {slotItems.length === 0 && slot !== '미정' && (
                          <SlotDropZone slot={slot} />
                        )}
                        {slotItems.map(item => {
                          const myMember = (meta.members ?? []).find(m => m.id === uid)
                          const canEditItems = !myMember || myMember.role === 'owner' || myMember.role === 'treasurer'
                          return (
                          <SortableItemRow
                            key={item.id}
                            item={item}
                            myUid={uid}
                            onDelete={handleDelete}
                            onEdit={setEditItem}
                            onQuickEdit={setQuickItem}
                            onChangeCat={handleChangeCat}
                            onRate={handleRate}
                            onFocusMap={handleFocusMap}
                            onViewReceipts={r => setLightbox({ receipts: r, idx: 0 })}
                            onUploadReceipt={files => handleUploadReceipts(item.id, files)}
                            mapIndex={mapIndexMap[item.id]}
                            rates={effectiveRates}
                            totalPeople={(meta.members ?? []).filter(m => !m.left).length || meta.people || 1}
                            memberIds={(meta.members ?? []).filter(m => !m.left).map(m => m.id)}
                            canEdit={canEditItems}
                          />
                          )
                        })}
                      </div>
                    )
                  })}
                </SortableContext>
              </DndContext>
            )}
          </div>
          {/* 모바일 스크롤 힌트 — 하단 페이드 */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#F8FAFC] to-transparent pointer-events-none z-10 lg:hidden" />
          </div>

          {/* 예산 푸터 */}
          <div data-tour="budget-bar" className="border-t border-gray-200 bg-white px-5 py-4 flex-shrink-0">
            {/* 전체 지출 */}
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-1.5 text-xs ${overageKRW > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                <Wallet className="w-3.5 h-3.5" />
                <span>{meta.budget > 0 ? '전체 예산' : '전체 지출'}</span>
              </div>
              <div className="text-right">
                {primaryCurrency !== 'KRW' && rates[primaryCurrency] ? (
                  <>
                    <span className={`text-xs font-bold ${overageKRW > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                      {formatLocal(Math.round(totalSpent / rates[primaryCurrency]), primaryCurrency)}
                      {meta.budget > 0 && ` / ${formatLocal(Math.round(meta.budget / rates[primaryCurrency]), primaryCurrency)}`}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      약 {formatKRW(totalSpent)}{meta.budget > 0 && ` / ${formatKRW(meta.budget)}`}
                    </p>
                  </>
                ) : (
                  <span className={`text-xs font-bold ${overageKRW > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                    {formatKRW(totalSpent)}{meta.budget > 0 && ` / ${formatKRW(meta.budget)}`}
                  </span>
                )}
              </div>
            </div>
            {/* 예산 바 — 예산 설정된 경우만 */}
            {meta.budget > 0 && (
              <>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${rawBudgetPct >= 100 ? 'bg-red-500' : rawBudgetPct >= 90 ? 'bg-red-400' : rawBudgetPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${budgetPct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[11px] font-semibold ${
                    rawBudgetPct >= 100 ? 'text-red-500' : rawBudgetPct >= 90 ? 'text-red-400' : rawBudgetPct >= 70 ? 'text-amber-500' : rawBudgetPct >= 40 ? 'text-blue-500' : 'text-emerald-500'
                  }`}>
                    {rawBudgetPct >= 100
                      ? `예산 초과 +${primaryCurrency !== 'KRW' && rates[primaryCurrency] ? formatLocal(Math.round(overageKRW / rates[primaryCurrency]), primaryCurrency) : formatKRW(overageKRW)}`
                      : rawBudgetPct >= 90 ? '예산이 거의 다 됐어요'
                      : rawBudgetPct >= 70 ? '슬슬 지출을 줄여볼까요'
                      : rawBudgetPct >= 40 ? '예산 내에서 잘 쓰고 있어요'
                      : '아직 여유가 충분해요'}
                  </span>
                  <span className="text-[11px] text-gray-400">{rawBudgetPct}% 사용</span>
                </div>
                {overageKRW > 0 && primaryCurrency !== 'KRW' && rates[primaryCurrency] && (
                  <p className="text-[10px] text-red-400 text-right mt-0.5">
                    약 +{formatKRW(overageKRW)} 초과
                  </p>
                )}
              </>
            )}
            {/* 1인 평균 + 정산 명세 */}
            {(meta.members ?? []).length > 1 && totalSpent > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div
                  data-tour="settlement-btn"
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setShowSettlement(true)}
                >
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Users className="w-3 h-3" />1인 평균
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-blue-600">
                      {primaryCurrency !== 'KRW' && rates[primaryCurrency]
                        ? formatLocal(Math.round(avgPerPerson / rates[primaryCurrency]), primaryCurrency)
                        : formatKRW(Math.round(avgPerPerson))
                      }
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                      명세 <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
                {hasUnevenParticipants && (
                  <p className="text-[10px] text-gray-400 mt-0.5">참여 인원이 다른 장소가 있어요</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 리사이즈 핸들 (데스크톱 전용) ── */}
        <div
          onMouseDown={handleResizeStart}
          className="hidden lg:flex w-2 flex-shrink-0 items-center justify-center cursor-col-resize group hover:bg-blue-50 active:bg-blue-100 transition-colors z-10 relative"
        >
          <div className="w-[3px] h-10 rounded-full bg-gray-200 group-hover:bg-blue-400 group-active:bg-blue-500 transition-colors" />
        </div>

        {/* ── 지도 컬럼 ── */}
        <div className={`${mobileTab === 'schedule' ? 'hidden' : 'flex'} lg:flex flex-1 flex-col overflow-hidden`}>
          {/* 장소 검색바 — 전체 모드에서는 안내 메시지 표시 */}
          <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-100">
            {activeDayIdx === -1 ? (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                <span className="text-xs text-gray-400">Day를 선택하면 장소를 추가할 수 있어요</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 hover:border-blue-300 focus-within:border-blue-400 focus-within:bg-white transition-colors">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={initMapSearchAc}
                  type="text"
                  placeholder="장소 검색 후 일정 추가…"
                  className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
                />
              </div>
            )}
          </div>
          {/* 지도 */}
          <div className="flex-1 relative overflow-hidden">
            {/* 도시 라벨 */}
            <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">{meta.city}</span>
              {mapItems.filter(i => i.lat && i.lng).length > 0 && (
                <span className="text-[10px] text-gray-400 ml-1">
                  {mapItems.filter(i => i.lat && i.lng).length}개 핀
                </span>
              )}
            </div>
            {/* 지도 사용 힌트 */}
            {!pendingPlace && showMapHint && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center animate-fade-in">
                <div className="bg-gray-900/90 backdrop-blur-sm text-white rounded-2xl px-4 py-3 shadow-xl flex flex-col gap-1.5 min-w-[220px]">
                  <p className="text-[11px] font-bold text-white/90 tracking-wide uppercase">장소 추가하기</p>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🖱️</span>
                    <span className="text-xs text-white/80 hidden sm:block">지도 빈 곳을 <b className="text-white">더블클릭</b></span>
                    <span className="text-xs text-white/80 block sm:hidden">지도 빈 곳을 <b className="text-white">두 번 탭</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">📍</span>
                    <span className="text-xs text-white/80">지도 위 <b className="text-white">장소 이름을 클릭</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🔍</span>
                    <span className="text-xs text-white/80">위의 <b className="text-white">검색창</b> 활용</span>
                  </div>
                </div>
                <span className="w-0 h-0 mt-[-1px]" style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '8px solid rgba(17,24,39,0.9)' }} />
              </div>
            )}
            {mapMounted && (
              <TripMap
                city={meta.city}
                items={[]}
                dayGroups={allDayGroups}
                activeDayId={activeDayIdx === -1 ? undefined : activeDay?.dayId}
                focusId={focusItemId}
                focusTrigger={focusTrigger}
                members={mapAvatarMembers}
                previewPlace={pendingPlace}
                onDblClick={handleMapDblClick}
              />
            )}

            {/* 장소 미리보기 카드 */}
            {pendingPlace && (
              <div className="absolute bottom-4 left-3 right-3 z-20 pointer-events-auto">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4.5 h-4.5 text-red-500" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate leading-snug">
                        {pendingPlace.name || '선택한 위치'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {pendingPlace.name
                          ? '검색된 장소 · 일정에 추가하시겠어요?'
                          : `${pendingPlace.lat.toFixed(5)}, ${pendingPlace.lng.toFixed(5)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setPendingPlace(undefined)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0 -mt-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 pb-3">
                    {activeDayIdx === -1 ? (
                      <div className="w-full py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 text-center font-medium">
                        Day 탭을 선택한 후 추가하세요
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAdd(true)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        이 장소를 일정에 추가하기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddItemPanel
          onAdd={handleAdd}
          onClose={() => { setShowAdd(false); setPendingPlace(undefined) }}
          defaultCurrency={primaryCurrency}
          currencies={tripCurrencies}
          people={meta.people || 1}
          members={(meta.members ?? []).filter(m => !m.left)}
          uid={uid}
          tripId={tripId}
          days={days}
          activeDayId={activeDay?.dayId ?? days[0]?.dayId ?? ''}
          onAddFlight={handleAddFlight}
          onAddAccommodation={handleAddAccommodation}
          defaultPlace={pendingPlace}
          tripCity={meta.city}
        />
      )}

      {quickItem && (
        <QuickItemSheet
          item={quickItem}
          onUpdate={handleUpdate}
          onClose={() => setQuickItem(null)}
          currencies={tripCurrencies}
          uid={uid}
          tripId={tripId}
          leftWidth={leftWidth}
          isDesktop={isDesktop}
          tabsBottom={dayTabsRef.current?.getBoundingClientRect().bottom ?? 152}
        />
      )}

      {editItem && (
        <EditItemPanel
          item={editItem}
          onUpdate={handleUpdate}
          onDelete={(id) => { handleDelete(id); setEditItem(null) }}
          onClose={() => setEditItem(null)}
          currencies={tripCurrencies}
          people={meta.people || 1}
          members={(meta.members ?? []).filter(m => !m.left)}
          uid={uid}
          tripId={tripId}
        />
      )}

      {/* ── 멤버 관리 모달 ── */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => setShowMembers(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[500px] sm:mx-4 shadow-2xl max-h-[92dvh] sm:max-h-[88dvh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* 모바일 드래그 핸들 */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* 헤더 */}
            <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-gray-900">여행 멤버</h3>
                  <InfoTooltip text="방장: 모든 권한 · 총무: 일정 추가·편집 가능 · 게스트: 일정 열람만 가능. 아바타의 💛 버튼으로 총무를 지정할 수 있어요." width={230} />
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{(meta.members ?? []).filter(m => !m.left).length} / {meta.people || 1}명 참여 중</span>
                  {(meta.members ?? []).filter(m => !m.left).length >= (meta.people || 1) && (
                    <span className="text-orange-500 font-semibold">· 정원 초과</span>
                  )}
                </p>
              </div>
              <button onClick={() => setShowMembers(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 멤버 패널 온보딩 팁 — 혼자일 때만, 한 번 닫으면 사라짐 */}
            {!memberTipDismissed && (meta.members ?? []).filter(m => !m.left).length <= 1 && (
              <div className="mx-3 sm:mx-4 mt-3 mb-1 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-900 mb-1">친구를 초대해보세요!</p>
                  <ul className="flex flex-col gap-1">
                    <li className="flex items-start gap-1.5 text-xs text-blue-700 leading-relaxed">
                      <span className="font-bold mt-0.5">·</span>
                      <span><span className="font-semibold">멤버 추가</span> — 닉네임을 입력해 직접 추가할 수 있어요</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-xs text-blue-700 leading-relaxed">
                      <span className="font-bold mt-0.5">·</span>
                      <span><span className="font-semibold">PIN 참여 링크</span> — 여러 명이면 PIN을 설정하고 링크를 공유하면 편해요</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => { setMemberTipDismissed(true); try { localStorage.setItem('member_panel_tip_seen', '1') } catch {} }}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-200 text-blue-400 flex-shrink-0 self-start"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 멤버 목록 */}
            <div className="px-3 sm:px-4 py-2 flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
              {(meta.members ?? []).map((m, mi) => {
                const isRegisteredUser = m.id.length >= 15
                const effectiveColorIdx = m.role === 'owner'
                  ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                  : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                const effectiveHex = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                const initialHex = m.hexColor ?? (effectiveColorIdx !== undefined ? CLAY[effectiveColorIdx].base : '#4A90E8')
                const ringC = effectiveHex ?? (effectiveColorIdx !== undefined ? CLAY[effectiveColorIdx % CLAY.length].base : undefined)
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50/80 group transition-colors ${m.left ? 'opacity-50' : ''}`}>
                    {/* 아바타 */}
                    {m.role !== 'owner' ? (
                      <div className="relative flex-shrink-0">
                        {/* 실제 가입 유저(Firebase UID)는 개인 색상 고정 — 방장이 변경 불가 */}
                        {!m.left && !isRegisteredUser ? (
                          <label className="cursor-pointer">
                            <input
                              type="color"
                              value={initialHex}
                              onChange={e => setMemberCustomColor(m.id, e.target.value)}
                              style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                            />
                            <PersonAvatar
                              name={m.name}
                              photoURL={m.photoURL}
                              size={42}
                              colorIndex={effectiveColorIdx}
                              hexColor={effectiveHex}
                              ringColor={ringC}
                              className="hover:opacity-75 transition-opacity"
                            />
                          </label>
                        ) : (
                          <PersonAvatar
                            name={m.name}
                            photoURL={m.photoURL}
                            size={42}
                            colorIndex={effectiveColorIdx}
                            hexColor={effectiveHex}
                            ringColor={ringC}
                          />
                        )}
                        {!m.left && (
                          <button
                            type="button"
                            onClick={() => setTreasurer(m.id)}
                            title={m.role === 'treasurer' ? '총무 해제' : '총무 지정'}
                            className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                              m.role === 'treasurer'
                                ? 'bg-amber-400 hover:bg-amber-500'
                                : 'bg-gray-200 hover:bg-amber-300'
                            }`}
                          >
                            <Wallet className={`w-3 h-3 ${m.role === 'treasurer' ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="relative flex-shrink-0">
                        <PersonAvatar
                          name={m.name}
                          photoURL={auth.currentUser?.photoURL ?? user?.photoURL ?? m.photoURL}
                          size={42}
                          colorIndex={effectiveColorIdx}
                          hexColor={effectiveHex}
                          ringColor={(auth.currentUser?.photoURL ?? user?.photoURL ?? m.photoURL) ? ringC : undefined}
                        />
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <Crown className="w-3 h-3 text-white" />
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                        {m.left ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 bg-gray-100 text-gray-400">
                            탈퇴
                          </span>
                        ) : (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            m.role === 'owner'      ? 'bg-blue-50 text-blue-600'
                            : m.role === 'treasurer' ? 'bg-amber-50 text-amber-600'
                            :                          'bg-gray-100 text-gray-500'
                          }`}>
                            {m.role === 'owner' ? '방장' : m.role === 'treasurer' ? '총무' : '게스트'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 text-gray-400">
                        {m.left ? '초대 링크로 다시 참여 가능' : m.role === 'owner' ? '마이페이지에서 색상 변경' : isRegisteredUser ? '본인이 설정한 색상 적용' : '아바타 클릭 → 색상 변경'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {m.role !== 'owner' && !m.left && (
                        <button onClick={() => removeMember(m.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 멤버 추가 */}
            <div className="border-t border-gray-100 px-4 sm:px-5 pt-4 pb-3 flex-shrink-0">
              {(meta.members ?? []).filter(m => !m.left).length >= (meta.people || 1) ? (
                <div className="flex items-center gap-2 px-3 py-3 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-xs text-orange-600 font-semibold leading-relaxed">
                    인원이 가득 찼어요. 여행 정보 편집에서 인원수를 늘려보세요.
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    멤버 추가 <span className="normal-case font-normal text-gray-400">({(meta.people || 1) - (meta.members ?? []).filter(m => !m.left).length}명 추가 가능)</span>
                  </p>
                  <div className="flex gap-2 items-center">
                    <PersonAvatar name={newMemberName || '?'} size={36} className="flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="닉네임 입력"
                      value={newMemberName}
                      maxLength={12}
                      onChange={e => setNewMemberName(e.target.value.slice(0, 12))}
                      onKeyDown={e => { if (e.key === 'Enter') addMember() }}
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                    <button onClick={addMember} disabled={!newMemberName.trim()}
                      className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 초대 링크 */}
            <div className="border-t border-gray-100 px-4 sm:px-5 pb-5 pt-4 flex flex-col gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">참여 링크</p>
                <InfoTooltip text="링크를 공유해 친구·가족을 여행에 초대하세요. PIN 링크는 4자리 비밀번호 입력 후 일정을 열람할 수 있고, 뷰어 링크는 PIN 없이 바로 열람 가능합니다." width={240} />
              </div>

              {/* PIN 참여 링크 */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 overflow-hidden">
                <div className="px-3.5 pt-3 pb-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-700">멤버 참여 링크</p>
                    <p className="text-[11px] text-blue-400">PIN 설정으로 보안 강화 (선택 사항)</p>
                  </div>
                </div>
                {/* PIN 직접 입력 */}
                <div className="px-3.5 pb-2.5 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-blue-500 flex-shrink-0">PIN</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4자리"
                    value={joinPinInput}
                    onChange={e => setJoinPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-20 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-center text-sm font-black text-blue-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all tracking-widest"
                  />
                  <button
                    onClick={() => saveJoinPin(joinPinInput)}
                    disabled={joinPinInput.length !== 4}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors disabled:opacity-40 flex items-center gap-1"
                  >
                    {pinSaved ? <><Check className="w-3 h-3" />저장됨</> : '저장'}
                  </button>
                </div>
                <div className="px-3.5 pb-3">
                  <button
                    onClick={copyJoinLink}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copied === 'join'
                      ? <><Check className="w-3.5 h-3.5" />복사됨</>
                      : <><Copy className="w-3.5 h-3.5" />링크 복사</>}
                  </button>
                </div>
              </div>

              {/* 뷰어 링크 */}
              <button onClick={() => copyLink('view')}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Link2 className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-gray-700">뷰어 링크 복사</p>
                  <p className="text-[11px] text-gray-400">PIN 없이 일정 열람만 가능 (편집 불가)</p>
                </div>
                {copied === 'view'
                  ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <Copy className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 체크리스트 드로어 */}
      {showChecklist && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setChecklist(false)} />
          <div className="relative z-50 w-full sm:w-80 bg-white h-full shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">여행 준비물</h3>
              <button onClick={() => setChecklist(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-1.5">
              {checkItems.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-gray-400">기본 준비물 목록을 불러오세요</p>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => loadChecklistDefaults('domestic')}
                      className="flex-1 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      🇰🇷 국내 여행
                    </button>
                    <button
                      onClick={() => loadChecklistDefaults('overseas')}
                      className="flex-1 py-2.5 rounded-xl border-2 border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors"
                    >
                      ✈️ 해외 여행
                    </button>
                  </div>
                </div>
              )}
              {checkItems.map(c => (
                <div key={c.id} className="flex items-center gap-2.5 group py-1.5">
                  <button
                    onClick={() => toggleCheck(c.id)}
                    className={`w-4.5 h-4.5 flex-shrink-0 rounded border-2 transition-colors flex items-center justify-center ${c.done ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-400'}`}
                    style={{ width: 18, height: 18 }}
                  >
                    {c.done && (
                      <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  {checkEditId === c.id ? (
                    <input
                      autoFocus
                      value={checkEditVal}
                      onChange={e => setCheckEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveCheckEdit(c.id); if (e.key === 'Escape') setCheckEditId(null) }}
                      onBlur={() => saveCheckEdit(c.id)}
                      className="flex-1 text-sm px-2 py-0.5 rounded border border-blue-400 outline-none bg-blue-50/50"
                    />
                  ) : (
                    <span className={`flex-1 text-sm select-none ${c.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{c.label}</span>
                  )}
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setCheckEditId(c.id); setCheckEditVal(c.label) }}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteCheckItem(c.id)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="새 항목 추가…"
                  value={checkInput}
                  onChange={e => setCheckInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCheckItem() }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all"
                />
                <button
                  onClick={addCheckItem}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 공지사항 팝업 ── */}
      {showNotice && meta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!noticeComposing && !noticeEditId) { setShowNotice(false) } }}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[560px] max-h-[85dvh]">

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-gray-900 text-sm">공지사항</span>
                {notices.length > 0 && (
                  <span className="text-xs text-gray-400 font-normal">{notices.length}개</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {!noticeComposing && !noticeEditId && (
                  <button
                    onClick={() => { setNoticeInput(''); setNoticeComposing(true) }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> 공지 작성
                  </button>
                )}
                <button
                  onClick={() => { setShowNotice(false); setNoticeComposing(false); setNoticeEditId(null) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 작성 / 수정 폼 */}
            {(noticeComposing || noticeEditId) && (
              <div className="px-5 py-4 border-b border-gray-100 bg-amber-50/40 flex-shrink-0">
                <p className="text-[11px] font-semibold text-amber-600 mb-2">
                  {noticeComposing ? '새 공지 작성' : '공지 수정'}
                </p>
                <textarea
                  value={noticeInput}
                  onChange={e => setNoticeInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all resize-none bg-white"
                  rows={4}
                  placeholder="멤버들에게 전달할 공지를 입력하세요"
                  autoFocus
                />
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={async () => {
                      const trimmed = noticeInput.trim()
                      if (!trimmed) return
                      if (noticeComposing) {
                        const ref = await addDoc(
                          collection(db, 'users', uid, 'trips', tripId, 'notices'),
                          { content: trimmed, createdAt: serverTimestamp() }
                        )
                        const newItem: NoticeItem = { id: ref.id, content: trimmed, createdAt: null }
                        setNotices(prev => [newItem, ...prev])
                        setNoticeComposing(false)
                        notifyTripMembers({
                          ownerUid:          uid,
                          members:           meta.members ?? [],
                          actorUid:          uid,
                          title:             `📢 ${meta.title || meta.city} 공지사항`,
                          body:              trimmed.length > 80 ? trimmed.slice(0, 80) + '…' : trimmed,
                          ownerPathOverride: `/trips/${tripId}?notice=1`,
                          memberPathOverride: meta.viewCode ? `/share/${meta.viewCode}?notice=1` : `/trips/${tripId}?notice=1`,
                          msgType:           'notice',
                          notifySelf:        true,
                        }).catch(() => {})
                      } else if (noticeEditId) {
                        await updateDoc(
                          doc(db, 'users', uid, 'trips', tripId, 'notices', noticeEditId),
                          { content: trimmed, updatedAt: serverTimestamp() }
                        )
                        setNotices(prev => prev.map(n => n.id === noticeEditId ? { ...n, content: trimmed, updatedAt: Timestamp.fromDate(new Date()) } : n))
                        setNoticeEditId(null)
                        notifyTripMembers({
                          ownerUid:          uid,
                          members:           meta.members ?? [],
                          actorUid:          uid,
                          title:             `📢 ${meta.title || meta.city} 공지사항 수정`,
                          body:              trimmed.length > 80 ? trimmed.slice(0, 80) + '…' : trimmed,
                          ownerPathOverride: `/trips/${tripId}?notice=1`,
                          memberPathOverride: meta.viewCode ? `/share/${meta.viewCode}?notice=1` : `/trips/${tripId}?notice=1`,
                          msgType:           'notice',
                          notifySelf:        true,
                        }).catch(() => {})
                      }
                      setNoticeInput('')
                    }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => { setNoticeComposing(false); setNoticeEditId(null); setNoticeInput('') }}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 공지 리스트 */}
            <div className="overflow-y-auto flex-1">
              {noticesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Megaphone className="w-8 h-8 text-gray-200" />
                  <p className="text-sm text-gray-400">
                    아직 공지사항이 없어요. 멤버들에게 공지를 남겨보세요.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {notices.map((n, i) => {
                    const fmtTs = (d: Date) =>
                      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                    const ts  = n.createdAt instanceof Timestamp ? n.createdAt.toDate() : null
                    const uts = n.updatedAt  instanceof Timestamp ? n.updatedAt.toDate()  : null
                    const dateStr = ts  ? fmtTs(ts)  : ''
                    const editStr = uts ? fmtTs(uts) : ''
                    const isEditing = noticeEditId === n.id
                    const num = notices.length - i
                    return (
                      <li key={n.id} className={`px-5 py-4 ${isEditing ? 'bg-amber-50/40' : ''}`}>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-50 text-amber-500 text-[11px] font-bold flex items-center justify-center mt-0.5">{num}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{n.content}</p>
                            {dateStr && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <p className="text-[11px] text-gray-400">{editStr ? editStr : dateStr}</p>
                                {editStr && (
                                  <span className="text-[10px] font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full leading-none">수정됨</span>
                                )}
                              </div>
                            )}
                          </div>
                          {!noticeComposing && !noticeEditId && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => { setNoticeEditId(n.id); setNoticeInput(n.content); setNoticeComposing(false) }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="수정"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('이 공지를 삭제할까요?')) return
                                  await deleteDoc(doc(db, 'users', uid, 'trips', tripId, 'notices', n.id))
                                  setNotices(prev => prev.filter(x => x.id !== n.id))
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 여행 정보 편집 모달 ── */}
      {showEdit && meta && (
        <TripEditModal
          city={meta.city}
          title={meta.title}
          startDate={meta.startDate}
          endDate={meta.endDate}
          people={meta.people}
          currency={primaryCurrency}
          budgetKRW={meta.budget}
          dayMetas={days}
          initialDayBudgets={dayBudgets}
          coverPhotoURL={meta.coverPhotoURL}
          coverPhotoPosition={meta.coverPhotoPosition}
          uid={uid}
          tripId={tripId}
          onClose={() => setShowEdit(false)}
          onSave={async (data: TripEditFormData) => {
            const start = new Date(data.startDate)
            const batch = writeBatch(db)
            batch.update(doc(db, 'users', uid, 'trips', tripId), {
              title:              data.title || null,
              startDate:          data.startDate,
              endDate:            data.endDate,
              nights:             data.nights,
              days:               data.days,
              people:             data.people,
              currency:           data.currency || null,
              budget:             data.budgetKRW,
              dayBudgets:         data.dayBudgets,
              coverPhotoURL:      data.coverPhotoURL ?? null,
              coverPhotoPosition: data.coverPhotoPosition ?? 50,
            })
            for (let i = 0; i < data.days; i++) {
              const d = new Date(start)
              d.setDate(d.getDate() + i)
              batch.set(
                doc(db, 'users', uid, 'trips', tripId, 'days', `d${i + 1}`),
                { label: `Day ${i + 1}`, date: d.toISOString().slice(0, 10) },
                { merge: true }
              )
            }
            await batch.commit()
            setDayBudgets(data.dayBudgets)
            setMeta(prev => prev ? {
              ...prev,
              title:         data.title || undefined,
              startDate:     data.startDate,
              endDate:       data.endDate,
              nights:        data.nights,
              days:          data.days,
              people:        data.people,
              budget:        data.budgetKRW,
              dayBudgets:    data.dayBudgets,
              coverPhotoURL:      data.coverPhotoURL,
              coverPhotoPosition: data.coverPhotoPosition ?? 50,
            } : prev)
          }}
        />
      )}

      {/* ── 정산 명세 팝업 ── */}
      {showSettlement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200]"
          onClick={() => setShowSettlement(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 shadow-2xl max-h-[90dvh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">정산 금액</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">장소별 참여 인원 기준 계산</p>
                {primaryCurrency !== 'KRW' && (
                  <p className="text-[11px] text-blue-500 mt-0.5">
                    {Object.keys(dayRates).length > 0
                      ? `날짜별 고정 환율 기준 계산 · 미고정 날은 현재 환율 적용`
                      : `현재 환율 기준 계산 (참고용) · 실제 결제 시 환율과 다를 수 있음`
                    }
                  </p>
                )}
              </div>
              <button onClick={() => setShowSettlement(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">

              {/* ── 결제자 기록 있으면: 이렇게 보내세요 ── */}
              {settlementTransfers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">이렇게 보내세요</p>
                  {settlementTransfers.map((t, ti) => {
                    const from = (meta.members ?? []).find(m => m.id === t.from)
                    const to   = (meta.members ?? []).find(m => m.id === t.to)
                    if (!from || !to) return null
                    const fci = from.role === 'owner' ? (avatarHexColor ? undefined : (avatarColor ?? 0)) : (from.hexColor ? undefined : (from.colorIndex ?? 0))
                    const tci = to.role   === 'owner' ? (avatarHexColor ? undefined : (avatarColor ?? 0)) : (to.hexColor   ? undefined : (to.colorIndex   ?? 0))
                    const fPhoto = from.role === 'owner' ? (auth.currentUser?.photoURL ?? user?.photoURL ?? from.photoURL) : from.photoURL
                    const tPhoto = to.role   === 'owner' ? (auth.currentUser?.photoURL ?? user?.photoURL ?? to.photoURL)   : to.photoURL
                    return (
                      <div key={ti} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                        <PersonAvatar name={from.name} size={26} colorIndex={fci} hexColor={from.role === 'owner' ? (avatarHexColor ?? undefined) : from.hexColor} photoURL={fPhoto ?? undefined} ringColor={fPhoto ? (from.role === 'owner' ? (avatarHexColor ?? (CLAY[avatarColor ?? 0]?.base)) : (from.hexColor ?? (from.colorIndex !== undefined ? CLAY[from.colorIndex % CLAY.length]?.base : undefined))) : undefined} />
                        <span className="text-xs font-semibold text-gray-700 truncate max-w-[60px]">{from.name}</span>
                        <span className="text-gray-400 text-xs flex-shrink-0">→</span>
                        <PersonAvatar name={to.name} size={26} colorIndex={tci} hexColor={to.role === 'owner' ? (avatarHexColor ?? undefined) : to.hexColor} photoURL={tPhoto ?? undefined} ringColor={tPhoto ? (to.role === 'owner' ? (avatarHexColor ?? (CLAY[avatarColor ?? 0]?.base)) : (to.hexColor ?? (to.colorIndex !== undefined ? CLAY[to.colorIndex % CLAY.length]?.base : undefined))) : undefined} />
                        <span className="text-xs font-semibold text-gray-700 truncate max-w-[60px]">{to.name}</span>
                        <div className="ml-auto text-right flex-shrink-0">
                          {preferredCurrency !== 'KRW' && rates[preferredCurrency] ? (
                            <>
                              <span className="text-sm font-bold text-emerald-600 block">{formatLocal(Math.round(t.amount / rates[preferredCurrency]), preferredCurrency)}</span>
                              <span className="text-[10px] text-gray-400">{formatKRW(t.amount)}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-emerald-600 block">{formatKRW(t.amount)}</span>
                              {primaryCurrency !== 'KRW' && rates[primaryCurrency] && (
                                <span className="text-[10px] text-gray-400">약 {formatLocal(Math.round(t.amount / rates[primaryCurrency]), primaryCurrency)}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── 개인별 내역 ── */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                  {paidItemCount > 0 ? '개인별 내역' : '내 몫'}
                </p>
                {(meta.members ?? []).map((m, mi) => {
                  const spent    = memberSpent[m.id] ?? 0
                  const paid     = memberPaid[m.id]  ?? 0
                  const net      = Math.round(paid - spent)
                  const isExpanded       = expandedMemberId === m.id
                  const paidItems        = memberPaidItems[m.id] ?? []
                  const participatedItems = memberParticipatedItems[m.id] ?? []
                  const ci = m.role === 'owner'
                    ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                    : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                  const hexC     = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                  const photoURL = m.role === 'owner' ? (auth.currentUser?.photoURL ?? user?.photoURL ?? m.photoURL) : m.photoURL
                  return (
                    <div key={m.id} className={`rounded-xl border transition-colors ${isExpanded ? 'border-blue-100 bg-blue-50/40' : 'border-gray-100 bg-gray-50/60'} ${m.left ? 'opacity-50' : ''}`}>
                      {/* 헤더 행 */}
                      <button
                        type="button"
                        onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <PersonAvatar name={m.name} size={30} colorIndex={ci} hexColor={hexC} photoURL={photoURL} ringColor={photoURL ? (hexC ?? (ci !== undefined ? CLAY[ci % CLAY.length]?.base : undefined)) : undefined} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 leading-none">
                            {m.name}
                            {m.left && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">탈퇴</span>}
                            {paidItems.length > 0 && (
                              <span className="text-[10px] text-blue-400 font-normal">{paidItems.length}건 결제</span>
                            )}
                          </span>
                          {paidItemCount > 0 && (
                            <span className="text-[10px] text-gray-400 mt-0.5 block">
                              낸 돈 {formatKRW(Math.round(paid))} · 내 몫 {formatKRW(Math.round(spent))}
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {paidItemCount > 0 ? (
                            <>
                              <span className={`text-sm font-bold block ${net > 0 ? 'text-emerald-600' : net < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {net === 0
                                  ? <span className="text-xs font-normal text-gray-400">완료</span>
                                  : preferredCurrency !== 'KRW' && rates[preferredCurrency]
                                    ? <>{net > 0 ? '+' : ''}{formatLocal(Math.round(Math.abs(net) / rates[preferredCurrency]), preferredCurrency)}</>
                                    : <>{net > 0 ? '+' : ''}{formatKRW(Math.abs(net))}</>
                                }
                              </span>
                              {net !== 0 && (preferredCurrency !== 'KRW' && rates[preferredCurrency]
                                ? <span className="text-[10px] text-gray-400">{net > 0 ? '+' : ''}{formatKRW(Math.abs(net))}</span>
                                : primaryCurrency !== 'KRW' && rates[primaryCurrency] && <span className="text-[10px] text-gray-400">약 {net > 0 ? '+' : ''}{formatLocal(Math.round(Math.abs(net) / rates[primaryCurrency]), primaryCurrency)}</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-gray-900 block">
                                {preferredCurrency !== 'KRW' && rates[preferredCurrency]
                                  ? formatLocal(Math.round(spent / rates[preferredCurrency]), preferredCurrency)
                                  : (formatKRW(Math.round(spent)) || '0원')}
                              </span>
                              {preferredCurrency !== 'KRW' && rates[preferredCurrency]
                                ? <span className="text-[10px] text-gray-400">{formatKRW(Math.round(spent))}</span>
                                : primaryCurrency !== 'KRW' && rates[primaryCurrency] && <span className="text-[10px] text-gray-400">약 {formatLocal(Math.round(spent / rates[primaryCurrency]), primaryCurrency)}</span>
                              }
                            </>
                          )}
                        </div>
                      </button>

                      {/* 아코디언: 결제 + 참여 항목 상세 */}
                      {isExpanded && (
                        <div className="px-3 pb-3 flex flex-col gap-3 border-t border-blue-100/60 pt-2.5">
                          {/* 💳 결제한 항목 */}
                          <div>
                            <p className="text-[10px] font-bold text-blue-500 mb-1.5">💳 결제한 항목</p>
                            {paidItems.length === 0 ? (
                              <p className="text-[11px] text-gray-400 pl-0.5">결제 기록 없음</p>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {paidItems.map((pi, pii) => (
                                  <div key={pii} className="flex items-center gap-2">
                                    <span className="flex-shrink-0 text-[11px]">
                                      {pi.type === 'flight' ? '✈️' : pi.type === 'acc' ? '🏨' : '📍'}
                                    </span>
                                    <span className="flex-1 text-[11px] text-gray-700 truncate">{pi.name}</span>
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-[11px] font-semibold text-gray-800 block">{formatKRW(pi.krw)}</span>
                                      <span className="text-[10px] text-gray-400">1인 {formatKRW(Math.round(pi.perPersonKrw))} · {pi.participantCount}명</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 👥 참여한 항목 */}
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 mb-1.5">👥 참여한 항목</p>
                            {participatedItems.length === 0 ? (
                              <p className="text-[11px] text-gray-400 pl-0.5">참여 기록 없음</p>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {participatedItems.map((pi, pii) => (
                                  <div key={pii} className="flex items-center gap-2">
                                    <span className="flex-shrink-0 text-[11px]">
                                      {pi.type === 'flight' ? '✈️' : pi.type === 'acc' ? '🏨' : '📍'}
                                    </span>
                                    <span className="flex-1 text-[11px] text-gray-700 truncate">{pi.name}</span>
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-[11px] font-semibold text-gray-800 block">{formatKRW(Math.round(pi.perPersonKrw))}</span>
                                      <span className="text-[10px] text-gray-400">÷{pi.participantCount}명</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>


              {/* 금액 내역 breakdown — 비행기·숙소 고정 비용 있을 때만 표시 */}
              <div className="mt-1 pt-3 border-t border-gray-100 flex flex-col gap-2">
                {settlementFixedKRW > 0 && (
                  <>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">금액 내역</p>

                    {/* 일정 합계 */}
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px]">📋</span>
                        일정 합계
                      </span>
                      <div className="text-right">
                        <span className="text-[12px] font-semibold text-gray-700 block">{formatKRW(totalSpent)}</span>
                        {primaryCurrency !== 'KRW' && rates[primaryCurrency] && totalSpent > 0 && (
                          <p className="text-[10px] text-gray-400">약 {formatLocal(Math.round(totalSpent / rates[primaryCurrency]), primaryCurrency)}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* 비행기 — 입력 통화 그대로, 원화 환산 병기 */}
                {(meta.flights ?? []).filter(f => f.includeInSettlement && f.price).map(f => {
                  const currency = f.currency ?? 'KRW'
                  const krw = toKRW(f.price!, currency, rates)
                  const isKRW = currency === 'KRW'
                  return (
                    <div key={f.id} className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500 flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                          <Plane className="w-2.5 h-2.5 text-sky-600" />
                        </span>
                        <span className="truncate">{f.name}</span>
                      </span>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-[12px] font-semibold text-sky-600 block">{formatKRW(krw)}</span>
                        {!isKRW && <p className="text-[10px] text-gray-400">{CURRENCY_SYMBOLS[currency] ?? currency}{f.price!.toLocaleString()}</p>}
                      </div>
                    </div>
                  )
                })}

                {/* 숙소 */}
                {(meta.accommodations ?? []).filter(a => a.includeInSettlement && a.price).map(a => {
                  const currency = a.currency ?? 'KRW'
                  const krw = toKRW(a.price!, currency, rates)
                  const isKRW = currency === 'KRW'
                  return (
                    <div key={a.id} className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500 flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <BedDouble className="w-2.5 h-2.5 text-amber-600" />
                        </span>
                        <span className="truncate">{a.name}</span>
                      </span>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-[12px] font-semibold text-amber-600 block">{formatKRW(krw)}</span>
                        {!isKRW && <p className="text-[10px] text-gray-400">{CURRENCY_SYMBOLS[currency] ?? currency}{a.price!.toLocaleString()}</p>}
                      </div>
                    </div>
                  )
                })}

                {/* 총합계 */}
                <div className="pt-2.5 mt-0.5 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-gray-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> 합계
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 block">
                      {formatKRW(totalSpent + settlementFixedKRW)}
                    </span>
                    {primaryCurrency !== 'KRW' && rates[primaryCurrency] && (totalSpent + settlementFixedKRW) > 0 && (
                      <span className="text-[11px] text-gray-400">
                        약 {formatLocal(Math.round((totalSpent + settlementFixedKRW) / rates[primaryCurrency]), primaryCurrency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 영수증 라이트박스 ── */}
      {lightbox && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85"
          onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.receipts[lightbox.idx]}
              alt="영수증"
              className="w-full rounded-2xl object-contain max-h-[80dvh]"
            />
            {lightbox.receipts.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {lightbox.receipts.map((_, i) => (
                  <button key={i} onClick={() => setLightbox(l => l && ({ ...l, idx: i }))}
                    className={`w-2 h-2 rounded-full transition-all ${i === lightbox.idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
                ))}
              </div>
            )}
            {lightbox.idx > 0 && (
              <button onClick={() => setLightbox(l => l && ({ ...l, idx: l.idx - 1 }))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {lightbox.idx < lightbox.receipts.length - 1 && (
              <button onClick={() => setLightbox(l => l && ({ ...l, idx: l.idx + 1 }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      )}
      {/* ── 비행기 수정 모달 ── */}
      {editingFlight && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingFlight(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 shadow-2xl p-6 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto overflow-x-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">비행기 수정</h3>
              <button onClick={() => setEditingFlight(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-gray-600">항공명 (공항 검색)</label>
              <input ref={editFlightInputRef} type="text" value={editingFlight.name}
                onChange={e => setEditingFlight({ ...editingFlight, name: e.target.value })}
                placeholder="공항명 검색..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-gray-600">종류</label>
              <div className="flex gap-2">
                {(['inbound', 'outbound'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setEditingFlight({ ...editingFlight, type: t })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${editingFlight.type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>
                    {t === 'inbound' ? '입국' : '출국'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-gray-600">날짜</label>
              <select value={editingFlight.dayId}
                onChange={e => setEditingFlight({ ...editingFlight, dayId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                {days.map(d => <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-[11px] font-semibold text-gray-500">출발 시간</label>
                <input type="time" value={editingFlight.departTime}
                  onChange={e => setEditingFlight({ ...editingFlight, departTime: e.target.value })}
                  className="w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all appearance-none" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-[11px] font-semibold text-gray-500">도착 시간</label>
                <input type="time" value={editingFlight.arriveTime}
                  onChange={e => setEditingFlight({ ...editingFlight, arriveTime: e.target.value })}
                  className="w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all appearance-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-gray-600">예상 비용 (선택)</label>
              <div className="flex gap-2">
                <select
                  value={editingFlight.currency ?? primaryCurrency}
                  onChange={e => setEditingFlight({ ...editingFlight, currency: e.target.value })}
                  className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                  {[primaryCurrency, ...Object.keys(CURRENCY_SYMBOLS).filter(c => c !== primaryCurrency)].map(c => (
                    <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c} {CURRENCY_NAMES[c] ? `· ${CURRENCY_NAMES[c]}` : ''}</option>
                  ))}
                </select>
                <input type="number" placeholder="0"
                  value={editingFlight.price ?? ''}
                  onChange={e => setEditingFlight({ ...editingFlight, price: Number(e.target.value) || undefined })}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
              </div>
              {!!editingFlight.price && (
                <label className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer select-none">
                  <input type="checkbox"
                    checked={editingFlight.includeInSettlement !== false}
                    onChange={e => setEditingFlight({ ...editingFlight, includeInSettlement: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-gray-700">정산에 포함</span>
                </label>
              )}
              {!!editingFlight.price && editingFlight.includeInSettlement !== false && (meta?.members ?? []).filter(m => !m.left).length > 1 && (() => {
                const activeMembers = (meta?.members ?? []).filter(m => !m.left)
                return (
                  <>
                    {/* 참여 인원 */}
                    <div className="flex flex-col gap-1.5">
                      <button type="button"
                        onClick={() => setShowParticipantsFlight(v => !v)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors">
                        <span>참여 인원 <span className="text-gray-400">(미선택 시 전원)</span>
                          {(editingFlight.participantIds?.length ?? 0) > 0 && (
                            <span className="ml-1.5 font-semibold text-blue-600">{editingFlight.participantIds!.length}명</span>
                          )}
                        </span>
                        <span className="text-gray-400 text-[10px]">{showParticipantsFlight ? '▲' : '▼'}</span>
                      </button>
                      {showParticipantsFlight && (
                        <div className="flex gap-2 flex-wrap px-1">
                          {activeMembers.map(m => {
                            const selected = (editingFlight.participantIds ?? []).includes(m.id)
                            return (
                              <button key={m.id} type="button"
                                onClick={() => {
                                  const ids = editingFlight.participantIds ?? []
                                  const newIds = selected ? ids.filter(id => id !== m.id) : [...ids, m.id]
                                  setEditingFlight({ ...editingFlight, participantIds: newIds.length > 0 ? newIds : undefined })
                                }}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? 'border-blue-400 bg-blue-50/60' : 'border-gray-100 opacity-50 hover:opacity-75'}`}>
                                <PersonAvatar name={m.name} photoURL={m.photoURL} size={32} colorIndex={m.hexColor ? undefined : (m.colorIndex ?? 0)} hexColor={m.hexColor} ringColor={m.photoURL ? (m.hexColor ?? CLAY[(m.colorIndex ?? 0) % CLAY.length]?.base) : undefined} />
                                <span className="text-[10px] font-semibold text-gray-700 max-w-[48px] truncate">{m.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {/* 결제자 */}
                    <div className="flex flex-col gap-1.5">
                      <button type="button"
                        onClick={() => setShowPayerFlight(v => !v)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors">
                        <span>결제자 <span className="text-gray-400">(선택)</span>
                          {editingFlight.payerId && (() => {
                            const m = activeMembers.find(m => m.id === editingFlight.payerId)
                            return m ? <span className="ml-1.5 font-semibold text-emerald-600">{m.name}</span> : null
                          })()}
                        </span>
                        <span className="text-gray-400 text-[10px]">{showPayerFlight ? '▲' : '▼'}</span>
                      </button>
                      {showPayerFlight && (
                        <div className="flex gap-2 flex-wrap px-1">
                          {activeMembers.map(m => {
                            const selected = editingFlight.payerId === m.id
                            return (
                              <button key={m.id} type="button"
                                onClick={() => setEditingFlight({ ...editingFlight, payerId: selected ? undefined : m.id })}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? 'border-emerald-400 bg-emerald-50/60' : 'border-gray-100 opacity-50 hover:opacity-75'}`}>
                                <PersonAvatar name={m.name} photoURL={m.photoURL} size={32} colorIndex={m.hexColor ? undefined : (m.colorIndex ?? 0)} hexColor={m.hexColor} ringColor={m.photoURL ? (m.hexColor ?? CLAY[(m.colorIndex ?? 0) % CLAY.length]?.base) : undefined} />
                                <span className="text-[10px] font-semibold text-gray-700 max-w-[48px] truncate">{m.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
            <button onClick={() => handleUpdateFlight(editingFlight)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
              저장
            </button>
          </div>
        </div>
      )}

      {/* ── 숙소 수정 모달 ── */}
      {editingAcc && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingAcc(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 shadow-2xl p-6 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto overflow-x-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">숙소 수정</h3>
              <button onClick={() => setEditingAcc(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-gray-600">숙소명 (숙소 검색)</label>
              <input ref={editAccInputRef} type="text" value={editingAcc.name}
                onChange={e => setEditingAcc({ ...editingAcc, name: e.target.value })}
                placeholder="호텔·숙소명 검색..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-[12px] font-semibold text-gray-600">체크인 날짜</label>
                <select value={editingAcc.checkInDayId}
                  onChange={e => setEditingAcc({ ...editingAcc, checkInDayId: e.target.value })}
                  className="w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                  {days.map(d => <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-[12px] font-semibold text-gray-600">체크인 시간</label>
                <input type="time" value={editingAcc.checkInTime}
                  onChange={e => setEditingAcc({ ...editingAcc, checkInTime: e.target.value })}
                  className="w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all appearance-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-[12px] font-semibold text-gray-600">체크아웃 날짜</label>
                <select value={editingAcc.checkOutDayId}
                  onChange={e => setEditingAcc({ ...editingAcc, checkOutDayId: e.target.value })}
                  className="w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                  {days.map(d => <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-[12px] font-semibold text-gray-600">체크아웃 시간</label>
                <input type="time" value={editingAcc.checkOutTime}
                  onChange={e => setEditingAcc({ ...editingAcc, checkOutTime: e.target.value })}
                  className="w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all appearance-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-gray-600">예상 비용 (선택)</label>
              <div className="flex gap-2">
                <select
                  value={editingAcc.currency ?? primaryCurrency}
                  onChange={e => setEditingAcc({ ...editingAcc, currency: e.target.value })}
                  className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white">
                  {[primaryCurrency, ...Object.keys(CURRENCY_SYMBOLS).filter(c => c !== primaryCurrency)].map(c => (
                    <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c} {CURRENCY_NAMES[c] ? `· ${CURRENCY_NAMES[c]}` : ''}</option>
                  ))}
                </select>
                <input type="number" placeholder="0"
                  value={editingAcc.price ?? ''}
                  onChange={e => setEditingAcc({ ...editingAcc, price: Number(e.target.value) || undefined })}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
              </div>
              {!!editingAcc.price && (
                <label className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer select-none">
                  <input type="checkbox"
                    checked={editingAcc.includeInSettlement !== false}
                    onChange={e => setEditingAcc({ ...editingAcc, includeInSettlement: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-gray-700">정산에 포함</span>
                </label>
              )}
              {!!editingAcc.price && editingAcc.includeInSettlement !== false && (meta?.members ?? []).filter(m => !m.left).length > 1 && (() => {
                const activeMembers = (meta?.members ?? []).filter(m => !m.left)
                return (
                  <>
                    {/* 참여 인원 */}
                    <div className="flex flex-col gap-1.5">
                      <button type="button"
                        onClick={() => setShowParticipantsAcc(v => !v)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors">
                        <span>참여 인원 <span className="text-gray-400">(미선택 시 전원)</span>
                          {(editingAcc.participantIds?.length ?? 0) > 0 && (
                            <span className="ml-1.5 font-semibold text-blue-600">{editingAcc.participantIds!.length}명</span>
                          )}
                        </span>
                        <span className="text-gray-400 text-[10px]">{showParticipantsAcc ? '▲' : '▼'}</span>
                      </button>
                      {showParticipantsAcc && (
                        <div className="flex gap-2 flex-wrap px-1">
                          {activeMembers.map(m => {
                            const selected = (editingAcc.participantIds ?? []).includes(m.id)
                            return (
                              <button key={m.id} type="button"
                                onClick={() => {
                                  const ids = editingAcc.participantIds ?? []
                                  const newIds = selected ? ids.filter(id => id !== m.id) : [...ids, m.id]
                                  setEditingAcc({ ...editingAcc, participantIds: newIds.length > 0 ? newIds : undefined })
                                }}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? 'border-blue-400 bg-blue-50/60' : 'border-gray-100 opacity-50 hover:opacity-75'}`}>
                                <PersonAvatar name={m.name} photoURL={m.photoURL} size={32} colorIndex={m.hexColor ? undefined : (m.colorIndex ?? 0)} hexColor={m.hexColor} ringColor={m.photoURL ? (m.hexColor ?? CLAY[(m.colorIndex ?? 0) % CLAY.length]?.base) : undefined} />
                                <span className="text-[10px] font-semibold text-gray-700 max-w-[48px] truncate">{m.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {/* 결제자 */}
                    <div className="flex flex-col gap-1.5">
                      <button type="button"
                        onClick={() => setShowPayerAcc(v => !v)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors">
                        <span>결제자 <span className="text-gray-400">(선택)</span>
                          {editingAcc.payerId && (() => {
                            const m = activeMembers.find(m => m.id === editingAcc.payerId)
                            return m ? <span className="ml-1.5 font-semibold text-emerald-600">{m.name}</span> : null
                          })()}
                        </span>
                        <span className="text-gray-400 text-[10px]">{showPayerAcc ? '▲' : '▼'}</span>
                      </button>
                      {showPayerAcc && (
                        <div className="flex gap-2 flex-wrap px-1">
                          {activeMembers.map(m => {
                            const selected = editingAcc.payerId === m.id
                            return (
                              <button key={m.id} type="button"
                                onClick={() => setEditingAcc({ ...editingAcc, payerId: selected ? undefined : m.id })}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? 'border-emerald-400 bg-emerald-50/60' : 'border-gray-100 opacity-50 hover:opacity-75'}`}>
                                <PersonAvatar name={m.name} photoURL={m.photoURL} size={32} colorIndex={m.hexColor ? undefined : (m.colorIndex ?? 0)} hexColor={m.hexColor} ringColor={m.photoURL ? (m.hexColor ?? CLAY[(m.colorIndex ?? 0) % CLAY.length]?.base) : undefined} />
                                <span className="text-[10px] font-semibold text-gray-700 max-w-[48px] truncate">{m.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
            <button onClick={() => handleUpdateAccommodation(editingAcc)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
              저장
            </button>
          </div>
        </div>
      )}

      {showReport && user && (
        <ReportModal
          user={user}
          onClose={() => setShowReport(false)}
        />
      )}


    </div>
  )
}

export default function PlannerPage() {
  const { tripId } = useParams<{ tripId: string }>()
  return <AuthGuard><PlannerContent tripId={tripId} /></AuthGuard>
}
