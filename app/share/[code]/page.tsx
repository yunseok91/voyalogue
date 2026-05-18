'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { MapPin, Wallet, Users, Crown, ChevronLeft, ChevronRight, Loader2, Star, Plus, X, Camera, Plane, BedDouble, Pencil, UserPlus, LogOut } from 'lucide-react'
import {
  collection, getDoc, getDocs,
  doc, addDoc, deleteDoc, updateDoc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { gradientStyle, gradientTextColor } from '@/lib/tripGradient'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { detectCurrencies, CURRENCY_SYMBOLS } from '@/lib/currencyMap'
import { getRatesInKRW, toKRW, formatLocal, formatKRW } from '@/lib/exchangeRate'
import { TripMap, type MapItem } from '@/components/TripMap'
import { useAuthStore } from '@/features/auth/store'
import { notifyTripMembers } from '@/lib/tripNotification'
import { NotificationBell } from '@/components/NotificationBell'
import { useScrollLock } from '@/hooks/useScrollLock'

/* ── 타입 (플래너와 동일) ── */
type TimeSlot = '아침' | '점심' | '저녁' | '미정'
type Category = '식사' | '장소' | '쇼핑' | '교통' | '기타'
type MemberRole = 'owner' | 'treasurer' | 'member'

type Member = { id: string; name: string; photoURL?: string; role: MemberRole; colorIndex?: number; left?: boolean }

type FlightItem = {
  id:          string
  name:        string
  type:        'inbound' | 'outbound'
  dayId:       string
  departTime:  string
  arriveTime:  string
}

type AccommodationItem = {
  id:             string
  name:           string
  checkInDayId:   string
  checkInTime:    string
  checkOutDayId:  string
  checkOutTime:   string
}

type TripMeta = {
  uid:             string
  id:              string
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
  flights?:        FlightItem[]
  accommodations?: AccommodationItem[]
}

type PlanItem = {
  id: string; name: string; timeSlot: TimeSlot; cat: Category
  price: number; currency: string; comment: string; order: number
  lat: number; lng: number; rating: number; ratings?: Record<string, number>; participants: number
  participantIds?: string[]
  receipts?: string[]
}

type Day = { dayId: string; label: string; date: string }

const SLOT_DOT: Record<TimeSlot, string> = {
  아침: 'bg-amber-400', 점심: 'bg-green-500', 저녁: 'bg-violet-500', 미정: 'bg-gray-400',
}
const TIME_SLOTS: TimeSlot[] = ['아침', '점심', '저녁', '미정']
const CATEGORIES: Category[] = ['식사', '장소', '쇼핑', '교통', '기타']
const CAT_COLORS: Record<Category, string> = {
  식사: 'bg-orange-100 text-orange-700', 장소: 'bg-blue-100 text-blue-700',
  쇼핑: 'bg-pink-100 text-pink-700',     교통: 'bg-gray-100 text-gray-600',
  기타: 'bg-gray-100 text-gray-600',
}

function formatDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}(${['일','월','화','수','목','금','토'][dt.getDay()]})`
}

function buildDays(meta: TripMeta): Day[] {
  const start = new Date(meta.startDate)
  return Array.from({ length: meta.days }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i)
    return { dayId: `d${i + 1}`, label: `Day ${i + 1}`, date: d.toISOString().slice(0, 10) }
  })
}

/* ── 별점 ── */
function StarRow({ myRating = 0, ratings = {}, onChange }: {
  myRating?: number
  ratings?: Record<string, number>
  onChange?: (v: number) => void
}) {
  const vals = Object.values(ratings).filter(v => v > 0)
  const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  const count = vals.length
  return (
    <span className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <span className="flex gap-0.5">
        {[1,2,3,4,5].map(v => (
          <Star key={v}
            className={`w-3 h-3 transition-colors ${v <= myRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 hover:text-amber-300'} ${onChange ? 'cursor-pointer' : ''}`}
            onClick={e => { e.stopPropagation(); onChange?.(v) }}
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

/* ── 아이템 행 (읽기 전용 / 편집 공통) ── */
function ItemCard({ item, canEdit, myUid, onEdit, onDelete, onRate, mapIndex, onFocusMap }: {
  item: PlanItem; canEdit: boolean; myUid?: string
  onEdit?: (item: PlanItem) => void
  onDelete?: (id: string) => void
  onRate?: (id: string, v: number) => void
  mapIndex?: number
  onFocusMap?: (id: string) => void
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  return (
    <div
      className="flex items-start gap-2 px-3 py-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => { if (item.lat && item.lng && onFocusMap) onFocusMap(item.id) }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          {mapIndex !== undefined && item.lat && item.lng && (
            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5 ${SLOT_DOT[item.timeSlot]}`}>
              {mapIndex}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900 flex-1 min-w-0 break-words">{item.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_COLORS[item.cat]}`}>{item.cat}</span>
        </div>
        {item.comment && (
          <div className="flex mb-1 mt-0.5">
            <div className="w-0.5 rounded-full bg-amber-300 flex-shrink-0 mr-2" />
            <p className="text-xs text-amber-800 leading-snug italic">{item.comment}</p>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
            { 아침: 'border-amber-200 text-amber-700 bg-amber-50', 점심: 'border-green-200 text-green-700 bg-green-50',
              저녁: 'border-violet-200 text-violet-700 bg-violet-50', 미정: 'border-gray-200 text-gray-500 bg-gray-50' }[item.timeSlot]
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${SLOT_DOT[item.timeSlot]}`} />
            {item.timeSlot}
          </span>
          <StarRow
            myRating={myUid ? (item.ratings?.[myUid] ?? 0) : 0}
            ratings={item.ratings}
            onChange={canEdit && onRate ? v => onRate(item.id, v) : undefined}
          />
          {item.price > 0 && (
            <span className="text-xs font-semibold text-emerald-600 ml-auto">
              {item.currency === 'KRW' ? formatKRW(item.price) : formatLocal(item.price, item.currency)}
            </span>
          )}
          {item.receipts && item.receipts.length > 0 ? (
            <button
              onClick={() => setLightboxIdx(0)}
              className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors flex-shrink-0"
            >
              <Camera className="w-2.5 h-2.5" />
              <span>{item.receipts.length}</span>
            </button>
          ) : canEdit && onEdit ? (
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full text-gray-400 bg-gray-50 hover:text-violet-600 hover:bg-violet-50 transition-colors flex-shrink-0"
            >
              <Camera className="w-2.5 h-2.5" />
            </button>
          ) : null}
        </div>
      </div>
      {canEdit && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(item)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(item.id)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 영수증 라이트박스 */}
      {lightboxIdx !== null && item.receipts && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85"
          onClick={() => setLightboxIdx(null)}>
          <div className="relative w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <img src={item.receipts[lightboxIdx]} alt="영수증"
              className="w-full rounded-2xl object-contain max-h-[80dvh]" />
            {item.receipts.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {item.receipts.map((_, i) => (
                  <button key={i} onClick={() => setLightboxIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === lightboxIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
                ))}
              </div>
            )}
            {lightboxIdx > 0 && (
              <button onClick={() => setLightboxIdx(i => i! - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {lightboxIdx < item.receipts.length - 1 && (
              <button onClick={() => setLightboxIdx(i => i! + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setLightboxIdx(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 이미지 압축 ── */
async function compressImg(file: File): Promise<Blob> {
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

/* ── 추가 패널 (총무 전용) ── */
function AddPanel({ onAdd, onClose, defaultCurrency, currencies, members, tripUid, tripId, defaultPlace }: {
  onAdd:    (item: Omit<PlanItem, 'id' | 'order'>) => void
  onClose:  () => void
  defaultCurrency: string; currencies: string[]
  members: Member[]; tripUid: string; tripId: string
  defaultPlace?: { name: string; lat: number; lng: number }
}) {
  const [name,           setName]           = useState(defaultPlace?.name ?? '')
  const [lat,            setLat]            = useState<number | null>(defaultPlace?.lat ?? null)
  const [lng,            setLng]            = useState<number | null>(defaultPlace?.lng ?? null)
  const [timeSlot,       setTimeSlot]       = useState<TimeSlot>('미정')
  const [cat,            setCat]            = useState<Category>('장소')
  const [price,          setPrice]          = useState('')
  const [currency,       setCurrency]       = useState(defaultCurrency)
  const [comment,        setComment]        = useState('')
  const [rating,         setRating]         = useState(0)
  const [hoverRating,    setHoverRating]    = useState(0)
  const [participantIds, setParticipantIds] = useState<string[]>(members.map(m => m.id))
  const [receiptFiles,   setReceiptFiles]   = useState<File[]>([])
  const [receiptPreviews,setReceiptPreviews]= useState<string[]>([])
  const [uploading,      setUploading]      = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ok = name.trim().length > 0

  useEffect(() => {
    let ac: google.maps.places.Autocomplete | null = null
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!inputRef.current) return
      ac = new google.maps.places.Autocomplete(inputRef.current, { fields: ['name', 'geometry'] })
      ac.addListener('place_changed', () => {
        const p = ac!.getPlace()
        if (p.name) setName(p.name)
        if (p.geometry?.location) { setLat(p.geometry.location.lat()); setLng(p.geometry.location.lng()) }
      })
    }).catch(() => {})
    return () => { if (ac) google.maps.event.clearInstanceListeners(ac) }
  }, [])

  const toggleMember = (id: string) =>
    setParticipantIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleReceiptAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toAdd = Array.from(e.target.files ?? []).slice(0, 3 - receiptFiles.length)
    setReceiptFiles(prev => [...prev, ...toAdd])
    setReceiptPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }
  const handleReceiptRemove = (i: number) => {
    URL.revokeObjectURL(receiptPreviews[i])
    setReceiptFiles(prev => prev.filter((_, j) => j !== i))
    setReceiptPreviews(prev => prev.filter((_, j) => j !== i))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    setUploading(true)
    const receiptURLs: string[] = []
    if (receiptFiles.length > 0) {
      try {
        const [{ storage }, { ref: sRef, uploadBytes, getDownloadURL }] = await Promise.all([
          import('@/lib/firebase'), import('firebase/storage'),
        ])
        const ts = Date.now()
        await Promise.all(receiptFiles.map(async (file, i) => {
          const blob = await compressImg(file)
          const r = sRef(storage, `users/${tripUid}/trips/${tripId}/receipts/${ts}_${i}.jpg`)
          await uploadBytes(r, blob)
          receiptURLs.push(await getDownloadURL(r))
        }))
      } catch { /* silent */ }
    }
    receiptPreviews.forEach(u => URL.revokeObjectURL(u))
    onAdd({
      name: name.trim(), timeSlot, cat,
      price: Number(price) || 0, currency, comment, rating,
      lat: lat ?? 0, lng: lng ?? 0,
      participants: participantIds.length || members.length,
      participantIds,
      ...(receiptURLs.length > 0 ? { receipts: receiptURLs } : {}),
    })
    setUploading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col sm:my-6" style={{ maxHeight: 'min(92dvh, 720px)' }}>
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 pt-4 sm:pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">일정 추가</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {/* 장소명 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">장소명 *</label>
            <input ref={inputRef} type="text" placeholder="장소 검색 (예: 센소지, Tsujihan…)"
              value={name} onChange={e => { setName(e.target.value); setLat(null); setLng(null) }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
            {lat !== null && <p className="text-[11px] text-blue-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> 위치 확인됨</p>}
          </div>
          {/* 시간대 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">시간대</label>
            <div className="flex gap-1.5 flex-wrap">
              {TIME_SLOTS.map(t => (
                <button key={t} type="button" onClick={() => setTimeSlot(t)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${timeSlot === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${timeSlot === t ? 'bg-white' : SLOT_DOT[t]}`} />{t}
                </button>
              ))}
            </div>
          </div>
          {/* 카테고리 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">카테고리</label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${cat === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}>{c}</button>
              ))}
            </div>
          </div>
          {/* 참석 인원 */}
          {members.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">참석 인원</label>
                <span className="text-xs text-gray-400">{participantIds.length}명 참석</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {members.map((m, i) => {
                  const selected = participantIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                      <PersonAvatar name={m.name} photoURL={m.photoURL} size={36}
                        colorIndex={m.colorIndex ?? ((i % (CLAY.length - 1)) + 1)} />
                      <span className="text-[10px] font-semibold text-gray-600 max-w-[48px] truncate">{m.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {/* 예상 비용 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">예상 비용</label>
            <div className="flex gap-2">
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 outline-none">
                {currencies.map(c => <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c}</option>)}
              </select>
              <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>
          {/* 별점 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">별점</label>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(v => (
                <button key={v} type="button"
                  onMouseEnter={() => setHoverRating(v)} onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(prev => prev === v ? 0 : v)}>
                  <Star className={`w-6 h-6 transition-colors ${v <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
          </div>
          {/* 메모 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">메모 (선택)</label>
            <input type="text" placeholder="예: 영업시간, 예약 필요 여부…" value={comment} onChange={e => setComment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
          </div>
          {/* 영수증 첨부 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">영수증 첨부 (최대 3장)</label>
            <div className="flex gap-2 flex-wrap">
              {receiptPreviews.map((url, i) => (
                <div key={i} className="relative w-16 h-16">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button type="button" onClick={() => handleReceiptRemove(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {receiptFiles.length < 3 && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] text-gray-400">추가</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleReceiptAdd} />
                </label>
              )}
            </div>
          </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button type="submit" disabled={!ok || uploading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── 수정 패널 (총무 전용) ── */
function EditPanel({ item, onSave, onClose, defaultCurrency, currencies, members, tripUid, tripId }: {
  item: PlanItem
  onSave: (id: string, patch: Partial<Omit<PlanItem, 'id' | 'order'>>) => void
  onClose: () => void
  defaultCurrency: string; currencies: string[]
  members: Member[]; tripUid: string; tripId: string
}) {
  const [name,            setName]           = useState(item.name)
  const [timeSlot,        setTimeSlot]       = useState<TimeSlot>(item.timeSlot)
  const [cat,             setCat]            = useState<Category>(item.cat)
  const [price,           setPrice]          = useState(item.price > 0 ? String(item.price) : '')
  const [currency,        setCurrency]       = useState(item.currency || defaultCurrency)
  const [comment,         setComment]        = useState(item.comment || '')
  const [rating,          setRating]         = useState(item.rating || 0)
  const [hoverRating,     setHoverRating]    = useState(0)
  const [participantIds,  setParticipantIds] = useState<string[]>(
    item.participantIds ?? members.map(m => m.id)
  )
  const [existingReceipts, setExistingReceipts] = useState<string[]>(item.receipts ?? [])
  const [receiptFiles,     setReceiptFiles]     = useState<File[]>([])
  const [receiptPreviews,  setReceiptPreviews]  = useState<string[]>([])
  const [uploading,        setUploading]        = useState(false)
  const ok = name.trim().length > 0

  const toggleMember = (id: string) =>
    setParticipantIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleReceiptAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = 3 - existingReceipts.length
    const toAdd = Array.from(e.target.files ?? []).slice(0, max - receiptFiles.length)
    setReceiptFiles(prev => [...prev, ...toAdd])
    setReceiptPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }
  const handleReceiptRemove = (i: number) => {
    URL.revokeObjectURL(receiptPreviews[i])
    setReceiptFiles(prev => prev.filter((_, j) => j !== i))
    setReceiptPreviews(prev => prev.filter((_, j) => j !== i))
  }
  const handleExistingRemove = (i: number) =>
    setExistingReceipts(prev => prev.filter((_, j) => j !== i))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    setUploading(true)
    const newURLs: string[] = []
    if (receiptFiles.length > 0) {
      try {
        const [{ storage }, { ref: sRef, uploadBytes, getDownloadURL }] = await Promise.all([
          import('@/lib/firebase'), import('firebase/storage'),
        ])
        const ts = Date.now()
        await Promise.all(receiptFiles.map(async (file, i) => {
          const blob = await compressImg(file)
          const r = sRef(storage, `users/${tripUid}/trips/${tripId}/receipts/${ts}_${i}.jpg`)
          await uploadBytes(r, blob)
          newURLs.push(await getDownloadURL(r))
        }))
      } catch { /* silent */ }
    }
    receiptPreviews.forEach(u => URL.revokeObjectURL(u))
    const receipts = [...existingReceipts, ...newURLs]
    onSave(item.id, {
      name: name.trim(), timeSlot, cat,
      price: Number(price) || 0, currency, comment, rating,
      participants: participantIds.length || members.length,
      participantIds,
      receipts,
    })
    setUploading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col sm:my-6" style={{ maxHeight: 'min(92dvh, 720px)' }}>
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 pt-4 sm:pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">일정 수정</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">장소명 *</label>
            <input type="text" placeholder="장소명 *" value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">시간대</label>
            <div className="flex gap-1.5 flex-wrap">
              {TIME_SLOTS.map(t => (
                <button key={t} type="button" onClick={() => setTimeSlot(t)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${timeSlot === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${timeSlot === t ? 'bg-white' : SLOT_DOT[t]}`} />{t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">카테고리</label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${cat === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}>{c}</button>
              ))}
            </div>
          </div>
          {members.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">참석 인원</label>
                <span className="text-xs text-gray-400">{participantIds.length}명 참석</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {members.map((m, i) => {
                  const selected = participantIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                      <PersonAvatar name={m.name} photoURL={m.photoURL} size={36}
                        colorIndex={m.colorIndex ?? ((i % (CLAY.length - 1)) + 1)} />
                      <span className="text-[10px] font-semibold text-gray-600 max-w-[48px] truncate">{m.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">예상 비용</label>
            <div className="flex gap-2">
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 outline-none">
                {currencies.map(c => <option key={c} value={c}>{CURRENCY_SYMBOLS[c] ?? c} {c}</option>)}
              </select>
              <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">별점</label>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(v => (
                <button key={v} type="button"
                  onMouseEnter={() => setHoverRating(v)} onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(prev => prev === v ? 0 : v)}>
                  <Star className={`w-6 h-6 transition-colors ${v <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">메모 (선택)</label>
            <input type="text" placeholder="메모" value={comment} onChange={e => setComment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 transition-all" />
          </div>
          {/* 영수증 첨부 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              영수증 첨부 (최대 3장)
            </label>
            <div className="flex gap-2 flex-wrap">
              {existingReceipts.map((url, i) => (
                <div key={`ex-${i}`} className="relative w-16 h-16">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button type="button" onClick={() => handleExistingRemove(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {receiptPreviews.map((url, i) => (
                <div key={`new-${i}`} className="relative w-16 h-16">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button type="button" onClick={() => handleReceiptRemove(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {(existingReceipts.length + receiptFiles.length) < 3 && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] text-gray-400">추가</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleReceiptAdd} />
                </label>
              )}
            </div>
          </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">취소</button>
              <button type="submit" disabled={!ok || uploading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">저장</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── 메인 ── */
export default function SharePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuthStore()

  const [trip,         setTrip]        = useState<TripMeta | null>(null)
  const [notFound,     setNotFound]    = useState(false)
  const [canEdit,      setCanEdit]     = useState(false)
  const [activeDayIdx, setActiveDayIdx]= useState(0)
  const [dayItems,     setDayItems]    = useState<Record<string, PlanItem[]>>({})
  const [showAdd,      setShowAdd]     = useState(false)
  const [editingItem,  setEditingItem] = useState<PlanItem | null>(null)
  const [mobileTab,    setMobileTab]   = useState<'schedule' | 'map'>('schedule')
  const [rates,        setRates]       = useState<Record<string, number>>({ KRW: 1 })
  const [joining,      setJoining]     = useState(false)
  const [joinError,    setJoinError]   = useState('')

  useScrollLock(showAdd || !!editingItem)

  /* 지도 검색 / 더블클릭 → 일정 추가 (canEdit 전용) */
  const [pendingPlace,  setPendingPlace]  = useState<{ name: string; lat: number; lng: number } | undefined>(undefined)
  const mapSearchAcRef  = useRef<google.maps.places.Autocomplete | null>(null)

  const handleMapDblClick = useCallback((lat: number, lng: number) => {
    setPendingPlace({ name: '', lat, lng })
  }, [])

  const initMapSearchAc = useCallback((el: HTMLInputElement | null) => {
    if (!el) {
      if (mapSearchAcRef.current) {
        google.maps.event.clearInstanceListeners(mapSearchAcRef.current)
        mapSearchAcRef.current = null
      }
      return
    }
    if (mapSearchAcRef.current) return
    import('@/lib/googleMaps').then(({ loadGoogleMaps }) => loadGoogleMaps()).then(() => {
      if (!el.isConnected) return
      const ac = new google.maps.places.Autocomplete(el, { fields: ['name', 'geometry'] })
      mapSearchAcRef.current = ac
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        setPendingPlace({ name: place.name ?? '', lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
        el.value = ''
      })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 접속 게이트 */
  type Gate = 'waiting' | 'choosing' | 'granted'
  const [gate,      setGate]     = useState<Gate>('waiting')
  const [guestName, setGuestName] = useState('')

  /* 코드로 trip 찾기 — shareIndex 단일 조회 */
  useEffect(() => {
    const lookup = async () => {
      const idxSnap = await getDoc(doc(db, 'shareIndex', code))
      if (!idxSnap.exists()) { setNotFound(true); return }

      const { uid, tripId, canEdit: edit } = idxSnap.data() as { uid: string; tripId: string; canEdit: boolean }
      const tripSnap = await getDoc(doc(db, 'users', uid, 'trips', tripId))
      if (!tripSnap.exists()) { setNotFound(true); return }

      setTrip({ uid, id: tripId, ...(tripSnap.data() as Omit<TripMeta, 'uid' | 'id'>) })
      setCanEdit(edit)
    }
    lookup()
  }, [code])

  /* 인증 상태 확인 후 게이트 결정 */
  useEffect(() => {
    if (authLoading || !trip) return
    if (user) {
      setGate('granted')
      /* 총무 역할이면 편집 권한 부여 */
      const member = (trip.members ?? []).find(m => m.id === user.uid)
      if (member?.role === 'treasurer') setCanEdit(true)
      /* 로그인 유저가 멤버 목록에 없으면 자동 추가 (인원 제한 내, 탈퇴 멤버 제외) */
      const alreadyIn = (trip.members ?? []).some(m => m.id === user.uid)
      const activeCount = (trip.members ?? []).filter(m => !m.left).length
      if (!alreadyIn && activeCount < (trip.people || 1)) {
        const newMember = {
          id:       user.uid,
          name:     user.displayName || '멤버',
          photoURL: user.photoURL ?? undefined,
          role:     'member' as const,
        }
        const updatedMembers = [...(trip.members ?? []), newMember]
        updateDoc(doc(db, 'users', trip.uid, 'trips', trip.id), { members: updatedMembers })
          .then(() => {
            setTrip(prev => prev ? { ...prev, members: updatedMembers } : prev)
            setDoc(doc(db, 'users', user.uid, 'invitedTrips', trip.id), {
              ownerUid: trip.uid, tripId: trip.id, viewCode: trip.viewCode,
            }).catch(() => {})
          })
          .catch(() => {})
      }
    } else {
      setGate('choosing')
    }
  }, [authLoading, user, trip])

  /* 환율 */
  const tripCurrencies = useMemo(() => trip ? detectCurrencies(trip.city) : ['KRW'], [trip])
  const primaryCurrency = tripCurrencies[0]
  useEffect(() => {
    if (primaryCurrency !== 'KRW') getRatesInKRW().then(setRates)
  }, [primaryCurrency])

  const days = useMemo(() => trip ? buildDays(trip) : [], [trip])

  /* 아이템 1회 로드 */
  useEffect(() => {
    if (!trip || !days.length) return
    Promise.all(
      days.map(day =>
        getDocs(collection(db, 'users', trip.uid, 'trips', trip.id, 'days', day.dayId, 'items'))
          .then(snap => ({ dayId: day.dayId, items: snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanItem[] }))
      )
    ).then(results => {
      const merged: Record<string, PlanItem[]> = {}
      results.forEach(r => { merged[r.dayId] = r.items })
      setDayItems(merged)
    }).catch(() => {})
  }, [trip, days.length])

  const activeDay    = days[activeDayIdx]
  const currentItems = activeDay ? (dayItems[activeDay.dayId] ?? []) : []

  const grouped = useMemo(() => {
    const g: Record<TimeSlot, PlanItem[]> = { 아침: [], 점심: [], 저녁: [], 미정: [] }
    currentItems.forEach(i => g[i.timeSlot as TimeSlot]?.push(i))
    Object.keys(g).forEach(k => g[k as TimeSlot].sort((a, b) => a.order - b.order))
    return g
  }, [currentItems])

  const mapItems = useMemo<MapItem[]>(() => {
    const sorted = [...currentItems].sort((a, b) => {
      const so: Record<TimeSlot, number> = { 아침: 0, 점심: 1, 저녁: 2, 미정: 3 }
      return (so[a.timeSlot] - so[b.timeSlot]) || (a.order - b.order)
    })
    return sorted.map(i => ({ id: i.id, name: i.name, lat: i.lat, lng: i.lng, timeSlot: i.timeSlot }))
  }, [currentItems])

  const mapIndexMap = useMemo(() => {
    const m: Record<string, number> = {}
    let n = 0
    mapItems.forEach(item => {
      const lat = Number(item.lat), lng = Number(item.lng)
      if (isFinite(lat) && isFinite(lng) && (lat !== 0 || lng !== 0)) m[item.id] = ++n
    })
    return m
  }, [mapItems])

  const [focusItemId, setFocusItemId] = useState<string | undefined>(undefined)

  const totalSpent = useMemo(
    () => Object.values(dayItems).flat().reduce((s, i) => s + toKRW(i.price, i.currency, rates), 0),
    [dayItems, rates]
  )
  const perPersonSpent = useMemo(
    () => Object.values(dayItems).flat().reduce(
      (s, i) => s + toKRW(i.price, i.currency, rates) / (i.participants || trip?.people || 1),
      0
    ),
    [dayItems, rates, trip]
  )

  const handleAdd = async (partial: Omit<PlanItem, 'id' | 'order'>) => {
    if (!activeDay || !trip) return
    await setDoc(doc(db, 'users', trip.uid, 'trips', trip.id, 'days', activeDay.dayId),
      { label: activeDay.label, date: activeDay.date }, { merge: true })
    const newOrder = currentItems.length
    const docRef = await addDoc(collection(db, 'users', trip.uid, 'trips', trip.id, 'days', activeDay.dayId, 'items'),
      { ...partial, order: newOrder, createdAt: serverTimestamp() })
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: [...(prev[activeDay.dayId] ?? []), { id: docRef.id, ...partial, order: newOrder }],
    }))
    /* 멤버들에게 알림 */
    notifyTripMembers({
      ownerUid: trip.uid,
      members:  trip.members ?? [],
      actorUid: user?.uid ?? null,
      title:    `${user?.displayName ?? '총무'}이(가) 일정을 추가했습니다`,
      body:     `${trip.title || trip.city} · ${partial.name}`,
      tripPath: `/share/${code}`,
    })
  }

  const handleDelete = async (itemId: string) => {
    if (!activeDay || !trip) return
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: (prev[activeDay.dayId] ?? []).filter(i => i.id !== itemId),
    }))
    await deleteDoc(doc(db, 'users', trip.uid, 'trips', trip.id, 'days', activeDay.dayId, 'items', itemId))
  }

  const handleEditSave = async (itemId: string, patch: Partial<Omit<PlanItem, 'id' | 'order'>>) => {
    if (!activeDay || !trip) return
    await updateDoc(
      doc(db, 'users', trip.uid, 'trips', trip.id, 'days', activeDay.dayId, 'items', itemId),
      patch
    )
  }

  const handleRate = async (itemId: string, stars: number) => {
    if (!activeDay || !trip || !user) return
    setDayItems(prev => ({
      ...prev,
      [activeDay.dayId]: (prev[activeDay.dayId] ?? []).map(i =>
        i.id !== itemId ? i : { ...i, ratings: { ...(i.ratings ?? {}), [user.uid]: stars } }
      ),
    }))
    await updateDoc(
      doc(db, 'users', trip.uid, 'trips', trip.id, 'days', activeDay.dayId, 'items', itemId),
      { [`ratings.${user.uid}`]: stars }
    )
  }

  const handleLeaveTrip = async () => {
    if (!user || !trip) return
    if (!window.confirm('이 여행에서 탈퇴하시겠습니까?')) return
    const updatedMembers = (trip.members ?? []).map(m =>
      m.id === user.uid ? { ...m, left: true } : m
    )
    await updateDoc(doc(db, 'users', trip.uid, 'trips', trip.id), { members: updatedMembers })
    await deleteDoc(doc(db, 'users', user.uid, 'invitedTrips', trip.id)).catch(() => {})
    router.replace('/')
  }

  /* ── 로딩 ── */
  if (!trip && !notFound) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }
  if (notFound || !trip) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <MapPin className="w-8 h-8 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">유효하지 않은 초대 링크예요.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">홈으로</Link>
      </div>
    )
  }

  /* ── 접속 게이트 ── */
  if (gate === 'waiting' || gate === 'choosing') {
    const memberCount = (trip.members ?? []).length
    const tw = gradientTextColor(trip.gradient) === 'white'
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] overflow-hidden">
          <div className="h-24 flex items-end px-6 pb-4" style={{ background: gradientStyle(trip.gradient) }}>
            <div>
              <p className={`font-bold text-lg leading-tight ${tw ? 'text-white' : 'text-gray-900'}`}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {trip.title || trip.city}
              </p>
              <p className={`text-xs mt-0.5 ${tw ? 'text-white/70' : 'text-gray-600'}`}>
                {trip.startDate.replace(/-/g,'.')} – {trip.endDate.slice(5).replace('-','.')} · 멤버 {memberCount}명
              </p>
            </div>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-0.5">여행에 참여하시겠어요?</p>
              <p className="text-xs text-gray-400">접속 방법을 선택해주세요.</p>
            </div>
            <button
              onClick={() => router.push(`/auth?redirect=/share/${code}`)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="white" fillOpacity="0.9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" fillOpacity="0.9" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" fillOpacity="0.9" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" fillOpacity="0.9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Voyalogue 회원 로그인
            </button>
            <button
              onClick={() => { setGuestName('(비회원)'); setCanEdit(false); setGate('granted') }}
              className="w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
            >
              비회원으로 접속
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* 현재 접속자 정보 */
  const currentMember   = user ? (trip.members ?? []).find(m => m.id === user.uid) ?? null : null

  /* ── 대표 초대링크 참여 ── */
  const handleJoinTrip = async () => {
    if (!user) { router.push(`/auth?redirect=/share/${code}`); return }
    const members = trip.members ?? []
    if (members.length >= (trip.people || 1)) {
      setJoinError('여행 인원이 가득 찼습니다. 방장에게 인원 증가를 요청하세요.')
      return
    }
    setJoining(true)
    try {
      const updatedMembers = [...members, {
        id:       user.uid,
        name:     user.displayName || user.email?.split('@')[0] || '멤버',
        photoURL: user.photoURL ?? undefined,
        role:     'member' as const,
      }]
      await updateDoc(doc(db, 'users', trip.uid, 'trips', trip.id), { members: updatedMembers })
      await setDoc(doc(db, 'users', user.uid, 'invitedTrips', trip.id), {
        ownerUid: trip.uid, tripId: trip.id, viewCode: trip.viewCode,
      })
      setTrip(prev => prev ? { ...prev, members: updatedMembers } : prev)
    } catch {
      setJoinError('참여 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setJoining(false)
    }
  }
  /* 탈퇴한 멤버 화면 */
  if (currentMember?.left === true) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <LogOut className="w-8 h-8 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">탈퇴한 여행입니다.</p>
        <p className="text-xs text-gray-400">초대 링크를 통해 다시 참여할 수 있어요.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">홈으로</Link>
      </div>
    )
  }

  const currentName     = user ? (user.displayName || user.email?.split('@')[0] || '나') : (guestName || '나')
  const currentPhotoURL = user?.photoURL ?? undefined
  const isTreasurer     = currentMember?.role === 'treasurer'

  /* Firebase Auth 최신 정보 반영 멤버 목록 (탈퇴 멤버 제외) */
  const resolvedMembers = (trip.members ?? []).filter(m => !m.left).map(m => ({
    ...m,
    photoURL: m.id === user?.uid ? (user?.photoURL ?? m.photoURL) : m.photoURL,
    name:     m.id === user?.uid ? (user?.displayName ?? m.name)  : m.name,
  }))

  const tw = gradientTextColor(trip.gradient) === 'white'

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0 z-20">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link href="/trips" className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900" title="내 여행으로">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: gradientStyle(trip.gradient) }} />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 text-sm truncate leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {trip.title || trip.city}
            </span>
            {trip.title && <span className="text-[11px] text-gray-400 leading-tight truncate">{trip.city}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && <NotificationBell />}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-1 pr-3 py-1">
            <div className="relative flex-shrink-0">
              <PersonAvatar
                name={currentName}
                photoURL={currentPhotoURL}
                size={30}
                colorIndex={currentMember?.colorIndex}
              />
              {isTreasurer && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <Wallet className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-gray-800 truncate max-w-[80px] leading-tight">{currentName}</span>
              <span className="text-[10px] leading-tight font-medium" style={{ color: isTreasurer ? '#d97706' : '#9ca3af' }}>
                {isTreasurer ? '총무' : currentMember ? '멤버' : '비회원'}
              </span>
            </div>
          </div>
          {/* 여행 탈퇴 버튼 — 초대된 멤버(오너 제외)에게만 표시 */}
          {user && currentMember && !currentMember.left && trip.uid !== user.uid && (
            <button
              onClick={handleLeaveTrip}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              title="여행 탈퇴"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* ── 참여 배너 (로그인 유저이지만 멤버가 아닌 경우) ── */}
      {user && !currentMember && !guestName && (
        <div className="flex-shrink-0 px-4 pt-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-blue-900 leading-snug">이 여행에 참여하시겠어요?</p>
              <p className="text-[11px] text-blue-500 leading-snug mt-0.5">
                {joinError || '참여하면 멤버로 등록되어 알림을 받을 수 있어요.'}
              </p>
            </div>
            <button
              onClick={handleJoinTrip}
              disabled={joining}
              className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {joining ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
              참여하기
            </button>
          </div>
        </div>
      )}

      {/* 헤더 카드 */}
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
          {/* 그라디언트 영역 */}
          <div className="h-20 px-5 flex items-center justify-between"
            style={{ background: gradientStyle(trip.gradient) }}>
            <div>
              <p className={`font-bold text-lg leading-tight ${tw ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {trip.title || trip.city}
              </p>
              <p className={`text-xs mt-0.5 ${tw ? 'text-white/70' : 'text-gray-600'}`}>
                {trip.startDate.replace(/-/g,'.')} – {trip.endDate.slice(5).replace('-','.')} · {trip.nights}박 {trip.days}일
              </p>
            </div>
          </div>
          {/* 멤버 이름 스트립 */}
          <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide border-t border-gray-100">
            {resolvedMembers.map((m, i) => (
              <div key={m.id} className="flex items-center gap-1.5 flex-shrink-0 bg-gray-50 border border-gray-100 rounded-full pl-0.5 pr-2.5 py-0.5">
                <div className="relative flex-shrink-0">
                  <PersonAvatar
                    name={m.name}
                    photoURL={m.photoURL}
                    size={22}
                    colorIndex={m.id === user?.uid ? (currentMember?.colorIndex ?? ((i % (CLAY.length - 1)) + 1)) : (m.colorIndex ?? ((i % (CLAY.length - 1)) + 1))}
                  />
                  {m.role === 'owner' && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <Crown className="w-1.5 h-1.5 text-white" />
                    </span>
                  )}
                  {m.role === 'treasurer' && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                      <Wallet className="w-1.5 h-1.5 text-white" />
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-semibold leading-none whitespace-nowrap ${
                  m.id === user?.uid ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {m.id === user?.uid ? '나' : m.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day 탭 */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 z-10 mt-3">
        <div className="px-4 flex items-center gap-1 overflow-x-auto">
          {days.map((d, i) => (
            <button key={d.dayId} onClick={() => setActiveDayIdx(i)}
              className={`flex-shrink-0 px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${
                i === activeDayIdx ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}>
              <span>{d.label}</span>
              <span className="block text-[10px] font-normal mt-0.5 text-gray-400">{formatDate(d.date)}</span>
            </button>
          ))}
        </div>
        <div className="flex lg:hidden border-t border-gray-100">
          <button onClick={() => setMobileTab('schedule')}
            className={`flex-1 py-2 text-xs font-semibold ${mobileTab === 'schedule' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>일정</button>
          <button onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 text-xs font-semibold ${mobileTab === 'map' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>지도</button>
        </div>
      </div>

      {/* 메인 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 일정 */}
        <div className={`${mobileTab === 'map' ? 'hidden' : 'flex'} lg:flex w-full lg:w-[420px] flex-shrink-0 flex-col bg-[#F8FAFC] overflow-hidden lg:border-r border-gray-200`}>
          <div className="px-5 py-4 flex items-center justify-between flex-shrink-0">
            <p className="text-sm font-bold text-gray-900">{activeDay?.label} · {activeDay ? formatDate(activeDay.date) : ''}</p>
            {canEdit && (
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> 추가
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
            {/* ── 고정 일정 (비행기 / 숙소) ── */}
            {activeDay && (() => {
              const activeDayIdx2 = days.findIndex(d => d.dayId === activeDay.dayId)
              const dayFlights = (trip.flights ?? []).filter(f => f.dayId === activeDay.dayId)
              const dayAccs: Array<{ acc: AccommodationItem; role: 'checkin' | 'stay' | 'checkout' }> = []
              for (const acc of (trip.accommodations ?? [])) {
                const inIdx  = days.findIndex(d => d.dayId === acc.checkInDayId)
                const outIdx = days.findIndex(d => d.dayId === acc.checkOutDayId)
                if (acc.checkInDayId === activeDay.dayId)        dayAccs.push({ acc, role: 'checkin' })
                else if (acc.checkOutDayId === activeDay.dayId)  dayAccs.push({ acc, role: 'checkout' })
                else if (activeDayIdx2 > inIdx && activeDayIdx2 < outIdx) dayAccs.push({ acc, role: 'stay' })
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
                    </div>
                  ))}
                </div>
              )
            })()}

            {currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                <MapPin className="w-8 h-8 text-gray-200" />
                <p className="text-sm">이 날 일정이 없어요</p>
              </div>
            ) : (
              TIME_SLOTS.map(slot => {
                const slotItems = grouped[slot]
                if (!slotItems.length) return null
                return (
                  <div key={slot}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${SLOT_DOT[slot]}`} />
                      <span className="text-xs font-bold text-gray-500">{slot}</span>
                      <span className="text-[10px] text-gray-300 ml-auto">{slotItems.length}개</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {slotItems.map(item => (
                        <ItemCard key={item.id} item={item} canEdit={canEdit} myUid={user?.uid} onEdit={setEditingItem} onDelete={handleDelete} onRate={handleRate} mapIndex={mapIndexMap[item.id]} onFocusMap={id => setFocusItemId(id)} />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 푸터 */}
          <div className="border-t border-gray-200 bg-white px-5 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-xs text-gray-500"><Wallet className="w-3.5 h-3.5" />전체 지출</span>
              <span className="text-xs font-bold text-gray-700">
                {primaryCurrency !== 'KRW' && rates[primaryCurrency]
                  ? formatLocal(Math.round(totalSpent / rates[primaryCurrency]), primaryCurrency)
                  : formatKRW(totalSpent)}
              </span>
            </div>
            {(trip.people || 1) > 1 && perPersonSpent > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <span className="flex items-center gap-1 text-[11px] text-gray-400"><Users className="w-3 h-3" />1인 부담</span>
                <span className="text-[11px] font-semibold text-blue-600">
                  {primaryCurrency !== 'KRW' && rates[primaryCurrency]
                    ? formatLocal(Math.round(perPersonSpent / rates[primaryCurrency]), primaryCurrency)
                    : formatKRW(Math.round(perPersonSpent))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 지도 */}
        <div className={`${mobileTab === 'schedule' ? 'hidden' : 'flex'} lg:flex flex-1 flex-col overflow-hidden`}>
          {/* 검색바 — canEdit(방장/총무) 전용 */}
          {canEdit && (
            <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-100">
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
            </div>
          )}
          {/* 지도 */}
          <div className="flex-1 relative overflow-hidden">
            {/* 더블클릭 힌트 — canEdit 전용 */}
            {canEdit && !pendingPlace && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <span className="text-[10px] text-gray-400 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-gray-100">
                  더블클릭으로 위치 직접 추가
                </span>
              </div>
            )}
            <TripMap
              city={trip.city}
              items={mapItems}
              focusId={focusItemId}
              previewPlace={pendingPlace}
              onDblClick={canEdit ? handleMapDblClick : undefined}
            />
            {/* 장소 미리보기 카드 — canEdit 전용 */}
            {canEdit && pendingPlace && (
              <div className="absolute bottom-4 left-3 right-3 z-20 pointer-events-auto">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-red-500" />
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
                    <button
                      onClick={() => setShowAdd(true)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      이 장소를 일정에 추가하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddPanel
          onAdd={handleAdd}
          onClose={() => { setShowAdd(false); setPendingPlace(undefined) }}
          defaultCurrency={primaryCurrency}
          currencies={tripCurrencies}
          members={resolvedMembers}
          tripUid={trip.uid}
          tripId={trip.id}
          defaultPlace={pendingPlace}
        />
      )}

      {editingItem && (
        <EditPanel
          item={editingItem}
          onSave={handleEditSave}
          onClose={() => setEditingItem(null)}
          defaultCurrency={primaryCurrency}
          currencies={tripCurrencies}
          members={resolvedMembers}
          tripUid={trip.uid}
          tripId={trip.id}
        />
      )}
    </div>
  )
}
