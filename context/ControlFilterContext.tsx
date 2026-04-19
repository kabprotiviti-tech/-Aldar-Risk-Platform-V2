'use client'

import React, { createContext, useContext, useState } from 'react'

export type FilterType = 'all' | 'failed' | 'partial' | 'effective' | 'overdue'

interface ControlFilterContextValue {
  filter: FilterType
  setFilter: (f: FilterType) => void
}

export const ControlFilterContext = createContext<ControlFilterContextValue>({
  filter: 'all',
  setFilter: () => {},
})

export function ControlFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<FilterType>('all')
  return (
    <ControlFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </ControlFilterContext.Provider>
  )
}

export function useControlFilter() {
  return useContext(ControlFilterContext)
}
