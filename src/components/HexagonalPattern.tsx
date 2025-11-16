'use client'

import React from 'react'

interface HexagonalPatternProps {
  className?: string
  opacity?: number
  strokeColor?: string
  iconColor?: string
  showIcons?: boolean
}

/**
 * Componente de patrón hexagonal decorativo para fondos
 * Sigue la identidad visual de TGH
 */
export default function HexagonalPattern({
  className = '',
  opacity = 0.25,
  strokeColor = '#214F5F',
  iconColor = '#E17739',
  showIcons = false,
}: HexagonalPatternProps) {
  // Función para convertir hex a RGB para opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Dimensiones del patrón
  const hexSize = 60
  const hexWidth = hexSize * 2
  const hexHeight = hexSize * Math.sqrt(3)

  // Generar hexágonos
  const hexagons = []
  const rows = 12
  const cols = 12

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexWidth * 0.75
      const y = row * hexHeight + (col % 2) * hexHeight * 0.5
      
      // Determinar si este hexágono tiene icono
      const hasIcon = showIcons && (row + col) % 5 === 0
      
      hexagons.push({ x, y, hasIcon })
    }
  }

  // Función para generar path de hexágono
  const getHexagonPath = (cx: number, cy: number, size: number) => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const px = cx + size * Math.cos(angle)
      const py = cy + size * Math.sin(angle)
      points.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`)
    }
    return points.join(' ') + ' Z'
  }

  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="hexagonal-pattern"
          x="0"
          y="0"
          width={hexWidth * 0.75}
          height={hexHeight}
          patternUnits="userSpaceOnUse"
        >
          {hexagons.map((hex, index) => (
            <g key={index}>
              <path
                d={getHexagonPath(hex.x, hex.y, hexSize * 0.4)}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1"
                opacity={opacity}
              />
              {hex.hasIcon && (
                <circle
                  cx={hex.x}
                  cy={hex.y}
                  r="4"
                  fill={iconColor}
                  opacity={opacity * 1.5}
                />
              )}
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexagonal-pattern)" />
    </svg>
  )
}

/**
 * Versión simplificada usando CSS para mejor rendimiento
 */
export function HexagonalPatternCSS({
  className = '',
}: {
  className?: string
}) {
  // SVG codificado para el patrón hexagonal
  const patternSVG = encodeURIComponent(`
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fill-rule="evenodd">
        <g fill="#214F5F" fill-opacity="0.2">
          <path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/>
          <path d="M30 50c-8-8-16-8-24 0v10h24V50zm0-20c-8-8-16-8-24 0v10h24V30zm24 0c-8-8-16-8-24 0v10h24V30zm-24 20c-8-8-16-8-24 0v10h24V50zm24 0c-8-8-16-8-24 0v10h24V50z"/>
        </g>
      </g>
    </svg>
  `)

  return (
    <div
      className={`absolute inset-0 opacity-20 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,${patternSVG}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '60px 60px',
      }}
    />
  )
}

