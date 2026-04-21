'use client'

/**
 * StealthToggle
 * -------------
 * Tiny, nearly-invisible dot in the bottom-right corner. Clicking it toggles
 * "client anonymisation mode" — every occurrence of "Aldar" / "Aldar Properties"
 * in the DOM is swapped live for a neutral alias ("ABC" / "ABC Holdings").
 *
 * Implementation: one MutationObserver walks text nodes + a handful of common
 * attributes (title, placeholder, aria-label, alt). State persists in
 * localStorage under `client-stealth-mode`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'client-stealth-mode'

// Ordered longest-first so "Aldar Properties" matches before "Aldar".
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/Aldar Properties PJSC/g, 'ABC Holdings PJSC'],
  [/Aldar Properties/g, 'ABC Holdings'],
  [/ALDAR PROPERTIES/g, 'ABC HOLDINGS'],
  [/ALDAR/g, 'ABC'],
  [/Aldar/g, 'ABC'],
  [/aldar/g, 'abc'],
]

const REVERSE: Array<[RegExp, string]> = [
  [/ABC Holdings PJSC/g, 'Aldar Properties PJSC'],
  [/ABC Holdings/g, 'Aldar Properties'],
  [/ABC HOLDINGS/g, 'ALDAR PROPERTIES'],
  [/\bABC\b/g, 'Aldar'],
  [/\babc\b/g, 'aldar'],
]

const ATTRS_TO_SCAN = ['title', 'placeholder', 'aria-label', 'alt', 'value']

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
      return next
    })
  }, [])

  if (!mounted) return null

  return (
    <button
      data-stealth-ignore="true"
      onClick={toggle}
      aria-label={stealth ? 'Disable anonymisation' : 'Enable anonymisation'}
      title=""
      style={{
        position: 'fixed',
        right: 6,
        bottom: 6,
        width: 8,
        height: 8,
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        background: stealth
          ? 'rgba(120, 200, 140, 0.35)'
          : 'rgba(255, 255, 255, 0.06)',
        cursor: 'pointer',
        zIndex: 2147483647,
        transition: 'background 200ms ease, transform 200ms ease',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.6)'
        e.currentTarget.style.background = stealth
          ? 'rgba(120, 200, 140, 0.7)'
          : 'rgba(255, 255, 255, 0.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = stealth
          ? 'rgba(120, 200, 140, 0.35)'
          : 'rgba(255, 255, 255, 0.06)'
      }}
    />
  )
}
