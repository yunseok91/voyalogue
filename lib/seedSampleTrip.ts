import {
  doc,
  collection,
  writeBatch,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { generateCode } from '@/lib/inviteCode'

function addDays(base: Date, n: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/* ── 영수증 샘플 SVG (약 600 bytes) ── */
const makeReceiptSvg = (name: string, price: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" viewBox="0 0 240 300">
  <rect width="240" height="300" fill="#FFFBF0" rx="6"/>
  <rect x="0" y="0" width="240" height="6" fill="#F59E0B" rx="3"/>
  <text x="120" y="36" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle" fill="#374151">${name}</text>
  <line x1="20" y1="50" x2="220" y2="50" stroke="#E5E7EB" stroke-width="1" stroke-dasharray="5,4"/>
  <text x="20" y="76" font-family="monospace" font-size="11" fill="#6B7280">수량    1</text>
  <text x="20" y="96" font-family="monospace" font-size="11" fill="#6B7280">단가  ${price}</text>
  <line x1="20" y1="112" x2="220" y2="112" stroke="#E5E7EB" stroke-width="1" stroke-dasharray="5,4"/>
  <text x="20" y="138" font-family="monospace" font-size="12" font-weight="bold" fill="#374151">합계</text>
  <text x="220" y="138" font-family="monospace" font-size="13" font-weight="bold" text-anchor="end" fill="#374151">${price}</text>
  <text x="120" y="180" font-family="monospace" font-size="10" text-anchor="middle" fill="#9CA3AF">감사합니다 · ありがとう</text>
</svg>`

export async function seedSampleTrip(uid: string, displayName: string) {
  const startBase = new Date()
  startBase.setDate(startBase.getDate() + 14)
  const startDate = startBase.toISOString().slice(0, 10)
  const endDate   = addDays(startBase, 2) // 2박 3일

  const viewCode = generateCode()
  const editCode = generateCode()

  /* ── trip 문서 ref (ID 먼저 확보) ── */
  const tripRef = doc(collection(db, 'users', uid, 'trips'))
  const tripId  = tripRef.id

  /* ── 영수증 이미지 먼저 업로드 (실패해도 여행 생성에는 영향 없음) ── */
  let receiptURL: string | null = null
  try {
    const svg  = makeReceiptSvg('이치란 라멘', '¥980')
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const storageRef = ref(storage, `users/${uid}/trips/${tripId}/receipts/sample.svg`)
    await uploadBytes(storageRef, blob)
    receiptURL = await getDownloadURL(storageRef)
  } catch { /* 실패해도 여행 생성 계속 */ }

  /* ── 일별 데이터 ── */
  const days = [0, 1, 2].map((i) => ({
    dayId: `d${i + 1}`,
    label: `Day ${i + 1}`,
    date:  addDays(startBase, i),
  }))

  type ItemDraft = {
    name: string; timeSlot: string; cat: string
    price: number; currency: string; comment: string
    lat: number; lng: number
    receipts?: string[]
  }

  const itemsByDay: ItemDraft[][] = [
    /* Day 1 — 출발 & 도착 */
    [
      { name: '인천국제공항 출발', timeSlot: '아침', cat: '교통',
        price: 0,    currency: 'KRW', comment: '탑승 2시간 전 체크인 권장',
        lat: 37.4602, lng: 126.4407 },
      { name: '나리타 공항 도착',  timeSlot: '점심', cat: '교통',
        price: 0,    currency: 'JPY', comment: '입국심사 후 리무진 버스 이용',
        lat: 35.7654, lng: 140.3864 },
      { name: '이치란 라멘',       timeSlot: '저녁', cat: '식사',
        price: 980,  currency: 'JPY', comment: '혼자 먹는 라멘의 성지 · 시부야점',
        lat: 35.6595, lng: 139.7004,
        receipts: receiptURL ? [receiptURL] : undefined },
    ],
    /* Day 2 — 도쿄 관광 */
    [
      { name: '메이지 신궁',       timeSlot: '아침', cat: '장소',
        price: 0,    currency: 'JPY', comment: '울창한 숲 속 신사 · 무료 입장',
        lat: 35.6763, lng: 139.6993 },
      { name: '하라주쿠 쇼핑',     timeSlot: '점심', cat: '쇼핑',
        price: 6000, currency: 'JPY', comment: '다케시타도리 · 패션·굿즈 밀집',
        lat: 35.6716, lng: 139.7027 },
      { name: '도쿄 타워 야경',    timeSlot: '저녁', cat: '장소',
        price: 1800, currency: 'JPY', comment: '메인 덱(150m) 입장료',
        lat: 35.6586, lng: 139.7454 },
    ],
    /* Day 3 — 귀국 */
    [
      { name: '아키하바라 탐방',   timeSlot: '아침', cat: '쇼핑',
        price: 5000, currency: 'JPY', comment: '전자제품·애니메이션 굿즈',
        lat: 35.7023, lng: 139.7745 },
      { name: '스시 오마카세',     timeSlot: '점심', cat: '식사',
        price: 3500, currency: 'JPY', comment: '가성비 런치 코스',
        lat: 35.7018, lng: 139.7730 },
      { name: '나리타 공항 출발',  timeSlot: '미정',  cat: '교통',
        price: 0,    currency: 'JPY', comment: '출발 3시간 전 공항 이동',
        lat: 35.7654, lng: 140.3864 },
    ],
  ]

  /* ── writeBatch ── */
  const batch = writeBatch(db)

  batch.set(tripRef, {
    city:      '도쿄, 일본',
    country:   '일본',
    title:     '도쿄 샘플 여행',
    startDate,
    endDate,
    nights:    2,
    days:      3,
    gradient:  '#3B82F6,#1D4ED8',
    people:    2,
    budget:    500000,
    viewCode,
    editCode,
    isSample:  true,
    members:   [{ id: uid, name: displayName, role: 'owner' }],
    checklist: [
      { id: 'c1', label: '여권 확인',   done: true  },
      { id: 'c2', label: '엔화 환전',   done: true  },
      { id: 'c3', label: '항공권 예매', done: true  },
      { id: 'c4', label: '숙소 예약',   done: false },
      { id: 'c5', label: '여행자 보험', done: false },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  batch.set(doc(db, 'shareIndex', viewCode), { uid, tripId, canEdit: false })
  batch.set(doc(db, 'shareIndex', editCode), { uid, tripId, canEdit: true })

  /* ── days + items ── */
  days.forEach((day, di) => {
    batch.set(
      doc(db, 'users', uid, 'trips', tripId, 'days', day.dayId),
      { label: day.label, date: day.date }
    )
    itemsByDay[di].forEach((item, order) => {
      const itemRef = doc(collection(db, 'users', uid, 'trips', tripId, 'days', day.dayId, 'items'))
      const { receipts, ...rest } = item
      batch.set(itemRef, {
        ...rest,
        ...(receipts ? { receipts } : {}),
        rating:       0,
        participants: 2,
        order,
        createdAt:    serverTimestamp(),
      })
    })
  })

  /* ── users.seeded 플래그 ── */
  batch.set(doc(db, 'users', uid), { seeded: true }, { merge: true })

  await batch.commit()
}
