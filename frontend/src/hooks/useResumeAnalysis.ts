import { useReducer, useCallback } from 'react'
import { analyzeResume, exportResume, triggerDownload } from '../api/client'
import type { AnalysisResult as BackendResult } from '../types/analysis'
import type { AnalysisResult as V0Result } from '../lib/mock-data'

type Status = 'idle' | 'analyzing' | 'rate_limited' | 'error' | 'success' | 'exporting'

interface ApiError {
  status: number
  message: string
  retryAfter?: number
}

interface State {
  status: Status
  data: V0Result | null
  error: ApiError | null
  retryAfter: number | null
  rawBackendData: BackendResult | null
}

type Action =
  | { type: 'START_ANALYZE' }
  | { type: 'ANALYZE_SUCCESS'; payload: BackendResult }
  | { type: 'ANALYZE_ERROR'; payload: ApiError }
  | { type: 'START_EXPORT' }
  | { type: 'EXPORT_SUCCESS' }
  | { type: 'EXPORT_ERROR' }
  | { type: 'RESET' }

function formatOptimizedCV(resume: BackendResult['optimized_resume']): string {
  let text = `${resume.name.toUpperCase()}\n${resume.contact_info}\n\n`
  if (resume.objective) text += `OBJETIVO\n${resume.objective}\n\n`
  text += `RESUMO PROFISSIONAL\n${resume.summary}\n\n`
  
  if (resume.experience.length > 0) {
    text += `EXPERIÊNCIA\n`
    resume.experience.forEach(exp => {
      text += `- ${exp.role} at ${exp.company} (${exp.dates})\n`
      exp.bullets.forEach(b => text += `  - ${b}\n`)
    })
    text += '\n'
  }

  if (resume.skills.length > 0) {
    text += `HABILIDADES\n`
    resume.skills.forEach(s => text += `- ${s.category}: ${s.skills.join(', ')}\n`)
    text += '\n'
  }

  return text.trim()
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_ANALYZE':
      return { status: 'analyzing', data: null, error: null, retryAfter: null, rawBackendData: null }
    case 'ANALYZE_SUCCESS':
      return {
        status: 'success',
        rawBackendData: action.payload,
        data: {
          score: action.payload.match_score,
          matchedKeywords: action.payload.matched_keywords.map(kw => kw.keyword),
          missingKeywords: action.payload.missing_keywords.map(kw => kw.keyword),
          formatQuality: 90,
          originalCV: action.payload.original_resume_text,
          optimizedCV: formatOptimizedCV(action.payload.optimized_resume),
        },
        error: null,
        retryAfter: null,
      }
    case 'ANALYZE_ERROR':
      if (action.payload.status === 429) {
        return { ...state, status: 'rate_limited', error: action.payload, retryAfter: action.payload.retryAfter || 60 }
      }
      return { ...state, status: 'error', error: action.payload }
    case 'START_EXPORT':
      return { ...state, status: 'exporting' }
    case 'EXPORT_SUCCESS':
      return { ...state, status: 'success' }
    case 'EXPORT_ERROR':
      return { ...state, status: 'success' }
    case 'RESET':
      return { status: 'idle', data: null, error: null, retryAfter: null, rawBackendData: null }
    default:
      return state
  }
}

export function useResumeAnalysis() {
  const [state, dispatch] = useReducer(reducer, {
    status: 'idle' as Status,
    data: null,
    error: null,
    retryAfter: null,
    rawBackendData: null,
  })

  const submitAnalysis = useCallback(async (jobDescription: string, file: File) => {
    dispatch({ type: 'START_ANALYZE' })
    try {
      const result = await analyzeResume(jobDescription, file)
      dispatch({ type: 'ANALYZE_SUCCESS', payload: result })
    } catch (err: any) {
      dispatch({ type: 'ANALYZE_ERROR', payload: err })
    }
  }, [])

  const handleExportDocx = useCallback(async () => {
    if (!state.rawBackendData) return
    dispatch({ type: 'START_EXPORT' })
    try {
      const blob = await exportResume(state.rawBackendData.optimized_resume)
      triggerDownload(blob)
      dispatch({ type: 'EXPORT_SUCCESS' })
    } catch (err) {
      console.error(err)
      dispatch({ type: 'EXPORT_ERROR' })
    }
  }, [state.rawBackendData])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return { state, submitAnalysis, handleExportDocx, reset }
}