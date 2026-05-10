export type TimeSlot = '아침' | '점심' | '저녁' | '미정'
export type ItemCategory = '식사' | '장소' | '쇼핑' | '교통' | '기타'

export interface PlannerItem {
  id: string
  name: string
  timeSlot: TimeSlot
  cat: ItemCategory
  price?: number
  currency?: string
  comment?: string
  order: number
  lat?: number
  lng?: number
  rating?: number
  reviewText?: string
  photos?: string[]
}

export interface PlannerDay {
  id: string
  date: string
  items: PlannerItem[]
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
  category?: string
}
