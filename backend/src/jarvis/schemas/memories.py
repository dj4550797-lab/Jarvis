"""Memory and Knowledge Schemas."""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

MemoryType = Literal["fact", "preference", "episodic", "project_context"]
MemoryCategory = Literal["user", "system", "coding", "personal", "device"]


class MemoryCreate(BaseModel):
    memory_type: MemoryType = "fact"
    category: MemoryCategory = "user"
    content: str = Field(min_length=1, max_length=10000)
    source_ref: str | None = None
    importance: float = Field(default=1.0, ge=0.0, le=1.0)
    is_sensitive: bool = False


class MemoryResponse(BaseModel):
    id: str
    memory_type: MemoryType
    category: MemoryCategory
    content: str
    source_ref: str | None = None
    importance: float
    access_count: int
    is_sensitive: bool
    created_at: datetime
    last_accessed_at: datetime


class MemorySearchRequest(BaseModel):
    query: str = Field(min_length=1)
    category: MemoryCategory | None = None
    top_k: int = Field(default=5, ge=1, le=50)


class MemorySearchResponse(BaseModel):
    query: str
    results: list[MemoryResponse]
