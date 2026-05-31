'use client'

import { useEffect, useState } from 'react'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { mulberry32 } from './prng'
import type { LottoMember } from './types'

interface Props {
  members:   LottoMember[]
  resultUid: string
  seed:      number
  startedAt: number
  onDone:    () => void
}

const DURATION = 5000  // 전체 애니메이션 시간 ms
const FAST_TICK = 120  // 초반 빠른 간격 ms
const SLOW_TICK = 600  // 후반 느린 간격 ms

export function BombGame({ members, resultUid, seed, startedAt, onDone }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [exploded,   setExploded]   = useState(false)
  const [showSmoke,  setShowSmoke]  = useState(false)

  useEffect(() => {
    const rng      = mulberry32(seed)
    const resultIdx = members.findIndex(m => m.id === resultUid)
    const elapsed  = Date.now() - startedAt
    if (elapsed > DURATION + 1500) { onDone(); return }

    let idx = 0
    let tick = FAST_TICK
    let remaining = DURATION - Math.max(0, elapsed)

    const schedule = () => {
      const t = setTimeout(() => {
        remaining -= tick

        // 후반부일수록 속도 감소
        const progress = 1 - remaining / DURATION
        tick = FAST_TICK + (SLOW_TICK - FAST_TICK) * Math.pow(progress, 2)

        if (remaining <= 0) {
          // 마지막: 결과 멤버에서 멈춤
          setCurrentIdx(resultIdx === -1 ? 0 : resultIdx)
          setTimeout(() => {
            setExploded(true)
            setShowSmoke(true)
            setTimeout(onDone, 1800)
          }, 400)
          return
        }

        // 랜덤 이동 (결과 멤버 제외 — 마지막에 멈출 때 임팩트)
        let next = Math.floor(rng() * members.length)
        if (remaining < 800 && next === resultIdx) next = (next + 1) % members.length
        idx = next
        setCurrentIdx(idx)
        schedule()
      }, Math.max(40, tick))
      return t
    }

    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-1">
          <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="13" r="7" /><path d="M11 6V4"/><path d="m19.37 6.37-1.42 1.42"/><path d="m16.95 4-1.42 1.42"/>
          </svg>
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">폭탄 돌리기</h2>
        <p className="text-sm text-gray-400">폭탄을 받은 사람이 총무!</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {members.map((m, i) => {
          const isActive = i === currentIdx
          const ci = m.colorIndex ?? 0
          return (
            <div
              key={m.id}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-150 ${
                isActive ? 'bg-red-50 scale-110 shadow-lg' : 'bg-gray-50 opacity-60'
              }`}
            >
              <div className="relative">
                <PersonAvatar
                  name={m.name} photoURL={m.photoURL} size={44}
                  colorIndex={m.hexColor ? undefined : ci} hexColor={m.hexColor}
                />
                {isActive && !exploded && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="13" r="5"/><path d="M11 8V6"/><path d="m17 6-1 1"/></svg>
                  </div>
                )}
                {isActive && exploded && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z"/></svg>
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-gray-700 text-center truncate w-full">{m.name}</span>
            </div>
          )
        })}
      </div>

      {exploded && (
        <div className="text-center animate-bounce">
          <p className="text-sm font-bold text-red-500">💥 {members[currentIdx]?.name}님이 총무가 되셨습니다!</p>
        </div>
      )}
    </div>
  )
}
