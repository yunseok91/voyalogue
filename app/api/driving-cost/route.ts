import { NextRequest, NextResponse } from 'next/server'

const CLIENT_ID     = process.env.NAVER_CLIENT_ID
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

const HEADERS = () => ({
  'X-NCP-APIGW-API-KEY-ID': CLIENT_ID!,
  'X-NCP-APIGW-API-KEY':    CLIENT_SECRET!,
})

export async function GET(req: NextRequest) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Naver API 키가 설정되지 않았습니다.' },
      { status: 501 },
    )
  }

  const { searchParams } = req.nextUrl

  // 좌표 직접 수신 (자동완성 선택 시)
  const originLat = searchParams.get('originLat')
  const originLng = searchParams.get('originLng')
  const destLat   = searchParams.get('destLat')
  const destLng   = searchParams.get('destLng')

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: '좌표 정보가 없습니다.' }, { status: 400 })
  }

  // Naver Directions: start/goal = lng,lat
  const start  = `${originLng},${originLat}`
  const goal   = `${destLng},${destLat}`
  const dirUrl = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&option=traoptimal`

  const dirRes = await fetch(dirUrl, { headers: HEADERS() })
  if (!dirRes.ok) {
    const body = await dirRes.text().catch(() => '')
    console.error('[driving-cost] Naver Directions error', dirRes.status, body)
    return NextResponse.json({ error: `경로 계산 실패 (${dirRes.status}): ${body}` }, { status: 502 })
  }

  const dirJson = await dirRes.json()
  const summary = dirJson.route?.traoptimal?.[0]?.summary

  if (!summary) {
    console.error('[driving-cost] No route summary', JSON.stringify(dirJson).slice(0, 300))
    return NextResponse.json({ error: `경로 정보가 없습니다. (code: ${dirJson.code})` }, { status: 400 })
  }

  return NextResponse.json({
    distance: summary.distance as number,   // meters
    toll:     summary.tollFare as number,   // 원
    duration: summary.duration as number,   // ms
  })
}
