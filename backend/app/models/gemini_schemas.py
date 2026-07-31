from pydantic import BaseModel, Field


class MatchedKeyword(BaseModel):
    keyword: str


class MissingKeyword(BaseModel):
    keyword: str
    suggestion: str = Field(description="Brief suggestion on where or how the user could add this keyword.")


class SectionFeedback(BaseModel):
    section_name: str = Field(description="e.g., 'Experience', 'Education', 'Skills'")
    feedback: str = Field(description="Specific, actionable feedback to improve this section for the ATS.")


class ExperienceItem(BaseModel):
    company: str
    role: str
    dates: str = Field(description="Original date string, e.g., 'Jan 2022 - Present'")
    bullets: list[str] = Field(description="Rewritten bullet points optimized for ATS keywords")


class SkillItem(BaseModel):
    category: str = Field(description="e.g., 'Programming Languages', 'Tools', 'Soft Skills'")
    skills: list[str]


class EducationItem(BaseModel):
    institution: str
    degree: str
    dates: str


class OptimizedResume(BaseModel):
    name: str = Field(description="The candidate's full name exactly as written in the resume.")
    contact_info: str = Field(description="The exact contact information string (phone, email, linkedin, etc).")
    objective: str | None = Field(default=None, description="The original 'Objective' or 'Objetivo' line if present, otherwise null.")
    summary: str = Field(description="Rewritten professional summary optimized for the job description.")
    experience: list[ExperienceItem]
    skills: list[SkillItem]
    education: list[EducationItem]


class AnalysisResult(BaseModel):
    match_score: int = Field(ge=0, le=100, description="Overall ATS match percentage.")
    summary_feedback: str = Field(description="A brief 2-3 sentence overall assessment of the resume vs the job description.")
    matched_keywords: list[MatchedKeyword]
    missing_keywords: list[MissingKeyword]
    section_feedback: list[SectionFeedback]
    optimized_resume: OptimizedResume