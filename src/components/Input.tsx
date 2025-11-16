'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * Componente de input con estilos corporativos de TGH
 */
export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="error-message">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-tgh-teal mt-1">{helperText}</p>
      )}
    </div>
  )
}

/**
 * Componente de textarea con estilos corporativos de TGH
 */
export function Textarea({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  helperText?: string
}) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={textareaId} className="label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`input-field min-h-[100px] resize-y ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="error-message">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-tgh-teal mt-1">{helperText}</p>
      )}
    </div>
  )
}

