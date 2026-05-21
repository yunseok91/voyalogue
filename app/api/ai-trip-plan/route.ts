import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

type VibeData = { style: string; pace: string; focus: string }

const VIBE_HINT: Record<string, VibeData> = {
  '먹방중심': {
    style: 'food-focused — must-visit restaurants, local specialties, popular eateries, street food, trending cafes',
    pace:  '3-4',
    focus: 'Prioritize 2-3 meal/cafe spots per day. Each day should feel like a food tour. Minimize pure sightseeing unless it doubles as a food spot.',
  },
  '핫플관광': {
    style: 'iconic landmarks, famous tourist highlights, Instagram-worthy cafes, trendy hotspots',
    pace:  '4-5',
    focus: 'Mix popular sightseeing with trendy cafes and good restaurants. Include at least one viral or must-visit spot per day.',
  },
  '느긋하게': {
    style: 'slow travel, neighborhood exploration, local atmosphere, relaxed pace',
    pace:  '2-3',
    focus: 'Fewer places, more time per spot. Cozy cafes, scenic walks, relaxed dining. Avoid crowded tourist traps. Prioritize vibe over checklist.',
  },
  '프리미엄': {
    style: 'high-end restaurants, luxury experiences, premium shopping, upscale spas and hotels',
    pace:  '3-4',
    focus: 'Quality over quantity. Only top-rated, Michelin-starred, or well-known premium venues. Include at least one high-end dining and one luxury experience per day.',
  },
}

/** Cyrillic(U+0400-04FF), CJK Unified(U+4E00-9FFF 등) 등 비한글 문자를 comment에서 제거 */
function sanitizeComment(text: string): string {
  return text
    .replace(/[Ѐ-ӿ]+/g, '') // 키릴 문자 (러시아어 등) 제거
    .replace(/\s{2,}/g, ' ')          // 다중 공백 정리
    .trim()
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
    const { destination, startDate, nights, companion, people, vibe, pace, foodPref, accommodation, accommodationStyle, accommodationLocation, transport, arrivalTime, departureTime, budget } = await req.json()

    if (!destination || !startDate || !nights) {
      return NextResponse.json({ error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    const totalDays    = Number(nights) + 1
    const vibeData     = VIBE_HINT[vibe as string] ?? VIBE_HINT['핫플관광']
    const PACE_COUNT: Record<string, string> = { '빽빽하게': '5-6', '적당히': '3-4', '느긋하게': '2-3' }
    const itemCount    = PACE_COUNT[pace as string] ?? vibeData.pace
    const styleHint    = vibeData.style
    const focusHint    = vibeData.focus
    const currency     = currencyFor(destination)

    /* 동행 유형 → 인원 추론 */
    let groupCount: number
    if ((companion as string) === '혼자')     groupCount = 1
    else if ((companion as string) === '커플') groupCount = 2
    else                                       groupCount = Math.max(2, parseInt(people as string) || 3)
    const groupSize = `${groupCount} ${groupCount === 1 ? 'person' : 'people'}`

    /* budget: 만원 단위 숫자 문자열 → KRW 변환 */
    const budgetKRW = Math.max(0, parseInt(budget as string) || 0) * 10000
    let budgetHint  = ''
    if (budgetKRW > 0) {
      const fmt = `${(budgetKRW / 10000).toLocaleString()}만원/인 (${budgetKRW.toLocaleString()} KRW per person, local expenses only)`
      if      (budgetKRW < 300000)  budgetHint = `very tight budget: ${fmt}. Free attractions only, street food, skip paid tours`
      else if (budgetKRW < 1000000) budgetHint = `budget travel: ${fmt}. Affordable dining, mix of free and low-cost attractions`
      else if (budgetKRW < 3000000) budgetHint = `comfortable budget: ${fmt}. Good restaurants, paid attractions`
      else                          budgetHint = `generous budget: ${fmt}. Fine dining, premium experiences, luxury options`
    }

    /* ── 항공편 시간 힌트 ── */
    let flightHint = ''
    if (arrivalTime)   flightHint += `\n- Day 1 arrival flight: ${arrivalTime} — do NOT schedule activities before this time on Day 1; start itinerary after arrival`
    if (departureTime) flightHint += `\n- Last day departure flight: ${departureTime} — end last day's itinerary early enough before this departure`

    /* ── 교통수단 힌트 ── */
    const transportStr = (transport as string) ?? '미정'
    let transportHint = ''
    if (transportStr === '렌터카')  transportHint = '\n- Transport: rental car — include spots that benefit from driving; scenic drives, out-of-center gems are fine'
    else if (transportStr === '대중교통') transportHint = '\n- Transport: public transit — only pick spots accessible by subway/bus/train; no car-only remote locations'

    /* ── 음식 취향 힌트 ── */
    const foodPrefArr = Array.isArray(foodPref) ? (foodPref as string[]) : []
    const FOOD_LABEL: Record<string, string> = {
      '현지로컬':   'authentic local restaurants (hidden gems, locals-only spots)',
      '인스타카페': 'photogenic Instagram-worthy cafes and dessert spots',
      '가성비식당': 'budget-friendly, affordable, great-value dining',
      '파인다이닝':  'fine dining / Michelin-starred restaurants',
    }
    let foodPrefHint = ''
    if (foodPrefArr.length > 0) {
      foodPrefHint = `\n- Food style preferences: ${foodPrefArr.map(p => FOOD_LABEL[p] ?? p).join(', ')} — weight dining choices toward these`
    }

    /* ── 숙소 추천 힌트 — vibe + companion + budget 조합으로 자동 추론 ── */
    let accommodationHint = ''
    if ((accommodation as string) === 'booked') {
      if (accommodationLocation) {
        accommodationHint = `\n- Accommodation: already booked near "${accommodationLocation}". Optimize routing around this base — prefer spots reachable from there and cluster nearby activities together.`
      }
    } else {
      const vibeStr      = (vibe      as string) ?? '핫플관광'
      const companionStr = (companion as string) ?? '커플'

      /* 사용자가 직접 스타일을 선택했으면 우선 적용 */
      const styleMap: Record<string, string> = {
        '가성비':  `budget hotel or affordable guesthouse (NOT hostel dorm — private room only)`,
        '3~4성급': `clean 3-4 star hotel or boutique hotel`,
        '럭셔리':  `5-star luxury hotel or high-end resort`,
      }

      let accomType = styleMap[accommodationStyle as string] ?? ''

      if (!accomType) {
        if (vibeStr === '프리미엄' || budgetKRW >= 2000000) {
          accomType = '5-star luxury hotel or high-end resort'
        } else if (budgetKRW > 0 && budgetKRW < 500000) {
          if (companionStr === '혼자') accomType = 'capsule hotel or affordable private guesthouse'
          else                         accomType = 'budget hotel (private room) or affordable Airbnb'
        } else {
          if      (companionStr === '혼자')   accomType = 'solo-friendly boutique hotel or small guesthouse'
          else if (companionStr === '커플')   accomType = '3-4 star boutique hotel or charming Airbnb'
          else if (companionStr === '가족')   accomType = 'spacious family hotel or apartment-style accommodation'
          else if (companionStr === '친구들') accomType = '3-4 star hotel with multiple rooms or Airbnb apartment'
          else                                accomType = '3-4 star hotel'
        }
      }

      accommodationHint = `\n- Accommodation: not booked. Add "accommodationOptions" (array of exactly 3 items) to the JSON response. Each option must be a REAL, verifiable hotel/accommodation that exists on Google Maps near the destination. Choose ${accomType} suitable for: group ${companionStr}, vibe ${vibeStr}. Do NOT add any hotel or check-in item inside "days" items.`
    }

    const dayIds = Array.from({ length: totalDays }, (_, i) => `"d${i + 1}"`).join(', ')

    const isDomestic = /서울|부산|제주|인천|대구|대전|광주|수원|경주|여수|강릉|속초|전주|통영|거제|울산|춘천|가평|남해|포항|목포|순천|군산|담양|한국|korea/i.test(destination)

    const systemPrompt = `You are a Korean local travel expert and enthusiastic guide. Always respond with valid JSON only. No explanation, no markdown, no code fences.

CRITICAL LANGUAGE RULES — violation is a fatal error:
1. ALL "comment" fields MUST be written ENTIRELY in Korean (한국어) using 해요체 style.
2. DO NOT include ANY Cyrillic letters (А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я etc.). Zero tolerance.
3. DO NOT include ANY Chinese/Japanese characters unless they are part of a proper noun place name.
4. Think and write in Korean from scratch. Never translate from Russian or any other language.
5. Use vivid Korean expressions: "진짜 맛있어요", "뷰가 끝내줘요", "꼭 가봐야 해요", "분위기 최고예요".
6. If you catch yourself about to write a non-Korean word in a comment, replace it with natural Korean immediately.`

    const userPrompt = `Create a ${nights}-night ${totalDays}-day travel itinerary for "${destination}".

Traveler profile:
- Group: ${groupSize} (${companion})
- Vibe: ${vibe} — ${styleHint}
- Focus rule: ${focusHint}
- Items per day: ${itemCount}
- Start date: ${startDate}${budgetHint ? `\n- Budget: ${budgetHint}` : ''}${accommodationHint}${flightHint}${transportHint}${foodPrefHint}
- Trip type: ${isDomestic ? 'Domestic Korea — recommend real Korean restaurants, trending cafes, local hotspots' : 'International — include famous local restaurants and must-visit attractions'}

Return this exact JSON structure:
{
  "tripTitle": "short catchy trip title in Korean (max 15 chars)",
  "accommodationOptions": [
    {
      "name": "실제 호텔명 (Google Maps에서 검색 가능한 실제 숙소)",
      "price": 150,
      "currency": "${currency}",
      "comment": "2문장 한국어 추천 이유 (해요체). 왜 이 여행자에게 맞는지 + 가격 정보.",
      "lat": 0.000,
      "lng": 0.000
    }
  ],
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
          "comment": "2~3문장, 자연스러운 한국어(해요체). 친구에게 추천하듯: 이 곳의 매력 + 추천 메뉴나 볼거리 + 실용 팁. 한국어만 사용, 외국어·키릴 문자 절대 금지.",
          "lat": 0.000,
          "lng": 0.000
        }
      ]
    }
  ]
}

RULES — follow strictly:
- timeSlot: MUST be exactly one of: 아침 / 점심 / 저녁. NEVER use 미정 — every item needs a time slot. Spread items so each day has morning/lunch/dinner coverage matching ${itemCount} items total
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
- Pick places the traveler group (${companion}) would actually visit and post on social media
- Include at least one trendy cafe or dessert spot per day if style allows

DO NOT include:
- Hotel check-in / check-out
- Airport arrivals / departures
- Vague transit unless it's a tourist attraction (cable car, scenic train etc.)

GPS: accurate real coordinates for every place
Prices: realistic in ${currency} (0 if free)`

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI 서비스 키가 설정되지 않았습니다. 관리자에게 문의해주세요.' },
        { status: 503 }
      )
    }

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
        temperature:     0.55,
        max_tokens:      8192,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = (err as { error?: { message?: string } }).error?.message ?? res.statusText
      const is429 = res.status === 429
      const is401 = res.status === 401
      return NextResponse.json(
        { error: is429
            ? '현재 AI 서비스가 잠시 혼잡합니다. 잠시 후 다시 시도해주세요.'
            : is401
            ? 'AI 서비스 인증에 실패했습니다. 관리자에게 문의해주세요.'
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
      if (/숙소|호텔|호스텔|게스트하우스|체크인|hotel|hostel|guesthouse|resort|accommodation|airbnb/.test(v)) return '기타'
      return '기타'
    }
    const normSlot = (s: string): string => {
      const v = (s ?? '').toLowerCase().trim()
      if (/아침|morning|breakfast/.test(v)) return '아침'
      if (/점심|lunch|noon|afternoon|midday/.test(v)) return '점심'
      if (/저녁|dinner|evening|night/.test(v)) return '저녁'
      return '점심'
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
        /* 키릴 문자 등 오염 문자 제거 */
        if (typeof item.comment === 'string') item.comment = sanitizeComment(item.comment)
      }
    }
    /* accommodationOptions 정규화 */
    for (const opt of plan.accommodationOptions ?? []) {
      if (typeof opt.comment === 'string') opt.comment = sanitizeComment(opt.comment)
      if (typeof opt.price !== 'number') opt.price = 0
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
