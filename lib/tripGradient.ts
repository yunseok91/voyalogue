export const THEME_COLORS = [
  { id: 'blue',    from: '#3B82F6', to: '#1D4ED8', label: '블루' },
  { id: 'violet',  from: '#8B5CF6', to: '#6D28D9', label: '바이올렛' },
  { id: 'emerald', from: '#10B981', to: '#059669', label: '에메랄드' },
  { id: 'rose',    from: '#F43F5E', to: '#BE123C', label: '로즈' },
  { id: 'amber',   from: '#F59E0B', to: '#B45309', label: '앰버' },
  { id: 'sky',     from: '#0EA5E9', to: '#0369A1', label: '스카이' },
  { id: 'pink',    from: '#EC4899', to: '#BE185D', label: '핑크' },
  { id: 'slate',   from: '#475569', to: '#1E293B', label: '다크' },
]

/**
 * gradient 문자열 → CSS linear-gradient 문자열
 * 저장 형식: "#from,#to"  (신규)
 * 레거시 형식: Tailwind class "from-blue-500 to-blue-700" 등
 */
export function gradientStyle(g: string | undefined): string {
  if (!g) return 'linear-gradient(135deg, #3B82F6, #1D4ED8)'

  // 신규 형식: "#3B82F6,#1D4ED8"
  if (g.includes(',') && g.includes('#')) {
    const [from, to] = g.split(',')
    return `linear-gradient(135deg, ${from.trim()}, ${to.trim()})`
  }

  // 레거시 Tailwind 형식 → 근사 매핑
  const legacy: Record<string, [string, string]> = {
    'from-blue-500':    ['#3B82F6', '#1D4ED8'],
    'from-violet-500':  ['#8B5CF6', '#6D28D9'],
    'from-emerald-500': ['#10B981', '#059669'],
    'from-rose-500':    ['#F43F5E', '#BE123C'],
    'from-amber-500':   ['#F59E0B', '#B45309'],
    'from-sky-500':     ['#0EA5E9', '#0369A1'],
    'from-pink-500':    ['#EC4899', '#BE185D'],
    'from-slate-500':   ['#475569', '#1E293B'],
  }
  const key = g.split(' ')[0]
  const pair = legacy[key] ?? ['#3B82F6', '#1D4ED8']
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`
}

/* ── Luminance 기반 텍스트 색상 결정 ── */
function hexToLinear(hex: string): [number, number, number] | null {
  const c = hex.replace('#', '')
  if (c.length !== 6) return null
  const toLinear = (v: number) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return [
    toLinear(parseInt(c.slice(0, 2), 16)),
    toLinear(parseInt(c.slice(2, 4), 16)),
    toLinear(parseInt(c.slice(4, 6), 16)),
  ]
}

function relativeLuminance(rgb: [number, number, number]): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

/**
 * gradient 문자열을 받아 텍스트 색상 방향 반환.
 * 'white' = 배경이 어두워 흰 글씨 적합
 * 'dark'  = 배경이 밝아 어두운 글씨 적합
 */
export function gradientTextColor(g: string | undefined): 'white' | 'dark' {
  const { from, to } = parseGradientHex(g)
  const fromRgb = hexToLinear(from)
  const toRgb   = hexToLinear(to)
  if (!fromRgb || !toRgb) return 'white'
  const avgLum = (relativeLuminance(fromRgb) + relativeLuminance(toRgb)) / 2
  return avgLum > 0.179 ? 'dark' : 'white'
}

/** gradient 문자열 → { from, to } hex 파싱 */
export function parseGradientHex(g: string | undefined): { from: string; to: string } {
  if (!g) return { from: '#3B82F6', to: '#1D4ED8' }
  if (g.includes(',') && g.includes('#')) {
    const [from, to] = g.split(',')
    return { from: from.trim(), to: to.trim() }
  }
  const css = gradientStyle(g)
  const m = css.match(/#[0-9A-Fa-f]{6}/g)
  return { from: m?.[0] ?? '#3B82F6', to: m?.[1] ?? '#1D4ED8' }
}
