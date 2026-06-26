import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

/* ── 타입 ── */
type VibeData = { style: string; pace: string; focus: string }

/* ── 바이브별 힌트 ── */
const VIBE_HINT: Record<string, VibeData> = {
  '먹방중심': {
    style: '맛집 투어 중심 — 현지 로컬 맛집, 인기 식당, 길거리 음식, 트렌디 카페',
    pace:  '3-4',
    focus: '하루 2-3개 식사·카페 위주. 관광지는 맛집과 겹치는 곳만. 줄서서라도 가야 하는 필수 맛집 포함.',
  },
  '핫플관광': {
    style: '핫플 + 관광 — 유명 랜드마크, 인스타 명소, 트렌디 카페, 必방문 스팟',
    pace:  '4-5',
    focus: '인기 관광지 + 트렌디 카페·맛집 믹스. 하루 최소 1개의 화제 스팟 포함.',
  },
  '느긋하게': {
    style: '슬로우 트래블 — 동네 탐방, 여유로운 카페, 현지 분위기',
    pace:  '2-3',
    focus: '장소 수 적게, 한 곳에서 충분한 시간. 붐비는 관광지 피하고 분위기 위주로.',
  },
  '프리미엄': {
    style: '프리미엄 — 미슐랭 레스토랑, 럭셔리 스파, 하이엔드 쇼핑',
    pace:  '3-4',
    focus: '수량보다 질. 최고급 다이닝 최소 1회/일, 럭셔리 경험 포함.',
  },
  '쇼핑투어': {
    style: '쇼핑 투어 — 현지 마켓, 쇼핑몰, 브랜드 거리, 기념품 골목',
    pace:  '3-4',
    focus: '쇼핑 스팟을 중심으로 동선을 짜되, 중간중간 카페·식사로 체력 보충. 현지에서만 살 수 있는 아이템 포함.',
  },
}

/* ── 목적지 → 통화 ── */
function currencyFor(dest: string): string {
  const d = dest
  if (/일본|japan|도쿄|오사카|교토|나고야|삿포로|후쿠오카|오키나와|나라|고베|히로시마/i.test(d)) return 'JPY'
  if (/파리|프랑스|로마|이탈리아|바르셀로나|스페인|암스테르담|독일|베를린|뮌헨|빈|프라하|유럽/i.test(d)) return 'EUR'
  if (/미국|뉴욕|LA|로스앤젤레스|하와이|샌프란시스코|시카고|라스베이거스/i.test(d)) return 'USD'
  if (/태국|방콕|치앙마이|푸켓|파타야|코사무이/i.test(d)) return 'THB'
  if (/싱가포르/i.test(d)) return 'SGD'
  if (/베트남|하노이|호치민|다낭|나트랑|호이안/i.test(d)) return 'VND'
  if (/영국|런던/i.test(d)) return 'GBP'
  if (/중국|베이징|상하이/i.test(d)) return 'CNY'
  if (/홍콩/i.test(d)) return 'HKD'
  if (/대만|타이베이|가오슝/i.test(d)) return 'TWD'
  if (/호주|시드니|멜버른|골드코스트/i.test(d)) return 'AUD'
  if (/캐나다|밴쿠버|토론토/i.test(d)) return 'CAD'
  if (/말레이시아|쿠알라룸푸르|코타키나발루|랑카위/i.test(d)) return 'MYR'
  if (/인도네시아|발리|자카르타|롬복/i.test(d)) return 'IDR'
  if (/필리핀|세부|마닐라|보라카이/i.test(d)) return 'PHP'
  if (/두바이|아부다비/i.test(d)) return 'AED'
  return 'KRW'
}

/** 이상 문자 제거 */
function sanitizeText(text: string): string {
  return text
    .replace(/[Ѐ-ӿ]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** timeSlot 정규화 (Gemini 5단계 → 앱 4단계 매핑) */
function normalizeSlot(slot: string): string {
  if (slot === '오후') return '점심'
  if (slot === '야간') return '저녁'
  if (['아침', '점심', '저녁', '미정'].includes(slot)) return slot
  return '미정'
}

/* ── Gemini responseSchema (Strict 구조 출력 보장) ── */
const travelSchema = {
  type: 'OBJECT',
  properties: {
    tripTitle: {
      type: 'STRING',
      description: '여행의 특징과 vibe를 살린 15자 이내의 센스 있는 한국어 제목',
    },
    accommodationOptions: {
      type: 'ARRAY',
      description: '숙소 추천 3개. 이미 예약한 경우 빈 배열([]) 반환.',
      items: {
        type: 'OBJECT',
        properties: {
          name:                 { type: 'STRING', description: '실제 존재하는 정확한 호텔/숙소 이름' },
          expectedPricePerNight: { type: 'NUMBER', description: '1박당 예상 금액 (숫자만)' },
          currency:             { type: 'STRING', description: '해당 국가 통화 코드 (예: JPY, USD, KRW)' },
          recommendationReason: { type: 'STRING', description: '유저 맞춤형 추천 이유 2문장 내외 (~해요체)' },
          lat: { type: 'NUMBER' },
          lng: { type: 'NUMBER' },
        },
        required: ['name', 'expectedPricePerNight', 'currency', 'recommendationReason', 'lat', 'lng'],
      },
    },
    days: {
      type: 'ARRAY',
      description: 'N+1일 일정 배열 (nights+1개의 day 객체)',
      items: {
        type: 'OBJECT',
        properties: {
          dayNumber: { type: 'INTEGER', description: '1, 2, 3 … 일차 번호' },
          items: {
            type: 'ARRAY',
            description: '동선 최적화된 하루 방문 장소 리스트',
            items: {
              type: 'OBJECT',
              properties: {
                spotName:      { type: 'STRING',  description: '실제 존재하는 장소명·식당명·카페명' },
                timeSlot:      { type: 'STRING',  enum: ['아침', '점심', '오후', '저녁', '야간'] },
                category:      { type: 'STRING',  enum: ['식사', '장소', '쇼핑', '교통', '기타'] },
                estimatedCost: { type: 'NUMBER',  description: '인당 예상 비용 (무료=0)' },
                currency:      { type: 'STRING',  description: '현지 통화 코드' },
                comment:       { type: 'STRING',  description: '장소 특징·추천 이유·꿀팁 2~3문장 (~해요체)' },
                lat:           { type: 'NUMBER' },
                lng:           { type: 'NUMBER' },
              },
              required: ['spotName', 'timeSlot', 'category', 'estimatedCost', 'currency', 'comment', 'lat', 'lng'],
            },
          },
        },
        required: ['dayNumber', 'items'],
      },
    },
  },
  required: ['tripTitle', 'accommodationOptions', 'days'],
}

export async function POST(req: NextRequest) {
  try {
    const {
      destination, startDate, nights, companion, people,
      vibe, pace, foodPref,
      accommodation, accommodationStyle, accommodationLocation,
      transport, arrivalTime, departureTime, budget,
    } = await req.json()

    if (!destination || !startDate || !nights) {
      return NextResponse.json({ error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI 서비스 키가 설정되지 않았습니다. 관리자에게 문의해주세요.' }, { status: 503 })
    }

    /* ── 기본 변수 계산 ── */
    const totalDays  = Number(nights) + 1
    const vibeArr    = Array.isArray(vibe) ? (vibe as string[]) : [vibe ?? '핫플관광']
    const vibeData   = VIBE_HINT[vibeArr[0]] ?? VIBE_HINT['핫플관광']
    const PACE_COUNT: Record<string, string> = { '빽빽하게': '5-6', '적당히': '3-4', '느긋하게': '2-3' }
    const itemCount  = PACE_COUNT[pace as string] ?? vibeData.pace
    const currency   = currencyFor(destination as string)
    const isDomestic = /서울|부산|제주|인천|대구|대전|광주|수원|경주|여수|강릉|속초|전주|통영|거제|울산|춘천|가평|남해|포항|목포|순천|군산|담양|한국|korea/i.test(destination as string)

    /* ── 인원 ── */
    let groupCount: number
    if ((companion as string) === '혼자')      groupCount = 1
    else if ((companion as string) === '커플') groupCount = 2
    else                                        groupCount = Math.max(2, parseInt(people as string) || 3)

    /* ── 예산 힌트 ── */
    const budgetKRW = Math.max(0, parseInt(budget as string) || 0) * 10000
    let budgetHint  = ''
    if (budgetKRW > 0) {
      const fmt = `${(budgetKRW / 10000).toLocaleString()}만원/인`
      if      (budgetKRW < 300000)  budgetHint = `매우 타이트 (${fmt}): 무료 명소 위주, 로컬 저렴 식당`
      else if (budgetKRW < 1000000) budgetHint = `알뜰 여행 (${fmt}): 가성비 식당, 저비용 명소`
      else if (budgetKRW < 3000000) budgetHint = `여유 있는 예산 (${fmt}): 맛집, 유료 명소 가능`
      else                          budgetHint = `프리미엄 예산 (${fmt}): 파인다이닝, 럭셔리 경험`
    }

    /* ── 음식 취향 ── */
    const foodPrefArr = Array.isArray(foodPref) ? (foodPref as string[]) : []
    const FOOD_LABEL: Record<string, string> = {
      '현지로컬':    '현지인 로컬 맛집 (숨겨진 보석)',
      '인스타카페':  '인스타 감성 카페·디저트',
      '야시장길거리': '야시장·길거리 음식·포장마차',
      '파인다이닝':   '파인다이닝·미슐랭 레스토랑',
    }

    /* ── 항공편 시간 힌트 ── */
    let flightHint = ''
    if (arrivalTime)   flightHint += `\n- Day 1 도착: ${arrivalTime} (그 이전 일정 제외)`
    if (departureTime) flightHint += `\n- 마지막날 출발: ${departureTime} (출발 전까지 일정만)`

    /* ── 교통수단 힌트 ── */
    let transportHint = ''
    const transportStr = (transport as string) ?? '미정'
    if (transportStr === '렌터카')        transportHint = '\n- 이동수단: 렌터카 (외곽·드라이브 코스 포함 가능)'
    else if (transportStr === '대중교통') transportHint = '\n- 이동수단: 대중교통 (지하철·버스 접근 가능 장소만)'

    /* ── 숙소 힌트 ── */
    const styleMap: Record<string, string> = {
      '가성비':  '가성비 호텔·게스트하우스 (개인실)',
      '3~4성급': '깔끔한 3-4성급 호텔·부티크 호텔',
      '럭셔리':  '5성급 럭셔리 호텔·리조트',
    }
    let accomType = styleMap[accommodationStyle as string] ?? ''
    if (!accomType) {
      if      (vibeArr.includes('프리미엄') || budgetKRW >= 2000000) accomType = '5성급 럭셔리 호텔'
      else if (budgetKRW > 0 && budgetKRW < 500000) accomType = '저렴한 게스트하우스·호스텔'
      else if ((companion as string) === '가족')   accomType = '넓은 패밀리 호텔'
      else if ((companion as string) === '커플')   accomType = '3-4성급 부티크 호텔'
      else                                          accomType = '3-4성급 호텔'
    }

    const accommodationBooked = (accommodation as string) === 'booked'

    /* ── 시스템 인스트럭션 (역할 + 불변 원칙만) ── */
    const systemInstruction = `너는 현지 사정에 정통한 최고의 여행 코디네이터야.
- 모든 comment·recommendationReason은 자연스러운 한국어 해요체로 작성해 (예: "진짜 맛있어요", "뷰가 끝내줘요")
- 실제 존재하고 Google Maps에서 검색되는 상호명만 사용해 — "X 맛집", "근처 카페" 같은 모호한 이름 절대 금지
- GPS 좌표(lat, lng)는 해당 장소의 실제 좌표를 입력해
- timeSlot 기준: 아침(~10시) / 점심(10~14시) / 오후(14~18시) / 저녁(18~22시) / 야간(22시~)
- JSON 외 어떠한 텍스트도 출력하지 마`

    /* ── 유저 프롬프트 (카테고리별, 중복 없이) ── */
    const userPrompt = `아래의 [유저 맞춤 조건]을 100% 반영하여 최적의 여행 일정을 짜줘.

[유저 맞춤 조건]
- 목적지: ${destination} (${isDomestic ? '국내' : '해외'} 여행)
- 일정: ${startDate} 출발, ${nights}박 ${totalDays}일
- 동행자: ${groupCount}명 (${companion})
- 핵심 취향(vibe): ${vibeArr.join(', ')}
- 하루 일정 강도: ${pace}
- 이동 수단: ${transportStr}
- 현지 통화: ${currency}${budgetHint ? `\n- 예산 기준: ${budgetHint}` : ''}${foodPrefArr.length > 0 ? `\n- 음식 취향: ${foodPrefArr.map(p => FOOD_LABEL[p] ?? p).join(', ')}` : ''}

[조건별 상세 지침 (반드시 준수)]
1. 취향이 '${vibeArr.join(', ')}'이므로 전체 일정의 70% 이상을 이 테마에 맞는 장소로 채워줘. 특히: ${vibeData.focus}
2. 일정 강도가 '${pace}'이므로 하루 장소 수를 정확히 ${itemCount}개로 제한해줘.
3. 이동 수단이 '${transportStr}'이므로${transportStr === '렌터카' ? ' 주차 편한 곳·드라이브 코스 위주로 동선을 짜줘.' : transportStr === '대중교통' ? ' 지하철역·버스 정류장 도보권 장소만 포함해줘.' : ' 이동 동선을 최적화해줘.'}${budgetHint ? `\n4. 예산이 '${budgetHint}'이므로 모든 식당·장소·숙소의 가격대를 이에 맞춰줘.` : ''}${arrivalTime ? `\n${budgetHint ? '5' : '4'}. Day 1은 ${arrivalTime} 도착이므로 그 이후부터 일정을 시작해줘.` : ''}${departureTime ? `\n${budgetHint && arrivalTime ? '6' : budgetHint || arrivalTime ? '5' : '4'}. 마지막 날은 ${departureTime} 출발이므로 그 이전에 일정을 마무리해줘.` : ''}${foodPrefArr.length > 0 ? `\n- 식당 선정 시 '${foodPrefArr.map(p => FOOD_LABEL[p] ?? p).join(', ')}' 위주로 구성해줘.` : ''}

[숙소]
${accommodationBooked
  ? `이미 예약됨${accommodationLocation ? ` (위치: ${accommodationLocation})` : ''}. accommodationOptions는 빈 배열([])로 반환하고, 해당 숙소 위치 기준으로 동선을 최적화해줘.`
  : `추천 필요 (스타일: ${accomType}). 실제 존재하는 숙소 3개를 accommodationOptions에 담아줘.`}

[출력 규칙]
- day 객체 정확히 ${totalDays}개 생성 (dayNumber: 1 ~ ${totalDays})
- 각 day의 items는 ${itemCount}개, timeSlot을 아침/점심/오후/저녁/야간으로 고르게 배분
- 식사 항목(category: 식사) 하루 1~2개 반드시 포함
- estimatedCost: 인당 예상 실비 (무료=0)`

    /* ── Gemini API 호출 ── */
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const geminiRes = await ai.models.generateContent({
      model:    'gemini-2.0-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema:   travelSchema,
      },
    })

    const rawText = geminiRes.text
    if (!rawText) throw new Error('빈 응답')

    const geminiPlan = JSON.parse(rawText)

    /* ── Gemini 응답 → 기존 GeneratedPlan 포맷 변환 ── */
    const plan = {
      tripTitle: (geminiPlan.tripTitle as string) ?? '',

      accommodationOptions: ((geminiPlan.accommodationOptions ?? []) as Array<{
        name: string
        expectedPricePerNight: number
        currency: string
        recommendationReason: string
        lat: number
        lng: number
      }>).map(acc => ({
        name:     acc.name,
        price:    acc.expectedPricePerNight ?? 0,
        currency: acc.currency ?? currency,
        comment:  sanitizeText(acc.recommendationReason ?? ''),
        lat:      acc.lat ?? 0,
        lng:      acc.lng ?? 0,
      })),

      days: ((geminiPlan.days ?? []) as Array<{
        dayNumber: number
        items: Array<{
          spotName: string
          timeSlot: string
          category: string
          estimatedCost: number
          currency: string
          comment: string
          lat: number
          lng: number
        }>
      }>).map(day => ({
        dayId: `d${day.dayNumber}`,
        items: (day.items ?? []).map(item => ({
          name:     item.spotName,
          timeSlot: normalizeSlot(item.timeSlot),
          cat:      item.category,
          price:    item.estimatedCost ?? 0,
          currency: item.currency ?? currency,
          comment:  sanitizeText(item.comment ?? ''),
          lat:      item.lat ?? 0,
          lng:      item.lng ?? 0,
        })),
      })),
    }

    return NextResponse.json(plan)

  } catch (err) {
    console.error('[ai-trip-plan]', err)
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
    if (msg.includes('quota') || msg.includes('rate') || msg.includes('429') || msg.includes('resource_exhausted')) {
      return NextResponse.json(
        { error: 'AI 요청량이 잠시 초과됐습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { error: 'AI 일정 생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 },
    )
  }
}
