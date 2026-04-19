'use client'

import React from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

interface AIInsightBoxProps {
  insight: string
  confidence?: number
  source?: string
  className?: string
  compact?: boolean
}

export function AIInsightBox({
  insight,
  confidence,
  source = 'AI Risk Engine',
  className,
  compact = false,
}: AIInsightBoxProps) {
  const confidencePct = confidence ? Math.round(confidence * 100) : null

  return (
    <div
      style={{
        backgroundColor: 'rgba(var(--accent-primary-rgb, 201, 168, 76), 0.06)',
        border: '1px solid var(--border-accent)',
        borderLeft: '3px solid var(--accent-primary)',
      }}
      className={clsx('rounded-lg', compact ? 'p-3' : 'p-4', className)}
    >
      <div className="flex items-start gap-3">
        <div
          style={{
            backgroundColor: 'var(--accent-glow)',
            border: '1px solid var(--border-accent)',
          }}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        >
          <Bot
            style={{ color: 'var(--accent-primary)' }}
            size={compact ? 14 : 16}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="ai-badge"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: '#000',
              }}
            >
              AI Generated
            </span>
            {confidencePct !== null && (
              <span
                style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
                className="font-medium"
              >
                {confidencePct}% confidence
              </span>
            )}
          </div>

          <p
            style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}
            className={clsx('leading-relaxed', compact ? 'text-xs' : 'text-sm')}
          >
            {insight}
          </p>

          {confidencePct !== null && (
            <div className="mt-3">
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  height: '3px',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${confidencePct}%`,
                    backgroundColor: 'var(--accent-primary)',
                    height: '100%',
                    borderRadius: '2px',
                    transition: 'width 1s ease',
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 mt-2">
            <Sparkles size={10} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              {source} · Aldar Risk &amp; Control Operating System
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
