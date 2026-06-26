import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 2) return NextResponse.json([])

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return NextResponse.json([])

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${key}&language=ko&region=kr`
  const res  = await fetch(url)
  if (!res.ok) return NextResponse.json([])

  const json = await res.json()
  const results = ((json.results ?? []) as {
    name: string
    formatted_address: string
    geometry: { location: { lat: number; lng: number } }
  }[]).slice(0, 5).map(p => ({
    name:    p.name,
    address: p.formatted_address,
    lat:     p.geometry.location.lat,
    lng:     p.geometry.location.lng,
  }))

  return NextResponse.json(results)
}
