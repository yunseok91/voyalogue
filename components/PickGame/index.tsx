'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, updateDoc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { X, Trophy, Car } from 'lucide-react'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { WaitingRoom }   from './WaitingRoom'
import { GameSelector }  from './GameSelector'
import { BombGame }      from './BombGame'
import { RaceGame }      from './RaceGame'
import { RandomGame }    from './RandomGame'
import { VoteGame }      from './VoteGame'
import { mulberry32 }    from './prng'
import type { PickState, PickMember, GameType } from './types'

interface Props {
  tripId:     string
  ownerUid:   string
  myUid:      string
  members:    PickMember[]
  onClose:    () => void
  onAssign:   (uid: string) => void
  mode?:      'treasurer' | 'driver'
  pickField?: string
}

function seededResult(seed: number, participants: string[]): string {
  const rand = mulberry32(seed)
  rand()
  return participants[Math.floor(rand() * participants.length)]
}

export function PickGame({ tripId, ownerUid, myUid, members, onClose, onAssign, mode = 'treasurer', pickField }: Props) {
  const field = pickField ?? 'pick'
  const f = (sub: string) => `${field}.${sub}`

  const isTreasurer = mode === 'treasurer'
  const accentCls   = isTreasurer ? 'violet' : 'emerald'
  const roleLabel   = isTreasurer ? '총무' : '운전자'

  const [pick, setPick] = useState<PickState | null>(null)
  const [gameDone, setGameDone] = useState(false)
  const isHost = myUid === ownerUid
  const pickRef = useRef<PickState | null>(null)

  const tripRef = doc(db, 'users', ownerUid, 'trips', tripId)

  useEffect(() => {
    const unsub = onSnapshot(tripRef, snap => {
      const data = snap.data()
      const next = (data?.[field] && data[field].status) ? (data[field] as PickState) : null
      const had = pickRef.current !== null
      pickRef.current = next
      setPick(next)
      if (!next && had && !isHost) onClose()
    })
    return unsub
  }, [tripId, ownerUid, field])

  const realMembers = members.filter(m => m.id.length > 10)

  const notifyStart = async (participants: string[]) => {
    for (const id of participants) {
      if (id === myUid) continue
      await addDoc(collection(db, 'users', id, 'messages'), {
        title:     isTreasurer ? '총무 뽑기가 시작됐어요! 🎰' : '운전자 뽑기가 시작됐어요! 🚗',
        body:      '방장이 게임을 시작했어요. 지금 바로 참여하세요!',
        type:      'trip',
        read:      false,
        tripPath:  `/trips/${tripId}`,
        createdAt: serverTimestamp(),
      })
    }
  }

  useEffect(() => {
    if (!isHost || pick) return
    const participants = realMembers.map(m => m.id)
    const initial: PickState = {
      status:       'waiting',
      gameType:     null,
      hostUid:      myUid,
      participants,
      ready:        { [myUid]: true },
      result:       null,
      startedAt:    Date.now(),
      seed:         Date.now(),
    }
    updateDoc(tripRef, { [field]: initial })
    notifyStart(participants)
  }, [])

  const handleReady = () => {
    updateDoc(tripRef, { [f(`ready.${myUid}`)]: true })
  }

  useEffect(() => {
    if (!pick || isHost) return
    if (pick.participants.includes(myUid) && !pick.ready[myUid]) {
      updateDoc(tripRef, { [f(`ready.${myUid}`)]: true })
    }
    return () => {
      if (pickRef.current?.status) {
        updateDoc(tripRef, { [f(`ready.${myUid}`)]: false }).catch(() => {})
      }
    }
  }, [!!pick])

  const handleToSelector = () => {
    updateDoc(tripRef, { [f('status')]: 'selecting' })
  }

  const handleSelectGame = (type: GameType) => {
    if (!pick) return
    const seed = Date.now()

    if (type === 'random') {
      const rand = mulberry32(seed)
      rand()
      const winnerSlot = Math.floor(rand() * pick.participants.length)
      updateDoc(tripRef, {
        [f('gameType')]:   'random',
        [f('status')]:     'picking',
        [f('seed')]:       seed,
        [f('result')]:     null,
        [f('startedAt')]:  Date.now(),
        [f('winnerSlot')]: winnerSlot,
        [f('picks')]:      {},
      })
      return
    }

    const result = seededResult(seed, pick.participants)

    const voteInit = type === 'vote' ? {
      voteRound:      1,
      voteCandidates: pick.participants,
      votes:          {},
      voteHistory:    [],
    } : {}

    updateDoc(tripRef, {
      [f('gameType')]:  type,
      [f('status')]:    type === 'vote' ? 'playing' : 'countdown',
      [f('seed')]:      seed,
      [f('result')]:    type !== 'vote' ? result : null,
      [f('startedAt')]: Date.now(),
      ...Object.fromEntries(Object.entries(voteInit).map(([k, v]) => [f(k), v])),
    })

    if (type !== 'vote') {
      setTimeout(() => {
        updateDoc(tripRef, { [f('status')]: 'playing', [f('startedAt')]: Date.now() })
      }, 3500)
    }
  }

  const handlePick = (slotIndex: number) => {
    if (!pick || pick.picks?.[myUid] !== undefined) return
    const takenSlots = Object.values(pick.picks ?? {})
    if (takenSlots.includes(slotIndex)) return
    updateDoc(tripRef, { [f(`picks.${myUid}`)]: slotIndex })
  }

  useEffect(() => {
    if (!pick || pick.gameType !== 'random' || pick.status !== 'picking' || !isHost) return
    const picks = pick.picks ?? {}
    if (!pick.participants.every(uid => picks[uid] !== undefined)) return
    const winnerSlot = pick.winnerSlot ?? 0
    const resultUid  = pick.participants.find(uid => picks[uid] === winnerSlot) ?? pick.participants[0]
    updateDoc(tripRef, {
      [f('result')]:    resultUid,
      [f('status')]:    'playing',
      [f('startedAt')]: Date.now(),
    })
  }, [pick])

  const handleVote = (targetUid: string) => {
    updateDoc(tripRef, { [f(`votes.${myUid}`)]: targetUid })
  }

  const handleVoteReveal = () => {
    if (!pick) return
    const votes      = pick.votes ?? {}
    const candidates = pick.voteCandidates ?? []

    const tally: Record<string, number> = {}
    candidates.forEach(c => { tally[c] = 0 })
    Object.values(votes).forEach(uid => { tally[uid] = (tally[uid] ?? 0) + 1 })

    const maxVotes = Math.max(...Object.values(tally))
    const minVotes = Math.min(...Object.values(tally))
    const newHistory = [...(pick.voteHistory ?? []), tally]

    const topCandidates = candidates.filter(uid => tally[uid] === maxVotes)
    if (topCandidates.length === 1) {
      updateDoc(tripRef, {
        [f('result')]:      topCandidates[0],
        [f('status')]:      'result',
        [f('voteHistory')]: newHistory,
      })
      notifyResult(topCandidates[0])
      return
    }

    if (maxVotes === minVotes) {
      updateDoc(tripRef, {
        [f('votes')]:       {},
        [f('voteHistory')]: newHistory,
        [f('voteRound')]:   (pick.voteRound ?? 1) + 1,
      })
      return
    }

    const remaining = candidates.filter(uid => tally[uid] > minVotes)
    updateDoc(tripRef, {
      [f('voteCandidates')]: remaining,
      [f('votes')]:          {},
      [f('voteRound')]:      (pick.voteRound ?? 1) + 1,
      [f('voteHistory')]:    newHistory,
    })
  }

  const notifyResult = async (resultUid: string) => {
    const resultName = members.find(m => m.id === resultUid)?.name ?? '???'
    for (const m of members) {
      if (m.id === myUid) continue
      await addDoc(collection(db, 'users', m.id, 'messages'), {
        title:     isTreasurer ? '총무가 결정됐어요! 🎰' : '운전자가 결정됐어요! 🚗',
        body:      `${resultName}님이 ${roleLabel}로 선정되었습니다.`,
        type:      'trip',
        read:      false,
        tripPath:  `/trips/${tripId}`,
        createdAt: serverTimestamp(),
      })
    }
  }

  const handleGameDone = () => {
    if (!pick?.result) return
    updateDoc(tripRef, { [f('status')]: 'result' })
    notifyResult(pick.result)
    setGameDone(true)
  }

  const handleAssign = () => {
    if (!pick?.result) return
    if (pick.result !== ownerUid || !isTreasurer) {
      onAssign(pick.result)
    }
    updateDoc(tripRef, { [field]: null })
    onClose()
  }

  const handleCancel = () => {
    if (isHost) {
      updateDoc(tripRef, { [field]: null })
    } else if (pickRef.current?.status) {
      updateDoc(tripRef, { [f(`ready.${myUid}`)]: false }).catch(() => {})
    }
    onClose()
  }

  const gradientCls = isTreasurer
    ? 'from-violet-500 to-blue-500'
    : 'from-emerald-500 to-teal-400'

  const spinCls = isTreasurer ? 'border-violet-400' : 'border-emerald-400'

  if (!pick) {
    if (isHost && realMembers.length < 2) {
      return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Google 연동 멤버가 부족해요</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {roleLabel} 뽑기는 실제 Google 계정으로 참여한<br />멤버가 2명 이상이어야 시작할 수 있어요
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
        <div className={`w-6 h-6 border-2 ${spinCls} border-t-transparent rounded-full animate-spin`} />
      </div>
    )
  }

  const resultMember = pick.result ? members.find(m => m.id === pick.result) : null

  /* 결과 화면용 색상 */
  const resultBg      = isTreasurer ? 'bg-violet-50'  : 'bg-emerald-50'
  const resultIconBg  = isTreasurer ? 'bg-violet-100' : 'bg-emerald-100'
  const resultIconCls = isTreasurer ? 'text-violet-600' : 'text-emerald-600'
  const resultBtnCls  = isTreasurer
    ? 'bg-violet-600 hover:bg-violet-700'
    : 'bg-emerald-600 hover:bg-emerald-700'
  const resultSubCls  = isTreasurer ? 'text-violet-500' : 'text-emerald-500'

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className={`h-1.5 bg-gradient-to-r ${gradientCls}`} />
        <div className="relative px-5 pt-5 pb-6">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {pick.status === 'countdown' && (
            <Countdown startedAt={pick.startedAt} />
          )}

          {pick.status === 'waiting' && (
            <WaitingRoom
              pick={pick} members={members} isHost={isHost} myUid={myUid} mode={mode}
              onReady={handleReady} onStart={handleToSelector} onCancel={handleCancel}
            />
          )}

          {pick.status === 'selecting' && isHost && (
            <GameSelector onSelect={handleSelectGame} onBack={() => updateDoc(tripRef, { [f('status')]: 'waiting' })} participantCount={pick.participants.length} />
          )}
          {pick.status === 'selecting' && !isHost && (
            <div className="text-center py-8 flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${resultIconBg} flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${resultIconCls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg>
              </div>
              <p className="text-sm font-bold text-gray-700">방장이 게임을 선택 중이에요…</p>
            </div>
          )}

          {pick.status === 'playing' && pick.gameType === 'bomb' && pick.result && (
            <BombGame members={members.filter(m => pick.participants.includes(m.id))}
              resultUid={pick.result} seed={pick.seed}
              startedAt={pick.startedAt} onDone={handleGameDone} />
          )}
          {pick.status === 'playing' && pick.gameType === 'race' && pick.result && (
            <RaceGame members={members.filter(m => pick.participants.includes(m.id))}
              resultUid={pick.result} seed={pick.seed}
              startedAt={pick.startedAt} onDone={handleGameDone} />
          )}
          {pick.gameType === 'random' && (pick.status === 'picking' || pick.status === 'playing') && (
            <RandomGame
              members={members.filter(m => pick.participants.includes(m.id))}
              picks={pick.picks ?? {}}
              winnerSlot={pick.winnerSlot ?? 0}
              resultUid={pick.result}
              phase={pick.status === 'picking' ? 'picking' : 'reveal'}
              myUid={myUid}
              startedAt={pick.startedAt}
              onPick={handlePick}
              onDone={handleGameDone}
            />
          )}
          {pick.status === 'playing' && pick.gameType === 'vote' && (
            <VoteGame pick={pick}
              members={members.filter(m => pick.participants.includes(m.id))}
              myUid={myUid} isHost={isHost}
              onVote={handleVote} onReveal={handleVoteReveal} onDone={handleGameDone} />
          )}

          {pick.status === 'result' && resultMember && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="text-center flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl ${resultIconBg} flex items-center justify-center`}>
                  {isTreasurer ? (
                    <svg className={`w-7 h-7 ${resultIconCls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                  ) : (
                    <Car className={`w-7 h-7 ${resultIconCls}`} />
                  )}
                </div>
                <h2 className="text-lg font-extrabold text-gray-900">{roleLabel} 결정!</h2>
              </div>
              <div className={`flex flex-col items-center gap-3 ${resultBg} rounded-2xl px-8 py-5 w-full`}>
                <PersonAvatar
                  name={resultMember.name} photoURL={resultMember.photoURL} size={64}
                  colorIndex={resultMember.hexColor ? undefined : (resultMember.colorIndex ?? 0)}
                  hexColor={resultMember.hexColor}
                />
                <div className="text-center">
                  <p className="text-lg font-extrabold text-gray-900">{resultMember.name}</p>
                  {isTreasurer && pick.result === ownerUid
                    ? <p className={`text-sm ${resultSubCls} font-semibold mt-0.5`}>방장이 직접 총무를 맡습니다 👑</p>
                    : <p className={`text-sm ${resultSubCls} font-semibold mt-0.5`}>{roleLabel}로 선정되었습니다 🏆</p>
                  }
                </div>
              </div>
              {isHost && (
                <button
                  onClick={handleAssign}
                  className={`w-full py-3 rounded-xl ${resultBtnCls} text-white text-sm font-bold transition-colors`}
                >
                  {isTreasurer && pick.result === ownerUid ? '확인' : `${roleLabel}로 지정하기`}
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
