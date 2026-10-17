"""Base interfaces and data structures for Controlled Computer Tools.

Complies with PRD Section 14 (Phase 5) and SECURITY.md Section 4 & 9.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    """Result of a tool execution with verifiable outputs."""

    success: bool
    output: Any = None
    error: str | None = None
    verifiable: bool = True
    requires_confirmation: bool = False
    confirmation_prompt: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ToolMetadata(BaseModel):
    """Catalog metadata describing a registered tool and its schema."""

    name: str
    description: str
    capability: str
    requires_confirmation: bool = False
    parameters_schema: dict[str, Any] = Field(default_factory=dict)


class BaseTool(ABC):
    """Abstract base class for all JARVIS controlled computer tools."""

    name: str
    description: str
    capability: str
    requires_confirmation: bool = False

    @abstractmethod
    def get_parameters_schema(self) -> dict[str, Any]:
        """Return JSON Schema for the tool's input arguments."""
        pass

    @abstractmethod
    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> ToolResult:
        """Execute the tool within strict security and sandbox constraints."""
        pass

    def to_metadata(self) -> ToolMetadata:
        """Convert tool to serializable catalog metadata."""
        return ToolMetadata(
            name=self.name,
            description=self.description,
            capability=self.capability,
            requires_confirmation=self.requires_confirmation,
            parameters_schema=self.get_parameters_schema(),
        )
