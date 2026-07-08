'use client'

/**
 * StealthToggle — client-name switch (ABC ↔ Aldar)
 * ------------------------------------------------
 * Small dot in the bottom-right corner. The product ships showing the neutral
 * demo client "ABC Holdings"; clicking the dot reveals the REAL client name
 * "Aldar" live everywhere on screen (and back again). Persisted in
 * localStorage (`client-stealth-mode`) so the choice carries across pages —
 * including from the login screen — and survives reloads.
 *
 * Implementation: one MutationObserver walks text nodes + a handful of common
 * attributes (title, placeholder, aria-label, alt) and rewrites the brand
 * strings in place. Toggling back to ABC reloads so the DOM rebuilds cleanly.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'client-stealth-mode'

// Client-name switch. The product ships with the neutral demo client "ABC
// Holdings". Toggling ON reveals the REAL client name "Aldar" live across the
// whole DOM. Ordered longest-first so "ABC Holdings" is rewritten before the
// bare "ABC" token (otherwise "ABC Holdings" → "Aldar Holdings").
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/ABC Holdings/g, 'Aldar Properties'],
  [/ABC HOLDINGS/g, 'ALDAR PROPERTIES'],
  [/\bABC\b/g, 'Aldar'],
]

// Reverse map (Aldar → ABC). Toggling OFF also triggers a page reload so the
// DOM is rebuilt cleanly from the React tree; this map is the best-effort
// in-place restore before that reload lands.
const REVERSE: Array<[RegExp, string]> = [
  [/Aldar Properties/g, 'ABC Holdings'],
  [/ALDAR PROPERTIES/g, 'ABC HOLDINGS'],
  [/\bAldar\b/g, 'ABC'],
]

// Attributes the walker scans. `href` is included so source links in
// the provenance click-through don't navigate to the real client URL
// while in anonymisation mode.
const ATTRS_TO_SCAN = ['title', 'placeholder', 'aria-label', 'alt', 'value', 'href']

function applyReplacements(text: string, rules: Array<[RegExp, string]>): string {
  let out = text
  for (const [pattern, repl] of rules) out = out.replace(pattern, repl)
  return out
}

function walkAndReplace(root: Node, rules: Array<[RegExp, string]>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let node: Node | null = walker.currentNode
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.nodeValue || ''
      const next = applyReplacements(txt, rules)
      if (next !== txt) node.nodeValue = next
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      // Skip our own toggle + script/style
      const tag = el.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || el.getAttribute('data-stealth-ignore') === 'true') {
        node = walker.nextNode()
        continue
      }
      for (const attr of ATTRS_TO_SCAN) {
        const v = el.getAttribute(attr)
        if (v) {
          const next = applyReplacements(v, rules)
          if (next !== v) el.setAttribute(attr, next)
        }
      }
    }
    node = walker.nextNode()
  }
}

export function StealthToggle() {
  const [stealth, setStealth] = useState(false)
  const [mounted, setMounted] = useState(false)
  const observerRef = useRef<MutationObserver | null>(null)

  // Load initial state + apply immediately if on
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY) === 'true'
      if (saved) {
        setStealth(true)
      }
    } catch {}
  }, [])

  // Maintain DOM replacements + observer based on stealth state
  useEffect(() => {
    if (!mounted) return

    // Tear down any existing observer
    observerRef.current?.disconnect()
    observerRef.current = null

    if (stealth) {
      // Initial pass
      walkAndReplace(document.body, REPLACEMENTS)
      // Title
      document.title = applyReplacements(document.title, REPLACEMENTS)

      // Watch for new content
      const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
            const txt = m.target.nodeValue || ''
            const next = applyReplacements(txt, REPLACEMENTS)
            if (next !== txt) m.target.nodeValue = next
          } else if (m.type === 'childList') {
            m.addedNodes.forEach((n) => {
              if (n.nodeType === Node.TEXT_NODE) {
                const txt = n.nodeValue || ''
                const next = applyReplacements(txt, REPLACEMENTS)
                if (next !== txt) n.nodeValue = next
              } else if (n.nodeType === Node.ELEMENT_NODE) {
                walkAndReplace(n, REPLACEMENTS)
              }
            })
          } else if (m.type === 'attributes' && m.attributeName && ATTRS_TO_SCAN.includes(m.attributeName)) {
            const el = m.target as Element
            const v = el.getAttribute(m.attributeName)
            if (v) {
              const next = applyReplacements(v, REPLACEMENTS)
              if (next !== v) el.setAttribute(m.attributeName, next)
            }
          }
        }
      })
      obs.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS_TO_SCAN,
      })
      observerRef.current = obs
    } else {
      // Restore original names on the fly (best-effort)
      walkAndReplace(document.body, REVERSE)
      document.title = applyReplacements(document.title, REVERSE)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [stealth, mounted])

  const toggle = useCallback(() => {
    setStealth((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      // Toggling stealth OFF cannot losslessly restore redacted source
      // URLs (we destroy the original path on the way in). Reload the
      // page so href attributes come back from the React render tree.
      // Toggling ON: keep the in-place DOM mutation flow (faster, no flash).
      if (prev === true) {
        // Use a microtask so localStorage writes flush before navigation.
        Promise.resolve().then(() => window.location.reload())
      }
      return next
    })
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + Shift + H → toggle
  useEffect(() => {
    if (!mounted) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mounted, toggle])

  const [hover, setHover] = useState(false)

  if (!mounted) return null

  return (
    <button
      data-stealth-ignore="true"
      onClick={toggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={stealth ? 'Switch client name to ABC (demo)' : 'Switch client name to Aldar (real)'}
      style={{
        // Large invisible hit area so the cursor finds it easily,
        // but the visible dot is drawn via ::before-style inline element.
        position: 'fixed',
        right: 0,
        bottom: 0,
        width: 48,
        height: 48,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        outline: 'none',
      }}
    >
      {/* The actual visible dot */}
      <span
        data-stealth-ignore="true"
        style={{
          display: 'block',
          marginRight: 8,
          marginBottom: 8,
          width: hover ? 16 : 11,
          height: hover ? 16 : 11,
          borderRadius: '50%',
          // Visible on BOTH light and dark themes: amber when showing the real
          // client (Aldar), neutral grey when showing the demo name (ABC).
          background: stealth
            ? hover
              ? 'rgba(11, 110, 91, 0.95)'
              : 'rgba(11, 110, 91, 0.7)'
            : hover
            ? 'rgba(120, 120, 128, 0.85)'
            : 'rgba(120, 120, 128, 0.45)',
          boxShadow: hover
            ? stealth
              ? '0 0 12px rgba(11, 110, 91, 0.6)'
              : '0 0 10px rgba(120, 120, 128, 0.5)'
            : 'none',
          transition: 'all 180ms ease',
        }}
      />
      {hover && (
        <span
          data-stealth-ignore="true"
          style={{
            position: 'absolute',
            right: 28,
            bottom: 10,
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(20,20,22,0.92)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            letterSpacing: 0.3,
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {stealth ? 'Client: Aldar — click to show ABC' : 'Client: ABC — click to show Aldar'}
          <span style={{ opacity: 0.5, marginLeft: 8 }}>⇧⌘H</span>
        </span>
      )}
    </button>
  )
}
