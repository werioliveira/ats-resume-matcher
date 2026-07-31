import os
import sys
import json

# Add the backend directory to the path so we can import 'app'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.services.gemini_client import call_gemini, GeminiResponseError

# 1. Load your actual resume
FIXTURE_PATH = "tests/fixtures/CURRICULO-WERIOLIVEIRA.pdf"

# NOTE: Since we are testing the Gemini client, we will use raw text here 
# to avoid mixing Fatia 1 and Fatia 2 dependencies in the manual script.
# (In Fatia 4 they will be connected).
RESUME_TEXT = """
Weri Oliveira
Software Engineer

Experience:
- Developed web applications using Python and React.
- Worked with databases like PostgreSQL and MongoDB.
- Collaborated with agile teams.

Skills:
Python, React, PostgreSQL, Git, Docker
"""

JOB_DESCRIPTION = """
We are looking for a Senior Backend Engineer.
Requirements:
- 5+ years of experience in Python (FastAPI or Django).
- Strong experience with AWS (Lambda, S3, RDS).
- CI/CD pipelines (GitHub Actions).
- Knowledge of microservices architecture.
"""


def main():
    print("Sending request to Gemini API...")
    print("-" * 50)
    
    try:
        result = call_gemini(JOB_DESCRIPTION, RESUME_TEXT)
        
        # Print as pretty JSON
        print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))
        print("-" * 50)
        print("✅ SUCCESS! Schema validated perfectly.")
        
    except GeminiResponseError as e:
        print(f"❌ ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()