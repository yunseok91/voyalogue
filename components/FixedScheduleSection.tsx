'use client'

import { Plane, BedDouble, Pencil, X } from 'lucide-react'

export type FlightItem = {
  id:         string
  name:       string
  type:       'inbound' | 'outbound'
  dayId:      string
  departTime: string
  arriveTime: string
}

export type AccommodationItem = {
  id:            string
  name:          string
  checkInDayId:  string
  checkInTime:   string
  checkOutDayId: string
  checkOutTime:  string
}

type DayEntry = { dayId: string }

type Props = {
  flights:        FlightItem[]
  accommodations: AccommodationItem[]
  activeDay:      DayEntry
  days:           DayEntry[]
  onEditFlight?:       (f: FlightItem) => void
  onDeleteFlight?:     (id: string) => void
  onEditAcc?:          (a: AccommodationItem) => void
  onDeleteAcc?:        (id: string) => void
}

export function FixedScheduleSection({
  flights, accommodations, activeDay, days,
  onEditFlight, onDeleteFlight, onEditAcc, onDeleteAcc,
}: Props) {
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
        <div key={f.id} className="flex items-center gap-3 pl-0 pr-3 py-0 bg-white border border-sky-200 rounded-xl overflow-hidden shadow-sm">
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
          </div>
          {(onEditFlight || onDeleteFlight) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEditFlight && (
                <button onClick={() => onEditFlight(f)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {onDeleteFlight && (
                <button onClick={() => onDeleteFlight(f.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {dayAccs.map(({ acc, role }) => (
        <div key={`${acc.id}-${role}`} className="flex items-center gap-3 pl-0 pr-3 py-0 bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
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
          </div>
          {role !== 'stay' && (onEditAcc || onDeleteAcc) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEditAcc && (
                <button onClick={() => onEditAcc(acc)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {onDeleteAcc && (
                <button onClick={() => onDeleteAcc(acc.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
