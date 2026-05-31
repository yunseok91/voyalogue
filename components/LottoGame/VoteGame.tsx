'use client'

import { PersonAvatar } from '@/components/PersonAvatar'
import type { LottoMember, LottoState } from './types'

interface Props {
  lotto:    LottoState
  members:  LottoMember[]
  myUid:    string
  isHost:   boolean
  onVote:   (targetUid: string) => void
  onReveal: () => void  // 방장: 라운드 결과 공개
  onDone:   () => void
}

export function VoteGame({ lotto, members, myUid, isHost, onVote, onReveal, onDone }: Props) {
  const round      = lotto.voteRound ?? 1
  const candidates = (lotto.voteCandidates ?? [])
    .map(uid => members.find(m => m.id === uid))
    .filter(Boolean) as LottoMember[]
  const votes      = lotto.votes ?? {}
  const history    = lotto.voteHistory ?? []
  const myVote      = votes[myUid]
  const voteCount   = Object.keys(votes).length
  const totalVoters = lotto.participants.length
  const allVoted    = voteCount >= totalVoters
  // 모든 참여자가 투표 가능 (후보 여부 무관), 본인 후보 제외
  const canVote     = !myVote && lotto.participants.includes(myUid)

  // 현재 라운드 득표 집계
  const tally: Record<string, number> = {}
  candidates.forEach(c => { tally[c.id] = 0 })
  Object.values(votes).forEach(uid => { tally[uid] = (tally[uid] ?? 0) + 1 })

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-1">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">추천 투표</h2>
        <p className="text-sm text-gray-400">Round {round} — 총무가 될 것 같은 사람에게 투표하세요</p>
      </div>

      {/* 이전 라운드 히스토리 */}
      {history.length > 0 && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 flex flex-col gap-1">
          {history.map((r, i) => (
            <p key={i} className="text-[11px] text-gray-400">
              Round {i + 1}: {Object.entries(r).map(([uid, v]) => {
                const m = members.find(m => m.id === uid)
                return `${m?.name ?? uid} ${v}표`
              }).join(', ')}
            </p>
          ))}
        </div>
      )}

      {/* 후보 목록 */}
      <div className="flex flex-col gap-2">
        {candidates.map(c => {
          const ci        = c.colorIndex ?? 0
          const voted     = myVote === c.id
          const voteNum   = tally[c.id] ?? 0
          const isMe      = c.id === myUid
          return (
            <button
              key={c.id}
              onClick={() => canVote && !isMe && onVote(c.id)}
              disabled={!!myVote || isMe}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                voted
                  ? 'border-violet-400 bg-violet-50'
                  : myVote || isMe
                  ? 'border-gray-100 bg-gray-50 opacity-60'
                  : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 active:scale-[0.98]'
              }`}
            >
              <PersonAvatar name={c.name} photoURL={c.photoURL} size={36}
                colorIndex={c.hexColor ? undefined : ci} hexColor={c.hexColor} />
              <span className="flex-1 text-sm font-semibold text-gray-800">
                {c.name} {isMe && <span className="text-[11px] text-gray-400">(나)</span>}
              </span>
              {allVoted && (
                <span className="text-sm font-bold text-violet-600">{voteNum}표</span>
              )}
              {voted && <span className="text-violet-500 text-sm">✓</span>}
            </button>
          )
        })}
      </div>

      {/* 투표 현황 */}
      <p className="text-center text-xs text-gray-400">{voteCount}/{totalVoters}명 투표 완료</p>

      {/* 방장: 결과 공개 버튼 */}
      {isHost && allVoted && (
        <button
          onClick={onReveal}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
        >
          결과 공개 →
        </button>
      )}

      {!isHost && canVote && (
        <p className="text-center text-xs text-gray-400">위 후보 중 한 명에게 투표하세요</p>
      )}
      {!isHost && myVote && !allVoted && (
        <p className="text-center text-xs text-gray-400">다른 멤버의 투표를 기다리는 중…</p>
      )}
      {!isHost && !lotto.participants.includes(myUid) && (
        <p className="text-center text-xs text-gray-400">관전 중입니다</p>
      )}
    </div>
  )
}
