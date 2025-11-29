'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'dark'
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

/**
 * Componente de card con estilos corporativos de TGH
 */
export default function Card({
  children,
  variant = 'default',
  className = '',
  padding = 'md',
}: CardProps) {
  const baseClasses = 'rounded-lg shadow-lg border-2'
  
  const variantClasses = {
    default: 'border-tgh-teal text-tgh-navy',
    dark: 'bg-tgh-teal-dark border-tgh-teal text-tgh-gray',
  }
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`

  return <div className={classes}>{children}</div>
}

/**
 * Header de card con título y acción opcional
 */
export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}) {
  const isCentered = className.includes('text-center')
  
  return (
    <div className={`flex items-start ${isCentered ? 'justify-center' : 'justify-between'} mb-4 ${className}`}>
      <div className={isCentered ? 'w-full text-center' : ''}>
        {title && <h3 className="text-xl font-bold text-tgh-orange">{title}</h3>}
        {subtitle && <p className="text-sm text-tgh-teal mt-1">{subtitle}</p>}
      </div>
      {action && !isCentered && <div>{action}</div>}
    </div>
  )
}

/**
 * Body de card
 */
export function CardBody({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

/**
 * Footer de card
 */
export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-tgh-teal/30 ${className}`}>
      {children}
    </div>
  )
}


