export interface MatchedKeyword {
  keyword: string
}

export interface MissingKeyword {
  keyword: string
  suggestion: string
}

export interface SectionFeedback {
  section_name: string
  feedback: string
}

export interface ExperienceItem {
  company: string
  role: string
  dates: string
  bullets: string[]
}

export interface SkillItem {
  category: string
  skills: string[]
}

export interface EducationItem {
  institution: string
  degree: string
  dates: string
}

export interface OptimizedResume {
  name: string
  contact_info: string
  objective: string | null
  summary: string
  experience: ExperienceItem[]
  skills: SkillItem[]
  education: EducationItem[]
}

// This is the EXACT shape your FastAPI /analyze endpoint returns
export interface AnalysisResult {
  match_score: number
  summary_feedback: string
  matched_keywords: MatchedKeyword[]
  missing_keywords: MissingKeyword[]
  section_feedback: SectionFeedback[]
  optimized_resume: OptimizedResume
  original_resume_text: string
}