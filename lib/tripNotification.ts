import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Member = { id: string; role: string }

/**
 * 주선자/총무가 일정을 변경했을 때 다른 멤버들에게 벨 알림 기록
 * Firebase UID는 28자 이상 — 6자짜리 초대 코드(owner 슬롯)는 자동 제외
 */
export async function notifyTripMembers({
  ownerUid,
  members,
  actorUid,
  title,
  body,
  tripPath,
}: {
  ownerUid:  string
  members:   Member[]
  actorUid:  string | null
  title:     string
  body:      string
  tripPath?: string   // 클릭 시 이동할 경로 (optional)
}) {
  const uids = new Set<string>()

  // 오너 UID 추가 (본인이 아닌 경우만)
  if (ownerUid && ownerUid !== actorUid) uids.add(ownerUid)

  // 초대 수락한 멤버 UID 추가 (Firebase UID = 28자 이상, 6자 코드 제외)
  for (const m of members) {
    if (m.role === 'owner') continue
    if (!m.id || m.id === actorUid || m.id.length < 15) continue
    uids.add(m.id)
  }

  if (uids.size === 0) return

  const batch = writeBatch(db)
  for (const uid of uids) {
    const ref = doc(collection(db, 'users', uid, 'messages'))
    batch.set(ref, {
      title,
      body,
      type: 'trip',
      tripPath: tripPath ?? null,
      read: false,
      createdAt: serverTimestamp(),
    })
  }
  await batch.commit().catch(() => {})
}
