import {
  doc, setDoc, getDoc, writeBatch, collection, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

/* ── 시드 데이터 ── */
const SEED_TRIPS = [
  { id: '1',  city: '방콕, 태국',         country: '태국',   startDate: '2026-04-24', endDate: '2026-04-29', nights: 5, days: 6, gradient: 'from-amber-500 to-orange-600' },
  { id: '2',  city: '파리, 프랑스',       country: '프랑스', startDate: '2026-07-15', endDate: '2026-07-20', nights: 5, days: 6, gradient: 'from-violet-500 to-violet-700' },
  { id: '3',  city: '도쿄, 일본',         country: '일본',   startDate: '2026-08-10', endDate: '2026-08-15', nights: 5, days: 6, gradient: 'from-blue-500 to-blue-700' },
  { id: '4',  city: '뉴욕, 미국',         country: '미국',   startDate: '2026-09-01', endDate: '2026-09-07', nights: 6, days: 7, gradient: 'from-slate-500 to-slate-700' },
  { id: '5',  city: '바르셀로나, 스페인', country: '스페인', startDate: '2026-10-05', endDate: '2026-10-10', nights: 5, days: 6, gradient: 'from-rose-500 to-rose-700' },
  { id: '6',  city: '싱가포르',           country: '싱가포르', startDate: '2026-11-20', endDate: '2026-11-25', nights: 5, days: 6, gradient: 'from-teal-500 to-teal-700' },
  { id: '7',  city: '제주, 한국',         country: '한국',   startDate: '2026-03-20', endDate: '2026-03-23', nights: 3, days: 4, gradient: 'from-emerald-500 to-emerald-700' },
  { id: '8',  city: '오사카, 일본',       country: '일본',   startDate: '2025-11-10', endDate: '2025-11-14', nights: 4, days: 5, gradient: 'from-orange-500 to-orange-700' },
  { id: '9',  city: '다낭, 베트남',       country: '베트남', startDate: '2025-08-01', endDate: '2025-08-07', nights: 6, days: 7, gradient: 'from-cyan-500 to-cyan-700' },
  { id: '10', city: '괌',                 country: '미국',   startDate: '2025-03-15', endDate: '2025-03-19', nights: 4, days: 5, gradient: 'from-sky-500 to-sky-700' },
]

/* 방콕 여행(id=1) 일별 아이템 */
const SEED_ITEMS: Record<string, { dayLabel: string; date: string; items: object[] }[]> = {
  '1': [
    {
      dayLabel: 'Day 1', date: '2026-04-24',
      items: [
        { id: 'i1', name: '수완나품 국제공항 도착', timeSlot: '아침',  cat: '교통', price: 0,      currency: 'KRW', comment: '택시로 호텔 이동', order: 0, lat: 13.681, lng: 100.747, rating: 0 },
        { id: 'i2', name: '아속 로컬 식당 점심',    timeSlot: '점심',  cat: '식사', price: 18000,  currency: 'KRW', comment: '팟타이 + 쏨땀',   order: 1, lat: 13.731, lng: 100.560, rating: 4 },
        { id: 'i3', name: '왓 포 사원',             timeSlot: '저녁',  cat: '장소', price: 9000,   currency: 'KRW', comment: '황금 와불상',      order: 2, lat: 13.746, lng: 100.492, rating: 5 },
      ],
    },
    {
      dayLabel: 'Day 2', date: '2026-04-25',
      items: [
        { id: 'i4', name: '짜뚜짝 주말 시장',       timeSlot: '아침',  cat: '쇼핑', price: 60000,  currency: 'KRW', comment: '기념품 구매',      order: 0, lat: 13.799, lng: 100.550, rating: 4 },
        { id: 'i5', name: '카오산 로드 점심',        timeSlot: '점심',  cat: '식사', price: 22000,  currency: 'KRW', comment: '길거리 음식',       order: 1, lat: 13.759, lng: 100.497, rating: 3 },
        { id: 'i6', name: '왕궁 & 에메랄드 사원',   timeSlot: '미정',  cat: '장소', price: 18000,  currency: 'KRW', comment: '복장 규정 있음',    order: 2, lat: 13.751, lng: 100.491, rating: 5 },
      ],
    },
    {
      dayLabel: 'Day 3', date: '2026-04-26',
      items: [
        { id: 'i7', name: '아이콘시암 쇼핑몰',      timeSlot: '점심',  cat: '쇼핑', price: 120000, currency: 'KRW', comment: '강변 뷰 레스토랑', order: 0, lat: 13.726, lng: 100.510, rating: 4 },
        { id: 'i8', name: '루프탑 바 - 오크라',      timeSlot: '저녁',  cat: '장소', price: 45000,  currency: 'KRW', comment: '야경이 환상적',    order: 1, lat: 13.722, lng: 100.526, rating: 5 },
      ],
    },
    { dayLabel: 'Day 4', date: '2026-04-27', items: [] },
    { dayLabel: 'Day 5', date: '2026-04-28', items: [] },
    {
      dayLabel: 'Day 6', date: '2026-04-29',
      items: [
        { id: 'i9', name: '수완나품 공항 출국',      timeSlot: '아침',  cat: '교통', price: 0,      currency: 'KRW', comment: '3시간 전 도착',    order: 0, lat: 13.681, lng: 100.747, rating: 0 },
      ],
    },
  ],
}

function buildDays(trip: typeof SEED_TRIPS[0]) {
  const days: { id: string; label: string; date: string }[] = []
  const start = new Date(trip.startDate)
  for (let i = 0; i < trip.days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push({
      id:    `d${i + 1}`,
      label: `Day ${i + 1}`,
      date:  d.toISOString().slice(0, 10),
    })
  }
  return days
}

/* ── 메인 시드 함수 ── */
export async function seedUserData(uid: string): Promise<void> {
  const profileRef = doc(db, 'users', uid)
  const snap = await getDoc(profileRef)

  /* 이미 시드된 경우 스킵 */
  if (snap.exists() && snap.data()?.seeded === true) return

  const batch = writeBatch(db)

  /* 프로필 마킹 */
  batch.set(profileRef, { seeded: true, createdAt: serverTimestamp() }, { merge: true })

  for (const trip of SEED_TRIPS) {
    const tripRef = doc(db, 'users', uid, 'trips', trip.id)
    batch.set(tripRef, {
      city:      trip.city,
      country:   trip.country,
      startDate: trip.startDate,
      endDate:   trip.endDate,
      nights:    trip.nights,
      days:      trip.days,
      gradient:  trip.gradient,
      budget:    trip.id === '1' ? 1200000 : 0,
      people:    2,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    type SeedDay = { dayLabel?: string; label?: string; date: string; items: object[] }
    const days: SeedDay[] = SEED_ITEMS[trip.id]
      ?? buildDays(trip).map(d => ({ label: d.label, date: d.date, items: [] }))

    for (let di = 0; di < days.length; di++) {
      const day   = days[di]
      const dayId = `d${di + 1}`
      const dayRef = doc(db, 'users', uid, 'trips', trip.id, 'days', dayId)
      batch.set(dayRef, { label: day.dayLabel ?? day.label ?? dayId, date: day.date })

      for (const item of day.items as Record<string, unknown>[]) {
        const itemRef = doc(
          collection(db, 'users', uid, 'trips', trip.id, 'days', dayId, 'items')
        )
        batch.set(itemRef, item)
      }
    }
  }

  await batch.commit()
}
