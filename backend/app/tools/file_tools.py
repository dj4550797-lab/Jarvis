"""Safe File Operations Tools for JARVIS.

Implements PRD Section 14 and SECURITY.md Section 11:
- File search within approved boundaries
- Safe file reading with size limits
- Atomic file writing with confirmation guard against accidental overwrites
- Path traversal defense on all operations
"""

from __future__ import annotations

import fnmatch
import os
import tempfile
from pathlib import Path
from typing import Any

from app.tools.base import BaseTool, ToolResult
from app.tools.security import get_sandbox_guard


class FileSearchTool(BaseTool):
    """Search for files in approved workspace directories."""

    name = "file_search"
    description = "Search for files matching a pattern within approved workspace directories."
    capability = "filesystem.read"
    requires_confirmation = False

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "Glob pattern to match, e.g. '*.py' or '*test*'",
                    "default": "*",
                },
                "directory": {
                    "type": "string",
                    "description": "Subdirectory to search inside. Defaults to workspace root.",
                    "default": ".",
                },
                "max_depth": {
                    "type": "integer",
                    "description": "Maximum directory traversal depth (1 to 10)",
                    "default": 5,
                    "minimum": 1,
                    "maximum": 10,
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (1 to 200)",
                    "default": 50,
                    "minimum": 1,
                    "maximum": 200,
                },
            },
        }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> ToolResult:
        pattern = params.get("pattern", "*")
        dir_arg = params.get("directory", ".")
        max_depth = min(max(int(params.get("max_depth", 5)), 1), 10)
        limit = min(max(int(params.get("limit", 50)), 1), 200)

        guard = get_sandbox_guard()
        target_dir = guard.validate_path(dir_arg, must_exist=True)

        if not target_dir.is_dir():
            return ToolResult(
                success=False,
                error=f"Target path is not a directory: '{target_dir}'",
                verifiable=True,
            )

        matches: list[dict[str, Any]] = []
        base_depth = len(target_dir.parts)

        # Standard directories to skip for speed and cleanliness
        skip_dirs = {".git", ".venv", "venv", "node_modules", "__pycache__", ".pytest_cache", "dist", "build"}

        for root, dirs, files in os.walk(target_dir):
            curr_path = Path(root)
            depth = len(curr_path.parts) - base_depth
            if depth >= max_depth:
                dirs.clear()  # Do not recurse further
                continue

            # In-place filter directories to avoid walking into node_modules, .venv, etc.
            dirs[:] = [d for d in dirs if d not in skip_dirs]

            for fname in files:
                if fnmatch.fnmatch(fname, pattern):
                    file_path = curr_path / fname
                    try:
                        stat = file_path.stat()
                        # Clean relative display path
                        rel_path = file_path.relative_to(target_dir)
                        matches.append(
                            {
                                "name": fname,
                                "path": str(rel_path).replace("\\", "/"),
                                "size_bytes": stat.st_size,
                                "is_file": True,
                            }
                        )
                        if len(matches) >= limit:
                            break
                    except OSError:
                        continue

            if len(matches) >= limit:
                break

        return ToolResult(
            success=True,
            output={
                "directory": str(dir_arg),
                "pattern": pattern,
                "matches_count": len(matches),
                "matches": matches,
            },
            verifiable=True,
        )


class FileReadTool(BaseTool):
    """Safely read content from an authorized file."""

    name = "file_read"
    description = "Read text content from a file located within approved workspace directories."
    capability = "filesystem.read"
    requires_confirmation = False

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "required": ["path"],
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file to read (relative to workspace or absolute).",
                },
                "max_bytes": {
                    "type": "integer",
                    "description": "Maximum bytes to read (default 1MB, max 10MB)",
                    "default": 1_000_000,
                    "maximum": 10_000_000,
                },
            },
        }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> ToolResult:
        raw_path = params.get("path")
        if not raw_path:
            return ToolResult(success=False, error="Parameter 'path' is required.", verifiable=False)

        max_bytes = min(int(params.get("max_bytes", 1_000_000)), 10_000_000)

        guard = get_sandbox_guard()
        target_file = guard.validate_path(raw_path, must_exist=True)

        if not target_file.is_file():
            return ToolResult(success=False, error=f"Target path is not a file: '{target_file}'", verifiable=True)

        file_size = target_file.stat().st_size
        if file_size > max_bytes:
            return ToolResult(
                success=False,
                error=f"File size ({file_size} bytes) exceeds requested limit of {max_bytes} bytes.",
                verifiable=True,
                metadata={"file_size": file_size, "limit": max_bytes},
            )

        try:
            content = target_file.read_text(encoding="utf-8", errors="replace")
            lines = content.splitlines()
            return ToolResult(
                success=True,
                output={
                    "path": str(raw_path),
                    "size_bytes": file_size,
                    "lines_count": len(lines),
                    "content": content,
                },
                verifiable=True,
            )
        except Exception as exc:
            return ToolResult(
                success=False,
                error=f"Failed to read file: {exc}",
                verifiable=True,
            )


class FileWriteTool(BaseTool):
    """Safely write content to an authorized file with overwrite confirmation."""

    name = "file_write"
    description = "Write text content to a file within approved workspace directories. Requires confirmation to overwrite existing files."
    capability = "filesystem.write"
    requires_confirmation = True

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "required": ["path", "content"],
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the target file to create or overwrite.",
                },
                "content": {
                    "type": "string",
                    "description": "Text content to write into the file.",
                },
                "confirmed": {
                    "type": "boolean",
                    "description": "Explicit confirmation flag required when overwriting an existing file.",
                    "default": False,
                },
            },
        }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> ToolResult:
        raw_path = params.get("path")
        content = params.get("content")
        confirmed = bool(params.get("confirmed", False))

        if not raw_path:
            return ToolResult(success=False, error="Parameter 'path' is required.", verifiable=False)
        if content is None:
            return ToolResult(success=False, error="Parameter 'content' is required.", verifiable=False)

        guard = get_sandbox_guard()
        target_file = guard.validate_path(raw_path, must_exist=False)

        # Check for overwrite safeguard
        if target_file.exists() and not confirmed:
            return ToolResult(
                success=False,
                requires_confirmation=True,
                confirmation_prompt=(
                    f"File '{raw_path}' already exists ({target_file.stat().st_size} bytes). "
                    "Overwriting will replace its contents. Please confirm to proceed."
                ),
                verifiable=True,
                metadata={"path": str(raw_path), "existing_size": target_file.stat().st_size},
            )

        # Ensure parent directory exists
        target_file.parent.mkdir(parents=True, exist_ok=True)

        # Atomic write pattern: write to temporary file, then replace
        try:
            with tempfile.NamedTemporaryFile("w", dir=target_file.parent, delete=False, encoding="utf-8") as tf:
                tf.write(content)
                temp_name = tf.name

            os.replace(temp_name, target_file)

            return ToolResult(
                success=True,
                output={
                    "path": str(raw_path),
                    "bytes_written": len(content.encode("utf-8")),
                    "action": "overwritten" if target_file.exists() and confirmed else "created",
                },
                verifiable=True,
            )
        except Exception as exc:
            # Clean up temp file on failure if still exists
            if 'temp_name' in locals() and os.path.exists(temp_name):
                try:
                    os.remove(temp_name)
                except OSError:
                    pass
            return ToolResult(
                success=False,
                error=f"Failed to write file: {exc}",
                verifiable=True,
            )
