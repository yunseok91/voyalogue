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
  startBase.setDate(startBase.getDate() + 14)
  const startDate = startBase.toISOString().slice(0, 10)
  const endDate   = addDays(startBase, 2)

  const viewCode = generateCode()
  const editCode = generateCode()

  const tripRef = doc(collection(db, 'users', uid, 'trips'))
  const tripId  = tripRef.id

  const days = [0, 1, 2].map(i => ({
    dayId: `sample-d${i + 1}`,
    label: `Day ${i + 1}`,
    date:  addDays(startBase, i),
  }))

  type ItemDraft = {
    name: string; timeSlot: string; cat: string
    price: number; currency: string; comment: string
    lat: number; lng: number
    rating?: number
    ratings?: Record<string, number>
  }

  const itemsByDay: ItemDraft[][] = [
    /* ── Day 1 · 출발 & 도쿄 도착 ── */
    [
      { name: '인천국제공항 출국', timeSlot: '아침', cat: '교통', price: 0, currency: 'KRW', comment: '탑승 2시간 전 체크인 · T1 면세점 쇼핑 추천', lat: 37.4602, lng: 126.4407 },
      { name: '하네다 공항 도착', timeSlot: '점심', cat: '교통', price: 0, currency: 'JPY', comment: '입국심사 후 게이큐 공항선 탑승 → 신주쿠 약 35분', lat: 35.5494, lng: 139.7798 },
      { name: '신주쿠 호텔 체크인', timeSlot: '점심', cat: '기타', price: 0, currency: 'JPY', comment: '신주쿠 서쪽 · 체크인 15:00~ · 짐 보관 후 관광 가능', lat: 35.6906, lng: 139.6923 },
      { name: '이치란 라멘', timeSlot: '저녁', cat: '식사', price: 980, currency: 'JPY', comment: '혼자 먹는 라멘의 성지 · 시부야점 · 반숙 계란 추가 필수', lat: 35.6595, lng: 139.7004, rating: 4, ratings: { [uid]: 4 } },
      { name: '신주쿠 골든가이', timeSlot: '저녁', cat: '장소', price: 1200, currency: 'JPY', comment: '레트로 분위기 이자카야 골목 · 칵테일 1잔 · 사진 명소', lat: 35.6938, lng: 139.7036 },
    ],
    /* ── Day 2 · 도쿄 핵심 관광 ── */
    [
      { name: '메이지 신궁', timeSlot: '아침', cat: '장소', price: 0, currency: 'JPY', comment: '70만 그루 숲 속 신사 · 무료 입장 · 이른 아침 방문 추천', lat: 35.6763, lng: 139.6993, rating: 5, ratings: { [uid]: 5 } },
      { name: '오모테산도 카페 브런치', timeSlot: '아침', cat: '식사', price: 1800, currency: 'JPY', comment: '오모테산도 힐즈 인근 · 팬케이크 · 오픈 10시', lat: 35.6656, lng: 139.7124 },
      { name: '하라주쿠 다케시타도리', timeSlot: '점심', cat: '쇼핑', price: 4000, currency: 'JPY', comment: '크레이프·스트리트 패션·캐릭터 굿즈 · 평일 오전 한산', lat: 35.6716, lng: 139.7027 },
      { name: '시부야 스크램블 교차로', timeSlot: '점심', cat: '장소', price: 0, currency: 'JPY', comment: '세계에서 가장 바쁜 교차로 · 스타벅스 2F 포토스팟', lat: 35.6595, lng: 139.7004, rating: 4, ratings: { [uid]: 4 } },
      { name: '시부야 스카이 전망대', timeSlot: '저녁', cat: '장소', price: 2000, currency: 'JPY', comment: '스크램블 스퀘어 최상층 45F·46F · 사전 예매 권장', lat: 35.6581, lng: 139.7022, rating: 5, ratings: { [uid]: 5 } },
      { name: '긴자 회전초밥 (스시로)', timeSlot: '저녁', cat: '식사', price: 1800, currency: 'JPY', comment: '스시로 긴자점 · 줄 서기 필수 · 오마카세보다 가성비 최고', lat: 35.6714, lng: 139.7658 },
    ],
    /* ── Day 3 · 전통 + 쇼핑 + 귀국 ── */
    [
      { name: '아사쿠사 센소지', timeSlot: '아침', cat: '장소', price: 0, currency: 'JPY', comment: '도쿄 최고(最古) 사찰 · 雷門 포토스팟 · 이른 아침 추천', lat: 35.7147, lng: 139.7966, rating: 5, ratings: { [uid]: 5 } },
      { name: '나카미세 기념품 쇼핑', timeSlot: '아침', cat: '쇼핑', price: 2500, currency: 'JPY', comment: '전통과자 · 인형 · 손수건 · 닌교야키 꼭 먹기', lat: 35.7122, lng: 139.7963 },
      { name: '아키하바라 전자상가', timeSlot: '점심', cat: '쇼핑', price: 5000, currency: 'JPY', comment: '전자제품·애니메이션 피규어·굿즈 · 요도바시 카메라', lat: 35.7023, lng: 139.7745 },
      { name: '규동 (요시노야)', timeSlot: '점심', cat: '식사', price: 550, currency: 'JPY', comment: '일본 국민 규동 · 빠르고 저렴 · 공항 가기 전 마지막 식사', lat: 35.7018, lng: 139.7730 },
      { name: '하네다 공항 출국', timeSlot: '미정', cat: '교통', price: 0, currency: 'JPY', comment: '출발 2시간 전 공항 도착 · 국제선 3터미널', lat: 35.5494, lng: 139.7798 },
    ],
  ]

  const batch = writeBatch(db)

  /* 여행 메타 */
  batch.set(tripRef, {
    city:      '도쿄, 일본',
    country:   '일본',
    title:     '도쿄 샘플 여행',
    startDate, endDate,
    nights:    2,
    days:      3,
    gradient:  '#3B82F6,#1D4ED8',
    people:    2,
    budget:    800000,
    viewCode,  editCode,
    isSample:  true,
    members:   [{ id: uid, name: displayName, role: 'owner' }],
    flights: [
      { id: 'sample-flight-out', name: '인천 → 하네다 (KE705)', type: 'outbound', dayId: 'sample-d1', departTime: '09:20', arriveTime: '11:35', lat: 35.5494, lng: 139.7798, price: 350000, currency: 'KRW', includeInSettlement: true },
      { id: 'sample-flight-in',  name: '하네다 → 인천 (KE706)', type: 'inbound',  dayId: 'sample-d3', departTime: '15:30', arriveTime: '17:45', lat: 37.4602, lng: 126.4407, price: 0, currency: 'KRW', includeInSettlement: false },
    ],
    accommodations: [
      { id: 'sample-acc-1', name: '신주쿠 워싱턴 호텔', checkInDayId: 'sample-d1', checkInTime: '15:00', checkOutDayId: 'sample-d3', checkOutTime: '11:00', lat: 35.6906, lng: 139.6923, price: 30000, currency: 'JPY', includeInSettlement: true },
    ],
    checklist: [
      { id: 'c1', label: '여권 유효기간 확인 (6개월 이상)', done: true  },
      { id: 'c2', label: '엔화 환전',                       done: true  },
      { id: 'c3', label: '왕복 항공권 예매',                done: true  },
      { id: 'c4', label: '숙소 예약 (신주쿠 호텔)',         done: true  },
      { id: 'c5', label: 'IC카드 (SUICA) 준비',             done: false },
      { id: 'c6', label: '유심 / 포켓 와이파이 준비',       done: false },
      { id: 'c7', label: '여행자 보험 가입',                done: false },
      { id: 'c8', label: '시부야 스카이 사전 예약',         done: false },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  /* shareIndex */
  batch.set(doc(db, 'shareIndex', viewCode), { uid, tripId, canEdit: false })
  batch.set(doc(db, 'shareIndex', editCode), { uid, tripId, canEdit: true })

  /* days + items */
  days.forEach((day, di) => {
    batch.set(doc(db, 'users', uid, 'trips', tripId, 'days', day.dayId), {
      label: day.label,
      date:  day.date,
    })
    itemsByDay[di].forEach((item, order) => {
      const { rating, ratings, ...rest } = item
      batch.set(
        doc(collection(db, 'users', uid, 'trips', tripId, 'days', day.dayId, 'items')),
        { ...rest, ...(ratings ? { ratings } : {}), rating: rating ?? 0, participants: 2, order, createdAt: serverTimestamp() }
      )
    })
  })

  await batch.commit()
}
