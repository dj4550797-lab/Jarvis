"""Task and Command Schemas."""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

TaskStatus = Literal[
    "Draft",
    "Queued",
    "Running",
    "AwaitingApproval",
    "Paused",
    "Completed",
    "PartiallyCompleted",
    "Failed",
    "Cancelled",
    "Blocked",
]

RiskLevel = Literal["Low", "Medium", "High", "Critical"]


class CommandRequest(BaseModel):
    command: str = Field(min_length=1, max_length=5000, description="Natural language command")
    device_id: str = Field(default="windows-desktop", description="Executing client identifier")
    allow_elevation: bool = Field(default=False, description="Authorize elevated actions")


class TaskStepResponse(BaseModel):
    id: str
    step_order: int
    action_type: str
    status: str
    output_data: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None


class TaskResponse(BaseModel):
    id: str
    title: str
    command_raw: str
    status: TaskStatus
    risk_level: RiskLevel
    requires_approval: bool
    approved_at: datetime | None = None
    progress_pct: float
    device_id: str
    result_summary: str | None = None
    error_details: str | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
    steps: list[TaskStepResponse] = []


class TaskListResponse(BaseModel):
    total: int
    tasks: list[TaskResponse]
