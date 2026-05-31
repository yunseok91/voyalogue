export type GameType = 'bomb' | 'random' | 'race' | 'vote'

export type LottoStatus =
  | 'waiting'    // 대기실 — 멤버 입장 확인
  | 'selecting'  // 방장이 게임 선택 중
  | 'picking'    // 제비뽑기 카드 선택 중 (random 전용)
  | 'countdown'  // 카운트다운 3…2…1
  | 'playing'    // 게임 진행 중
  | 'result'     // 결과 화면

export interface LottoState {
  status:       LottoStatus
  gameType:     GameType | null
  hostUid:      string
  participants: string[]              // 참여자 uid 목록
  ready:        Record<string, boolean>
  result:       string | null         // 당첨자 uid
  startedAt:    number                // ms — 애니메이션 동기화용
  seed:         number                // 결과 결정용 시드

  // 랜덤 제비뽑기 전용
  winnerSlot?:  number                // 당첨 카드 슬롯 인덱스 (비공개)
  picks?:       Record<string, number> // uid → 선택한 슬롯 인덱스

  // 투표 게임 전용
  voteRound?:      number
  voteCandidates?: string[]
  votes?:          Record<string, string>   // voterUid → candidateUid
  voteHistory?:    Array<Record<string, number>>  // 라운드별 득표수
}

export interface LottoMember {
  id:          string
  name:        string
  photoURL?:   string
  colorIndex?: number
  hexColor?:   string
  role:        string
}
