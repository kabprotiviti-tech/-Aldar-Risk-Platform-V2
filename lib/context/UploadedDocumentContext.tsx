'use client'

/**
 * UploadedDocumentContext
 * -----------------------
 * Shared store that holds the most-recent document content read by
 * DocumentUpload. Other intelligence panels (e.g. ControlAssessmentPanel)
 * subscribe to it so they can react to uploads without re-implementing
 * file I/O.
 *
 * Safe to call outside a provider — the hook returns an empty snapshot.
 * Single broadcast channel; latest upload wins.
 */

import React, { createContext, useCallback, useContext, useState } from 'react'

interface UploadedDocumentCtx {
  fileName: string | null
  content: string
  uploadedAt: number | null
  setUploaded: (args: { fileName: string; content: string }) => void
  clearUploaded: () => void
}

const EMPTY: UploadedDocumentCtx = {
  fileName: null,
  content: '',
  uploadedAt: null,
  setUploaded: () => {},
  clearUploaded: () => {},
}

const Ctx = createContext<UploadedDocumentCtx>(EMPTY)

export function UploadedDocumentProvider({ children }: { children: React.ReactNode }) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [uploadedAt, setUploadedAt] = useState<number | null>(null)

  const setUploaded = useCallback((args: { fileName: string; content: string }) => {
    setFileName(args.fileName)
    setContent(args.content)
    setUploadedAt(Date.now())
  }, [])

  const clearUploaded = useCallback(() => {
    setFileName(null)
    setContent('')
    setUploadedAt(null)
  }, [])

  return (
    <Ctx.Provider value={{ fileName, content, uploadedAt, setUploaded, clearUploaded }}>
      {children}
    </Ctx.Provider>
  )
}

export function useUploadedDocument(): UploadedDocumentCtx {
  return useContext(Ctx)
}
