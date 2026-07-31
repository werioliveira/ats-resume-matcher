from pydantic import BaseModel, Field
from typing import Optional

# We re-create the structure here so the API layer is decoupled from 
# the exact Gemini schema. If Gemini changes, we only update gemini_schemas.py.
class MatchedKeyword(BaseModel):
    keyword: str

class MissingKeyword(BaseModel):
    keyword: str
    suggestion: str

class SectionFeedback(BaseModel):
    section_name: str
    feedback: str

class ExperienceItem(BaseModel):
    company: str
    role: str
    dates: str
    bullets: list[str]

class SkillItem(BaseModel):
    category: str
    skills: list[str]

class EducationItem(BaseModel):
    institution: str
    degree: str
    dates: str

class OptimizedResume(BaseModel):
    name: str
    contact_info: str
    objective: str | None = None
    summary: str
    experience: list[ExperienceItem]
    skills: list[SkillItem]
    education: list[EducationItem]

class AnalyzeResponse(BaseModel):
    match_score: int
    summary_feedback: str
    matched_keywords: list[MatchedKeyword]
    missing_keywords: list[MissingKeyword]
    section_feedback: list[SectionFeedback]
    optimized_resume: OptimizedResume
    original_resume_text: str