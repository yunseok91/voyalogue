import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Member = { id: string; role: string }

/**
 * 주선자/총무가 일정을 변경했을 때 다른 멤버들에게 벨 알림 기록
 * - 오너는 /trips/${tripId} 로, 초대 멤버는 /share/${viewCode} 로 이동
 * Firebase UID는 28자 이상 — 6자짜리 초대 코드(owner 슬롯)는 자동 제외
 */
export async function notifyTripMembers({
  ownerUid,
  members,
  actorUid,
  title,
  body,
  tripPath,
  viewCode,
  memberPathOverride,
  msgType = 'trip',
}: {
  ownerUid:  string
  members:   Member[]
  actorUid:  string | null
  title:     string
  body:      string
  tripPath?:       string
  viewCode?:       string
  memberPathOverride?: string   // 멤버 전용 경로 오버라이드 (없으면 /share/${viewCode} 자동 생성)
  msgType?:            'trip' | 'notice'
}) {
  const batch = writeBatch(db)
  let count = 0

  // 오너 알림 (본인이 아닌 경우만)
  if (ownerUid && ownerUid !== actorUid) {
    const ref = doc(collection(db, 'users', ownerUid, 'messages'))
    batch.set(ref, {
      title,
      body,
      type: msgType,
      tripPath: tripPath ?? null,
      read: false,
      createdAt: serverTimestamp(),
    })
    count++
  }

  // 초대 수락한 멤버 알림 (Firebase UID = 28자 이상, 6자 코드 제외)
  const memberPath = memberPathOverride ?? (viewCode ? `/share/${viewCode}` : (tripPath ?? null))
  for (const m of members) {
    if (m.role === 'owner') continue
    if (!m.id || m.id === actorUid || m.id.length < 15) continue
    const ref = doc(collection(db, 'users', m.id, 'messages'))
    batch.set(ref, {
      title,
      body,
      type: msgType,
      tripPath: memberPath,
      read: false,
      createdAt: serverTimestamp(),
    })
    count++
  }

  if (count === 0) return
  await batch.commit().catch(() => {})
}
