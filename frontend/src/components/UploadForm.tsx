import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

interface UploadFormProps {
  onSubmit: (jobDescription: string, file: File) => void
  isSubmitting?: boolean
}

export function UploadForm({ onSubmit, isSubmitting = false }: UploadFormProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (selectedFile: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type) && !ALLOWED_EXTENSIONS.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
      return 'Invalid file type. Please upload a PDF or DOCX file.'
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
    }
    return null
  }

  const handleFileSelect = (selectedFile: File) => {
    setError(null)
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setFile(null)
    } else {
      setFile(selectedFile)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFileSelect(selectedFile)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!jobDescription.trim()) {
      setError('Please paste the job description.')
      return
    }
    if (!file) {
      setError('Please upload your resume.')
      return
    }

    // MOCKED SUBMIT (Fatia 1 rule: not connected to API yet)
    console.log('Mock Submit:', { jobDescription, fileName: file.name })
    alert(`Form valid! Would send to API:\n\nJob Description Length: ${jobDescription.length}\nFile: ${file.name}`)
    
    // When we reach Fatia 3, this will just be:
    // onSubmit(jobDescription, file)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Description */}
        <div>
          <label htmlFor="job_description" className="block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <textarea
            id="job_description"
            rows={6}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* File Upload Dropzone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume (PDF or DOCX)
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-1 flex justify-center rounded-lg border-2 border-dashed px-6 pt-5 pb-6 cursor-pointer transition-colors ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-center">
              {file ? (
                <div className="text-indigo-600 font-medium">
                  📄 {file.name}
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="ml-3 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop your resume here, or click to select
                  </p>
                  <p className="mt-1 text-xs text-gray-500">PDF or DOCX up to {MAX_FILE_SIZE_MB}MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Analyze Resume
        </Button>
      </form>
    </Card>
  )
}