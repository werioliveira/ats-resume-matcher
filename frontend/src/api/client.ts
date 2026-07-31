import type { AnalysisResult } from "../types/analysis"


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface ApiError {
  status: number
  message: string
  retryAfter?: number
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json()
  }

  const error: ApiError = {
    status: response.status,
    message: 'An unexpected error occurred.',
  }

  try {
    const body = await response.json()
    error.message = body.detail || error.message
  } catch {}

  if (response.status === 429) {
    const retryHeader = response.headers.get('Retry-After')
    if (retryHeader) error.retryAfter = parseInt(retryHeader, 10)
  }

  throw error
}

export async function analyzeResume(jobDescription: string, file: File): Promise<AnalysisResult> {
  const formData = new FormData()
  formData.append('job_description', jobDescription)
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse<AnalysisResult>(response)
}

export async function exportResume(optimizedResume: AnalysisResult['optimized_resume']): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optimized_resume: optimizedResume }),
  })

  if (!response.ok) throw new Error('Failed to generate DOCX file.')
  return response.blob()
}

export function triggerDownload(blob: Blob, filename: string = 'curriculo_otimizado.docx') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}