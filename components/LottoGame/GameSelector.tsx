'use client'

import type { GameType } from './types'

const GAMES: { type: GameType; emoji: string; title: string; desc: string }[] = [
  { type: 'bomb',   emoji: '💣', title: '폭탄 돌리기',  desc: '멤버 사이를 돌다 멈추면 총무' },
  { type: 'random', emoji: '🎁', title: '랜덤 뽑기',    desc: '상자를 열면 총무 등장' },
  { type: 'race',   emoji: '🏃', title: '달리기 레이스', desc: '꼴찌가 총무' },
  { type: 'vote',   emoji: '🗳️', title: '추천 투표',    desc: '과반수 나올 때까지 반복 투표' },
]

interface Props {
  onSelect: (type: GameType) => void
  onBack:   () => void
}

export function GameSelector({ onSelect, onBack }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-lg font-extrabold text-gray-900">어떤 게임으로 뽑을까요?</h2>
        <p className="text-sm text-gray-400 mt-1">방장만 선택할 수 있어요</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GAMES.map(g => (
          <button
            key={g.type}
            onClick={() => onSelect(g.type)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-violet-400 hover:bg-violet-50 transition-all active:scale-95"
          >
            <span className="text-3xl">{g.emoji}</span>
            <span className="text-sm font-bold text-gray-900">{g.title}</span>
            <span className="text-[11px] text-gray-400 text-center leading-tight">{g.desc}</span>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center">
        ← 대기실로
      </button>
    </div>
  )
}
