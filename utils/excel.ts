import * as XLSX from 'xlsx'

/* ── 타입 ── */
export type TripRow = {
  id:        string
  city:      string
  startDate: string
  endDate:   string
  nights:    number
  days:      number
  status:    string
  gradient?: string
}

export type ItemRow = {
  tripId:   string
  city:     string
  day:      string   // 'Day 1'
  date:     string   // 'YYYY-MM-DD'
  timeSlot: string
  name:     string
  category: string
  price:    number
  comment:  string
  rating:   number
}

export type ExcelData = {
  trips: TripRow[]
  items: ItemRow[]
}

/* ── 내보내기 ── */
export function exportToExcel(data: ExcelData, filename = '내_여행_일정') {
  const wb = XLSX.utils.book_new()

  /* Sheet 1: 여행 목록 */
  const tripHeaders = ['여행ID', '도시', '시작일', '종료일', '박수', '일수', '상태']
  const tripRows = data.trips.map(t => [
    t.id, t.city, t.startDate, t.endDate, t.nights, t.days, t.status,
  ])
  const ws1 = XLSX.utils.aoa_to_sheet([tripHeaders, ...tripRows])
  ws1['!cols'] = [
    { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 8 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, '여행 목록')

  /* Sheet 2: 일정 */
  const itemHeaders = ['여행ID', '도시', '날', '날짜', '시간대', '장소명', '카테고리', '비용(원)', '메모', '별점']
  const itemRows = data.items.map(i => [
    i.tripId, i.city, i.day, i.date, i.timeSlot, i.name,
    i.category, i.price, i.comment, i.rating,
  ])
  const ws2 = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows])
  ws2['!cols'] = [
    { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 12 },
    { wch: 8 }, { wch: 24 }, { wch: 8 }, { wch: 10 }, { wch: 28 }, { wch: 6 },
  ]
  XLSX.utils.book_append_sheet(wb, ws2, '일정')

  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/* ── 가져오기 ── */
export type ImportResult =
  | { ok: true;  data: ExcelData }
  | { ok: false; error: string }

export function importFromExcel(file: File): Promise<ImportResult> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const ab  = e.target?.result as ArrayBuffer
        const wb  = XLSX.read(ab, { type: 'array' })

        /* 시트 존재 확인 */
        const sheet1 = wb.Sheets['여행 목록']
        const sheet2 = wb.Sheets['일정']
        if (!sheet1 || !sheet2) {
          resolve({ ok: false, error: '"여행 목록"과 "일정" 시트가 모두 필요합니다.' })
          return
        }

        const tripRaw  = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet1)
        const itemRaw  = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet2)

        const trips: TripRow[] = tripRaw.map((r, i) => ({
          id:        String(r['여행ID']   ?? `imported_${i}`),
          city:      String(r['도시']     ?? ''),
          startDate: String(r['시작일']   ?? ''),
          endDate:   String(r['종료일']   ?? ''),
          nights:    Number(r['박수']     ?? 0),
          days:      Number(r['일수']     ?? 0),
          status:    String(r['상태']     ?? ''),
        })).filter(t => t.city)

        const items: ItemRow[] = itemRaw.map((r, i) => ({
          tripId:   String(r['여행ID']   ?? ''),
          city:     String(r['도시']     ?? ''),
          day:      String(r['날']       ?? ''),
          date:     String(r['날짜']     ?? ''),
          timeSlot: String(r['시간대']   ?? '미정'),
          name:     String(r['장소명']   ?? ''),
          category: String(r['카테고리'] ?? '기타'),
          price:    Number(r['비용(원)'] ?? 0),
          comment:  String(r['메모']     ?? ''),
          rating:   Number(r['별점']     ?? 0),
        })).filter(i => i.name)

        if (trips.length === 0) {
          resolve({ ok: false, error: '유효한 여행 데이터가 없습니다.' })
          return
        }

        resolve({ ok: true, data: { trips, items } })
      } catch {
        resolve({ ok: false, error: '파일을 읽는 중 오류가 발생했습니다.' })
      }
    }
    reader.onerror = () => resolve({ ok: false, error: '파일 읽기에 실패했습니다.' })
    reader.readAsArrayBuffer(file)
  })
}
