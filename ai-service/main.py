from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

class BulkMatchRequest(BaseModel):
    resumes: List[str]
    job_description: str

@app.post("/match")
def calculate_match(data: MatchRequest):
    if not data.resume_text or not data.job_description:
        raise HTTPException(status_code=400, detail="Missing text data")
    
    documents = [data.resume_text, data.job_description]
    vectorizer = TfidfVectorizer().fit_transform(documents)
    vectors = vectorizer.toarray()
    
    similarity = cosine_similarity([vectors[0]], [vectors[1]])[0][0]
    match_score = round(float(similarity) * 100, 2)
    
    return {"matchScore": match_score}

@app.post("/match/bulk")
def calculate_bulk_match(data: BulkMatchRequest):
    if not data.resumes or not data.job_description:
        raise HTTPException(status_code=400, detail="Missing resume or job description data")
    if len(data.resumes) > 200:
        raise HTTPException(status_code=400, detail="A batch may contain no more than 200 resumes")
    if any(not resume.strip() for resume in data.resumes):
        raise HTTPException(status_code=400, detail="Every resume must contain text")

    vectors = TfidfVectorizer().fit_transform([*data.resumes, data.job_description])
    scores = cosine_similarity(vectors[:-1], vectors[-1]).flatten()
    return {"matchScores": [round(float(score) * 100, 2) for score in scores]}


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.getenv("AI_SERVICE_HOST", "127.0.0.1"),
        port=int(os.getenv("AI_SERVICE_PORT", "8001")),
    )
