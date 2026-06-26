'use client'

import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { Navigation } from 'lucide-react'

/* 세션 동안 유지되는 도보 거리 캐시 — 같은 좌표쌍은 API 재호출 없음 */
const walkDistCache = new Map<string, number>()

export type MapItem = {
  id:          string
  name:        string
  lat:         number
  lng:         number
  timeSlot:    string
  cat?:        string
  markerType?: 'special'
}

export type AvatarMember = {
  name:      string
  baseColor: string
  photoURL?: string
}

export type DayGroup = {
  dayId: string
  label: string
  color: string
  items: MapItem[]
}

export const DAY_COLORS = [
  '#3B82F6', '#F97316', '#10B981', '#8B5CF6',
  '#EC4899', '#EAB308', '#14B8A6', '#F43F5E',
  '#6366F1', '#84CC16', '#EF4444', '#06B6D4',
  '#D946EF', '#22C55E', '#A855F7', '#EA580C',
  '#F472B6', '#1D4ED8', '#059669', '#7C3AED',
  '#DC2626', '#0284C7', '#C026D3', '#16A34A',
  '#9333EA', '#B45309', '#0F766E', '#BE123C',
  '#4338CA', '#4D7C0F',
]

const SLOT_COLORS: Record<string, string> = {
  아침: '#F59E0B',
  점심: '#10B981',
  저녁: '#6366F1',
  미정: '#94A3B8',
}

// 비행기·숙소 전용 색상 — DAY_COLORS 팔레트에 절대 추가 금지
const SPECIAL_COLORS: Record<string, string> = {
  '비행기': '#0EA5E9',  // sky-500: 스카이블루 (비행기 전용)
  '숙소':   '#92400E',  // amber-800: 짙은 브라운 (숙소 전용)
}

interface Props {
  city:          string
  items:         MapItem[]
  focusId?:      string
  focusTrigger?: number
  members?:      AvatarMember[]
  previewPlace?: { name: string; lat: number; lng: number }
  onDblClick?:   (lat: number, lng: number, name?: string) => void
  dayGroups?:    DayGroup[]
  activeDayId?:  string
}

type MarkerEntry = {
  marker: google.maps.Marker
  iw:     google.maps.InfoWindow
}

export function TripMap({ city, items, focusId, focusTrigger, members, previewPlace, onDblClick, dayGroups, activeDayId }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null)
  const mapRef            = useRef<google.maps.Map | null>(null)
  const markerMapRef      = useRef<Map<string, MarkerEntry>>(new Map())
  const polylineRef       = useRef<google.maps.Polyline | null>(null)
  const dayPolylinesRef   = useRef<Map<string, google.maps.Polyline>>(new Map())
  const distOverlaysRef   = useRef<google.maps.OverlayView[]>([])
  const distFetchTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const myLocOverlay      = useRef<google.maps.OverlayView | null>(null)
  const openIwRef         = useRef<google.maps.InfoWindow | null>(null)
  const previewMarkerRef  = useRef<google.maps.Marker | null>(null)
  const initDoneRef       = useRef(false)
  const focusIdRef        = useRef(focusId)
  const onDblClickRef     = useRef(onDblClick)
  focusIdRef.current      = focusId
  onDblClickRef.current   = onDblClick

  /* map init 후 즉시 마커 렌더링 — items effect 비동기 타이밍 우회 */
  const syncMarkersRef = useRef<() => void>(() => {})
  /* 마커가 렌더링되면 true — Geocoder가 fitBounds를 덮어쓰지 않도록 방지 */
  const centeredOnMarkersRef = useRef(false)

  /* ── 지도 최초 초기화 ── */
  useEffect(() => {
    if (initDoneRef.current) return
    initDoneRef.current = true

    loadGoogleMaps().then(() => {
      if (!containerRef.current) return

      const style = document.createElement('style')
      style.innerHTML = `
        .gm-style-iw-c { padding: 0 !important; border-radius: 12px !important; box-shadow: 0 2px 12px rgba(0,0,0,0.12) !important; overflow: hidden !important; }
        .gm-style-iw-d { overflow: hidden !important; }
        .gm-ui-hover-effect { display: none !important; }
        .gm-style-iw-tc { display: none !important; }
        .gm-style-iw-t::after { display: none !important; }
      `
      document.head.appendChild(style)

      const map = new google.maps.Map(containerRef.current, {
        zoom:                    13,
        center:                  { lat: 35.6762, lng: 139.6503 },
        mapTypeControl:          false,
        streetViewControl:       false,
        fullscreenControl:       false,
        zoomControlOptions:      { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling:         'greedy',
        disableDoubleClickZoom:  true,
      })
      mapRef.current = map
      syncMarkersRef.current()   // 마커 즉시 렌더 (items effect 실행 전 map이 준비될 수 있음)

      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        const e = event as google.maps.MapMouseEvent & { placeId?: string; stop?: () => void }
        if (e.placeId && onDblClickRef.current) {
          /* POI 탭 — 기본 정보창 막고 장소명+좌표 추출 */
          e.stop?.()
          new google.maps.places.PlacesService(map).getDetails(
            { placeId: e.placeId, fields: ['name', 'geometry'] },
            (place, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                onDblClickRef.current?.(
                  place.geometry.location.lat(),
                  place.geometry.location.lng(),
                  place.name ?? '',
                )
              }
            },
          )
        } else {
          openIwRef.current?.close()
          openIwRef.current = null
        }
      })

      map.addListener('dblclick', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return
        onDblClickRef.current?.(event.latLng.lat(), event.latLng.lng())
      })

      new google.maps.Geocoder().geocode({ address: city }, (results, status) => {
        if (status === 'OK' && results?.[0] && !centeredOnMarkersRef.current) {
          map.setCenter(results[0].geometry.location)
        }
      })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── 마커 & 경로선 업데이트 (단일 Day 모드) ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (dayGroups?.length) return   // multi-day 모드에서는 아래 effect가 처리
    const render = () => {
      if (!mapRef.current) return

      markerMapRef.current.forEach(({ marker }) => marker.setMap(null))
      markerMapRef.current.clear()
      polylineRef.current?.setMap(null)
      polylineRef.current = null
      distOverlaysRef.current.forEach(o => o.setMap(null))
      distOverlaysRef.current = []
      openIwRef.current?.close()
      openIwRef.current = null

      const pinned = items
        .map(i => ({ ...i, lat: Number(i.lat), lng: Number(i.lng) }))
        .filter(i => isFinite(i.lat) && isFinite(i.lng) && (i.lat !== 0 || i.lng !== 0))

      let regularIdx = 0
      pinned.forEach((item, idx) => {
        const isSpecial = item.markerType === 'special'
        const color = isSpecial
          ? (SPECIAL_COLORS[item.timeSlot] ?? '#94A3B8')
          : (SLOT_COLORS[item.timeSlot] ?? '#94A3B8')

        let marker: google.maps.Marker

        if (isSpecial) {
          const isFlightType = item.timeSlot === '비행기'

          /* 비행기 핀: 핀 모양 + 비행기 아이콘 */
          const flightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54"><defs><filter id="d"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/></filter></defs><path d="M22 4C14.268 4 8 10.268 8 18c0 10.5 14 32 14 32S36 28.5 36 18C36 10.268 29.732 4 22 4Z" fill="${color}" filter="url(#d)"/><circle cx="22" cy="18" r="10" fill="rgba(255,255,255,0.18)"/><text x="22" y="18" font-family="Arial,sans-serif" font-size="15" text-anchor="middle" dominant-baseline="central" fill="white">&#x2708;</text></svg>`

          /* 숙소 핀: 핀 모양 + 집/호텔 아이콘 */
          const hotelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54"><defs><filter id="d"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/></filter></defs><path d="M22 4C14.268 4 8 10.268 8 18c0 10.5 14 32 14 32S36 28.5 36 18C36 10.268 29.732 4 22 4Z" fill="${color}" filter="url(#d)"/><circle cx="22" cy="18" r="10" fill="rgba(255,255,255,0.18)"/><polygon points="22,9 13,16 31,16" fill="white"/><rect x="14" y="15" width="16" height="11" fill="white" rx="0.5"/><rect x="20" y="20" width="4" height="6" fill="${color}" rx="0.5"/><rect x="15.5" y="16.5" width="3.5" height="2.5" fill="${color}" rx="0.3"/><rect x="25" y="16.5" width="3.5" height="2.5" fill="${color}" rx="0.3"/></svg>`

          const iconSvg = isFlightType ? flightSvg : hotelSvg

          marker = new google.maps.Marker({
            position:  { lat: item.lat, lng: item.lng },
            map:       mapRef.current!,
            icon: {
              url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`,
              scaledSize: new google.maps.Size(44, 54),
              anchor:     new google.maps.Point(22, 54),
            },
            title:     item.name,
            zIndex:    idx + 5,
            clickable: true,
          })

          const typeLabel = isFlightType ? '✈ 비행기' : '🏠 숙소'
          const mapsUrlSpec = `https://www.google.com/maps/search/${encodeURIComponent(item.name)}`
          const iw = new google.maps.InfoWindow({
            content: `<div style="min-width:160px;"><div style="background:${color};padding:5px 12px;"><span style="font-size:10px;font-weight:700;color:white;">${typeLabel}</span></div><div style="padding:8px 12px 9px;"><p style="margin:0 0 5px;font-size:13px;font-weight:700;color:#111827;">${item.name}</p><div style="text-align:right;"><a href="${mapsUrlSpec}" target="_blank" rel="noopener" style="font-size:10px;color:#3B82F6;font-weight:600;text-decoration:none;">구글맵에서 보기</a></div></div></div>`,
            pixelOffset: new google.maps.Size(0, -6),
          })
          marker.addListener('click', () => {
            openIwRef.current?.close()
            iw.open(mapRef.current!, marker)
            openIwRef.current = iw
          })
          markerMapRef.current.set(item.id, { marker, iw })
        } else {
          regularIdx++
          const num = regularIdx
          const catLabel = item.cat ?? ''
          const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54"><defs><filter id="s"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.22)"/></filter></defs><path d="M22 3C13.716 3 7 9.716 7 18c0 11 15 33 15 33S37 29 37 18C37 9.716 30.284 3 22 3Z" fill="${color}" filter="url(#s)"/><text x="22" y="${catLabel ? '16' : '20'}" font-family="Arial,sans-serif" font-size="${catLabel ? '12' : '13'}" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="white">${num}</text>${catLabel ? `<rect x="9" y="22" width="26" height="10" rx="5" fill="rgba(255,255,255,0.28)"/><text x="22" y="27" font-family="Arial,sans-serif" font-size="8" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="white">${catLabel}</text>` : ''}</svg>`
          marker = new google.maps.Marker({
            position:  { lat: item.lat, lng: item.lng },
            map:       mapRef.current!,
            icon: {
              url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
              scaledSize: new google.maps.Size(44, 54),
              anchor:     new google.maps.Point(22, 51),
            },
            title:     item.name,
            zIndex:    idx + 10,
            clickable: true,
          })
          const mapsUrlReg = `https://www.google.com/maps/search/${encodeURIComponent(item.name)}`
          const catHtmlReg = item.cat
            ? `<span style="font-size:10px;font-weight:600;color:${color};background:${color}1A;padding:1.5px 7px;border-radius:20px;">${item.cat}</span>`
            : '<span></span>'
          const iw = new google.maps.InfoWindow({
            content: `<div style="min-width:160px;"><div style="background:${color};padding:5px 12px;display:flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.28);color:white;text-align:center;line-height:18px;font-size:10px;font-weight:700;flex-shrink:0;">${num}</span><span style="font-size:10px;font-weight:700;color:white;">${item.timeSlot}</span></div><div style="padding:8px 12px 9px;"><p style="margin:0 0 5px;font-size:13px;font-weight:700;color:#111827;">${item.name}</p><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">${catHtmlReg}<a href="${mapsUrlReg}" target="_blank" rel="noopener" style="font-size:10px;color:#3B82F6;font-weight:600;text-decoration:none;flex-shrink:0;">구글맵에서 보기</a></div></div></div>`,
            pixelOffset: new google.maps.Size(0, -4),
          })
          marker.addListener('click', () => {
            openIwRef.current?.close()
            iw.open(mapRef.current!, marker)
            openIwRef.current = iw
          })
          markerMapRef.current.set(item.id, { marker, iw })
        }
      })

      const haversineDist = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000
        const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180
        const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }

      const regularPinned = pinned.filter(i => i.markerType !== 'special')
      if (regularPinned.length > 1) {
        polylineRef.current = new google.maps.Polyline({
          path:          regularPinned.map(i => ({ lat: i.lat, lng: i.lng })),
          geodesic:      true,
          strokeColor:   '#EF4444',
          strokeOpacity: 0.75,
          strokeWeight:  2.5,
          icons: [
            {
              icon: {
                path:        google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor:   '#EF4444',
                fillOpacity: 1,
                strokeColor: '#EF4444',
                scale:       3,
              },
              offset: '100%',
            },
            {
              icon: {
                path:        google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor:   '#EF4444',
                fillOpacity: 0.7,
                strokeColor: '#EF4444',
                scale:       2.5,
              },
              offset: '50%',
            },
          ],
          map: mapRef.current!,
        })

        /* 폴리라인 클릭 → 구글맵 전체 경로 길찾기 (비용 $0, URL 리다이렉트) */
        const first = regularPinned[0], last = regularPinned[regularPinned.length - 1]
        const waypoints = regularPinned.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|')
        const fullRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${first.lat},${first.lng}&destination=${last.lat},${last.lng}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=walking`
        polylineRef.current.addListener('click', () => window.open(fullRouteUrl, '_blank'))

        /* 마커 간 거리 라벨 오버레이 — Haversine 초기 표시 후 실제 도보 거리로 업데이트 */
        /* 클릭/탭 시 구글맵 길찾기 열기 (좌표 기반 → 정확한 위치 전달, 비용 $0) */
        const labelSpans: HTMLSpanElement[] = []
        const NAV_SVG = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>'
        const BTN_STYLE = [
          'display:inline-flex;align-items:center;gap:4px;',
          'background:white;border:1.5px solid #fecaca;border-radius:999px;',
          'padding:6px 11px;',
          'font-size:11px;font-weight:700;color:#ef4444;',
          'white-space:nowrap;',
          'box-shadow:0 2px 10px rgba(239,68,68,0.22);',
          'cursor:pointer;-webkit-tap-highlight-color:transparent;',
          'touch-action:manipulation;',
          'pointer-events:auto;',
          'outline:none;',
        ].join('')

        for (let i = 0; i < regularPinned.length - 1; i++) {
          const p1 = regularPinned[i], p2 = regularPinned[i + 1]
          const midLat = (p1.lat + p2.lat) / 2
          const midLng = (p1.lng + p2.lng) / 2
          const dist   = haversineDist(p1.lat, p1.lng, p2.lat, p2.lng)
          const pos    = new google.maps.LatLng(midLat, midLng)

          /* 좌표 기반 URL → 정확한 장소 전달 */
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${p1.lat},${p1.lng}&destination=${p2.lat},${p2.lng}&travelmode=walking`

          /* button 요소 — 모바일 탭 이벤트 기본 처리 */
          const btn = document.createElement('button')
          btn.style.cssText = BTN_STYLE
          btn.setAttribute('aria-label', `${p1.name}에서 ${p2.name}까지 길찾기`)
          btn.innerHTML = `${NAV_SVG}<span></span>`
          const txt = btn.querySelector('span') as HTMLSpanElement
          txt.textContent = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`
          btn.addEventListener('click', e => { e.stopPropagation(); window.open(mapsUrl, '_blank') })
          labelSpans.push(txt)

          class DistLabel extends google.maps.OverlayView {
            private el: HTMLDivElement | null = null
            onAdd() {
              this.el = document.createElement('div')
              this.el.style.cssText = 'position:absolute;pointer-events:none;'
              /* 래퍼: 하단(dot)이 폴리라인 중점에 맞닿도록 translate(-50%,-100%) */
              const wrapper = document.createElement('div')
              wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);'
              wrapper.appendChild(btn)
              /* 커넥터 라인 */
              const line = document.createElement('div')
              line.style.cssText = 'width:1.5px;height:10px;background:#fca5a5;flex-shrink:0;'
              wrapper.appendChild(line)
              /* 중점 마커 dot */
              const dot = document.createElement('div')
              dot.style.cssText = 'width:5px;height:5px;border-radius:50%;background:#ef4444;opacity:0.65;flex-shrink:0;'
              wrapper.appendChild(dot)
              this.el.appendChild(wrapper)
              this.getPanes()!.overlayMouseTarget.appendChild(this.el)
            }
            draw() {
              if (!this.el) return
              const pt = this.getProjection().fromLatLngToDivPixel(pos)
              if (!pt) return
              this.el.style.left = `${pt.x}px`
              this.el.style.top  = `${pt.y}px`
            }
            onRemove() {
              this.el?.parentNode?.removeChild(this.el)
              this.el = null
            }
          }
          const overlay = new DistLabel()
          overlay.setMap(mapRef.current!)
          distOverlaysRef.current.push(overlay)
        }

        /* Distance Matrix API — 캐시 히트 즉시 반영, 미캐시 쌍만 API 호출 (디바운스 1.5초) */
        const pairs = regularPinned.slice(0, -1).map((p, i) => ({
          key: `${p.lat.toFixed(6)},${p.lng.toFixed(6)}|${regularPinned[i+1].lat.toFixed(6)},${regularPinned[i+1].lng.toFixed(6)}`,
          idx: i,
          from: new google.maps.LatLng(p.lat, p.lng),
          to:   new google.maps.LatLng(regularPinned[i+1].lat, regularPinned[i+1].lng),
        }))

        /* 캐시 히트: 즉시 텍스트 반영 */
        pairs.forEach(({ key, idx }) => {
          const cached = walkDistCache.get(key)
          if (cached !== undefined && labelSpans[idx]) {
            labelSpans[idx].textContent = cached >= 1000 ? `${(cached / 1000).toFixed(1)}km` : `${cached}m`
          }
        })

        /* 미캐시 쌍만 추출해서 디바운스 후 API 호출 */
        const uncached = pairs.filter(({ key }) => !walkDistCache.has(key))
        if (uncached.length > 0) {
          if (distFetchTimer.current) clearTimeout(distFetchTimer.current)
          distFetchTimer.current = setTimeout(() => {
            new google.maps.DistanceMatrixService().getDistanceMatrix(
              {
                origins:      uncached.map(p => p.from),
                destinations: uncached.map(p => p.to),
                travelMode:   google.maps.TravelMode.WALKING,
              },
              (res, status) => {
                if (status !== 'OK' || !res) return
                res.rows.forEach((row, ri) => {
                  const el = row.elements[ri]
                  if (el?.status !== 'OK') return
                  const m = uncached[ri]
                  walkDistCache.set(m.key, el.distance.value)
                  if (labelSpans[m.idx]) {
                    labelSpans[m.idx].textContent = el.distance.value >= 1000
                      ? `${(el.distance.value / 1000).toFixed(1)}km`
                      : `${el.distance.value}m`
                  }
                })
              }
            )
          }, 1500)
        }
      }

      if (regularPinned.length === 1) {
        centeredOnMarkersRef.current = true
        mapRef.current.panTo({ lat: regularPinned[0].lat, lng: regularPinned[0].lng })
      } else if (regularPinned.length > 1) {
        centeredOnMarkersRef.current = true
        const bounds = new google.maps.LatLngBounds()
        regularPinned.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }))
        mapRef.current.fitBounds(bounds, 60)
      } else if (pinned.length > 0) {
        centeredOnMarkersRef.current = true
        mapRef.current.panTo({ lat: pinned[0].lat, lng: pinned[0].lng })
      }

      /* 마커 재생성 후 기존 focusId 복원 */
      const fid = focusIdRef.current
      if (fid) {
        const entry = markerMapRef.current.get(fid)
        if (entry) {
          const pos = entry.marker.getPosition()
          if (pos) {
            mapRef.current.panTo(pos)
            mapRef.current.setZoom(16)
            entry.iw.open(mapRef.current, entry.marker)
            openIwRef.current = entry.iw
          }
        }
      }
    }

    /* items가 바뀔 때 즉시 렌더, map init 콜백에서도 호출됨 */
    syncMarkersRef.current = render
    render()
  }, [items])

  /* ── 마커 & 경로선 업데이트 (멀티 Day 모드) ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!dayGroups?.length) return

    const render = () => {
      if (!mapRef.current) return

      /* 기존 단일 day 마커/폴리라인 초기화 */
      markerMapRef.current.forEach(({ marker }) => marker.setMap(null))
      markerMapRef.current.clear()
      polylineRef.current?.setMap(null)
      polylineRef.current = null
      distOverlaysRef.current.forEach(o => o.setMap(null))
      distOverlaysRef.current = []
      dayPolylinesRef.current.forEach(p => p.setMap(null))
      dayPolylinesRef.current.clear()
      openIwRef.current?.close()
      openIwRef.current = null

      const allBounds  = new google.maps.LatLngBounds()
      const activeBounds = new google.maps.LatLngBounds()
      let totalPinned  = 0
      let activePinned = 0

      const showAll = !activeDayId   // 전체 일정 모드

      /* ── special 아이템 사전 수집 (중복 제거 + active 판정) ──
         숙소처럼 여러 Day 그룹에 같은 id로 등록된 경우,
         한 그룹이라도 active면 opacity 1.0 으로 렌더링 */
      const specialMap = new Map<string, { item: MapItem; active: boolean }>()
      dayGroups.forEach(group => {
        const isActive = showAll || group.dayId === activeDayId
        group.items
          .filter(i => i.markerType === 'special')
          .map(i => ({ ...i, lat: Number(i.lat), lng: Number(i.lng) }))
          .filter(i => isFinite(i.lat) && isFinite(i.lng) && (i.lat !== 0 || i.lng !== 0))
          .forEach(item => {
            const prev = specialMap.get(item.id)
            if (!prev) {
              specialMap.set(item.id, { item, active: isActive })
            } else if (isActive && !prev.active) {
              specialMap.set(item.id, { item, active: true })
            }
          })
      })

      specialMap.forEach(({ item, active }) => {
        const isFlightType = item.timeSlot === '비행기'
        const sColor = SPECIAL_COLORS[item.timeSlot] ?? '#94A3B8'
        const opacity = active ? 1.0 : 0.3
        const flightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54"><defs><filter id="d"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/></filter></defs><path d="M22 4C14.268 4 8 10.268 8 18c0 10.5 14 32 14 32S36 28.5 36 18C36 10.268 29.732 4 22 4Z" fill="${sColor}" filter="url(#d)"/><circle cx="22" cy="18" r="10" fill="rgba(255,255,255,0.18)"/><text x="22" y="18" font-family="Arial,sans-serif" font-size="15" text-anchor="middle" dominant-baseline="central" fill="white">&#x2708;</text></svg>`
        const hotelSvg  = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54"><defs><filter id="d"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/></filter></defs><path d="M22 4C14.268 4 8 10.268 8 18c0 10.5 14 32 14 32S36 28.5 36 18C36 10.268 29.732 4 22 4Z" fill="${sColor}" filter="url(#d)"/><circle cx="22" cy="18" r="10" fill="rgba(255,255,255,0.18)"/><polygon points="22,9 13,16 31,16" fill="white"/><rect x="14" y="15" width="16" height="11" fill="white" rx="0.5"/><rect x="20" y="20" width="4" height="6" fill="${sColor}" rx="0.5"/><rect x="15.5" y="16.5" width="3.5" height="2.5" fill="${sColor}" rx="0.3"/><rect x="25" y="16.5" width="3.5" height="2.5" fill="${sColor}" rx="0.3"/></svg>`
        const marker = new google.maps.Marker({
          position:  { lat: item.lat, lng: item.lng },
          map:       mapRef.current!,
          icon: {
            url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(isFlightType ? flightSvg : hotelSvg)}`,
            scaledSize: new google.maps.Size(44, 54),
            anchor:     new google.maps.Point(22, 54),
          },
          opacity,
          zIndex: active ? 15 : 2,
          title:  item.name,
        })
        const typeLabel = isFlightType ? '✈ 비행기' : '🏠 숙소'
        const mapsUrlSpecM = `https://www.google.com/maps/search/${encodeURIComponent(item.name)}`
        const iw = new google.maps.InfoWindow({
          content: `<div style="min-width:160px;"><div style="background:${sColor};padding:5px 12px;"><span style="font-size:10px;font-weight:700;color:white;">${typeLabel}</span></div><div style="padding:8px 12px 9px;"><p style="margin:0 0 5px;font-size:13px;font-weight:700;color:#111827;">${item.name}</p><div style="text-align:right;"><a href="${mapsUrlSpecM}" target="_blank" rel="noopener" style="font-size:10px;color:#3B82F6;font-weight:600;text-decoration:none;">구글맵에서 보기</a></div></div></div>`,
          pixelOffset: new google.maps.Size(0, -6),
        })
        marker.addListener('click', () => {
          openIwRef.current?.close()
          iw.open(mapRef.current!, marker)
          openIwRef.current = iw
        })
        markerMapRef.current.set(item.id, { marker, iw })

        /* special 아이템도 bounds에 포함 */
        const sll = new google.maps.LatLng(item.lat, item.lng)
        allBounds.extend(sll)
        totalPinned++
        if (active) { activeBounds.extend(sll); activePinned++ }
      })

      dayGroups.forEach(group => {
        const isActive = showAll || group.dayId === activeDayId
        const polylineColor  = isActive ? group.color : '#CBD5E1'
        const polylineAlpha  = isActive ? 0.85 : 0.2
        const polylineWeight = isActive ? 3   : 1.5

        const pinned = group.items
          .filter(i => i.markerType !== 'special')
          .map(i => ({ ...i, lat: Number(i.lat), lng: Number(i.lng) }))
          .filter(i => isFinite(i.lat) && isFinite(i.lng) && (i.lat !== 0 || i.lng !== 0))

        pinned.forEach((item, idx) => {
          let iconUrl: string
          let iconSize: google.maps.Size
          let anchor: google.maps.Point
          let opacity: number

          if (showAll) {
            /* 전체 모드: 작은 원형 번호 뱃지 (색상으로 Day 구분, 숫자로 당일 순서 표시) */
            const num = idx + 1
            const c   = group.color
            const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="11" fill="${c}" stroke="white" stroke-width="2"/><text x="13" y="13" font-family="Arial,sans-serif" font-size="${num >= 10 ? '9' : '11'}" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="white">${num}</text></svg>`
            iconUrl  = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(badgeSvg)}`
            iconSize = new google.maps.Size(26, 26)
            anchor   = new google.maps.Point(13, 13)
            opacity  = 1.0
          } else if (isActive) {
            /* 개별 Day 활성: 슬롯 컬러 번호 핀 (아침/점심/저녁/미정) */
            const slotColor = SLOT_COLORS[item.timeSlot] ?? '#94A3B8'
            const num       = idx + 1
            const catLabel  = item.cat ?? ''
            const pinSvg    = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54"><defs><filter id="s"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.22)"/></filter></defs><path d="M22 3C13.716 3 7 9.716 7 18c0 11 15 33 15 33S37 29 37 18C37 9.716 30.284 3 22 3Z" fill="${slotColor}" filter="url(#s)"/><text x="22" y="${catLabel ? '16' : '20'}" font-family="Arial,sans-serif" font-size="${catLabel ? '12' : '13'}" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="white">${num}</text>${catLabel ? `<rect x="9" y="22" width="26" height="10" rx="5" fill="rgba(255,255,255,0.28)"/><text x="22" y="27" font-family="Arial,sans-serif" font-size="8" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="white">${catLabel}</text>` : ''}</svg>`
            iconUrl  = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`
            iconSize = new google.maps.Size(44, 54)
            anchor   = new google.maps.Point(22, 51)
            opacity  = 1.0
          } else {
            /* 개별 Day 비활성: 아주 작은 회색 점 */
            const dimSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="7" cy="7" r="5" fill="#CBD5E1" stroke="white" stroke-width="1.5"/></svg>`
            iconUrl  = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(dimSvg)}`
            iconSize = new google.maps.Size(14, 14)
            anchor   = new google.maps.Point(7, 7)
            opacity  = 0.5
          }

          const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map:      mapRef.current!,
            icon:     { url: iconUrl, scaledSize: iconSize, anchor },
            opacity,
            zIndex:   isActive ? idx + 20 : idx + 1,
            title:    item.name,
          })

          /* 클릭 InfoWindow */
          const iwColor    = showAll ? group.color : (SLOT_COLORS[item.timeSlot] ?? '#94A3B8')
          const headerText = showAll ? `${group.label} · ${item.timeSlot}` : item.timeSlot
          const mapsUrlDay = `https://www.google.com/maps/search/${encodeURIComponent(item.name)}`
          const catHtmlDay = item.cat
            ? `<span style="font-size:10px;font-weight:600;color:${iwColor};background:${iwColor}1A;padding:1.5px 7px;border-radius:20px;">${item.cat}</span>`
            : '<span></span>'
          const iw = new google.maps.InfoWindow({
            content: `<div style="min-width:160px;"><div style="background:${iwColor};padding:5px 12px;"><span style="font-size:10px;font-weight:700;color:white;">${headerText}</span></div><div style="padding:8px 12px 9px;"><p style="margin:0 0 5px;font-size:13px;font-weight:700;color:#111827;">${item.name}</p><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">${catHtmlDay}<a href="${mapsUrlDay}" target="_blank" rel="noopener" style="font-size:10px;color:#3B82F6;font-weight:600;text-decoration:none;flex-shrink:0;">구글맵에서 보기</a></div></div></div>`,
            pixelOffset: new google.maps.Size(0, -6),
          })
          marker.addListener('click', () => {
            openIwRef.current?.close()
            iw.open(mapRef.current!, marker)
            openIwRef.current = iw
          })
          markerMapRef.current.set(item.id, { marker, iw })

          const ll = new google.maps.LatLng(item.lat, item.lng)
          allBounds.extend(ll)
          if (isActive) { activeBounds.extend(ll); activePinned++ }
          totalPinned++
        })

        if (!isActive) {
          /* 비활성 Day: 단일 회색 선 */
          if (pinned.length > 1) {
            const poly = new google.maps.Polyline({
              path:          pinned.map(i => ({ lat: i.lat, lng: i.lng })),
              geodesic:      true,
              strokeColor:   '#CBD5E1',
              strokeOpacity: 0.2,
              strokeWeight:  1.5,
              map:           mapRef.current!,
              zIndex:        1,
            })
            dayPolylinesRef.current.set(group.dayId, poly)
          }
        } else if (showAll) {
          /* 전체 일정 모드: Day 고유 색상 단일 선 */
          if (pinned.length > 1) {
            const poly = new google.maps.Polyline({
              path:          pinned.map(i => ({ lat: i.lat, lng: i.lng })),
              geodesic:      true,
              strokeColor:   group.color,
              strokeOpacity: 0.85,
              strokeWeight:  3,
              icons: [{
                icon: {
                  path:        google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  fillColor:   group.color,
                  fillOpacity: 1,
                  strokeColor: group.color,
                  scale:       3,
                },
                offset: '100%',
              }],
              map:    mapRef.current!,
              zIndex: 10,
            })
            dayPolylinesRef.current.set(group.dayId, poly)
          }
        } else {
          /* 개별 Day 활성: 슬롯 색상 + 슬롯 경계를 자연스럽게 잇는 폴리라인
             같은 슬롯 내 아이템끼리는 해당 슬롯 색으로, 슬롯이 바뀌는 지점에서는
             이전 슬롯 색으로 다음 슬롯 첫 번째 아이템까지 선을 이어줌 */
          if (pinned.length >= 2) {
            let batchStart = 0
            for (let i = 1; i <= pinned.length; i++) {
              const isEnd = i === pinned.length
              const slotChanged = isEnd || pinned[i].timeSlot !== pinned[batchStart].timeSlot

              if (slotChanged) {
                const slotColor = SLOT_COLORS[pinned[batchStart].timeSlot] ?? '#94A3B8'
                const path = pinned.slice(batchStart, i).map(x => ({ lat: x.lat, lng: x.lng }))

                if (!isEnd) {
                  path.push({ lat: pinned[i].lat, lng: pinned[i].lng })
                }

                if (path.length >= 2) {
                  const poly = new google.maps.Polyline({
                    path,
                    geodesic:      true,
                    strokeColor:   slotColor,
                    strokeOpacity: 0.85,
                    strokeWeight:  3,
                    icons: [{
                      icon: {
                        path:        google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        fillColor:   slotColor,
                        fillOpacity: 1,
                        strokeColor: slotColor,
                        scale:       3,
                      },
                      offset: '100%',
                    }],
                    map:    mapRef.current!,
                    zIndex: 10,
                  })
                  dayPolylinesRef.current.set(`${group.dayId}_batch_${batchStart}`, poly)
                }

                batchStart = i
              }
            }
          }
        }
      })

      /* fitBounds: 전체 모드 or 초기 → 전체 bounds, 특정 Day → 해당 Day bounds */
      if (!centeredOnMarkersRef.current) {
        if (totalPinned > 0) {
          centeredOnMarkersRef.current = true
          mapRef.current.fitBounds(allBounds, 60)
        }
      } else if (showAll) {
        if (totalPinned > 0) mapRef.current.fitBounds(allBounds, 60)
      } else if (activePinned > 0) {
        mapRef.current.fitBounds(activeBounds, 80)
      }

      /* 기존 focusId 복원 */
      const fid = focusIdRef.current
      if (fid) {
        const entry = markerMapRef.current.get(fid)
        if (entry) {
          const pos = entry.marker.getPosition()
          if (pos) {
            mapRef.current.panTo(pos)
            mapRef.current.setZoom(16)
            entry.iw.open(mapRef.current, entry.marker)
            openIwRef.current = entry.iw
          }
        }
      }
    }

    syncMarkersRef.current = render
    render()
  }, [dayGroups, activeDayId])

  /* ── 미리보기 마커 (검색 / 더블클릭) ── */
  useEffect(() => {
    previewMarkerRef.current?.setMap(null)
    previewMarkerRef.current = null
    if (!previewPlace || !mapRef.current) return
    const marker = new google.maps.Marker({
      position:  { lat: previewPlace.lat, lng: previewPlace.lng },
      map:       mapRef.current,
      animation: google.maps.Animation.DROP,
      zIndex:    2000,
    })
    previewMarkerRef.current = marker
    mapRef.current.panTo({ lat: previewPlace.lat, lng: previewPlace.lng })
    mapRef.current.setZoom(16)
  }, [previewPlace])

  /* ── focusId / focusTrigger 변경 → 마커 팬 & InfoWindow ── */
  useEffect(() => {
    if (!focusId || !mapRef.current) return
    const entry = markerMapRef.current.get(focusId)
    if (!entry) return
    const { marker, iw } = entry
    const pos = marker.getPosition()
    if (!pos) return
    openIwRef.current?.close()
    mapRef.current.panTo(pos)
    mapRef.current.setZoom(16)
    iw.open(mapRef.current, marker)
    openIwRef.current = iw
  }, [focusId, focusTrigger])

  /* ── 현재 위치 버튼 ── */
  const handleLocate = () => {
    if (!navigator.geolocation || !mapRef.current) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        const latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
        mapRef.current!.panTo(latlng)
        mapRef.current!.setZoom(16)

        /* 기존 오버레이 제거 */
        myLocOverlay.current?.setMap(null)
        myLocOverlay.current = null

        /* 멤버 아바타 HTML 생성 */
        const list      = (members ?? []).slice(0, 5)
        const extraCnt  = Math.max(0, (members ?? []).length - 5)

        const avatarsHtml = list.map((m, i) => {
          const inner = m.photoURL
            ? `<img src="${m.photoURL}" referrerpolicy="no-referrer"
                style="width:100%;height:100%;object-fit:cover;display:block;"
                onerror="this.style.display='none'" />`
            : `<svg viewBox="0 0 44 44" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
                <path d="M 7 44 Q 7 30 14.5 27 Q 18 25.5 22 25.5 Q 26 25.5 29.5 27 Q 37 30 37 44 Z" fill="${m.baseColor}"/>
                <circle cx="22" cy="14" r="11" fill="${m.baseColor}"/>
               </svg>`
          return `
            <div style="
              width:26px;height:26px;border-radius:50%;overflow:hidden;
              border:2px solid white;background:${m.baseColor};
              flex-shrink:0;margin-left:${i === 0 ? '0' : '-7px'};
              position:relative;z-index:${10 - i};
            ">${inner}</div>
          `
        }).join('')

        const extraHtml = extraCnt > 0
          ? `<span style="font-size:9px;font-weight:700;color:#374151;margin-left:3px;padding-right:3px;">+${extraCnt}</span>`
          : ''

        /* OverlayView 서브클래스 (Maps SDK 로드 후에만 실행됨) */
        class AvatarLocOverlay extends google.maps.OverlayView {
          private el: HTMLDivElement | null = null

          onAdd() {
            this.el = document.createElement('div')
            this.el.style.cssText = 'position:absolute;pointer-events:none;'
            this.el.innerHTML = `
              <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,calc(-100% + 6px));">
                <div style="
                  display:flex;align-items:center;
                  background:white;border-radius:20px;
                  padding:3px;
                  box-shadow:0 2px 10px rgba(0,0,0,0.22);
                ">
                  <div style="display:flex;align-items:center;">${avatarsHtml}</div>
                  ${extraHtml}
                </div>
                <div style="width:1.5px;height:6px;background:rgba(59,130,246,0.45);margin-top:1px;"></div>
                <div style="
                  width:13px;height:13px;border-radius:50%;
                  background:#3B82F6;border:2.5px solid white;
                  box-shadow:0 0 0 4px rgba(59,130,246,0.18),0 1px 4px rgba(0,0,0,0.22);
                "></div>
              </div>
            `
            this.getPanes()!.overlayLayer.appendChild(this.el)
          }

          draw() {
            if (!this.el) return
            const pt = this.getProjection().fromLatLngToDivPixel(latlng)
            if (!pt) return
            this.el.style.left = `${pt.x}px`
            this.el.style.top  = `${pt.y}px`
          }

          onRemove() {
            this.el?.parentNode?.removeChild(this.el)
            this.el = null
          }
        }

        const overlay = new AvatarLocOverlay()
        overlay.setMap(mapRef.current!)
        myLocOverlay.current = overlay
      },
      () => {}
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* 범례 */}
      {dayGroups?.length && !activeDayId ? (
        /* 전체 일정 모드 — Day별 색상 범례 */
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 flex-wrap max-w-[calc(100%-24px)]">
          {dayGroups.map(g => (
            <span key={g.dayId} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
              {g.label}
            </span>
          ))}
        </div>
      ) : (
        /* 단일 Day 모드 또는 기본 — 아침/점심/저녁/미정 범례 */
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-sm border border-gray-100 flex items-center gap-1.5 max-w-[calc(50%-16px)]">
          {Object.entries(SLOT_COLORS).map(([slot, color]) => (
            <span key={slot} className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-600 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              {slot}
            </span>
          ))}
        </div>
      )}

      {/* 현재 위치 버튼 */}
      <button
        onClick={handleLocate}
        className="absolute bottom-6 left-4 w-10 h-10 bg-white shadow-md border border-gray-200 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors z-10"
        title="현재 위치"
        aria-label="현재 위치"
      >
        <Navigation className="w-4 h-4 text-blue-600" />
      </button>
    </div>
  )
}
