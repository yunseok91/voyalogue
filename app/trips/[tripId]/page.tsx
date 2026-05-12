'use client'

import { useState, useMemo, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, MapPin, Plus, Minus, X, Clock,
  GripVertical, Star, CheckSquare, Wallet, ChevronRight,
  Edit2, Trash2, MoreHorizontal, Users, Map, Loader2,
  Share2, Crown, Link2, Copy, Check, Camera,
  Plane, BedDouble,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  MeasuringStrategy, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {
  onSnapshot, getDocs, doc, collection, getDoc,
  addDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { AuthGuard } from '@/components/AuthGuard'
import { TripMap, type MapItem, type AvatarMember } from '@/components/TripMap'
import { detectCurrencies, CURRENCY_SYMBOLS, CURRENCY_NAMES, ZERO_DECIMAL } from '@/lib/currencyMap'
import { getRatesInKRW, toKRW, formatLocal, formatKRW } from '@/lib/exchangeRate'
import { gradientStyle, THEME_COLORS } from '@/lib/tripGradient'
import { generateCode } from '@/lib/inviteCode'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'

/* ── 타입 ── */
type TimeSlot = '아침' | '점심' | '저녁' | '미정'
type Category = '식사' | '장소' | '쇼핑' | '교통' | '기타'

type PlanItem = {
  id:           string
  name:         string
  timeSlot:     TimeSlot
  cat:          Category
  price:        number
  currency:     string
  comment:      string
  order:        number
  lat:          number
  lng:          number
  rating:       number
  participants:    number
  participantIds?: string[]
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
}

type AccommodationItem = {
  id:             string
  name:           string
  checkInDayId:   string
  checkInTime:    string
  checkOutDayId:  string
  checkOutTime:   string
  lat?:           number
  lng?:           number
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
  members:         Member[]
  checklist?:      CheckItem[]
  flights?:        FlightItem[]
  accommodations?: AccommodationItem[]
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
  교통: 'bg-gray-100 text-gray-600',
  기타: 'bg-gray-100 text-gray-600',
}

const CAT_DOTS: Record<Category, string> = {
  식사: 'bg-orange-500',
  장소: 'bg-blue-500',
  쇼핑: 'bg-pink-500',
  교통: 'bg-gray-500',
  기타: 'bg-gray-400',
}

const SLOT_STYLES: Record<TimeSlot, string> = {
  아침: 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100',
  점심: 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100',
  저녁: 'border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100',
  미정: 'border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100',
}

const SLOT_DOT: Record<TimeSlot, string> = {
  아침: 'bg-amber-400',
  점심: 'bg-green-500',
  저녁: 'bg-violet-500',
  미정: 'bg-gray-400',
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

/* ── 별점 ── */
function StarRow({ rating, onChange }: { rating: number; onChange?: (v: number) => void }) {
  return (
    <span className="flex gap-0.5" onClick={e => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map(v => (
        <Star key={v}
          className={`w-3.5 h-3.5 transition-colors ${v <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'} ${onChange ? 'cursor-pointer' : ''}`}
          onClick={e => { e.stopPropagation(); onChange?.(v) }}
        />
      ))}
    </span>
  )
}

/* ── 아이템 행 ── */
function ItemRow({ item, onDelete, onEdit, onChangeCat, onRate, onFocusMap, onViewReceipts, onUploadReceipt, mapIndex, rates, totalPeople, dragHandleProps }: {
  item:              PlanItem
  onDelete:          (id: string) => void
  onEdit:            (item: PlanItem) => void
  onChangeCat:       (id: string, cat: Category) => void
  onRate:            (id: string, v: number) => void
  onFocusMap:        (id: string) => void
  onViewReceipts:    (receipts: string[]) => void
  onUploadReceipt?:  (files: FileList) => void
  mapIndex?:         number
  rates:             Record<string, number>
  totalPeople:       number
  dragHandleProps?:  Record<string, unknown>
}) {
  const [menu,         setMenu]         = useState(false)
  const [showCatPick,  setShowCatPick]  = useState(false)
  const [showPP,       setShowPP]       = useState(false)
  const catRef      = useRef<HTMLDivElement>(null)
  const menuRef     = useRef<HTMLDivElement>(null)
  const cameraRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!menu && !showCatPick) return
    const handler = (e: MouseEvent) => {
      if (catRef.current  && !catRef.current.contains(e.target as Node))  setShowCatPick(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menu, showCatPick])

  /* ÷N 툴팁 2.5초 후 자동 닫기 */
  useEffect(() => {
    if (!showPP) return
    const t = setTimeout(() => setShowPP(false), 2500)
    return () => clearTimeout(t)
  }, [showPP])

  const actualPart   = item.participantIds?.length ?? item.participants ?? totalPeople
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
              onClick={e => { e.stopPropagation(); setShowCatPick(v => !v); setMenu(false) }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full hover:opacity-75 transition-opacity ${CAT_COLORS[item.cat]}`}
            >
              {item.cat}
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
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메모 — 시각적으로 구분되는 스타일 */}
        {item.comment && (
          <div className="flex items-start gap-1.5 mb-1.5 mt-0.5">
            <span className="mt-[5px] w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
            <p className="text-xs text-slate-500 leading-snug italic">{item.comment}</p>
          </div>
        )}

        {/* 메타 행: 시간대 점 + 별점 + ÷N + 금액 */}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {/* 시간대 도트 (그룹 헤더와 대응) */}
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SLOT_DOT[item.timeSlot]}`}
            title={item.timeSlot}
          />

          {/* 별점 — stopPropagation은 StarRow 내부에서 처리 */}
          <StarRow rating={item.rating} onChange={v => onRate(item.id, v)} />

          {/* ÷N 배지 — 클릭 시 1인 금액 인라인 표시 */}
          {totalPeople > 1 && item.price > 0 && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowPP(v => !v) }}
              className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-all ${
                actualPart < totalPeople
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Users className="w-2.5 h-2.5 flex-shrink-0" />
              <span>÷{actualPart}</span>
              {showPP && perPersonKRW > 0 && (
                <span className="ml-0.5">= {formatKRW(perPersonKRW)}</span>
              )}
            </button>
          )}

          {item.price > 0 && (
            <span className="text-xs font-semibold text-emerald-600 ml-auto">
              {item.currency === 'KRW' ? formatKRW(item.price) : formatLocal(item.price, item.currency)}
            </span>
          )}

          {/* 사진 아이콘 — 항상 표시: 사진 없으면 회색(클릭 시 업로드), 있으면 보라색+개수(클릭 시 라이트박스) */}
          {(() => {
            const hasReceipts = !!(item.receipts && item.receipts.length > 0)
            return (
              <>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    if (hasReceipts) onViewReceipts(item.receipts!)
                    else cameraRef.current?.click()
                  }}
                  className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-colors flex-shrink-0 ${
                    hasReceipts
                      ? 'text-violet-600 bg-violet-50 hover:bg-violet-100'
                      : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Camera className="w-2.5 h-2.5" />
                  {hasReceipts && <span>{item.receipts!.length}</span>}
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
            )
          })()}
        </div>
      </div>

      {/* 더보기 메뉴 */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={e => { e.stopPropagation(); setMenu(v => !v); setShowCatPick(false) }}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menu && (
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-28">
            <button
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={e => { e.stopPropagation(); onEdit(item); setMenu(false) }}
            >
              <Edit2 className="w-3.5 h-3.5" /> 수정
            </button>
            <button
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              onClick={e => { e.stopPropagation(); onDelete(item.id); setMenu(false) }}
            >
              <Trash2 className="w-3.5 h-3.5" /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sortable 아이템 행 ── */
function SortableItemRow({ item, onDelete, onEdit, onChangeCat, onRate, onFocusMap, onViewReceipts, onUploadReceipt, mapIndex, rates, totalPeople }: {
  item:             PlanItem
  onDelete:         (id: string) => void
  onEdit:           (item: PlanItem) => void
  onChangeCat:      (id: string, cat: Category) => void
  onRate:           (id: string, v: number) => void
  onFocusMap:       (id: string) => void
  onViewReceipts:   (receipts: string[]) => void
  onUploadReceipt?: (files: FileList) => void
  mapIndex?:        number
  rates:            Record<string, number>
  totalPeople:      number
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
        onDelete={onDelete}
        onEdit={onEdit}
        onChangeCat={onChangeCat}
        onRate={onRate}
        onFocusMap={onFocusMap}
        onViewReceipts={onViewReceipts}
        onUploadReceipt={onUploadReceipt}
        mapIndex={mapIndex}
        rates={rates}
        totalPeople={totalPeople}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

/* ── 장소 추가 패널 ── */
type AddMode = 'normal' | 'flight' | 'accommodation'

function AddItemPanel({ onAdd, onClose, defaultCurrency, currencies, people, members, uid, tripId, days, activeDayId, onAddFlight, onAddAccommodation }: {
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
  onAddFlight:          (f: Omit<FlightItem, 'id'>) => void
  onAddAccommodation:   (a: Omit<AccommodationItem, 'id'>) => void
}) {
  const { avatarColor, avatarHexColor, user: authUser } = useAuthStore()
  const [mode,           setMode]           = useState<AddMode>('normal')
  const [successMsg,     setSuccessMsg]     = useState('')
  const [name,           setName]           = useState('')
  const [timeSlot,       setTimeSlot]       = useState<TimeSlot>('미정')
  const [cat,            setCat]            = useState<Category>('장소')
  const [price,          setPrice]          = useState('')
  const [currency,       setCurrency]       = useState(defaultCurrency)
  const [comment,        setComment]        = useState('')
  const [lat,            setLat]            = useState<number | null>(null)
  const [lng,            setLng]            = useState<number | null>(null)
  const [participantIds, setParticipantIds] = useState<string[]>(members.map(m => m.id))
  const [receiptFiles,    setReceiptFiles]    = useState<File[]>([])
  const [receiptPreviews, setReceiptPreviews] = useState<string[]>([])
  const [uploading,       setUploading]       = useState(false)
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
    let ac: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!accInputRef.current) return
      ac = new google.maps.places.Autocomplete(accInputRef.current, {
        fields: ['name', 'geometry'],
        types: ['lodging'],
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

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 2000)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'flight') {
      if (!flightName.trim()) return
      if (!inEnabled && !outEnabled) return
      const loc = flightLat !== null ? { lat: flightLat, lng: flightLng ?? 0 } : {}
      if (inEnabled)  onAddFlight({ name: flightName.trim(), type: 'inbound',  dayId: inDayId,  departTime: inDepart,  arriveTime: inArrive,  ...loc })
      if (outEnabled) onAddFlight({ name: flightName.trim(), type: 'outbound', dayId: outDayId, departTime: outDepart, arriveTime: outArrive, ...loc })
      setFlightName(''); setInDepart(''); setInArrive(''); setOutDepart(''); setOutArrive('')
      setFlightLat(null); setFlightLng(null)
      showSuccess('비행기가 등록되었습니다'); return
    }
    if (mode === 'accommodation') {
      if (!accName.trim()) return
      onAddAccommodation({ name: accName.trim(), checkInDayId, checkInTime, checkOutDayId, checkOutTime,
        ...(accLat !== null ? { lat: accLat, lng: accLng ?? 0 } : {}) })
      setAccName(''); setCheckInTime(''); setCheckOutTime(''); setAccLat(null); setAccLng(null)
      showSuccess('숙소가 등록되었습니다'); return
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
      ...(receiptURLs.length > 0 ? { receipts: receiptURLs } : {}),
    })
    setName(''); setPrice(''); setComment(''); setLat(null); setLng(null)
    setReceiptFiles([]); setReceiptPreviews([]); setUploading(false)
    showSuccess('일정이 등록되었습니다')
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
  const selectCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white"

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">일정 추가</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 등록 성공 토스트 */}
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

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

        <form onSubmit={submit} className="flex flex-col gap-4">

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
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500">출발 시간</label>
                        <input type="time" value={inDepart} onChange={e => setInDepart(e.target.value)} className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500">도착 시간</label>
                        <input type="time" value={inArrive} onChange={e => setInArrive(e.target.value)} className={inputCls} />
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
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500">출발 시간</label>
                        <input type="time" value={outDepart} onChange={e => setOutDepart(e.target.value)} className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500">도착 시간</label>
                        <input type="time" value={outArrive} onChange={e => setOutArrive(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button type="submit" disabled={!flightName.trim() || (!inEnabled && !outEnabled)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">
                비행기 추가
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
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-gray-600">체크인 날짜</label>
                  <select value={checkInDayId} onChange={e => setCheckInDayId(e.target.value)} className={selectCls}>
                    {days.map(d => (
                      <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-gray-600">체크인 시간</label>
                  <input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-gray-600">체크아웃 날짜</label>
                  <select value={checkOutDayId} onChange={e => setCheckOutDayId(e.target.value)} className={selectCls}>
                    {days.map(d => (
                      <option key={d.dayId} value={d.dayId}>{d.label} · {d.date.slice(5).replace('-', '/')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-gray-600">체크아웃 시간</label>
                  <input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} className={inputCls} />
                </div>
              </div>
              <button type="submit" disabled={!accName.trim()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">
                숙소 추가
              </button>
            </>
          )}

          {/* ── 일반 일정 폼 ── */}
          {mode === 'normal' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-gray-600">
                  장소명 * {lat !== null && <span className="text-blue-500 font-normal">위치 확인됨</span>}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="장소 검색 (예: 센소지, Tsujihan…)"
                  value={name}
                  onChange={e => { setName(e.target.value); setLat(null); setLng(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-gray-600">시간대</label>
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
                      }`}>{c}</button>
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
                      const photoURL = m.role === 'owner' ? (authUser?.photoURL ?? m.photoURL) : m.photoURL
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
                          <PersonAvatar name={m.name} size={28} colorIndex={ci} hexColor={hexC} photoURL={photoURL ?? undefined} />
                          <span className="text-[9px] font-semibold text-gray-700 max-w-[44px] truncate">{m.name}</span>
                        </button>
                      )
                    })}
                  </div>
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
      </div>
    </div>
  )
}

/* ── 아이템 수정 패널 ── */
function EditItemPanel({ item, onUpdate, onClose, currencies, people, members, uid, tripId }: {
  item:      PlanItem
  onUpdate:  (id: string, updates: Partial<Omit<PlanItem, 'id' | 'order'>>) => Promise<void>
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
  const [cat,            setCat]            = useState<Category>(item.cat)
  const [price,          setPrice]          = useState(item.price > 0 ? String(item.price) : '')
  const [currency,       setCurrency]       = useState(item.currency)
  const [comment,        setComment]        = useState(item.comment)
  const [lat,            setLat]            = useState<number>(item.lat)
  const [lng,            setLng]            = useState<number>(item.lng)
  const [participantIds, setParticipantIds] = useState<string[]>(
    item.participantIds ?? members.map(m => m.id)
  )
  const [saving,         setSaving]         = useState(false)
  const [receipts,     setReceipts]     = useState<string[]>(item.receipts ?? [])
  const [newFiles,     setNewFiles]     = useState<File[]>([])
  const [newPreviews,  setNewPreviews]  = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

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
      price: Number(price) || 0, currency,
      comment, lat, lng,
      participants: participantIds.length || people,
      participantIds,
      receipts: finalReceipts.length > 0 ? finalReceipts : [],
    })
    setSaving(false)
    onClose()
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
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-gray-600">시간대</label>
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
                  {c}
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
                  const photoURL = m.role === 'owner' ? (authUser?.photoURL ?? m.photoURL) : m.photoURL
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
                      <PersonAvatar name={m.name} size={28} colorIndex={ci} hexColor={hexC} photoURL={photoURL ?? undefined} />
                      <span className="text-[9px] font-semibold text-gray-700 max-w-[44px] truncate">{m.name}</span>
                    </button>
                  )
                })}
              </div>
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

          <button type="submit" disabled={!ok || saving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />저장 중…</>
              : '저장'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── 플래너 본체 ── */
function PlannerContent({ tripId }: { tripId: string }) {
  const { user, avatarColor, avatarHexColor } = useAuthStore()
  const uid = user!.uid

  /* 여행 메타 */
  const [meta,        setMeta]        = useState<TripMeta | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)

  /* 일별 아이템 */
  const [dayItems,    setDayItems]    = useState<Record<string, PlanItem[]>>({})
  const unsubsRef = useRef<Record<string, () => void>>({})

  /* UI 상태 */
  const [activeDayIdx,  setActiveDayIdx]  = useState(0)
  const [showAdd,       setShowAdd]       = useState(false)
  const [editItem,      setEditItem]      = useState<PlanItem | null>(null)
  const [showChecklist, setChecklist]     = useState(false)
  const [mobileTab,     setMobileTab]     = useState<'schedule' | 'map'>('schedule')
  const [mapMounted,    setMapMounted]    = useState(false)  // lazy mount — 처음 지도 탭 열릴 때 true
  const [showEdit,      setShowEdit]      = useState(false)
  const [editForm,      setEditForm]      = useState({ title: '', startDate: '', endDate: '', people: 1 })
  const [editSaving,    setEditSaving]    = useState(false)
  const [checkInput,    setCheckInput]    = useState('')
  const [checkEditId,   setCheckEditId]   = useState<string | null>(null)
  const [checkEditVal,  setCheckEditVal]  = useState('')
  const [showMembers,   setShowMembers]   = useState(false)
  const [copied,        setCopied]        = useState<'view' | 'edit' | null>(null)
  const [copiedMember,  setCopiedMember]  = useState<string | null>(null)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmoji,setNewMemberEmoji]= useState('😊')
  const [colorPickForId,  setColorPickForId]  = useState<string | null>(null)
  const [colorPickHex,    setColorPickHex]    = useState('')
  const [lightbox,        setLightbox]        = useState<{ receipts: string[]; idx: number } | null>(null)
  const [showSettlement,  setShowSettlement]  = useState(false)

  /* 환율 */
  const [rates, setRates] = useState<Record<string, number>>({ KRW: 1 })

  /* 지도 포커스 */
  const [focusItemId, setFocusItemId] = useState<string | undefined>(undefined)

  const handleFocusMap = (itemId: string) => {
    setFocusItemId(itemId)
    setMobileTab('map')
  }

  /* DnD — restrictToFirstScrollableAncestor: 스크롤 상단 이동 버그 방지 */
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  /* ── 데스크톱에서는 지도 즉시 마운트 ── */
  useEffect(() => {
    if (window.innerWidth >= 1024) setMapMounted(true)
  }, [])

  /* ── 여행 메타 1회 로드 ── */
  useEffect(() => {
    getDoc(doc(db, 'users', uid, 'trips', tripId))
      .then(snap => { if (snap.exists()) setMeta(snap.data() as TripMeta) })
      .catch(() => {})
      .finally(() => setMetaLoading(false))
  }, [uid, tripId])

  /* ── shareIndex 지연 등록 (기존 여행 마이그레이션 포함) ── */
  useEffect(() => {
    if (!meta) return
    setDoc(doc(db, 'shareIndex', meta.viewCode), { uid, tripId, canEdit: false })
    setDoc(doc(db, 'shareIndex', meta.editCode), { uid, tripId, canEdit: true })
  }, [meta?.viewCode, meta?.editCode])

  /* ── 통화 감지 & 환율 로드 ── */
  const tripCurrencies = useMemo(
    () => meta ? detectCurrencies(meta.city) : ['KRW'],
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

  /* ── 당일 자동 선택 (여행 기간 내인 경우) ── */
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (!days.length || autoSelectedRef.current) return
    const today = new Date().toISOString().slice(0, 10)
    const idx   = days.findIndex(d => d.date === today)
    if (idx !== -1) {
      setActiveDayIdx(idx)
      autoSelectedRef.current = true
    } else if (days.length > 0) {
      autoSelectedRef.current = true
    }
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

  /* ── 비활성 Day items 1회 로드 ── */
  useEffect(() => {
    if (!days.length) return
    const inactiveDays = days.filter((_, i) => i !== activeDayIdx)
    Promise.all(
      inactiveDays.map(day =>
        getDocs(collection(db, 'users', uid, 'trips', tripId, 'days', day.dayId, 'items'))
          .then(snap => ({ dayId: day.dayId, items: snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanItem[] }))
      )
    ).then(results => {
      setDayItems(prev => {
        const next = { ...prev }
        results.forEach(r => { next[r.dayId] = r.items })
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
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanItem[]
      setDayItems(prev => ({ ...prev, [day.dayId]: items }))
    })
    unsubsRef.current[day.dayId] = unsub

    return () => { Object.values(unsubsRef.current).forEach(u => u()) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDayIdx, uid, tripId])

  const activeDay    = days[activeDayIdx]
  const currentItems = activeDay ? (dayItems[activeDay.dayId] ?? []) : []

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
    Object.values(dayItems).flat().forEach(item => {
      const krw = toKRW(item.price, item.currency, rates)
      if (krw === 0) return
      if (item.participantIds && item.participantIds.length > 0) {
        const share = krw / item.participantIds.length
        item.participantIds.forEach(id => { if (result[id] !== undefined) result[id] += share })
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

  const avgPerPerson = (meta?.members?.length ?? 1) > 1 && totalSpent > 0
    ? totalSpent / (meta?.members?.length ?? 1)
    : 0

  const daySpent = currentItems.reduce((s, i) => s + toKRW(i.price, i.currency, rates), 0)
  const budgetPct = meta ? Math.min(100, Math.round((totalSpent / (meta.budget || 1)) * 100)) : 0

  /* ── 아이템 추가 ── */
  const handleAdd = async (partial: Omit<PlanItem, 'id' | 'order'>) => {
    if (!activeDay) return
    await setDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId),
      { label: activeDay.label, date: activeDay.date },
      { merge: true }
    )
    await addDoc(
      collection(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items'),
      { ...partial, order: currentItems.length, createdAt: serverTimestamp() }
    )
  }

  /* ── 아이템 삭제 ── */
  const handleDelete = async (itemId: string) => {
    if (!activeDay) return
    await deleteDoc(doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId))
  }

  /* ── 아이템 수정 (범용) ── */
  const handleUpdate = async (itemId: string, updates: Partial<Omit<PlanItem, 'id' | 'order'>>) => {
    if (!activeDay) return
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId),
      updates
    )
  }

  /* ── 카테고리 빠른 변경 ── */
  const handleChangeCat = async (itemId: string, cat: Category) => {
    if (!activeDay) return
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId),
      { cat }
    )
  }

  /* ── 드래그 후 순서 변경 ── */
  const handleReorder = async (activeId: string, overId: string) => {
    if (!activeDay) return
    const sorted = [...currentItems].sort((a, b) => a.order - b.order)
    const oldIdx = sorted.findIndex(i => i.id === activeId)
    const newIdx = sorted.findIndex(i => i.id === overId)
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return

    const reordered = arrayMove(sorted, oldIdx, newIdx)
    const batch     = writeBatch(db)
    reordered.forEach((item, idx) => {
      batch.update(
        doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', item.id),
        { order: idx }
      )
    })
    await batch.commit()
  }

  /* ── 별점 ── */
  const handleRate = (itemId: string, rating: number) => handleUpdate(itemId, { rating })

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
    await updateDoc(
      doc(db, 'users', uid, 'trips', tripId, 'days', activeDay.dayId, 'items', itemId),
      { receipts: [...existing, ...newURLs] }
    )
  }

  /* ── 비행기 / 숙소 고정 일정 ── */
  const handleAddFlight = async (f: Omit<FlightItem, 'id'>) => {
    if (!meta) return
    const newFlight: FlightItem = { ...f, id: generateCode(8) }
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), {
      flights: [...(meta.flights ?? []), newFlight],
    })
  }

  const handleDeleteFlight = async (id: string) => {
    if (!meta) return
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), {
      flights: (meta.flights ?? []).filter(f => f.id !== id),
    })
  }

  const handleAddAccommodation = async (a: Omit<AccommodationItem, 'id'>) => {
    if (!meta) return
    const newAcc: AccommodationItem = { ...a, id: generateCode(8) }
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), {
      accommodations: [...(meta.accommodations ?? []), newAcc],
    })
  }

  const handleDeleteAccommodation = async (id: string) => {
    if (!meta) return
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), {
      accommodations: (meta.accommodations ?? []).filter(a => a.id !== id),
    })
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

  const addMember = async () => {
    if (!newMemberName.trim() || !meta) return
    if ((meta.members ?? []).length >= (meta.people || 1)) return
    const members = [...(meta.members ?? []), {
      id: generateCode(6), name: newMemberName.trim(), role: 'member' as const,
    }]
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { members })
    setMeta({ ...meta, members })
    setNewMemberName('')
  }

  const removeMember = async (id: string) => {
    if (!meta) return
    const members = meta.members.filter(m => m.id !== id)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { members })
    setMeta({ ...meta, members })
  }

  const setTreasurer = async (id: string) => {
    if (!meta) return
    const isAlready = meta.members.find(m => m.id === id)?.role === 'treasurer'
    const newEditCode = isAlready ? meta.editCode : generateCode()
    const members = meta.members.map(m => ({
      ...m,
      role: m.role === 'owner' ? 'owner' as const
          : m.id === id && !isAlready ? 'treasurer' as const
          : 'member' as const,
    }))
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), {
      members,
      ...(isAlready ? {} : { editCode: newEditCode }),
    })
    if (!isAlready) {
      await setDoc(doc(db, 'shareIndex', newEditCode), { uid, tripId, canEdit: true })
    }
    setMeta({ ...meta, members, ...(!isAlready ? { editCode: newEditCode } : {}) })
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

  const copyMemberInvite = async (memberId: string) => {
    if (!meta) return
    const member = meta.members.find(m => m.id === memberId)
    if (!member) return

    let inviteCode = member.inviteCode
    if (!inviteCode) {
      inviteCode = generateCode(12)
      const members = meta.members.map(m =>
        m.id === memberId ? { ...m, inviteCode } : m
      )
      await Promise.all([
        updateDoc(doc(db, 'users', uid, 'trips', tripId), { members }),
        setDoc(doc(db, 'memberInvites', inviteCode), {
          ownerUid: uid, tripId, memberId, viewCode: meta.viewCode,
        }),
      ])
      setMeta({ ...meta, members })
    }

    const url = `${window.location.origin}/invite/${inviteCode}`
    await navigator.clipboard.writeText(url)
    setCopiedMember(memberId)
    setTimeout(() => setCopiedMember(null), 2000)
  }

  /* ── 여행 정보 편집 ── */
  const openEdit = () => {
    if (!meta) return
    setEditForm({ title: meta.title ?? '', startDate: meta.startDate, endDate: meta.endDate, people: meta.people || 1 })
    setShowEdit(true)
  }

  const handleEditSave = async () => {
    if (!editForm.startDate || !editForm.endDate) return
    const start  = new Date(editForm.startDate)
    const end    = new Date(editForm.endDate)
    const nights = Math.round((end.getTime() - start.getTime()) / 86400000)
    if (nights < 0) return
    const daysCount = nights + 1

    setEditSaving(true)
    const batch = writeBatch(db)
    batch.update(doc(db, 'users', uid, 'trips', tripId), {
      title: editForm.title.trim() || null,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      nights, days: daysCount,
      people: Math.max(1, editForm.people),
    })
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      batch.set(
        doc(db, 'users', uid, 'trips', tripId, 'days', `d${i + 1}`),
        { label: `Day ${i + 1}`, date: d.toISOString().slice(0, 10) },
        { merge: true }
      )
    }
    await batch.commit()
    setEditSaving(false)
    setShowEdit(false)
  }

  /* ── 체크리스트 ── */
  const checkItems = meta?.checklist ?? []

  const toggleCheck = async (id: string) => {
    if (!meta) return
    const updated = checkItems.map(c => c.id === id ? { ...c, done: !c.done } : c)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist: updated })
  }

  const addCheckItem = async () => {
    if (!checkInput.trim() || !meta) return
    const updated = [...checkItems, { id: `${Date.now()}`, label: checkInput.trim(), done: false }]
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist: updated })
    setCheckInput('')
  }

  const deleteCheckItem = async (id: string) => {
    if (!meta) return
    const updated = checkItems.filter(c => c.id !== id)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist: updated })
  }

  const saveCheckEdit = async (id: string) => {
    if (!checkEditVal.trim() || !meta) return
    const updated = checkItems.map(c => c.id === id ? { ...c, label: checkEditVal.trim() } : c)
    await updateDoc(doc(db, 'users', uid, 'trips', tripId), { checklist: updated })
    setCheckEditId(null)
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
    const items: MapItem[] = sorted.map(i => ({ id: i.id, name: i.name, lat: i.lat, lng: i.lng, timeSlot: i.timeSlot }))

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
          items.push({ id: `${acc.id}_in`, name: `${acc.name} (체크인)`, lat: acc.lat, lng: acc.lng, timeSlot: '숙소', markerType: 'special' })
        } else if (acc.checkOutDayId === adId) {
          items.push({ id: `${acc.id}_out`, name: `${acc.name} (체크아웃)`, lat: acc.lat, lng: acc.lng, timeSlot: '숙소', markerType: 'special' })
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

  /* 지도 멤버 아바타 색상 목록 */
  const mapAvatarMembers = useMemo<AvatarMember[]>(() => {
    return (meta?.members ?? []).map((m, mi) => {
      const ci = m.role === 'owner'
        ? (avatarHexColor ? undefined : (avatarColor ?? 0))
        : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
      const hexC = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
      const clay = ci !== undefined ? CLAY[ci % CLAY.length] : CLAY[0]
      const photoURL = m.role === 'owner' ? (user?.photoURL ?? m.photoURL) : m.photoURL
      return { name: m.name, baseColor: hexC ?? clay.base, photoURL: photoURL ?? undefined }
    })
  }, [meta?.members, avatarColor, avatarHexColor, user?.photoURL])

  /* 전체 아이템 ID 목록 (DnD 전체 컨텍스트용) */
  const allItemIds = useMemo(
    () => [...currentItems].sort((a, b) => a.order - b.order).map(i => i.id),
    [currentItems]
  )

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

      {/* ── Navbar ── */}
      <nav className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0 z-20">
        <Link href="/trips" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">내 여행</span>
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: gradientStyle(meta.gradient) }} />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 text-sm truncate leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {meta.title || meta.city}
            </span>
            {meta.title && (
              <span className="text-[11px] text-gray-400 leading-tight truncate">{meta.city}</span>
            )}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
            {meta.startDate.slice(5).replace('-', '/')} – {meta.endDate.slice(5).replace('-', '/')} · {meta.nights}박
          </span>
          <button
            onClick={openEdit}
            title="여행 정보 편집"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* 멤버 아바타 */}
          <button onClick={() => { setShowMembers(true); getDoc(doc(db, 'users', uid, 'trips', tripId)).then(snap => { if (snap.exists()) setMeta(snap.data() as TripMeta) }).catch(() => {}) }}
            className="flex items-center hover:opacity-80 transition-opacity"
            title="멤버 관리">
            <div className="flex -space-x-2.5">
              {(meta.members ?? []).slice(0, 4).map((m, i) => (
                <div key={m.id} className="relative" style={{ zIndex: 10 - i }}>
                  <PersonAvatar
                    name={m.name}
                    photoURL={m.role === 'owner' ? (user?.photoURL ?? m.photoURL) : m.photoURL}
                    size={28}
                    stacked
                    colorIndex={
                      m.role === 'owner'
                        ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                        : (m.hexColor ? undefined : (m.colorIndex ?? ((i % (CLAY.length - 1)) + 1)))
                    }
                    hexColor={m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor}
                  />
                  {m.role === 'treasurer' && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                      <Crown className="w-2 h-2 text-white" />
                    </span>
                  )}
                </div>
              ))}
              {(meta.members ?? []).length > 4 && (
                <div className="w-7 h-7 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                  +{(meta.members ?? []).length - 4}
                </div>
              )}
            </div>
          </button>
          <button onClick={() => setChecklist(v => !v)}
            className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">체크리스트</span>
          </button>
          <Link href={`/trips/${tripId}/summary`}
            className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold px-2.5 sm:px-4 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors">
            <span className="hidden sm:inline">여행 요약</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Day 탭 + 모바일 지도/일정 토글 ── */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="px-4 sm:px-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-end" style={{ minWidth: days.length * 80 }}>
            {days.map((d, i) => {
              const isActive = i === activeDayIdx
              const isToday  = d.date === new Date().toISOString().slice(0, 10)
              const members  = meta?.members ?? []
              const MAX_VISIBLE = 5
              const visible  = members.slice(0, MAX_VISIBLE)
              const overflow = members.length - MAX_VISIBLE
              const overlap  = members.length <= 3 ? -4 : -6

              return (
                <div key={d.dayId} className="flex flex-col items-center flex-shrink-0 pt-2" style={{ minWidth: 76, marginRight: 4 }}>
                  {/* 멤버 아바타 행: 활성 탭만, 비활성은 높이 유지 */}
                  <div className="flex items-center justify-center mb-2" style={{ height: 22 }}>
                    {isActive && visible.length > 0 && (
                      <>
                        {visible.map((m, mi) => (
                          <div
                            key={m.id}
                            className="flex-shrink-0 ring-[1.5px] ring-white rounded-full"
                            style={{ marginLeft: mi === 0 ? 0 : overlap, zIndex: visible.length - mi }}
                          >
                            <PersonAvatar
                              name={m.name}
                              photoURL={m.role === 'owner' ? (user?.photoURL ?? m.photoURL) : m.photoURL}
                              colorIndex={
                                m.role === 'owner'
                                  ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                                  : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                              }
                              hexColor={m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor}
                              size={18}
                            />
                          </div>
                        ))}
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
                    <span className={`block text-[10px] font-medium mt-1.5 ${isActive ? 'text-blue-500' : 'text-gray-300'}`}>
                      {formatDate(d.date)}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
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
        <div className={`${mobileTab === 'map' ? 'hidden' : 'flex'} lg:flex w-full lg:w-[420px] flex-shrink-0 flex-col bg-[#F8FAFC] overflow-hidden lg:border-r border-gray-200`}>

          <div className="px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeDay?.label} · {activeDay ? formatDate(activeDay.date) : ''}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {currentItems.length > 0 ? `${currentItems.length}개 일정` : '일정을 추가해보세요'}
                {daySpent > 0 && ` · ${
                  primaryCurrency !== 'KRW' && rates[primaryCurrency]
                    ? formatLocal(Math.round(daySpent / rates[primaryCurrency]), primaryCurrency)
                    : formatKRW(daySpent)
                }`}
              </p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" /> 추가
            </button>
          </div>

          {/* 아이템 목록 — DnD 스크롤 버그 방지: MeasuringStrategy.Always + restrictToFirstScrollableAncestor */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">

            {/* ── 고정 일정 (비행기 / 숙소) ── */}
            {activeDay && (() => {
              const activeDayIdx2 = days.findIndex(d => d.dayId === activeDay.dayId)
              const dayFlights = (meta.flights ?? []).filter(f => f.dayId === activeDay.dayId)
              const dayAccs: Array<{ acc: AccommodationItem; role: 'checkin' | 'stay' | 'checkout' }> = []
              for (const acc of (meta.accommodations ?? [])) {
                const inIdx  = days.findIndex(d => d.dayId === acc.checkInDayId)
                const outIdx = days.findIndex(d => d.dayId === acc.checkOutDayId)
                if (acc.checkInDayId === activeDay.dayId) {
                  dayAccs.push({ acc, role: 'checkin' })
                } else if (acc.checkOutDayId === activeDay.dayId) {
                  dayAccs.push({ acc, role: 'checkout' })
                } else if (activeDayIdx2 > inIdx && activeDayIdx2 < outIdx) {
                  dayAccs.push({ acc, role: 'stay' })
                }
              }
              if (dayFlights.length === 0 && dayAccs.length === 0) return null
              return (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">고정 일정</span>
                  {dayFlights.map(f => (
                    <div key={f.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-sky-50 border border-sky-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <Plane className="w-3.5 h-3.5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-sky-800 leading-none">
                          {f.type === 'inbound' ? '입국' : '출국'} · {f.name}
                        </p>
                        {(f.departTime || f.arriveTime) && (
                          <p className="text-[10px] text-sky-600 mt-0.5">
                            {f.departTime && `출발 ${f.departTime}`}
                            {f.departTime && f.arriveTime && ' → '}
                            {f.arriveTime && `도착 ${f.arriveTime}`}
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleDeleteFlight(f.id)}
                        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-sky-200 text-sky-400 flex-shrink-0 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {dayAccs.map(({ acc, role }) => (
                    <div key={`${acc.id}-${role}`} className="flex items-center gap-2.5 px-3 py-2.5 bg-violet-50 border border-violet-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-violet-800 leading-none">
                          {role === 'checkin' ? '체크인' : role === 'checkout' ? '체크아웃' : '숙박중'} · {acc.name}
                        </p>
                        {role === 'checkin' && acc.checkInTime && (
                          <p className="text-[10px] text-violet-600 mt-0.5">체크인 {acc.checkInTime}</p>
                        )}
                        {role === 'checkout' && acc.checkOutTime && (
                          <p className="text-[10px] text-violet-600 mt-0.5">체크아웃 {acc.checkOutTime}</p>
                        )}
                      </div>
                      {role !== 'stay' && (
                        <button onClick={() => handleDeleteAccommodation(acc.id)}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-violet-200 text-violet-400 flex-shrink-0 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}

            {currentItems.length === 0 ? (
              <div onClick={() => setShowAdd(true)}
                className="flex flex-col items-center justify-center py-16 gap-3 cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-dashed border-gray-200 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors font-medium">
                  + 첫 번째 일정을 추가하세요
                </p>
              </div>
            ) : (
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToFirstScrollableAncestor]}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragEnd={(e: DragEndEvent) => {
                  const { active, over } = e
                  if (!over || active.id === over.id) return
                  handleReorder(String(active.id), String(over.id))
                }}
              >
                <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
                  {TIME_SLOTS.map(slot => {
                    const slotItems = grouped[slot]
                    if (!slotItems.length) return null
                    const slotKRW = slotItems.reduce((s, i) => s + toKRW(i.price, i.currency, rates), 0)
                    const slotAmtStr = slotKRW > 0
                      ? primaryCurrency !== 'KRW' && rates[primaryCurrency]
                        ? formatLocal(Math.round(slotKRW / rates[primaryCurrency]), primaryCurrency)
                        : formatKRW(slotKRW)
                      : ''
                    return (
                      <div key={slot} className="flex flex-col gap-2">
                        {/* 시간대 구분선 */}
                        <div className="flex items-center gap-2.5 py-1">
                          <div className="flex-1 h-px bg-gray-200" />
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${SLOT_DOT[slot]}`} />
                            <span className="text-[11px] font-bold text-gray-400">{slot}</span>
                            {slotAmtStr && (
                              <span className="text-[10px] text-emerald-600 font-semibold">{slotAmtStr}</span>
                            )}
                            <span className="text-[10px] text-gray-300">{slotItems.length}개</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        {slotItems.map(item => (
                          <SortableItemRow
                            key={item.id}
                            item={item}
                            onDelete={handleDelete}
                            onEdit={setEditItem}
                            onChangeCat={handleChangeCat}
                            onRate={handleRate}
                            onFocusMap={handleFocusMap}
                            onViewReceipts={r => setLightbox({ receipts: r, idx: 0 })}
                            onUploadReceipt={files => handleUploadReceipts(item.id, files)}
                            mapIndex={mapIndexMap[item.id]}
                            rates={rates}
                            totalPeople={meta.people || 1}
                          />
                        ))}
                      </div>
                    )
                  })}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* 예산 푸터 */}
          <div className="border-t border-gray-200 bg-white px-5 py-4 flex-shrink-0">
            {/* 전체 지출 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Wallet className="w-3.5 h-3.5" />
                <span>{meta.budget > 0 ? '전체 예산' : '전체 지출'}</span>
              </div>
              <div className="text-right">
                {primaryCurrency !== 'KRW' && rates[primaryCurrency] ? (
                  <>
                    <span className="text-xs font-bold text-gray-700">
                      {formatLocal(Math.round(totalSpent / rates[primaryCurrency]), primaryCurrency)}
                      {meta.budget > 0 && ` / ${formatLocal(Math.round(meta.budget / rates[primaryCurrency]), primaryCurrency)}`}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ≈ {formatKRW(totalSpent)}{meta.budget > 0 && ` / ${formatKRW(meta.budget)}`}
                    </p>
                  </>
                ) : (
                  <span className="text-xs font-bold text-gray-700">
                    {formatKRW(totalSpent)}{meta.budget > 0 && ` / ${formatKRW(meta.budget)}`}
                  </span>
                )}
              </div>
            </div>
            {/* 예산 바 — 예산 설정된 경우만 */}
            {meta.budget > 0 && (
              <>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${budgetPct}%` }} />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 text-right">{budgetPct}% 사용</p>
              </>
            )}
            {/* 1인 평균 + 정산 명세 */}
            {(meta.members ?? []).length > 1 && totalSpent > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div
                  className={`flex items-center justify-between ${hasUnevenParticipants ? 'cursor-pointer group' : ''}`}
                  onClick={() => hasUnevenParticipants && setShowSettlement(true)}
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
                    {hasUnevenParticipants && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                        명세 <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
                {hasUnevenParticipants && (
                  <p className="text-[10px] text-gray-400 mt-0.5">참여 인원이 다른 장소가 있어요</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 지도 ── */}
        <div className={`${mobileTab === 'schedule' ? 'hidden' : 'flex'} lg:flex flex-1 relative overflow-hidden`}>
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
          {mapMounted && <TripMap city={meta.city} items={mapItems} focusId={focusItemId} members={mapAvatarMembers} />}
        </div>
      </div>

      {showAdd && (
        <AddItemPanel
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
          defaultCurrency={primaryCurrency}
          currencies={tripCurrencies}
          people={meta.people || 1}
          members={meta.members ?? []}
          uid={uid}
          tripId={tripId}
          days={days}
          activeDayId={activeDay?.dayId ?? days[0]?.dayId ?? ''}
          onAddFlight={handleAddFlight}
          onAddAccommodation={handleAddAccommodation}
        />
      )}

      {editItem && (
        <EditItemPanel
          item={editItem}
          onUpdate={handleUpdate}
          onClose={() => setEditItem(null)}
          currencies={tripCurrencies}
          people={meta.people || 1}
          members={meta.members ?? []}
          uid={uid}
          tripId={tripId}
        />
      )}

      {/* ── 멤버 관리 모달 ── */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => setShowMembers(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:w-[380px] mx-0 sm:mx-4 shadow-2xl max-h-[90dvh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* 헤더 */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">여행 멤버</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {(meta.members ?? []).length} / {meta.people || 1}명
                  {(meta.members ?? []).length >= (meta.people || 1) && (
                    <span className="ml-1.5 text-orange-500 font-semibold">정원 초과</span>
                  )}
                </p>
              </div>
              <button onClick={() => setShowMembers(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 멤버 목록 */}
            <div className="px-3 py-2 flex flex-col gap-0.5 overflow-y-auto flex-shrink min-h-0">
              {(meta.members ?? []).map((m, mi) => {
                const effectiveColorIdx = m.role === 'owner'
                  ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                  : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                const effectiveHex = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                const initialHex = m.hexColor ?? (effectiveColorIdx !== undefined ? CLAY[effectiveColorIdx].base : '#4A90E8')
                return (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-gray-50/80 group transition-colors">
                    {/* 아바타 — 멤버는 label로 감싸서 클릭 즉시 팔레트 열림 */}
                    {m.role !== 'owner' ? (
                      <div className="relative flex-shrink-0">
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
                            className="hover:opacity-75 transition-opacity"
                          />
                        </label>
                        {/* 크라운 뱃지 — 총무: amber, 일반: 회색 흐림 / 클릭 시 총무 토글 */}
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
                          <Crown className={`w-3 h-3 ${m.role === 'treasurer' ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex-shrink-0">
                        <PersonAvatar
                          name={m.name}
                          photoURL={user?.photoURL ?? m.photoURL}
                          size={42}
                          colorIndex={effectiveColorIdx}
                          hexColor={effectiveHex}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          m.role === 'owner'      ? 'bg-blue-50 text-blue-600'
                          : m.role === 'treasurer' ? 'bg-amber-50 text-amber-600'
                          :                          'bg-gray-100 text-gray-500'
                        }`}>
                          {m.role === 'owner' ? '오너' : m.role === 'treasurer' ? '총무' : '멤버'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 text-gray-400">
                        {m.role === 'owner' ? '마이페이지에서 색상 변경' : '아바타 클릭 → 색상 변경'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {m.role !== 'owner' && (
                        <>
                          <button
                            onClick={() => copyMemberInvite(m.id)}
                            title="개인 초대 링크 복사"
                            className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/60 transition-colors group">
                            {copiedMember === m.id ? (
                              <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                            ) : (
                              <Link2 className="w-3 h-3 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            )}
                            <span className="text-[11px] font-semibold text-gray-500 group-hover:text-blue-600 leading-none">
                              {copiedMember === m.id ? '복사됨' : '초대링크'}
                            </span>
                          </button>
                          <button onClick={() => removeMember(m.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 멤버 추가 */}
            <div className="border-t border-gray-100 px-5 pt-4 pb-3 flex-shrink-0">
              {(meta.members ?? []).length >= (meta.people || 1) ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-xs text-orange-600 font-semibold">
                    인원이 가득 찼어요. 여행 정보 편집에서 인원수를 늘려보세요.
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    멤버 추가 ({(meta.people || 1) - (meta.members ?? []).length}명 추가 가능)
                  </p>
                  <div className="flex gap-2 items-center">
                    <PersonAvatar name={newMemberName || '?'} size={36} className="flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="닉네임 입력"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addMember() }}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
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
            <div className="border-t border-gray-100 px-5 pb-5 pt-4 flex flex-col gap-2 flex-shrink-0">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">초대 링크</p>
              <button onClick={() => copyLink('view')}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/60 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Link2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-gray-700">뷰어 링크 복사</p>
                  <p className="text-[11px] text-gray-400">일정 보기만 가능</p>
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
          <div className="relative z-50 w-80 bg-white h-full shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">여행 체크리스트</h3>
              <button onClick={() => setChecklist(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-1.5">
              {checkItems.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">아직 항목이 없어요</p>
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 여행 정보 편집 모달 ── */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]"
          onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl p-6 w-[360px] mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-5">여행 정보 편집</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500">여행 제목 <span className="font-normal text-gray-400">(선택)</span></label>
                  <span className={`text-[11px] font-medium tabular-nums ${(editForm.title?.length ?? 0) >= 18 ? 'text-orange-500' : 'text-gray-300'}`}>
                    {editForm.title?.length ?? 0}/20
                  </span>
                </div>
                <input type="text" value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value.slice(0, 20) }))}
                  maxLength={20}
                  placeholder={meta?.city ?? ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">시작일</label>
                <input type="date" value={editForm.startDate}
                  onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">종료일</label>
                <input type="date" value={editForm.endDate}
                  onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">인원수</label>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setEditForm(f => ({ ...f, people: Math.max(1, f.people - 1) }))}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors text-lg font-light disabled:opacity-30"
                    disabled={editForm.people <= 1}>
                    −
                  </button>
                  <span className="flex-1 text-center text-sm font-bold text-gray-900">{editForm.people}명</span>
                  <button type="button"
                    onClick={() => setEditForm(f => ({ ...f, people: Math.min(20, f.people + 1) }))}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors text-lg font-light disabled:opacity-30"
                    disabled={editForm.people >= 20}>
                    +
                  </button>
                </div>
              </div>
              {editForm.startDate && editForm.endDate && (
                <p className="text-xs text-gray-400 text-center">
                  {Math.max(0, Math.round((new Date(editForm.endDate).getTime() - new Date(editForm.startDate).getTime()) / 86400000))}박{' '}
                  {Math.max(1, Math.round((new Date(editForm.endDate).getTime() - new Date(editForm.startDate).getTime()) / 86400000) + 1)}일
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowEdit(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={handleEditSave}
                disabled={editSaving || !editForm.startDate || !editForm.endDate}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
                {editSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 정산 명세 팝업 ── */}
      {showSettlement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200]"
          onClick={() => setShowSettlement(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">정산 금액</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">장소별 참여 인원 기준 계산</p>
              </div>
              <button onClick={() => setShowSettlement(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-3">
              {(meta.members ?? []).map((m, mi) => {
                const amt = memberSpent[m.id] ?? 0
                const ci = m.role === 'owner'
                  ? (avatarHexColor ? undefined : (avatarColor ?? 0))
                  : (m.hexColor ? undefined : (m.colorIndex ?? ((mi % (CLAY.length - 1)) + 1)))
                const hexC = m.role === 'owner' ? (avatarHexColor ?? undefined) : m.hexColor
                const photoURL = m.role === 'owner' ? (user?.photoURL ?? m.photoURL) : m.photoURL
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <PersonAvatar name={m.name} size={32} colorIndex={ci} hexColor={hexC} photoURL={photoURL} />
                    <span className="text-sm text-gray-800 flex-1 font-medium">{m.name}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {primaryCurrency !== 'KRW' && rates[primaryCurrency]
                        ? formatLocal(Math.round(amt / rates[primaryCurrency]), primaryCurrency)
                        : formatKRW(Math.round(amt))
                      }
                    </span>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />합계
                </span>
                <span className="text-xs font-bold text-gray-700">
                  {primaryCurrency !== 'KRW' && rates[primaryCurrency]
                    ? formatLocal(Math.round(totalSpent / rates[primaryCurrency]), primaryCurrency)
                    : formatKRW(totalSpent)
                  }
                </span>
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
    </div>
  )
}

export default function PlannerPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params)
  return <AuthGuard><PlannerContent tripId={tripId} /></AuthGuard>
}
