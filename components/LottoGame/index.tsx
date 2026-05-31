'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, updateDoc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { X, Trophy } from 'lucide-react'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { WaitingRoom }   from './WaitingRoom'
import { GameSelector }  from './GameSelector'
import { BombGame }      from './BombGame'
import { RaceGame }      from './RaceGame'
import { RandomGame }    from './RandomGame'
import { VoteGame }      from './VoteGame'
import { mulberry32 }    from './prng'
import type { LottoState, LottoMember, GameType } from './types'

interface Props {
  tripId:     string
  ownerUid:   string          // 여행 소유자(방장)
  myUid:      string
  members:    LottoMember[]
  onClose:    () => void
  onAssign:   (uid: string) => void  // 총무로 지정
}

function seededResult(seed: number, participants: string[]): string {
  const rand = mulberry32(seed)
  // 한 번 워밍업 후 사용 (초기 시드 편향 제거)
  rand()
  return participants[Math.floor(rand() * participants.length)]
}

export function LottoGame({ tripId, ownerUid, myUid, members, onClose, onAssign }: Props) {
  const [lotto, setLotto] = useState<LottoState | null>(null)
  const [gameDone, setGameDone] = useState(false)
  const isHost = myUid === ownerUid
  const lottoRef = useRef<LottoState | null>(null)

  const tripRef = doc(db, 'users', ownerUid, 'trips', tripId)

  /* 실시간 lotto 상태 구독 — status 없는 유령 문서는 무시 */
  useEffect(() => {
    const unsub = onSnapshot(tripRef, snap => {
      const data = snap.data()
      const next = (data?.lotto && data.lotto.status) ? (data.lotto as LottoState) : null
      const had = lottoRef.current !== null
      lottoRef.current = next
      setLotto(next)
      // 멤버: 게임이 한번 시작된 뒤 lotto가 사라지면(방장 종료) 모달 자동 닫기
      if (!next && had && !isHost) onClose()
    })
    return unsub
  }, [tripId, ownerUid])

  /* Firebase Auth UID: 28자 영숫자. generateCode(6)으로 추가된 비연동 멤버 제외 */
  const realMembers = members.filter(m => m.id.length > 10)

  /* 방장: 게임 초기화 */
  useEffect(() => {
    if (!isHost || lotto) return
    const participants = realMembers.map(m => m.id)
    const initial: LottoState = {
      status:       'waiting',
      gameType:     null,
      hostUid:      myUid,
      participants,
      ready:        { [myUid]: true },
      result:       null,
      startedAt:    Date.now(),
      seed:         Date.now(),
    }
    updateDoc(tripRef, { lotto: initial })
  }, [])

  /* 내 준비 완료 */
  const handleReady = () => {
    updateDoc(tripRef, { [`lotto.ready.${myUid}`]: true })
  }

  /* 비호스트 멤버: 모달 열리면 자동 ready, 언마운트 시 ready 해제 */
  useEffect(() => {
    if (!lotto || isHost) return
    if (lotto.participants.includes(myUid) && !lotto.ready[myUid]) {
      updateDoc(tripRef, { [`lotto.ready.${myUid}`]: true })
    }
    return () => {
      // lotto 문서가 살아있을 때만 ready 해제 — null이면 유령 문서 생성 방지
      if (lottoRef.current?.status) {
        updateDoc(tripRef, { [`lotto.ready.${myUid}`]: false }).catch(() => {})
      }
    }
  }, [!!lotto])

  /* 방장: 게임 선택 화면으로 */
  const handleToSelector = () => {
    updateDoc(tripRef, { 'lotto.status': 'selecting' })
  }

  /* 방장: 게임 선택 */
  const handleSelectGame = (type: GameType) => {
    if (!lotto) return
    const seed = Date.now()

    // 랜덤 제비뽑기: 카드 선택 페이즈로 (카운트다운 없이)
    if (type === 'random') {
      const rand = mulberry32(seed)
      rand() // warmup
      const winnerSlot = Math.floor(rand() * lotto.participants.length)
      updateDoc(tripRef, {
        'lotto.gameType':   'random',
        'lotto.status':     'picking',
        'lotto.seed':       seed,
        'lotto.result':     null,
        'lotto.startedAt':  Date.now(),
        'lotto.winnerSlot': winnerSlot,
        'lotto.picks':      {},
      })
      return
    }

    const result = seededResult(seed, lotto.participants)

    const voteInit = type === 'vote' ? {
      voteRound:      1,
      voteCandidates: lotto.participants,
      votes:          {},
      voteHistory:    [],
    } : {}

    updateDoc(tripRef, {
      'lotto.gameType':  type,
      'lotto.status':    type === 'vote' ? 'playing' : 'countdown',
      'lotto.seed':      seed,
      'lotto.result':    type !== 'vote' ? result : null,
      'lotto.startedAt': Date.now(),
      ...Object.fromEntries(Object.entries(voteInit).map(([k, v]) => [`lotto.${k}`, v])),
    })

    if (type !== 'vote') {
      // 카운트다운 후 playing
      setTimeout(() => {
        updateDoc(tripRef, { 'lotto.status': 'playing', 'lotto.startedAt': Date.now() })
      }, 3500)
    }
  }

  /* 제비뽑기: 카드 선택 */
  const handlePick = (slotIndex: number) => {
    if (!lotto || lotto.picks?.[myUid] !== undefined) return
    const takenSlots = Object.values(lotto.picks ?? {})
    if (takenSlots.includes(slotIndex)) return
    updateDoc(tripRef, { [`lotto.picks.${myUid}`]: slotIndex })
  }

  /* 제비뽑기: 모든 참여자가 선택 완료 시 결과 결정 (방장만) */
  useEffect(() => {
    if (!lotto || lotto.gameType !== 'random' || lotto.status !== 'picking' || !isHost) return
    const picks = lotto.picks ?? {}
    if (!lotto.participants.every(uid => picks[uid] !== undefined)) return
    const winnerSlot = lotto.winnerSlot ?? 0
    const resultUid  = lotto.participants.find(uid => picks[uid] === winnerSlot) ?? lotto.participants[0]
    updateDoc(tripRef, {
      'lotto.result':    resultUid,
      'lotto.status':    'playing',
      'lotto.startedAt': Date.now(),
    })
  }, [lotto])

  /* 투표 게임: 투표 */
  const handleVote = (targetUid: string) => {
    updateDoc(tripRef, { [`lotto.votes.${myUid}`]: targetUid })
  }

  /* 투표 게임: 라운드 결과 공개 (방장) */
  const handleVoteReveal = () => {
    if (!lotto) return
    const votes      = lotto.votes ?? {}
    const candidates = lotto.voteCandidates ?? []

    const tally: Record<string, number> = {}
    candidates.forEach(c => { tally[c] = 0 })
    Object.values(votes).forEach(uid => { tally[uid] = (tally[uid] ?? 0) + 1 })

    const maxVotes = Math.max(...Object.values(tally))
    const minVotes = Math.min(...Object.values(tally))
    const newHistory = [...(lotto.voteHistory ?? []), tally]

    // 최다 득표자가 1명 → 바로 결정
    const topCandidates = candidates.filter(uid => tally[uid] === maxVotes)
    if (topCandidates.length === 1) {
      updateDoc(tripRef, {
        'lotto.result':      topCandidates[0],
        'lotto.status':      'result',
        'lotto.voteHistory': newHistory,
      })
      notifyResult(topCandidates[0])
      return
    }

    // 전원 동률 → 같은 멤버로 재투표
    if (maxVotes === minVotes) {
      updateDoc(tripRef, {
        'lotto.votes':       {},
        'lotto.voteHistory': newHistory,
        'lotto.voteRound':   (lotto.voteRound ?? 1) + 1,
      })
      return
    }

    // 최솟값 제거 → 다음 라운드
    const remaining = candidates.filter(uid => tally[uid] > minVotes)
    updateDoc(tripRef, {
      'lotto.voteCandidates': remaining,
      'lotto.votes':          {},
      'lotto.voteRound':      (lotto.voteRound ?? 1) + 1,
      'lotto.voteHistory':    newHistory,
    })
  }

  const notifyResult = async (resultUid: string) => {
    const resultName = members.find(m => m.id === resultUid)?.name ?? '???'
    for (const m of members) {
      if (m.id === myUid) continue
      await addDoc(collection(db, 'users', m.id, 'messages'), {
        title:     '총무가 결정됐어요! 🎰',
        body:      `${resultName}님이 총무로 선정되었습니다.`,
        type:      'trip',
        read:      false,
        tripPath:  `/trips/${tripId}`,
        createdAt: serverTimestamp(),
      })
    }
  }

  /* 게임 종료 → 결과 화면 */
  const handleGameDone = () => {
    if (!lotto?.result) return
    updateDoc(tripRef, { 'lotto.status': 'result' })
    notifyResult(lotto.result)
    setGameDone(true)
  }

  /* 총무 지정 확인 */
  const handleAssign = () => {
    if (!lotto?.result) return
    // 방장이 당첨된 경우 — 총무 역할 변경 없이 그냥 닫기
    if (lotto.result !== ownerUid) {
      onAssign(lotto.result)
    }
    updateDoc(tripRef, { lotto: null })
    onClose()
  }

  /* 취소 */
  const handleCancel = () => {
    if (isHost) {
      updateDoc(tripRef, { lotto: null })
    } else if (lottoRef.current?.status) {
      // 멤버가 나가면 ready 해제 → 방장에게 실시간으로 보임 (유효 문서일 때만)
      updateDoc(tripRef, { [`lotto.ready.${myUid}`]: false }).catch(() => {})
    }
    onClose()
  }

  if (!lotto) {
    /* 실제 Google 연동 멤버 2명 미만이면 게임 불가 */
    if (isHost && realMembers.length < 2) {
      return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Google 연동 멤버가 부족해요</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              총무 뽑기는 실제 Google 계정으로 참여한<br />멤버가 2명 이상이어야 시작할 수 있어요
            </p>
          </div>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">
            닫기
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const resultMember = lotto.result ? members.find(m => m.id === lotto.result) : null

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-blue-500" />
        <div className="relative px-5 pt-5 pb-6">
          {/* 닫기 */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 카운트다운 */}
          {lotto.status === 'countdown' && (
            <Countdown startedAt={lotto.startedAt} />
          )}

          {/* 대기실 */}
          {lotto.status === 'waiting' && (
            <WaitingRoom
              lotto={lotto} members={members} isHost={isHost} myUid={myUid}
              onReady={handleReady} onStart={handleToSelector} onCancel={handleCancel}
            />
          )}

          {/* 게임 선택 (방장만) */}
          {lotto.status === 'selecting' && isHost && (
            <GameSelector onSelect={handleSelectGame} onBack={() => updateDoc(tripRef, { 'lotto.status': 'waiting' })} />
          )}
          {lotto.status === 'selecting' && !isHost && (
            <div className="text-center py-8 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg>
              </div>
              <p className="text-sm font-bold text-gray-700">방장이 게임을 선택 중이에요…</p>
            </div>
          )}

          {/* 게임 진행 */}
          {lotto.status === 'playing' && lotto.gameType === 'bomb' && lotto.result && (
            <BombGame members={members.filter(m => lotto.participants.includes(m.id))}
              resultUid={lotto.result} seed={lotto.seed}
              startedAt={lotto.startedAt} onDone={handleGameDone} />
          )}
          {lotto.status === 'playing' && lotto.gameType === 'race' && lotto.result && (
            <RaceGame members={members.filter(m => lotto.participants.includes(m.id))}
              resultUid={lotto.result} seed={lotto.seed}
              startedAt={lotto.startedAt} onDone={handleGameDone} />
          )}
          {/* 제비뽑기 — 카드 선택 & 공개 */}
          {lotto.gameType === 'random' && (lotto.status === 'picking' || lotto.status === 'playing') && (
            <RandomGame
              members={members.filter(m => lotto.participants.includes(m.id))}
              picks={lotto.picks ?? {}}
              winnerSlot={lotto.winnerSlot ?? 0}
              resultUid={lotto.result}
              phase={lotto.status === 'picking' ? 'picking' : 'reveal'}
              myUid={myUid}
              startedAt={lotto.startedAt}
              onPick={handlePick}
              onDone={handleGameDone}
            />
          )}
          {lotto.status === 'playing' && lotto.gameType === 'vote' && (
            <VoteGame lotto={lotto}
              members={members.filter(m => lotto.participants.includes(m.id))}
              myUid={myUid} isHost={isHost}
              onVote={handleVote} onReveal={handleVoteReveal} onDone={handleGameDone} />
          )}

          {/* 결과 화면 */}
          {lotto.status === 'result' && resultMember && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                </div>
                <h2 className="text-lg font-extrabold text-gray-900">총무 결정!</h2>
              </div>
              <div className="flex flex-col items-center gap-3 bg-violet-50 rounded-2xl px-8 py-5 w-full">
                <PersonAvatar
                  name={resultMember.name} photoURL={resultMember.photoURL} size={64}
                  colorIndex={resultMember.hexColor ? undefined : (resultMember.colorIndex ?? 0)}
                  hexColor={resultMember.hexColor}
                />
                <div className="text-center">
                  <p className="text-lg font-extrabold text-gray-900">{resultMember.name}</p>
                  {lotto.result === ownerUid
                    ? <p className="text-sm text-amber-500 font-semibold mt-0.5">방장이 직접 총무를 맡습니다 👑</p>
                    : <p className="text-sm text-violet-500 font-semibold mt-0.5">총무로 선정되었습니다 🏆</p>
                  }
                </div>
              </div>
              {isHost && (
                <button
                  onClick={handleAssign}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
                >
                  {lotto.result === ownerUid ? '확인' : '총무로 지정하기'}
                </button>
              )}
              {!isHost && (
                <p className="text-xs text-gray-400">방장이 확인할 거예요</p>
              )}
              <button onClick={handleCancel} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* 카운트다운 컴포넌트 */
function Countdown({ startedAt }: { startedAt: number }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    const elapsed = Date.now() - startedAt
    const remaining = 3000 - elapsed
    if (remaining <= 0) return

    const t = setInterval(() => {
      const n = Math.ceil((remaining - (Date.now() - startedAt - (3000 - remaining))) / 1000)
      setCount(Math.max(0, n))
    }, 100)
    return () => clearInterval(t)
  }, [startedAt])

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <p className="text-sm text-gray-400 font-medium">게임 시작까지</p>
      <p className="text-8xl font-extrabold text-violet-600 tabular-nums animate-pulse">{count}</p>
      <p className="text-sm text-gray-400">모두 준비하세요! 🎰</p>
    </div>
  )
}
