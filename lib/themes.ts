export interface Theme {
  id: string
  name: string
  description: string
  preview: string[] // 3 hex colors for swatch
}

export const THEMES: Theme[] = [
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    description: 'Premium dark with gold accents — default executive view',
    preview: ['#0A0E1A', '#141B2D', '#C9A84C'],
  },
  {
    id: 'executive-light',
    name: 'Executive Light',
    description: 'Clean white with navy — boardroom presentation mode',
    preview: ['#F4F7FB', '#FFFFFF', '#0A3D7A'],
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg Terminal',
    description: 'Dark charcoal with orange — market data terminal feel',
    preview: ['#0D0D0D', '#1A1A1A', '#FF6600'],
  },
  {
    id: 'esg-green',
    name: 'ESG Green',
    description: 'Deep green palette — sustainability & ESG reporting',
    preview: ['#051209', '#0D2214', '#00E676'],
  },
  {
    id: 'risk-heat',
    name: 'Risk Heat',
    description: 'Red-toned dark — critical risk monitoring mode',
    preview: ['#110808', '#1F1111', '#FF4444'],
  },
  {
    id: 'strategy-gold',
    name: 'Strategy Gold',
    description: 'Deep black with gold — strategic planning sessions',
    preview: ['#0C0A00', '#1A1500', '#FFD600'],
  },
  {
    id: 'minimal-black',
    name: 'Minimal Black',
    description: 'Pure black with white — maximum contrast, minimal distraction',
    preview: ['#000000', '#111111', '#FFFFFF'],
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Deep navy with electric blue — corporate technology feel',
    preview: ['#020B18', '#071A2E', '#2D9EFF'],
  },
]

export const DEFAULT_THEME = 'executive-dark'
