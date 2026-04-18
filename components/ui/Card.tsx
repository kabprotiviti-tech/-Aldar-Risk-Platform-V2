'use client'

import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  accent?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export function Card({ children, className, glow, accent, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: accent ? 'var(--border-accent)' : 'var(--border-color)',
        boxShadow: glow ? '0 0 24px var(--accent-glow)' : undefined,
        ...style,
      }}
      className={clsx(
        'rounded-xl border transition-all duration-200',
        onClick && 'cursor-pointer hover:scale-[1.01]',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      style={{ borderBottomColor: 'var(--border-color)' }}
      className={clsx('flex items-center justify-between px-5 py-4 border-b', className)}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3
      style={{ color: 'var(--text-secondary)' }}
      className={clsx('text-xs font-semibold uppercase tracking-widest', className)}
    >
      {children}
    </h3>
  )
}

export function CardBody({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return <div className={clsx('p-5', className)} style={style}>{children}</div>
}
