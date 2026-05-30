import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Voyalogue — 스마트 여행 플래너'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1D4ED8 0%, #1e3a8a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 배경 글로우 */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: 250,
          background: 'rgba(96,165,250,0.15)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 400,
          height: 400,
          borderRadius: 200,
          background: 'rgba(96,165,250,0.10)',
          display: 'flex',
        }} />

        {/* 로고 원 */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          fontSize: 48,
        }}>
          ✈️
        </div>

        {/* 브랜드명 */}
        <div style={{
          color: 'white',
          fontSize: 80,
          fontWeight: 800,
          letterSpacing: -3,
          lineHeight: 1,
        }}>
          Voyalogue
        </div>

        {/* 태그라인 */}
        <div style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 36,
          marginTop: 20,
          fontWeight: 500,
        }}>
          스마트 여행 플래너
        </div>

        {/* 설명 */}
        <div style={{
          display: 'flex',
          gap: 24,
          marginTop: 32,
        }}>
          {['✈️ 항공·숙소', '🗓️ 일별 일정', '💱 환율 계산', '👥 친구 공유'].map(tag => (
            <div key={tag} style={{
              background: 'rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 22,
              padding: '10px 20px',
              borderRadius: 50,
              display: 'flex',
            }}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
