'use client'

import { useRef } from 'react'
import { Plane, BedDouble, Pencil, X, MapPin, ImageIcon } from 'lucide-react'

export type FlightItem = {
  id:         string
  name:       string
  type:       'inbound' | 'outbound'
  dayId:      string
  departTime: string
  arriveTime: string
  lat?:       number
  lng?:       number
  price?:               number
  currency?:            string
  includeInSettlement?: boolean
  payerId?:             string
  participantIds?:      string[]
  photos?:              string[]
}

export type AccommodationItem = {
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
  photos?:              string[]
}

type DayEntry = { dayId: string }

type Props = {
  flights:        FlightItem[]
  accommodations: AccommodationItem[]
  activeDay:      DayEntry
  days:           DayEntry[]
  onEditFlight?:         (f: FlightItem) => void
  onDeleteFlight?:       (id: string) => void
  onEditAcc?:            (a: AccommodationItem) => void
  onDeleteAcc?:          (id: string) => void
  onFocusMap?:           (itemId: string) => void
  onViewPhotos?:         (photos: string[]) => void
  onUploadFlightPhoto?:  (id: string, files: FileList) => void
  onUploadAccPhoto?:     (id: string, files: FileList) => void
  canEdit?:              boolean
}

export function FixedScheduleSection({
  flights, accommodations, activeDay, days,
  onEditFlight, onDeleteFlight, onEditAcc, onDeleteAcc, onFocusMap,
  onViewPhotos, onUploadFlightPhoto, onUploadAccPhoto, canEdit,
}: Props) {
  const flightCameraRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const accCameraRefs    = useRef<Record<string, HTMLInputElement | null>>({})

  const activeDayIdx = days.findIndex(d => d.dayId === activeDay.dayId)

  const dayFlights = flights.filter(f => f.dayId === activeDay.dayId)
  const dayAccs: Array<{ acc: AccommodationItem; role: 'checkin' | 'stay' | 'checkout' }> = []

  for (const acc of accommodations) {
    const inIdx  = days.findIndex(d => d.dayId === acc.checkInDayId)
    const outIdx = days.findIndex(d => d.dayId === acc.checkOutDayId)
    if (acc.checkInDayId === activeDay.dayId)       dayAccs.push({ acc, role: 'checkin' })
    else if (acc.checkOutDayId === activeDay.dayId) dayAccs.push({ acc, role: 'checkout' })
    else if (activeDayIdx > inIdx && activeDayIdx < outIdx) dayAccs.push({ acc, role: 'stay' })
  }

  if (dayFlights.length === 0 && dayAccs.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">고정 일정</span>

      {dayFlights.map(f => (
        <div key={f.id}
          className={`flex items-center gap-3 pl-0 pr-3 py-0 bg-white border border-sky-200 rounded-xl overflow-hidden shadow-sm ${f.lat && f.lng && onFocusMap ? 'cursor-pointer hover:border-sky-400 transition-colors' : ''}`}
          onClick={() => f.lat && f.lng && onFocusMap?.(f.id)}
        >
          <div className="w-10 h-full min-h-[52px] bg-sky-500 flex items-center justify-center flex-shrink-0">
            <Plane className="text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1 min-w-0 py-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                f.type === 'inbound' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {f.type === 'inbound' ? '입국' : '출국'}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-900 leading-snug truncate">{f.name}</p>
            {(f.departTime || f.arriveTime) && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {f.departTime && `출발 ${f.departTime}`}
                {f.departTime && f.arriveTime && ' → '}
                {f.arriveTime && `도착 ${f.arriveTime}`}
              </p>
            )}
            {!!f.price && (
              <p className={`text-[10px] font-semibold mt-0.5 ${f.includeInSettlement ? 'text-sky-600' : 'text-gray-400'}`}>
                {f.currency ?? ''} {f.price.toLocaleString()}
                {!f.includeInSettlement && <span className="ml-1 text-[9px]">(정산 미포함)</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {f.photos && f.photos.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onViewPhotos?.(f.photos!) }}
                className="flex items-center gap-0.5 bg-violet-50 px-1.5 py-0.5 rounded-full hover:bg-violet-100 transition-colors"
              >
                <ImageIcon className="w-2.5 h-2.5 text-violet-600" />
                <span className="text-[11px] font-semibold text-violet-600">{f.photos.length}</span>
              </button>
            )}
            {canEdit && (!f.photos || f.photos.length < 3) && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); flightCameraRefs.current[f.id]?.click() }}
                  className="flex items-center gap-0.5 bg-white border border-violet-200 px-1.5 py-0.5 rounded-full hover:bg-violet-50 hover:border-violet-300 transition-colors"
                  title="사진 업로드"
                >
                  <ImageIcon className="w-2.5 h-2.5 text-violet-400" />
                </button>
                <input
                  ref={el => { flightCameraRefs.current[f.id] = el }}
                  type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { if (e.target.files?.length) { onUploadFlightPhoto?.(f.id, e.target.files); e.target.value = '' } }}
                />
              </>
            )}
          </div>
          {(onEditFlight || onDeleteFlight) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEditFlight && (
                <button onClick={e => { e.stopPropagation(); onEditFlight(f) }}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {onDeleteFlight && (
                <button onClick={e => { e.stopPropagation(); onDeleteFlight(f.id) }}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {dayAccs.map(({ acc, role }) => (
        <div key={`${acc.id}-${role}`}
          className={`flex items-center gap-3 pl-0 pr-3 py-0 bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm ${acc.lat && acc.lng && onFocusMap ? 'cursor-pointer hover:border-amber-400 transition-colors' : ''}`}
          onClick={() => acc.lat && acc.lng && onFocusMap?.(`${acc.id}_in`)}
        >
          <div className={`w-10 h-full min-h-[52px] flex items-center justify-center flex-shrink-0 ${
            role === 'stay' ? 'bg-amber-300' : 'bg-amber-500'
          }`}>
            <BedDouble className="text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1 min-w-0 py-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                role === 'checkin'  ? 'bg-amber-100 text-amber-700'
                : role === 'checkout' ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-500'
              }`}>
                {role === 'checkin' ? '체크인' : role === 'checkout' ? '체크아웃' : '숙박중'}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-900 leading-snug truncate">{acc.name}</p>
            {role === 'checkin' && acc.checkInTime && (
              <p className="text-[10px] text-gray-400 mt-0.5">체크인 {acc.checkInTime}</p>
            )}
            {role === 'checkout' && acc.checkOutTime && (
              <p className="text-[10px] text-gray-400 mt-0.5">체크아웃 {acc.checkOutTime}</p>
            )}
            {role === 'checkin' && !!acc.price && (
              <p className={`text-[10px] font-semibold mt-0.5 ${acc.includeInSettlement ? 'text-amber-600' : 'text-gray-400'}`}>
                {acc.currency ?? ''} {acc.price.toLocaleString()}
                {!acc.includeInSettlement && <span className="ml-1 text-[9px]">(정산 미포함)</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {acc.photos && acc.photos.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onViewPhotos?.(acc.photos!) }}
                className="flex items-center gap-0.5 bg-violet-50 px-1.5 py-0.5 rounded-full hover:bg-violet-100 transition-colors"
              >
                <ImageIcon className="w-2.5 h-2.5 text-violet-600" />
                <span className="text-[11px] font-semibold text-violet-600">{acc.photos.length}</span>
              </button>
            )}
            {canEdit && (!acc.photos || acc.photos.length < 3) && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); accCameraRefs.current[acc.id]?.click() }}
                  className="flex items-center gap-0.5 bg-white border border-violet-200 px-1.5 py-0.5 rounded-full hover:bg-violet-50 hover:border-violet-300 transition-colors"
                  title="사진 업로드"
                >
                  <ImageIcon className="w-2.5 h-2.5 text-violet-400" />
                </button>
                <input
                  ref={el => { accCameraRefs.current[acc.id] = el }}
                  type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { if (e.target.files?.length) { onUploadAccPhoto?.(acc.id, e.target.files); e.target.value = '' } }}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {acc.lat && acc.lng && (
              <a
                href={`https://maps.google.com/?q=${acc.lat},${acc.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                title="구글 지도에서 보기"
              >
                <MapPin className="w-3 h-3" />
              </a>
            )}
            {role !== 'stay' && onEditAcc && (
              <button onClick={() => onEditAcc(acc)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {role !== 'stay' && onDeleteAcc && (
              <button onClick={() => onDeleteAcc(acc.id)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
