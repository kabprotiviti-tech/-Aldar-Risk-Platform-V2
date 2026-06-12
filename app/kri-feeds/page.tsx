'use client'

/**
 * KRI Feeds — Phase 4 (4.3)
 * KRI values auto-sourced from external systems (illustrative feed). Proves
 * the capability: no manual entry, source-attributed, sync on demand.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Database, Wifi } from 'lucide-react'
import { KRI_FEEDS, feedStatus, FEED_STATUS_META } from '@/lib/data/kri-feeds'
import { isFlagOn } from '@/lib/featureFlags'
import { PageHeader } from '@/components/ui/PageHeader'

interface FeedVal { value: number; fetchedAt: string }

export default function KriFeedsPage() {
  const [vals, setVals] = useState<Record<string, FeedVal>>(() =>
    Object.fromEntries(KRI_FEEDS.map((f) => [f.kriId, { value: f.baseValue, fetchedAt: '' }])),
  )
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string>('')

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/kri-feed', { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data?.values)) {
        const next: Record<string, FeedVal> = {}
        for (const v of data.values) next[v.kriId] = { value: v.value, fetchedAt: v.fetchedAt }
        setVals((prev) => ({ ...prev, ...next }))
        setLastSync(new Date().toLocaleTimeString())
      }
    } catch {
      // keep last values
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => { sync() }, [sync])

  if (!isFlagOn('erm_integrations')) return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>This module is not enabled.</div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 18px 60px' }}>
      <PageHeader
        eyebrow={<><Wifi size={11} /> Illustrative feed · connectors deferred</>}
        title="KRI Live Feeds"
        subtitle={<>These KRIs are populated automatically from source systems instead of manual entry. {lastSync && <>Last synced <strong>{lastSync}</strong>.</>}</>}
        actions={
          <button onClick={sync} disabled={syncing} className="ui-btn-primary" style={{ cursor: syncing ? 'wait' : 'pointer' }}>
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} /> {syncing ? 'Syncing…' : 'Sync all'}
          </button>
        }
      />

      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              {['KRI', 'Source system', 'Current value', 'Amber / Red', 'Status', 'Fetched'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '9px 12px', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KRI_FEEDS.map((f) => {
              const v = vals[f.kriId]
              const st = FEED_STATUS_META[feedStatus(f, v.value)]
              return (
                <tr key={f.kriId}>
                  <td style={{ fontSize: 12, color: 'var(--text-primary)', padding: '9px 12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-tertiary)' }}>{f.kriId}</span>
                  </td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)', padding: '9px 12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Database size={11} style={{ color: 'var(--accent-primary)' }} /> {f.sourceSystem}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{f.sourceField}</div>
                  </td>
                  <td style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', padding: '9px 12px', borderBottom: '1px solid var(--border-color)', fontVariantNumeric: 'tabular-nums' }}>{v.value}<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', marginLeft: 3 }}>{f.unit}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '9px 12px', borderBottom: '1px solid var(--border-color)' }}>{f.amberThreshold} / {f.redThreshold}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: st.color, background: `${st.color}1a`, border: `1px solid ${st.color}40`, borderRadius: 999, padding: '2px 9px' }}>{st.label}</span>
                  </td>
                  <td style={{ fontSize: 10.5, color: 'var(--text-tertiary)', padding: '9px 12px', borderBottom: '1px solid var(--border-color)' }}>{v.fetchedAt ? new Date(v.fetchedAt).toLocaleTimeString() : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
