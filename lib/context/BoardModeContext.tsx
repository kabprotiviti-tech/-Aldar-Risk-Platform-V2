'use client'

/**
 * BoardModeContext
 * ----------------
 * Global toggle for simplified "Board Mode" — hides detail-heavy panels
 * and keeps only the top-level exposure, decision, and 3 priorities.
 *
 * Persists in localStorage so the setting survives navigation.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface BoardModeCtx {
  boardMode: boolean
  toggle: () => void
  setBoardMode: (v: boolean) => void
}

const Ctx = createContext<BoardModeCtx | null>(null)
const KEY = 'aldar.boardMode'

export function BoardModeProvider({ children }: { children: React.ReactNode }) {
  const [boardMode, setBoardModeState] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY)
      if (v === '1') setBoardModeState(true)
    } catch {}
  }, [])

  const setBoardMode = useCallback((v: boolean) => {
    setBoardModeState(v)
    try {
      localStorage.setItem(KEY, v ? '1' : '0')
    } catch {}
  }, [])

  const toggle = useCallback(() => setBoardMode(!boardMode), [boardMode, setBoardMode])

  return <Ctx.Provider value={{ boardMode, toggle, setBoardMode }}>{children}</Ctx.Provider>
}

export function useBoardMode() {
  const c = useContext(Ctx)
  if (!c) return { boardMode: false, toggle: () => {}, setBoardMode: () => {} }
  return c
}
