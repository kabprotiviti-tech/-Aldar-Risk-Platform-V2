export interface Theme {
  id: string
  name: string
  description: string
  preview: string[] // 3 hex colors for swatch
}

// Batch 2: one opinionated point of view — Executive Light (default) +
// Executive Dark. The novelty themes (Bloomberg, ESG Green, Risk Heat,
// Strategy Gold, Minimal Black, Corporate Blue) are retired from the
// selector; their CSS remains in globals.css but is no longer offered.
export const THEMES: Theme[] = [
  {
    id: 'executive-light',
    name: 'Executive Light',
    description: 'Warm paper, near-monochrome, Protiviti-red accent — boardroom default',
    preview: ['#FAFAF8', '#FFFFFF', '#E4002B'],
  },
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    description: 'Premium dark with Protiviti-red accent',
    preview: ['#0A0E1A', '#141B2D', '#E4002B'],
  },
]

export const DEFAULT_THEME = 'executive-light'
