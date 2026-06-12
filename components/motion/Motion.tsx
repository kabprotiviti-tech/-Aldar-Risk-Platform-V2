'use client'

/**
 * Motion primitives — a small, reusable, performant animation layer.
 *
 * Design rules (learned the hard way from the login-freeze incident):
 *  - transform + opacity ONLY (GPU-composited; never animate blur/filter/layout)
 *  - no infinite/heavy loops
 *  - every primitive honours prefers-reduced-motion (useReducedMotion)
 *  - springs are snappy and short so the tool feels fast, not floaty
 */

import React from 'react'
import {
  motion,
  useReducedMotion,
  useInView,
  animate,
  type Variants,
} from 'framer-motion'
import { usePathname } from 'next/navigation'

// ── Shared easing / timing ────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const // easeOutExpo-ish

export function useMotionVariants() {
  const reduce = useReducedMotion()
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  }
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: 0.02 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  }
  return { reduce, fadeUp, container, item }
}

// ── Page-level entrance: every route gets a subtle fade-up on mount ────────
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: EASE }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}

// ── Fade-up on mount (or on scroll-into-view) ──────────────────────────────
export function FadeInUp({
  children,
  delay = 0,
  whenVisible = false,
  style,
  className,
}: {
  children: React.ReactNode
  delay?: number
  whenVisible?: boolean
  style?: React.CSSProperties
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const animateState = whenVisible ? (inView ? 'show' : 'hidden') : 'show'
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={animateState}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE, delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

// ── Staggered list/grid reveal ─────────────────────────────────────────────
export function Stagger({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const { container } = useMotionVariants()
  return (
    <motion.div className={className} style={style} variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const { item } = useMotionVariants()
  return (
    <motion.div className={className} style={style} variants={item}>
      {children}
    </motion.div>
  )
}

// ── Card with entrance + a subtle hover lift ───────────────────────────────
export function MotionCard({
  children,
  style,
  className,
  onClick,
  hover = true,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
  hover?: boolean
}) {
  const { item, reduce } = useMotionVariants()
  return (
    <motion.div
      className={className}
      style={style}
      onClick={onClick}
      variants={item}
      whileHover={hover && !reduce ? { y: -3, boxShadow: '0 8px 22px rgba(0,0,0,0.10)' } : undefined}
      whileTap={onClick && !reduce ? { scale: 0.99 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 26 }}
    >
      {children}
    </motion.div>
  )
}

// ── Animated number count-up (for hero KPIs) ───────────────────────────────
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1.1,
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = React.useState(reduce ? value : 0)
  React.useEffect(() => {
    if (reduce) { setDisplay(value); return }
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value, duration, reduce])
  return <>{prefix}{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
}

// ── Tiny tap-scale wrapper for buttons/icons ───────────────────────────────
export function Tappable({ children, style, className, onClick, title }: { children: React.ReactNode; style?: React.CSSProperties; className?: string; onClick?: () => void; title?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.span className={className} style={{ display: 'inline-flex', ...style }} onClick={onClick} title={title} whileHover={reduce ? undefined : { scale: 1.05 }} whileTap={reduce ? undefined : { scale: 0.92 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      {children}
    </motion.span>
  )
}
