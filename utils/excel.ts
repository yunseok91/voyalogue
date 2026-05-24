import * as XLSX from 'xlsx'

/* ── 타입 ── */
export type TripRow = {
  title:      string
  city:       string
  ownerName:  string
  startDate:  string
  endDate:    string
  nights:     number
  days:       number
  memberList: string
}

export type ItemRow = {
  tripTitle:    string
  city:         string
  day:          string
  date:         string
  timeSlot:     string
  name:         string
  category:     string
  priceLocal:   string
  priceKRW:     number
  comment:      string
  participants: string
  _dayNum?:     number
  _order?:      number
}

export type BudgetRow = {
  tripTitle:  string
  division:   string   // '전체' | 'Day 1' | ...
  date:       string
  budgetKRW:  number
  actualKRW:  number
  diffKRW:    number   // 양수 = 절약, 음수 = 초과
  usagePct:   number | null  // null = 예산 미설정
  status:     string   // '절약' | '적정' | '초과' | '미설정'
}

export type ExcelData = {
  trips:   TripRow[]
  items:   ItemRow[]
  budgets: BudgetRow[]
}

/* ── 상수 ── */
const TIME_ORDER: Record<string, number> = {
  아침: 0, 점심: 1, 저녁: 2, 미정: 3,
}

const CAT_KO: Record<string, string> = {
  식사: '식사', 장소: '관광', 쇼핑: '쇼핑', 교통: '교통', 기타: '기타',
}

/* ── 내보내기 ── */
export function exportToExcel(data: ExcelData, filename = '내_여행_일정') {
  const wb = XLSX.utils.book_new()

  /* ── Sheet 1 : 여행 목록 ── */
  const tripHeaders = ['여행 제목', '도시', '방장', '시작일', '종료일', '박수', '일수', '멤버']
  const tripRows    = data.trips.map(t => [
    t.title, t.city, t.ownerName,
    t.startDate, t.endDate,
    t.nights, t.days,
    t.memberList,
  ])
  const ws1 = XLSX.utils.aoa_to_sheet([tripHeaders, ...tripRows])
  ws1['!cols'] = [
    { wch: 26 }, { wch: 16 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 36 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, '여행 목록')

  /* ── Sheet 2 : 일정 ── */
  const sorted = [...data.items].sort((a, b) => {
    if (a.tripTitle !== b.tripTitle) return a.tripTitle.localeCompare(b.tripTitle)
    const da = a._dayNum ?? 0, db = b._dayNum ?? 0
    if (da !== db) return da - db
    const ta = TIME_ORDER[a.timeSlot] ?? 3, tb = TIME_ORDER[b.timeSlot] ?? 3
    if (ta !== tb) return ta - tb
    return (a._order ?? 0) - (b._order ?? 0)
  })

  const itemHeaders = [
    '여행', '도시', '날', '날짜', '시간대', '장소', '카테고리',
    '비용(통화)', '비용(원화)', '메모', '참여 멤버',
  ]
  const itemRows = sorted.map(i => [
    i.tripTitle, i.city, i.day, i.date, i.timeSlot, i.name,
    CAT_KO[i.category] ?? i.category,
    i.priceLocal, i.priceKRW,
    i.comment, i.participants,
  ])
  const ws2 = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows])
  ws2['!cols'] = [
    { wch: 22 }, { wch: 14 }, { wch: 7 }, { wch: 12 },
    { wch: 7 }, { wch: 26 }, { wch: 7 },
    { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 24 },
  ]
  XLSX.utils.book_append_sheet(wb, ws2, '일정')

  /* ── Sheet 3 : 예산 분석 ── */
  if (data.budgets.length > 0) {
    const budgetHeaders = [
      '여행', '구분', '날짜', '예산(원)', '실지출(원)', '잔여/초과(원)', '사용률', '판정',
    ]
    const budgetRows = data.budgets.map(b => [
      b.tripTitle,
      b.division,
      b.date,
      b.budgetKRW > 0 ? b.budgetKRW : '미설정',
      b.actualKRW,
      b.budgetKRW > 0 ? b.diffKRW : '-',
      b.usagePct !== null ? `${b.usagePct}%` : '-',
      b.status,
    ])
    const ws3 = XLSX.utils.aoa_to_sheet([budgetHeaders, ...budgetRows])
    ws3['!cols'] = [
      { wch: 22 }, { wch: 8 }, { wch: 24 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 8 }, { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(wb, ws3, '예산 분석')
  }

  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
