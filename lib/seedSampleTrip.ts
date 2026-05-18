import {
  doc,
  collection,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { generateCode } from '@/lib/inviteCode'

function addDays(base: Date, n: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function seedSampleTrip(uid: string, displayName: string) {
  const startBase = new Date()
  startBase.setDate(startBase.getDate() + 30)
  const startDate = startBase.toISOString().slice(0, 10)
  const endDate   = addDays(startBase, 3)

  const viewCode = generateCode()
  const editCode = generateCode()

  const batch = writeBatch(db)

  /* ── trip 문서 ── */
  const tripRef = doc(collection(db, 'users', uid, 'trips'))
  batch.set(tripRef, {
    city:       '도쿄, 일본',
    country:    '일본',
    title:      '도쿄 여행',
    startDate,
    endDate,
    nights:     3,
    days:       4,
    gradient:   '#3B82F6,#1D4ED8',
    people:     2,
    budget:     1200000,
    viewCode,
    editCode,
    isSample:   true,
    members: [{ id: uid, name: displayName, role: 'owner' }],
    checklist: [
      { id: 'c1', label: '여권 확인',   done: false },
      { id: 'c2', label: '엔화 환전',   done: false },
      { id: 'c3', label: '항공권 예매', done: false },
      { id: 'c4', label: '숙소 예약',   done: false },
      { id: 'c5', label: '여행자 보험', done: false },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  /* ── shareIndex ── */
  batch.set(doc(db, 'shareIndex', viewCode), { uid, tripId: tripRef.id, canEdit: false })
  batch.set(doc(db, 'shareIndex', editCode), { uid, tripId: tripRef.id, canEdit: true })

  /* ── 일별 helper ── */
  const days = [0, 1, 2, 3].map((i) => ({
    dayId: `d${i + 1}`,
    label: `Day ${i + 1}`,
    date:  addDays(startBase, i),
  }))

  type ItemDraft = { name: string; timeSlot: string; cat: string; price: number; currency: string; comment: string; lat: number; lng: number }

  const itemsByDay: ItemDraft[][] = [
    /* Day 1 — 출발 & 도착 */
    [
      { name: '인천국제공항 출발', timeSlot: '아침', cat: '교통',  price: 0,      currency: 'KRW', comment: '출국 2시간 전 도착 권장',      lat: 37.4602, lng: 126.4407 },
      { name: '나리타 공항 도착', timeSlot: '점심', cat: '교통',  price: 0,      currency: 'JPY', comment: '입국 심사 및 짐 수령',           lat: 35.7654, lng: 140.3864 },
      { name: '이케부쿠로 탐방', timeSlot: '저녁', cat: '장소',  price: 0,      currency: 'JPY', comment: '에니메이트·만다라케 방문',       lat: 35.7296, lng: 139.7109 },
      { name: '라멘 나기 혼점',   timeSlot: '저녁', cat: '식사',  price: 1200,   currency: 'JPY', comment: '이케부쿠로 명물 라멘',           lat: 35.7309, lng: 139.7093 },
    ],
    /* Day 2 — 아사쿠사 & 도쿄 타워 */
    [
      { name: '아사쿠사 센소지', timeSlot: '아침', cat: '장소',  price: 0,      currency: 'JPY', comment: '아침 일찍 방문하면 한산함',       lat: 35.7148, lng: 139.7967 },
      { name: '나카미세도리 쇼핑', timeSlot: '아침', cat: '쇼핑', price: 5000,  currency: 'JPY', comment: '기념품 구매 최적 장소',          lat: 35.7123, lng: 139.7963 },
      { name: '우오가시 스시',    timeSlot: '점심', cat: '식사',  price: 3000,   currency: 'JPY', comment: '쌉쌀한 에도마에 스시',          lat: 35.7142, lng: 139.7978 },
      { name: '도쿄 타워',        timeSlot: '저녁', cat: '장소',  price: 1800,   currency: 'JPY', comment: '야경이 아름다운 전망대',         lat: 35.6586, lng: 139.7454 },
    ],
    /* Day 3 — 시부야 & 하라주쿠 */
    [
      { name: '메이지 신궁',      timeSlot: '아침', cat: '장소',  price: 0,      currency: 'JPY', comment: '울창한 숲속 신사',               lat: 35.6763, lng: 139.6993 },
      { name: '하라주쿠 다케시타도리', timeSlot: '점심', cat: '쇼핑', price: 8000, currency: 'JPY', comment: '패션·팝업 스토어 밀집',     lat: 35.6716, lng: 139.7027 },
      { name: '크레이프 마리온',  timeSlot: '점심', cat: '식사',  price: 700,    currency: 'JPY', comment: '하라주쿠 명물 크레이프',        lat: 35.6712, lng: 139.7030 },
      { name: '시부야 스크램블 교차로', timeSlot: '저녁', cat: '장소', price: 0, currency: 'JPY', comment: '세계에서 가장 바쁜 교차로',    lat: 35.6595, lng: 139.7004 },
    ],
    /* Day 4 — 아키하바라 & 귀국 */
    [
      { name: '아키하바라 전자상가', timeSlot: '아침', cat: '쇼핑', price: 15000, currency: 'JPY', comment: '전자제품·피규어·게임',         lat: 35.7023, lng: 139.7745 },
      { name: '이치란 라멘 아키하바라점', timeSlot: '점심', cat: '식사', price: 980, currency: 'JPY', comment: '혼자 먹는 라멘의 성지',    lat: 35.7018, lng: 139.7730 },
      { name: '나리타 공항 출발', timeSlot: '미정',  cat: '교통',  price: 0,      currency: 'JPY', comment: '출발 3시간 전 공항 이동',       lat: 35.7654, lng: 140.3864 },
    ],
  ]

  /* ── 배치에 days & items 추가 ── */
  days.forEach((day, di) => {
    const dayRef = doc(db, 'users', uid, 'trips', tripRef.id, 'days', day.dayId)
    batch.set(dayRef, { label: day.label, date: day.date })

    itemsByDay[di].forEach((item, order) => {
      const itemRef = doc(collection(db, 'users', uid, 'trips', tripRef.id, 'days', day.dayId, 'items'))
      batch.set(itemRef, {
        ...item,
        rating:       0,
        participants: 2,
        order,
        createdAt:    serverTimestamp(),
      })
    })
  })

  /* ── users 문서에 seeded 플래그 ── */
  batch.set(doc(db, 'users', uid), { seeded: true }, { merge: true })

  await batch.commit()
}
