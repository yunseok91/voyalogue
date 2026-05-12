'use client'

import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { Navigation } from 'lucide-react'

export type MapItem = {
  id:          string
  name:        string
  lat:         number
  lng:         number
  timeSlot:    string
  markerType?: 'special'
}

export type AvatarMember = {
  name:      string
  baseColor: string
  photoURL?: string
}

const SLOT_COLORS: Record<string, string> = {
  아침: '#F59E0B',
  점심: '#10B981',
  저녁: '#6366F1',
  미정: '#94A3B8',
}

const SPECIAL_COLORS: Record<string, string> = {
  '비행기': '#0EA5E9',
  '숙소':   '#8B5CF6',
}

interface Props {
  city:          string
  items:         MapItem[]
  focusId?:      string
  focusTrigger?: number
  members?:      AvatarMember[]
  previewPlace?: { name: string; lat: number; lng: number }
  onDblClick?:   (lat: number, lng: number) => void
}

type MarkerEntry = {
  marker: google.maps.Marker
  iw:     google.maps.InfoWindow
}

export function TripMap({ city, items, focusId, focusTrigger, members, previewPlace, onDblClick }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null)
  const mapRef            = useRef<google.maps.Map | null>(null)
  const markerMapRef      = useRef<Map<string, MarkerEntry>>(new Map())
  const polylineRef       = useRef<google.maps.Polyline | null>(null)
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

  /* ── 지도 최초 초기화 ── */
  useEffect(() => {
    if (initDoneRef.current) return
    initDoneRef.current = true

    loadGoogleMaps().then(() => {
      if (!containerRef.current) return

      const style = document.createElement('style')
      style.innerHTML = `
        .gm-style-iw-c { padding: 0 !important; border-radius: 12px !important; box-shadow: 0 2px 12px rgba(0,0,0,0.12) !important; }
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
        styles: [
          { featureType: 'poi',     elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      })
      mapRef.current = map
      syncMarkersRef.current()   // 마커 즉시 렌더 (items effect 실행 전 map이 준비될 수 있음)

      map.addListener('click', () => {
        openIwRef.current?.close()
        openIwRef.current = null
      })

      map.addListener('dblclick', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return
        onDblClickRef.current?.(event.latLng.lat(), event.latLng.lng())
      })

      new google.maps.Geocoder().geocode({ address: city }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          map.setCenter(results[0].geometry.location)
        }
      })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── 마커 & 경로선 업데이트 ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const render = () => {
      if (!mapRef.current) return

      markerMapRef.current.forEach(({ marker }) => marker.setMap(null))
      markerMapRef.current.clear()
      polylineRef.current?.setMap(null)
      polylineRef.current = null
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
          const emoji = item.timeSlot === '비행기' ? '✈' : '⌂'
          marker = new google.maps.Marker({
            position:  { lat: item.lat, lng: item.lng },
            map:       mapRef.current!,
            icon: {
              path:         google.maps.SymbolPath.CIRCLE,
              fillColor:    color,
              fillOpacity:  1,
              strokeColor:  'white',
              strokeWeight: 2.5,
              scale:        12,
            },
            title:     item.name,
            zIndex:    idx + 5,
            clickable: true,
          })
          const iw = new google.maps.InfoWindow({
            content: `<div style="display:flex;align-items:center;gap:8px;padding:9px 14px 9px 10px;">
              <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:${color};
                color:#fff;text-align:center;line-height:22px;font-size:13px;">${emoji}</span>
              <span style="font-size:13px;font-weight:600;color:#111827;white-space:nowrap;letter-spacing:-0.01em;">${item.name}</span>
            </div>`,
            pixelOffset: new google.maps.Size(0, -4),
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
          marker = new google.maps.Marker({
            position:  { lat: item.lat, lng: item.lng },
            map:       mapRef.current!,
            label:     { text: String(num), color: 'white', fontWeight: 'bold', fontSize: '11px' },
            icon: {
              path:         google.maps.SymbolPath.CIRCLE,
              fillColor:    color,
              fillOpacity:  1,
              strokeColor:  'white',
              strokeWeight: 2.5,
              scale:        14,
            },
            title:     item.name,
            zIndex:    idx + 10,
            clickable: true,
          })
          const iw = new google.maps.InfoWindow({
            content: `<div style="display:flex;align-items:center;gap:8px;padding:9px 14px 9px 10px;">
              <span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:${color};
                color:#fff;text-align:center;line-height:20px;font-size:11px;font-weight:700;">${num}</span>
              <span style="font-size:13px;font-weight:600;color:#111827;white-space:nowrap;letter-spacing:-0.01em;">${item.name}</span>
            </div>`,
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
      }

      if (regularPinned.length === 1) {
        mapRef.current.panTo({ lat: regularPinned[0].lat, lng: regularPinned[0].lng })
      } else if (regularPinned.length > 1) {
        const bounds = new google.maps.LatLngBounds()
        regularPinned.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }))
        mapRef.current.fitBounds(bounds, 60)
      } else if (pinned.length > 0) {
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
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-3">
        {Object.entries(SLOT_COLORS).map(([slot, color]) => (
          <span key={slot} className="flex items-center gap-1 text-[11px] font-semibold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            {slot}
          </span>
        ))}
      </div>

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
