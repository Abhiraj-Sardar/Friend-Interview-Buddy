from pydantic import BaseModel, Field
from typing import Literal


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    mode: Literal["coach", "interview"] = "coach"


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []


class DocumentResponse(BaseModel):
    name: str
    chunks: int


class InterviewRequest(BaseModel):
    answer: str = Field(min_length=1)
    question: str = Field(min_length=1)
