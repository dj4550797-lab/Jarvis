"""Emergency Stop Controller for JARVIS.

Implements PRD Section 14 and SECURITY.md Section 9.4:
- Halts all active and queued tool executions immediately
- Rejects new tool invocations while active
- Requires explicit user authorization to reset
- Preserves audit event of activation
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.utils.logging import logger


class EmergencyStopActiveError(Exception):
    """Raised when an operation is attempted while Emergency Stop is engaged."""

    def __init__(self, reason: str | None = None) -> None:
        msg = f"EMERGENCY STOP ACTIVE: Operations halted. {reason or 'Manual intervention required.'}"
        super().__init__(msg)
        self.reason = reason


class EmergencyStopManager:
    """Manages global emergency stop state for computer operations."""

    def __init__(self) -> None:
        self._is_active: bool = False
        self._reason: str | None = None
        self._engaged_at: str | None = None
        self._interrupted_tasks_count: int = 0

    @property
    def is_active(self) -> bool:
        return self._is_active

    def get_status(self) -> dict[str, Any]:
        return {
            "is_active": self._is_active,
            "reason": self._reason,
            "engaged_at": self._engaged_at,
            "interrupted_tasks_count": self._interrupted_tasks_count,
        }

    def engage(self, reason: str = "Emergency stop initiated by operator.") -> dict[str, Any]:
        """Engage the emergency stop immediately."""
        self._is_active = True
        self._reason = reason
        self._engaged_at = datetime.now(timezone.utc).isoformat()
        self._interrupted_tasks_count += 1
        logger.critical("EMERGENCY STOP ENGAGED! Reason: %s", reason)
        return self.get_status()

    def reset(self, confirmed: bool) -> dict[str, Any]:
        """Reset emergency stop state. Requires explicit confirmation."""
        if not confirmed:
            raise ValueError("Emergency stop reset requires explicit confirmation (confirmed=True).")

        logger.info("Emergency stop cleared by operator.")
        self._is_active = False
        self._reason = None
        self._engaged_at = None
        return self.get_status()

    def assert_not_stopped(self) -> None:
        """Assert that emergency stop is not engaged.

        Raises:
            EmergencyStopActiveError: If emergency stop is active.
        """
        if self._is_active:
            raise EmergencyStopActiveError(self._reason)


_default_emergency_manager = EmergencyStopManager()


def get_emergency_manager() -> EmergencyStopManager:
    return _default_emergency_manager
