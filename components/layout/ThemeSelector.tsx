'use client'

import React, { useEffect, useRef } from 'react'
import { X, Check } from 'lucide-react'
import { THEMES } from '@/lib/themes'
import { useTheme } from '@/lib/context/ThemeContext'

interface ThemeSelectorProps {
  onClose: () => void
}

export function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { currentTheme, setTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        ref={ref}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          borderRadius: '16px',
          padding: '28px',
          width: '540px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
        className="animate-slide-up"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}
            >
              Display Theme
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
              Select interface theme for your executive preference
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              padding: '8px',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {THEMES.map((theme) => {
            const isActive = currentTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id)
                  onClose()
                }}
                style={{
                  textAlign: 'left',
                  padding: '14px',
                  borderRadius: '12px',
                  border: isActive
                    ? '2px solid var(--accent-primary)'
                    : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Color swatches */}
                <div className="flex gap-1 mb-3">
                  {theme.preview.map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === 0 ? '32px' : '16px',
                        height: '28px',
                        borderRadius: '4px',
                        backgroundColor: color,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>

                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    marginBottom: '2px',
                  }}
                >
                  {theme.name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', lineHeight: 1.4 }}>
                  {theme.description}
                </div>

                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={11} style={{ color: 'var(--on-accent)' }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
