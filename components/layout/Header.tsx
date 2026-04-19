'use client'

import React, { useState, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { ThemeSelector } from './ThemeSelector'
import { MarketWidget } from '@/components/MarketWidget'

function LiveBadge() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        borderRadius: '7px',
        backgroundColor: 'var(--accent-glow)',
        border: '1px solid var(--border-accent)',
        flexShrink: 0,
      }}
    >
      <span
        className="animate-pulse"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: 'var(--risk-low)',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          letterSpacing: '0.07em',
          whiteSpace: 'nowrap',
        }}
      >
        LIVE
      </span>
    </div>
  )
}

function ClockWidget() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-AE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Dubai',
        hour12: false,
      }) + ' GST'
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        padding: '5px 10px',
        borderRadius: '7px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {time}
    </div>
  )
}

function ConfidenceWidget() {
  return (
    <div
      title="AI model confidence level"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        borderRadius: '7px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-accent)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.03em',
          display: 'none',
        }}
        className="lg-inline"
      >
        AI
      </span>
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--accent-primary)',
        }}
      >
        87%
      </span>
      <span
        style={{
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
        className="hidden lg:inline"
      >
        Confidence
      </span>
    </div>
  )
}

export function Header() {
  const [showThemes, setShowThemes] = useState(false)

  return (
    <>
      <header
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            gap: '16px',
            minWidth: 0,
          }}
        >
          {/* LEFT — brand accent + vertical title block */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: '3px',
                height: '30px',
                borderRadius: '2px',
                background:
                  'linear-gradient(180deg, var(--accent-primary) 0%, var(--risk-low) 100%)',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1.2,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                Aldar Properties
              </span>
              <h1
                className="header-title"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.98rem',
                  fontWeight: 650,
                  letterSpacing: '-0.005em',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Risk &amp; Control Operating System
              </h1>
            </div>
          </div>

          {/* RIGHT — controls row, scrolls on mobile rather than wrapping */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              flexShrink: 1,
              minWidth: 0,
              /* hide scrollbar but allow scroll */
              scrollbarWidth: 'none',
            }}
          >
            {/* Hidden on mobile — shown tablet+ */}
            <div className="hidden sm:flex items-center" style={{ gap: '8px', flexShrink: 0 }}>
              <LiveBadge />
              <ClockWidget />
            </div>
            <div className="hidden md:flex items-center" style={{ gap: '8px', flexShrink: 0 }}>
              <MarketWidget />
              <ConfidenceWidget />
            </div>

            {/* Subtle divider between status cluster and theme */}
            <span
              aria-hidden
              className="hidden md:inline-block"
              style={{
                width: '1px',
                height: '20px',
                backgroundColor: 'var(--border-color)',
                opacity: 0.6,
                flexShrink: 0,
              }}
            />

            {/* Theme button */}
            <button
              onClick={() => setShowThemes(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '7px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-accent)',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 600,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <Palette size={13} />
              <span className="hidden sm:inline">Theme</span>
            </button>
          </div>
        </div>
      </header>

      {showThemes && <ThemeSelector onClose={() => setShowThemes(false)} />}
    </>
  )
}
