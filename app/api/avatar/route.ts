import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })

  // 허용된 도메인만 프록시
  const allowed = ['lh3.googleusercontent.com', 'googleusercontent.com', 'graph.facebook.com']
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }
  if (!allowed.some(d => hostname.endsWith(d))) {
    return NextResponse.json({ error: 'domain not allowed' }, { status: 403 })
  }

  try {
    const res = await fetch(url, { headers: { Referer: '' } })
    const buf = await res.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 })
  }
}
