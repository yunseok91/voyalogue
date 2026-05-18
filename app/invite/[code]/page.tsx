'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getDoc, doc, updateDoc, setDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { gradientStyle, gradientTextColor } from '@/lib/tripGradient'
import { Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'

type InviteDoc = {
  ownerUid: string
  tripId:   string
  memberId: string
  viewCode: string
}

type TripSnap = {
  city:       string
  title?:     string
  gradient:   string
  startDate:  string
  endDate:    string
  people:     number
  members:    Array<{ id: string; name: string; role: string; photoURL?: string; inviteCode?: string; left?: boolean }>
}

export default function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const { user, loading: authLoading } = useAuthStore()

  const [invite,      setInvite]      = useState<InviteDoc | null>(null)
  const [trip,        setTrip]        = useState<TripSnap | null>(null)
  const [memberName,  setMemberName]  = useState('')
  const [notFound,    setNotFound]    = useState(false)
  const [claiming,    setClaiming]    = useState(false)
  const [claimed,     setClaimed]     = useState(false)
  const [error,       setError]       = useState('')

  /* 초대 코드 + 여행 정보 로드 */
  useEffect(() => {
    const load = async () => {
      try {
        const invSnap = await getDoc(doc(db, 'memberInvites', code))
        if (!invSnap.exists()) { setNotFound(true); return }
        const inv = invSnap.data() as InviteDoc
        setInvite(inv)

        const tripSnap = await getDoc(doc(db, 'users', inv.ownerUid, 'trips', inv.tripId))
        if (!tripSnap.exists()) { setNotFound(true); return }
        const tripData = tripSnap.data() as TripSnap
        setTrip(tripData)

        const pre = (tripData.members ?? []).find(m => m.id === inv.memberId)
        if (pre) setMemberName(pre.name)
      } catch {
        setNotFound(true)
      }
    }
    load()
  }, [code])

  /* 로그인 완료 → 자동 연동 */
  useEffect(() => {
    if (!user || !invite || !trip || claiming || claimed) return
    claimInvite()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, invite, trip])

  const claimInvite = async () => {
    if (!user || !invite || !trip) return
    setClaiming(true)
    setError('')
    try {
      const members = trip.members ?? []

      /* 주선자가 자신의 여행 초대링크에 접속한 경우 */
      if (user.uid === invite.ownerUid) {
        /* 주선자 슬롯이 랜덤 ID(기존 여행)이면 실제 UID로 교체 */
        const ownerSlotIdx = members.findIndex(m => m.role === 'owner' && m.id !== user.uid)
        if (ownerSlotIdx >= 0) {
          const updatedMembers = members.map((m, i) =>
            i === ownerSlotIdx
              ? { ...m, id: user.uid, name: user.displayName || m.name, photoURL: user.photoURL ?? m.photoURL }
              : m
          )
          await updateDoc(doc(db, 'users', invite.ownerUid, 'trips', invite.tripId), { members: updatedMembers })
        }
        router.replace(`/trips/${invite.tripId}`)
        return
      }

      /* 이미 연동된 경우 (일반 멤버) */
      const existingMember = members.find(m => m.id === user.uid)
      if (existingMember) {
        if (existingMember.left) {
          /* 탈퇴 멤버 복원 */
          const updatedMembers = members.map(m =>
            m.id === user.uid ? { ...m, left: false } : m
          )
          await updateDoc(doc(db, 'users', invite.ownerUid, 'trips', invite.tripId), {
            members: updatedMembers,
          })
          await setDoc(doc(db, 'users', user.uid, 'invitedTrips', invite.tripId), {
            ownerUid: invite.ownerUid, tripId: invite.tripId, viewCode: invite.viewCode,
          })
          setClaimed(true)
          setTimeout(() => router.replace(`/share/${invite.viewCode}`), 1200)
        } else {
          setDoc(doc(db, 'users', user.uid, 'invitedTrips', invite.tripId), {
            ownerUid: invite.ownerUid, tripId: invite.tripId, viewCode: invite.viewCode,
          }).catch(() => {})
          router.replace(`/share/${invite.viewCode}`)
        }
        return
      }

      let updatedMembers: typeof members
      const preIdx = members.findIndex(m => m.id === invite.memberId)

      if (preIdx >= 0) {
        /* 미리 생성된 슬롯에 연동 */
        updatedMembers = members.map((m, i) =>
          i === preIdx
            ? { ...m, id: user.uid, name: user.displayName || m.name, photoURL: user.photoURL ?? m.photoURL }
            : m
        )
      } else {
        /* 빈 슬롯 — 인원 여유가 있으면 신규 추가 (탈퇴 멤버 제외 카운트) */
        const activeCount = members.filter(m => !m.left).length
        if (activeCount >= (trip.people || 1)) {
          setError('이미 인원이 가득 찼어요. 방장에게 문의해주세요.')
          setClaiming(false)
          return
        }
        updatedMembers = [...members, {
          id:       user.uid,
          name:     user.displayName || memberName || '멤버',
          photoURL: user.photoURL ?? undefined,
          role:     'member' as const,
        }]
      }

      await updateDoc(doc(db, 'users', invite.ownerUid, 'trips', invite.tripId), {
        members: updatedMembers,
      })

      /* 기존 임시 ID → user.uid 로 participantIds 일괄 교체 */
      if (preIdx >= 0) {
        const oldId = invite.memberId
        const daysSnap = await getDocs(
          collection(db, 'users', invite.ownerUid, 'trips', invite.tripId, 'days')
        )
        await Promise.all(
          daysSnap.docs.map(async dayDoc => {
            const itemsSnap = await getDocs(
              collection(db, 'users', invite.ownerUid, 'trips', invite.tripId, 'days', dayDoc.id, 'items')
            )
            await Promise.all(
              itemsSnap.docs
                .filter(itemDoc => (itemDoc.data().participantIds ?? []).includes(oldId))
                .map(itemDoc => {
                  const pids: string[] = itemDoc.data().participantIds
                  return updateDoc(itemDoc.ref, {
                    participantIds: pids.map(id => (id === oldId ? user.uid : id)),
                  })
                })
            )
          })
        )
      }

      await setDoc(doc(db, 'users', user.uid, 'invitedTrips', invite.tripId), {
        ownerUid: invite.ownerUid, tripId: invite.tripId, viewCode: invite.viewCode,
      })

      setClaimed(true)
      setTimeout(() => router.replace(`/share/${invite.viewCode}`), 1200)
    } catch {
      setError('연동에 실패했어요. 다시 시도해주세요.')
      setClaiming(false)
    }
  }

  /* ── 화면 ── */
  if (notFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <MapPin className="w-8 h-8 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">유효하지 않은 초대 링크예요.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">홈으로</Link>
      </div>
    )
  }

  if (!invite || !trip || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">멤버로 연동됐어요!</p>
        <p className="text-xs text-gray-400">잠시 후 일정 페이지로 이동합니다…</p>
      </div>
    )
  }

  const tw = gradientTextColor(trip.gradient) === 'white'

  return (
    <div className="h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] overflow-hidden">
        <div className="h-24 flex items-end px-6 pb-4" style={{ background: gradientStyle(trip.gradient) }}>
          <div>
            <p className={`font-bold text-lg leading-tight ${tw ? 'text-white' : 'text-gray-900'}`}
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {trip.title || trip.city}
            </p>
            <p className={`text-xs mt-0.5 ${tw ? 'text-white/70' : 'text-gray-600'}`}>
              {trip.startDate.replace(/-/g, '.')} – {trip.endDate.slice(5).replace('-', '.')}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-0.5">
              {memberName ? `"${memberName}"으로 초대받으셨어요` : '여행에 초대받으셨어요'}
            </p>
            <p className="text-xs text-gray-400">
              로그인하면 멤버로 자동 연동돼요.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          {!user ? (
            <button
              onClick={() => router.push(`/auth?redirect=/invite/${code}`)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="white" fillOpacity="0.9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" fillOpacity="0.9" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" fillOpacity="0.9" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" fillOpacity="0.9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              로그인하고 여행 참여하기
            </button>
          ) : (
            <button
              onClick={claimInvite}
              disabled={claiming}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : '멤버로 참여하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
