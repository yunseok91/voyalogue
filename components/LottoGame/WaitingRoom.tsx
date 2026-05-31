'use client'

import { Check, Clock } from 'lucide-react'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'

function getRingColor(m: LottoMember) {
  if (m.hexColor) return m.hexColor
  return CLAY[(m.colorIndex ?? 0) % CLAY.length]?.base ?? '#6366f1'
}

function LottoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
import type { LottoMember, LottoState } from './types'

interface Props {
  lotto:        LottoState
  members:      LottoMember[]
  isHost:       boolean
  myUid:        string
  onReady:      () => void
  onStart:      () => void   // 게임 선택 화면으로
  onCancel:     () => void
}

export function WaitingRoom({ lotto, members, isHost, myUid, onReady, onStart, onCancel }: Props) {
  const participants = members.filter(m => lotto.participants.includes(m.id))
  const readyCount   = participants.filter(m => lotto.ready[m.id]).length
  const allReady     = readyCount === participants.length
  const iAmReady     = !!lotto.ready[myUid]

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-1">
          <LottoIcon className="w-6 h-6 text-violet-600" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">총무 뽑기</h2>
        <p className="text-sm text-gray-400">모든 멤버가 입장하면 시작할 수 있어요</p>
      </div>

      {/* 멤버 입장 현황 */}
      <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-500">입장 현황</span>
          <span className="text-xs text-gray-400">{readyCount}/{participants.length}명</span>
        </div>
        {participants.map(m => {
          const ready = !!lotto.ready[m.id]
          const ci = m.colorIndex ?? 0
          return (
            <div key={m.id} className="flex items-center gap-3">
              <PersonAvatar
                name={m.name} photoURL={m.photoURL}
                size={34} colorIndex={m.hexColor ? undefined : ci}
                hexColor={m.hexColor}
                ringColor={getRingColor(m)}
              />
              <span className="flex-1 text-sm font-semibold text-gray-800">{m.name}</span>
              {ready
                ? <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" />입장</span>
                : <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />대기</span>
              }
            </div>
          )
        })}
      </div>

      {/* 입장 대기 안내 (비호스트, 자동 ready 처리 중) */}
      {!iAmReady && !isHost && lotto.participants.includes(myUid) && (
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">입장 처리 중...</span>
        </div>
      )}

      {/* 방장 전용 */}
      {isHost && (
        <div className="flex flex-col gap-2">
          <button
            onClick={onStart}
            disabled={!allReady}
            className="w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-40
              bg-violet-600 hover:bg-violet-700 text-white disabled:bg-gray-200 disabled:text-gray-400"
          >
            {allReady ? '게임 선택하기' : `${participants.length - readyCount}명 더 기다리는 중…`}
          </button>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center">
            취소
          </button>
        </div>
      )}

      {!isHost && iAmReady && (
        <p className="text-center text-sm text-gray-400">방장이 게임을 선택할 때까지 기다려주세요 👀</p>
      )}
    </div>
  )
}
