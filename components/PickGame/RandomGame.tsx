'use client'

import { useEffect, useRef, useState } from 'react'
import { PersonAvatar } from '@/components/PersonAvatar'
import type { PickMember } from './types'

interface Props {
  members:    PickMember[]
  picks:      Record<string, number>  // uid → 선택한 슬롯 인덱스
  winnerSlot: number                  // 당첨 카드 슬롯
  resultUid:  string | null
  phase:      'picking' | 'reveal'
  myUid:      string
  startedAt:  number
  onPick:     (slot: number) => void
  onDone:     () => void
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

export function RandomGame({ members, picks, winnerSlot, resultUid, phase, myUid, startedAt, onPick, onDone }: Props) {
  const [flipped,  setFlipped]  = useState<boolean[]>(members.map(() => false))
  const [revealed, setRevealed] = useState(false)
  const cancelledRef = useRef(false)
  const timeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([])
  const n = members.length

  // 카드 공개 애니메이션 (reveal 페이즈 진입 시)
  useEffect(() => {
    if (phase !== 'reveal') return
    cancelledRef.current = false

    const elapsed = Date.now() - startedAt
    const totalTime = n * 700 + 1200

    if (elapsed > totalTime + 1000) { onDone(); return }

    // 비당첨 슬롯 먼저, 당첨 슬롯 마지막
    const nonWinners = Array.from({ length: n }, (_, i) => i).filter(i => i !== winnerSlot)
    const order = [...nonWinners, winnerSlot]

    order.forEach((slotIdx, step) => {
      const delay = Math.max(0, step * 700 - elapsed)
      const t = setTimeout(() => {
        if (cancelledRef.current) return
        setFlipped(prev => {
          const next = [...prev]
          next[slotIdx] = true
          return next
        })
        if (step === order.length - 1) {
          setRevealed(true)
          const t2 = setTimeout(() => { if (!cancelledRef.current) onDone() }, 2500)
          timeoutsRef.current.push(t2)
        }
      }, delay)
      timeoutsRef.current.push(t)
    })

    return () => {
      cancelledRef.current = true
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [phase])

  // 슬롯 → 해당 슬롯을 선택한 멤버
  const slotToMember: (PickMember | undefined)[] = Array.from({ length: n }, (_, i) => {
    const entry = Object.entries(picks).find(([, slot]) => slot === i)
    return entry ? members.find(m => m.id === entry[0]) : undefined
  })

  const myPick     = picks[myUid]
  const pickedCount = Object.keys(picks).length
  const gridCols   = n === 2 ? 'grid-cols-2' : 'grid-cols-3'

  const resultMember = resultUid ? members.find(m => m.id === resultUid) : null

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 헤더 */}
      <div className="text-center flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center mb-1">
          <GiftIcon className="w-6 h-6 text-yellow-600" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">제비뽑기</h2>
        <p className="text-sm text-gray-400">
          {phase === 'picking'
            ? myPick !== undefined ? '선택 완료! 모두 선택하면 공개돼요' : '카드를 하나 선택하세요'
            : revealed ? '결과 공개!' : '카드를 공개합니다…'
          }
        </p>
      </div>

      {/* 진행 도트 (선택 단계) */}
      {phase === 'picking' && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {Array.from({ length: n }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < pickedCount ? 'bg-violet-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">{pickedCount}/{n}명 선택 완료</span>
        </div>
      )}

      {/* 카드 그리드 */}
      <div className={`grid ${gridCols} gap-3 w-full`}>
        {Array.from({ length: n }, (_, slotIdx) => {
          const member   = slotToMember[slotIdx]
          const isMyPick = myPick === slotIdx
          const isTaken  = member !== undefined
          const isFlipped = flipped[slotIdx]
          const isWinner  = slotIdx === winnerSlot
          const canPick   = phase === 'picking' && myPick === undefined && !isTaken

          /* ── 선택 단계 ── */
          if (phase === 'picking') {
            return (
              <button
                key={slotIdx}
                onClick={() => canPick && onPick(slotIdx)}
                disabled={!canPick && !isMyPick}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl transition-all duration-200 ${
                  isMyPick
                    ? 'bg-violet-100 ring-2 ring-violet-500 scale-105 shadow-md'
                    : isTaken
                    ? 'bg-gray-50 opacity-60'
                    : canPick
                    ? 'bg-violet-50 hover:bg-violet-100 hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                {isTaken ? (
                  <>
                    <PersonAvatar
                      name={member!.name} photoURL={member!.photoURL} size={40}
                      colorIndex={member!.hexColor ? undefined : (member!.colorIndex ?? 0)}
                      hexColor={member!.hexColor}
                    />
                    <span className="text-[10px] font-semibold text-gray-600 truncate w-full text-center leading-tight">
                      {isMyPick ? '내 카드' : member!.name.slice(0, 4)}
                    </span>
                  </>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      canPick ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <GiftIcon className={`w-5 h-5 ${canPick ? 'text-yellow-500' : 'text-gray-300'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${canPick ? 'text-violet-500' : 'text-gray-300'}`}>
                      {slotIdx + 1}번
                    </span>
                  </>
                )}
              </button>
            )
          }

          /* ── 공개 단계 ── */
          return (
            <div
              key={slotIdx}
              className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl transition-all duration-500 ${
                isFlipped
                  ? isWinner && revealed
                    ? 'bg-yellow-50 scale-110 shadow-xl ring-2 ring-yellow-400'
                    : 'bg-gray-50'
                  : 'bg-violet-100'
              }`}
            >
              {isFlipped ? (
                <>
                  {member ? (
                    <PersonAvatar
                      name={member.name} photoURL={member.photoURL} size={40}
                      colorIndex={member.hexColor ? undefined : (member.colorIndex ?? 0)}
                      hexColor={member.hexColor}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  )}
                  {isWinner && revealed && (
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center -mt-1">
                      <StarIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className={`text-[10px] font-semibold text-center truncate w-full leading-tight ${
                    isWinner && revealed ? 'text-yellow-700 font-bold' : 'text-gray-700'
                  }`}>
                    {member?.name.slice(0, 4) ?? '???'}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center animate-pulse">
                    <GiftIcon className="w-5 h-5 text-yellow-500" />
                  </div>
                  <span className="text-[10px] font-semibold text-violet-400">{slotIdx + 1}번</span>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 결과 메시지 */}
      {revealed && resultMember && (
        <div className="text-center bg-yellow-50 rounded-2xl px-5 py-3 w-full">
          <p className="text-sm font-bold text-yellow-700">
            {resultMember.name}님이 {winnerSlot + 1}번 카드로 총무가 되셨습니다!
          </p>
        </div>
      )}
    </div>
  )
}
