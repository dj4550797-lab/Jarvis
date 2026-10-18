"""Security, Sandboxing, and Path Traversal Defense for Tools.

Enforces SECURITY.md Sections 4, 9, and 11:
- Canonical path resolution against approved root directories
- Defense against path traversal ('..', drive hopping, UNC shares, device paths)
- Whitelist enforcement for launched applications
- Shell metacharacter injection blocking
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Sequence

from app.utils.logging import logger


class SecurityViolationError(Exception):
    """Raised when an operation violates security policy or sandbox boundaries."""

    def __init__(self, message: str, code: str = "SECURITY_VIOLATION") -> None:
        super().__init__(message)
        self.code = code


# Default approved directories (workspace root and safe temp data directory)
DEFAULT_WORKSPACE_ROOT = Path("f:/Jarvis").resolve()

# Allowlisted desktop application executables
ALLOWED_APPLICATIONS: set[str] = {
    "notepad",
    "notepad.exe",
    "calc",
    "calc.exe",
    "explorer",
    "explorer.exe",
}

# Dangerous Windows device filenames that must never be opened
RESERVED_DEVICE_NAMES: set[str] = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}

# Dangerous characters for subprocess arguments
FORBIDDEN_ARG_CHARS: set[str] = {"&", "|", ";", ">", "<", "`", "$", "\n", "\r"}


class _SandboxValidateDescriptor:
    """Allows validate_path to be invoked either on an instance or directly on the class."""

    def __init__(self, func):
        self.func = func

    def __get__(self, obj, cls=None):
        if obj is None:
            return lambda raw_path, must_exist=False: get_sandbox_guard().validate_path(raw_path, must_exist=must_exist)
        return lambda raw_path, must_exist=False: self.func(obj, raw_path, must_exist=must_exist)


class SandboxGuard:
    """Validates filesystem paths and external operations against security policies."""

    def __init__(self, approved_roots: Sequence[Path] | None = None) -> None:
        if approved_roots is None:
            self._approved_roots = [DEFAULT_WORKSPACE_ROOT]
        else:
            self._approved_roots = [r.resolve() for r in approved_roots]

    def add_approved_root(self, root: Path) -> None:
        """Add an authorized directory to the sandbox."""
        resolved = root.resolve()
        if resolved not in self._approved_roots:
            self._approved_roots.append(resolved)

    @_SandboxValidateDescriptor
    def validate_path(self, raw_path: str | Path, must_exist: bool = False) -> Path:
        """Canonicalize and validate a path against approved sandbox roots.

        Raises:
            SecurityViolationError: If path attempts path traversal, targets reserved devices,
                                   or lies outside approved directories.
            FileNotFoundError: If must_exist is True and the target file does not exist.
        """
        if not raw_path or not str(raw_path).strip():
            raise SecurityViolationError("Path argument cannot be empty.", code="EMPTY_PATH")

        path_str = str(raw_path).strip()

        # 1. Reject Windows device namespaces and UNC network paths
        if path_str.startswith(("\\\\.\\", "\\\\?\\", "\\\\")):
            logger.warning("Sandbox blocked UNC/device namespace path: %s", path_str)
            raise SecurityViolationError(
                f"UNC network paths and Windows device namespaces are prohibited: '{path_str}'",
                code="PATH_NAMESPACE_PROHIBITED",
            )

        # 2. Check for reserved Windows filenames (NUL, CON, etc.)
        p_obj = Path(path_str)
        stem_upper = p_obj.stem.upper()
        if stem_upper in RESERVED_DEVICE_NAMES:
            logger.warning("Sandbox blocked reserved Windows device name: %s", path_str)
            raise SecurityViolationError(
                f"Access to reserved Windows device file '{stem_upper}' is prohibited.",
                code="RESERVED_DEVICE_NAME",
            )

        # 3. Canonicalize path
        # If relative, resolve relative to the primary approved root
        if not p_obj.is_absolute():
            resolved = (self._approved_roots[0] / p_obj).resolve()
        else:
            resolved = p_obj.resolve()

        # 4. Enforce that the canonical path is within one of the approved roots
        is_inside_sandbox = False
        for root in self._approved_roots:
            try:
                # relative_to raises ValueError if resolved is not a subpath of root
                resolved.relative_to(root)
                is_inside_sandbox = True
                break
            except ValueError:
                continue

        if not is_inside_sandbox:
            logger.warning(
                "Sandbox blocked path traversal attempt: '%s' resolved to '%s' (outside %s)",
                path_str,
                resolved,
                [str(r) for r in self._approved_roots],
            )
            raise SecurityViolationError(
                f"Path traversal denied: '{path_str}' resolves outside approved directories.",
                code="PATH_TRAVERSAL_DENIED",
            )

        # 5. Existence check if requested
        if must_exist and not resolved.exists():
            raise FileNotFoundError(f"Requested path does not exist: '{resolved}'")

        return resolved

    def validate_application_launch(self, app_name: str, args: list[str] | None = None) -> str:
        """Validate an application launch request against the allowlist.

        Raises:
            SecurityViolationError: If the application is not allowlisted or args contain metacharacters.
        """
        clean_name = Path(app_name.strip()).name.lower()
        if clean_name not in ALLOWED_APPLICATIONS:
            logger.warning("Blocked unapproved application launch attempt: '%s'", app_name)
            raise SecurityViolationError(
                f"Application '{app_name}' is not in the approved application allowlist: "
                f"{sorted(ALLOWED_APPLICATIONS)}",
                code="APP_NOT_ALLOWLISTED",
            )

        # Validate arguments against shell injection
        if args:
            for arg in args:
                for char in FORBIDDEN_ARG_CHARS:
                    if char in arg:
                        logger.warning("Blocked shell metacharacter '%s' in argument '%s'", char, arg)
                        raise SecurityViolationError(
                            f"Shell metacharacter '{char}' is forbidden in application arguments.",
                            code="SHELL_METACHAR_FORBIDDEN",
                        )

        return clean_name


# Default singleton instance
_default_sandbox_guard = SandboxGuard()


def get_sandbox_guard() -> SandboxGuard:
    return _default_sandbox_guard
