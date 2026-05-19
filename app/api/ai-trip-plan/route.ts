import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const PACE_COUNT: Record<string, string> = {
  '여유롭게': '2-3',
  '적당히':   '3-4',
  '빽빽하게': '5-6',
}

const STYLE_HINT: Record<string, string> = {
  '가성비':   'budget-friendly, free or low-cost spots, local street food and markets',
  '유명명소': 'iconic landmarks, famous tourist highlights and must-see attractions',
  '맛집탐방': 'food-focused trip, popular restaurants, local specialties, food streets and markets',
  '럭셔리':   'high-end restaurants, luxury experiences, premium shopping, upscale hotels and spas',
}

function currencyFor(dest: string): string {
  const d = dest
  if (/일본|japan|도쿄|오사카|교토|나고야|삿포로|후쿠오카/i.test(d)) return 'JPY'
  if (/파리|프랑스|로마|이탈리아|바르셀로나|스페인|암스테르담|독일|베를린|유럽/i.test(d)) return 'EUR'
  if (/미국|뉴욕|LA|로스앤젤레스|하와이|샌프란시스코|시카고/i.test(d)) return 'USD'
  if (/태국|방콕|치앙마이|푸켓/i.test(d)) return 'THB'
  if (/싱가포르/i.test(d)) return 'SGD'
  if (/베트남|하노이|호치민|다낭/i.test(d)) return 'VND'
  if (/영국|런던/i.test(d)) return 'GBP'
  if (/중국|베이징|상하이|홍콩/i.test(d)) return 'CNY'
  if (/대만|타이베이/i.test(d)) return 'TWD'
  if (/호주|시드니|멜버른/i.test(d)) return 'AUD'
  return 'KRW'
}

export async function POST(req: NextRequest) {
  try {
    const { destination, startDate, nights, ageGroup, companion, people, style, interests, pace, budget } = await req.json()

    if (!destination || !startDate || !nights) {
      return NextResponse.json({ error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    const totalDays   = Number(nights) + 1
    const itemCount   = PACE_COUNT[pace]   ?? '3-4'
    const styleHint   = STYLE_HINT[style]  ?? 'balanced mix of sightseeing and dining'
    const currency    = currencyFor(destination)
    const interestStr = Array.isArray(interests) && interests.length
      ? interests.join(', ')
      : '전반적인 관광'

    /* budget: 만원 단위 숫자 문자열 → KRW 변환 */
    const budgetKRW  = Math.max(0, parseInt(budget as string) || 0) * 10000
    const groupSize  = people ? `${people} people` : '2 people'
    let budgetHint   = ''
    if (budgetKRW > 0) {
      const fmt = `${(budgetKRW / 10000).toLocaleString()}만원 (${budgetKRW.toLocaleString()} KRW)`
      if      (budgetKRW < 300000)   budgetHint = `very tight budget: ${fmt}. Free attractions only, street food, skip paid tours`
      else if (budgetKRW < 1000000)  budgetHint = `budget travel: ${fmt}. Affordable dining, mix of free and low-cost attractions`
      else if (budgetKRW < 3000000)  budgetHint = `comfortable budget: ${fmt}. Good restaurants, paid attractions`
      else                           budgetHint = `generous budget: ${fmt}. Fine dining, premium experiences, luxury options`
    }

    const dayIds = Array.from({ length: totalDays }, (_, i) => `"d${i + 1}"`).join(', ')

    const isDomestic = /서울|부산|제주|인천|대구|대전|광주|수원|경주|여수|강릉|속초|전주|통영|거제|울산|춘천|가평|남해|포항|목포|순천|군산|담양|한국|korea/i.test(destination)

    const ageHint: Record<string, string> = {
      '10대':      'teens — trendy SNS hotspots, cute cafes, popular street food, youth culture spots',
      '20대':      'twenties — Instagram-worthy cafes, hip neighborhoods, popular local restaurants, night life spots',
      '30대':      'thirties — well-known restaurants with good reviews, mix of trendy and classic, comfortable experiences',
      '40대':      'forties — established well-known restaurants, cultural sites, comfortable and reputable places',
      '50대 이상': 'fifties and above — traditional and famous spots, reputable restaurants, comfortable sightseeing',
    }

    const systemPrompt = `You are a local travel expert who knows real restaurants, cafes, and attractions. Always respond with valid JSON only. No explanation, no markdown, no code fences.`

    const userPrompt = `Create a ${nights}-night ${totalDays}-day travel itinerary for "${destination}".

Traveler profile:
- Age group: ${ageGroup} (${ageHint[ageGroup as string] ?? ageHint['20대']})
- Group: ${groupSize} (${companion})
- Style: ${style} (${styleHint})
- Interests: ${interestStr}
- Pace: ${pace} (${itemCount} places per day)
- Start date: ${startDate}${budgetHint ? `\n- Budget: ${budgetHint}` : ''}
- Trip type: ${isDomestic ? 'Domestic Korea — recommend real Korean restaurants, trending cafes, local hotspots' : 'International — include famous local restaurants and must-visit attractions'}

Return this exact JSON structure:
{
  "tripTitle": "short catchy trip title in Korean (max 15 chars)",
  "days": [
    {
      "dayId": "d1",
      "items": [
        {
          "name": "장소 이름",
          "timeSlot": "아침",
          "cat": "장소",
          "price": 0,
          "currency": "${currency}",
          "comment": "2-3 sentences in Korean: why it's good, what to order or do, practical tip",
          "lat": 0.000,
          "lng": 0.000
        }
      ]
    }
  ]
}

RULES — follow strictly:
- timeSlot: MUST be exactly one of: 아침 / 점심 / 저녁 / 미정
- cat: MUST be exactly one of:
  • 식사 → restaurants, cafes, bakeries, bars, food courts, street food stalls
  • 장소 → attractions, parks, museums, temples, palaces, landmarks, viewpoints, galleries, theme parks
  • 쇼핑 → shopping malls, markets, department stores, outlet, shopping streets, duty-free
  • 교통 → ONLY scenic transport (cable car, scenic train, cruise, ferry worth visiting as attraction)
  • 기타 → spas, experiences, activities that don't fit above
- Generate exactly ${totalDays} day objects, dayId: ${dayIds}
- Each day: ${itemCount} items spread across 아침/점심/저녁
- Include 1-2 meal items (cat: "식사") per day
- NEVER use "기타" for restaurants, cafes, shopping, or attractions — use the correct cat above

PLACE NAMES — most critical rule:
- ONLY use real place names that exist on Google Maps
- Restaurants/cafes: actual business name (e.g. "온지음", "어니언 성수", "이치란 라멘 신주쿠점")
- Attractions: official name (e.g. "경복궁", "남산서울타워", "팀랩 보더리스")
- Shopping: actual venue name (e.g. "성수연방", "광장시장", "돈키호테 신주쿠점")
- NEVER write: "X 맛집", "X역 근처 카페", "현지 식당", "인기 레스토랑" — these are FORBIDDEN

TRENDING & POPULAR focus:
- Prioritize places that are currently popular, well-reviewed, and frequently visited
- For ${ageGroup} travelers, pick places they would actually go and post on social media
- Include at least one trendy cafe or dessert spot per day if style allows

DO NOT include:
- Hotel check-in / check-out
- Airport arrivals / departures
- Vague transit unless it's a tourist attraction (cable car, scenic train etc.)

GPS: accurate real coordinates for every place
Prices: realistic in ${currency} (0 if free)`

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:           'llama-3.3-70b-versatile',
        messages:        [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        temperature:     0.7,
        max_tokens:      8192,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = (err as { error?: { message?: string } }).error?.message ?? res.statusText
      const is429 = res.status === 429
      return NextResponse.json(
        { error: is429
            ? '현재 AI 서비스가 잠시 혼잡합니다. 잠시 후 다시 시도해주세요.'
            : `AI 오류: ${msg}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('빈 응답')

    const plan = JSON.parse(content)

    /* AI 응답 정규화 — cat/timeSlot 값이 규칙을 벗어난 경우 교정 */
    const normCat = (c: string): string => {
      const v = (c ?? '').toLowerCase().trim()
      if (/식사|food|restaurant|dining|cafe|coffee|meal|bar|eat|lunch|dinner|breakfast|bakery|snack|ramen|sushi|bbq/.test(v)) return '식사'
      if (/장소|place|attraction|sightseeing|museum|park|temple|shrine|landmark|palace|garden|gallery|theme|view|castle/.test(v)) return '장소'
      if (/쇼핑|shopping|mall|market|store|shop|boutique|outlet|duty.free|department/.test(v)) return '쇼핑'
      if (/교통|transport|transit|cable.car|ropeway|train|cruise|ferry/.test(v)) return '교통'
      return '기타'
    }
    const normSlot = (s: string): string => {
      const v = (s ?? '').toLowerCase().trim()
      if (/아침|morning|breakfast/.test(v)) return '아침'
      if (/점심|lunch|noon|afternoon|midday/.test(v)) return '점심'
      if (/저녁|dinner|evening|night/.test(v)) return '저녁'
      return '미정'
    }

    for (const day of plan.days ?? []) {
      for (const item of day.items ?? []) {
        const rawCat  = item.cat  as string
        const rawSlot = item.timeSlot as string
        const fixedCat  = normCat(rawCat)
        const fixedSlot = normSlot(rawSlot)
        /* 원래 값이 한국어 규칙값이면 유지, 아니면 교정 */
        item.cat      = ['식사','장소','쇼핑','교통','기타'].includes(rawCat)  ? rawCat  : fixedCat
        item.timeSlot = ['아침','점심','저녁','미정'].includes(rawSlot)        ? rawSlot : fixedSlot
      }
    }

    return NextResponse.json(plan)

  } catch (err) {
    console.error('[ai-trip-plan]', err)
    return NextResponse.json(
      { error: 'AI 일정 생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
