'use client'

import { useEffect, useRef, useState } from 'react'
import { PersonAvatar } from '@/components/PersonAvatar'
import { mulberry32 } from './prng'
import type { LottoMember } from './types'

interface Props {
  members:   LottoMember[]
  resultUid: string
  seed:      number
  startedAt: number
  onDone:    () => void
}

const RACE_DURATION = 5000

export function RaceGame({ members, resultUid, seed, startedAt, onDone }: Props) {
  // 꼴등이 총무 — 결과 멤버가 마지막에 도착
  const [positions, setPositions] = useState<number[]>(members.map(() => 0))
  const [finished,  setFinished]  = useState(false)
  const [ranking,   setRanking]   = useState<string[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // 시드로 각 멤버 속도 결정 — 결과 멤버가 가장 느리게
    const rand = mulberry32(seed)

    const speeds = members.map(m => {
      if (m.id === resultUid) return 0.45 + rand() * 0.15  // 꼴등: 45~60%
      return 0.75 + rand() * 0.25  // 나머지: 75~100%
    })

    const elapsed = Date.now() - startedAt

    const animate = () => {
      const now = Date.now() - startedAt
      const progress = Math.min(now / RACE_DURATION, 1)

      const newPos = members.map((_, i) => {
        // easeOut 커브
        const ease = 1 - Math.pow(1 - Math.min(progress * speeds[i], 1), 3)
        return ease * 100
      })
      setPositions(newPos)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setFinished(true)
        // 결과 멤버 가장 낮은 위치
        const ranked = [...members].sort((a, b) => {
          const ai = members.indexOf(a), bi = members.indexOf(b)
          return newPos[bi] - newPos[ai]
        })
        setRanking(ranked.map(m => m.id))
        setTimeout(onDone, 2000)
      }
    }

    if (elapsed < RACE_DURATION) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      setFinished(true)
      setPositions(members.map(m => m.id === resultUid ? 45 : 100))
      setTimeout(onDone, 500)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const resultMember = members.find(m => m.id === resultUid)

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-1">
          <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M7 20l4-8 2 3 2-2 3 7"/><path d="M17 9c-2 0-4 1-5 3"/>
          </svg>
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">달리기 레이스</h2>
        <p className="text-sm text-gray-400">꼴찌가 총무!</p>
      </div>

      {/* 레이스 트랙 */}
      <div className="w-full flex flex-col gap-3">
        {members.map((m, i) => {
          const ci = m.colorIndex ?? 0
          const pos = positions[i]
          const isLast = finished && m.id === resultUid
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 w-10 text-right flex-shrink-0 truncate">{m.name.slice(0, 3)}</span>
              <div className="flex-1 h-10 bg-gray-100 rounded-full relative overflow-hidden">
                {/* 트랙 라인 */}
                <div className="absolute inset-y-0 right-2 flex items-center text-lg">🏁</div>
                {/* 달리는 캐릭터 */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-none"
                  style={{ left: `calc(${Math.max(2, Math.min(pos, 88))}% - 16px)` }}
                >
                  <div className={`text-xl ${!finished ? 'animate-bounce' : ''}`}>
                    {isLast ? '🐢' : '🏃'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {finished && resultMember && (
        <div className="text-center bg-red-50 rounded-2xl px-6 py-3 w-full">
          <p className="text-sm font-bold text-red-500">🐢 꼴찌! {resultMember.name}님이 총무가 되셨습니다!</p>
        </div>
      )}
    </div>
  )
}
