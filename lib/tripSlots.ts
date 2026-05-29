export type TimeSlot = '아침' | '점심' | '저녁' | '미정'

export const TIME_SLOTS: TimeSlot[] = ['아침', '점심', '저녁', '미정']

export const SLOT_STYLES: Record<TimeSlot, string> = {
  아침: 'border-amber-300 text-amber-700 bg-amber-50',
  점심: 'border-green-300 text-green-700 bg-green-50',
  저녁: 'border-violet-300 text-violet-700 bg-violet-50',
  미정: 'border-gray-200 text-gray-500 bg-gray-50',
}

export const SLOT_DOT: Record<TimeSlot, string> = {
  아침: 'bg-amber-400',
  점심: 'bg-green-500',
  저녁: 'bg-violet-500',
  미정: 'bg-gray-400',
}
