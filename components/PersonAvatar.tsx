'use client'

import { useState, useEffect } from 'react'

export const CLAY = [
  { base: '#E2E8F0', hi: '#FFFFFF', sh: '#64748B' }, // 0: white/gray
  { base: '#E8636A', hi: '#FFB3B7', sh: '#A82E35' }, // 1: red
  { base: '#F0944A', hi: '#FFC88A', sh: '#B55E10' }, // 2: orange
  { base: '#52C87A', hi: '#96EBB5', sh: '#257A48' }, // 3: green
  { base: '#4A90E8', hi: '#8BBDF8', sh: '#1D5CB0' }, // 4: blue
  { base: '#9B6FE8', hi: '#C9AFF8', sh: '#6230B5' }, // 5: violet
  { base: '#E86BAD', hi: '#FFB0D5', sh: '#A83075' }, // 6: pink
  { base: '#D4B44A', hi: '#F4D888', sh: '#8E7010' }, // 7: amber
  { base: '#6A9AB5', hi: '#A5C3D5', sh: '#385A72' }, // 8: slate
]

function getColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % (CLAY.length - 1)
  return CLAY[Math.abs(h) + 1]
}

interface Props {
  name:        string
  photoURL?:   string
  size?:       number
  showName?:   boolean
  className?:  string
  colorIndex?: number
  hexColor?:   string
  stacked?:    boolean
  ringColor?:  string
}

export function PersonAvatar({ name, photoURL, size = 40, showName = false, className = '', colorIndex, hexColor, stacked, ringColor }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [photoURL])

  const clay    = colorIndex !== undefined ? CLAY[colorIndex % CLAY.length] : getColor(name)
  const base    = hexColor ?? clay.base
  const sh      = hexColor ? '#64748B' : clay.sh
  const isWhite = colorIndex === 0 && !hexColor

  let shadow: string
  if (photoURL && !imgFailed) {
    shadow = `0 2px 6px rgba(0,0,0,0.12)`
  } else if (isWhite) {
    shadow = `0 2px 8px rgba(71,85,105,0.22), inset 0 0 0 1.5px #8FA8C0`
  } else {
    shadow = `0 2px 5px ${sh}55`
  }

  if (ringColor) {
    shadow = `0 0 0 2.5px white, 0 0 0 5px ${ringColor}, ${shadow}`
  }

  const showPhoto = !!photoURL && !imgFailed

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className="relative flex-shrink-0"
        style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', boxShadow: shadow }}
      >
        {showPhoto ? (
          <img
            src={photoURL!}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <svg viewBox="0 0 44 44" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 7 44 Q 7 30 14.5 27 Q 18 25.5 22 25.5 Q 26 25.5 29.5 27 Q 37 30 37 44 Z"
              fill={base}
            />
            <circle cx="22" cy="14" r="11" fill={base} />
          </svg>
        )}
      </div>

      {showName && (
        <span className="text-[10px] font-semibold text-gray-600 leading-tight max-w-[56px] truncate text-center">
          {name}
        </span>
      )}
    </div>
  )
}
