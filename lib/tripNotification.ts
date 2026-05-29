import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Member = { id: string; role: string; left?: boolean }

/**
 * 여행 멤버들에게 벨 알림 기록
 * - notifySelf: true 이면 actorUid(본인)에게도 알림 전송
 * - ownerPathOverride: 오너 알림의 이동 경로 별도 지정 (공지 등)
 * - memberPathOverride: 멤버 알림의 이동 경로 별도 지정
 * Firebase UID는 15자 이상 — 6자짜리 초대 코드는 자동 제외
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
  ownerPathOverride,
  msgType = 'trip',
  notifySelf = false,
}: {
  ownerUid:  string
  members:   Member[]
  actorUid:  string | null
  title:     string
  body:      string
  tripPath?:          string
  viewCode?:          string
  memberPathOverride?: string
  ownerPathOverride?:  string  // 오너 알림 경로 별도 지정 (없으면 tripPath 사용)
  msgType?:            'trip' | 'notice'
  notifySelf?:         boolean  // true 이면 actorUid(본인)에게도 알림
}) {
  const batch = writeBatch(db)
  let count = 0

  const resolvedOwnerPath = ownerPathOverride ?? tripPath ?? null

  // 오너 알림 (본인이 아닌 경우 OR notifySelf 켜진 경우)
  if (ownerUid && (ownerUid !== actorUid || notifySelf)) {
    const ref = doc(collection(db, 'users', ownerUid, 'messages'))
    batch.set(ref, {
      title,
      body,
      type: msgType,
      tripPath: resolvedOwnerPath,
      read: false,
      createdAt: serverTimestamp(),
    })
    count++
  }

  // 초대 수락한 멤버 알림 (Firebase UID = 15자 이상, 6자 초대코드 제외)
  const memberPath = memberPathOverride ?? (viewCode ? `/share/${viewCode}` : (tripPath ?? null))
  for (const m of members) {
    if (m.role === 'owner') continue
    if (m.left) continue
    if (!m.id || m.id.length < 15) continue
    if (m.id === actorUid && !notifySelf) continue
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
