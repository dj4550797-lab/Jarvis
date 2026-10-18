"""Stack Trace and Error Diagnostics Engine.

Complies with Phase 7 requirements and PRD Section 17:
- Parses Python and JavaScript/TypeScript exception stack traces into structured frames
- Identifies local workspace source files within call stack
- Distinguishes verified trace facts from diagnostic inferences
- Provides actionable remediation guidance
"""

from __future__ import annotations

import os
import re
from typing import Any

from app.tools.security import SandboxGuard

PYTHON_FRAME_REGEX = re.compile(
    r'File\s+["\'](?P<file>.+?)["\'],\s+line\s+(?P<line>\d+)(?:,\s+in\s+(?P<func>\S+))?',
    re.IGNORECASE,
)
JS_FRAME_REGEX = re.compile(
    r'at\s+(?:(?P<func>[^\s(]+)\s+\()?(?P<file>[^\s()]+?):(?P<line>\d+):(?P<col>\d+)\)?',
    re.IGNORECASE,
)


class StackTraceParser:
    """Parses and diagnoses stack traces from Python and JavaScript runtimes."""

    @classmethod
    def parse_and_diagnose(
        cls,
        raw_trace: str,
        workspace_root: str = r"f:\Jarvis",
    ) -> dict[str, Any]:
        """Parse raw trace into structured frames and diagnose cause."""
        if not raw_trace or not raw_trace.strip():
            return {
                "detected_language": "unknown",
                "error_type": "UnknownError",
                "error_message": "Empty or whitespace-only stack trace provided.",
                "frames": [],
                "analysis": {
                    "primary_culprit": None,
                    "summary": "No trace frames could be identified.",
                    "suggestions": [],
                },
            }

        lines = raw_trace.strip().splitlines()

        # Check for Python traceback
        if "traceback (most recent call last)" in raw_trace.lower() or any(
            PYTHON_FRAME_REGEX.search(l) for l in lines
        ):
            return cls._parse_python_trace(lines, workspace_root)

        # Check for JS/Node stack trace
        if any(JS_FRAME_REGEX.search(l) for l in lines):
            return cls._parse_js_trace(lines, workspace_root)

        # Fallback generic parsing
        return cls._parse_generic_trace(lines, workspace_root)

    @classmethod
    def _parse_python_trace(cls, lines: list[str], workspace_root: str) -> dict[str, Any]:
        frames: list[dict[str, Any]] = []
        error_type = "PythonException"
        error_message = ""

        # Extract frames
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            match = PYTHON_FRAME_REGEX.search(line)
            if match:
                file_path = match.group("file")
                line_no = int(match.group("line"))
                func_name = match.group("func") or "<module>"

                # Check if next line contains code snippet
                code_snippet = ""
                if i + 1 < len(lines) and not PYTHON_FRAME_REGEX.search(lines[i + 1]) and not lines[i + 1].startswith("Traceback"):
                    code_snippet = lines[i + 1].strip()
                    i += 1

                is_local = cls._is_local_file(file_path, workspace_root)
                frames.append({
                    "file": file_path,
                    "line": line_no,
                    "function": func_name,
                    "code": code_snippet,
                    "is_local_project_file": is_local,
                })
            i += 1

        # The last line usually holds ExceptionType: message
        if lines:
            last_line = lines[-1].strip()
            if ":" in last_line and not last_line.startswith("File "):
                parts = last_line.split(":", 1)
                error_type = parts[0].strip()
                error_message = parts[1].strip()
            else:
                error_message = last_line

        analysis = cls._build_analysis(frames, error_type, error_message)

        return {
            "detected_language": "python",
            "error_type": error_type,
            "error_message": error_message,
            "total_frames": len(frames),
            "frames": frames,
            "analysis": analysis,
        }

    @classmethod
    def _parse_js_trace(cls, lines: list[str], workspace_root: str) -> dict[str, Any]:
        frames: list[dict[str, Any]] = []
        error_type = "JavaScriptError"
        error_message = ""

        # First line usually: ErrorType: Message
        if lines and ":" in lines[0] and not lines[0].strip().startswith("at "):
            parts = lines[0].split(":", 1)
            error_type = parts[0].strip()
            error_message = parts[1].strip()
        elif lines:
            error_message = lines[0].strip()

        for line in lines:
            match = JS_FRAME_REGEX.search(line.strip())
            if match:
                file_path = match.group("file")
                line_no = int(match.group("line"))
                func_name = match.group("func") or "<anonymous>"
                is_local = cls._is_local_file(file_path, workspace_root)

                frames.append({
                    "file": file_path,
                    "line": line_no,
                    "function": func_name,
                    "code": "",
                    "is_local_project_file": is_local,
                })

        analysis = cls._build_analysis(frames, error_type, error_message)

        return {
            "detected_language": "javascript",
            "error_type": error_type,
            "error_message": error_message,
            "total_frames": len(frames),
            "frames": frames,
            "analysis": analysis,
        }

    @classmethod
    def _parse_generic_trace(cls, lines: list[str], workspace_root: str) -> dict[str, Any]:
        first_line = lines[0] if lines else "Error"
        error_type = "GenericError"
        error_message = first_line

        if ": " in first_line:
            parts = first_line.split(": ", 1)
            prefix = parts[0].strip()
            if prefix.isalnum() or "Error" in prefix or "Exception" in prefix:
                error_type = prefix
                error_message = parts[1].strip()

        return {
            "detected_language": "generic",
            "error_type": error_type,
            "error_message": error_message,
            "total_frames": 0,
            "frames": [],
            "analysis": {
                "primary_culprit": None,
                "summary": f"Could not parse structured stack frames from message: '{first_line}'.",
                "suggestions": ["Ensure full exception traceback including frame headers is provided."],
            },
        }

    @classmethod
    def _is_local_file(cls, file_path: str, workspace_root: str) -> bool:
        """Check if file belongs to user's workspace rather than site-packages/node_modules."""
        norm_file = os.path.normpath(file_path).lower()
        norm_root = os.path.normpath(workspace_root).lower()

        if "site-packages" in norm_file or "node_modules" in norm_file or "<frozen" in norm_file:
            return False

        return norm_file.startswith(norm_root)

    @classmethod
    def _build_analysis(
        cls,
        frames: list[dict[str, Any]],
        error_type: str,
        error_message: str,
    ) -> dict[str, Any]:
        """Generate verified diagnostic facts and targeted suggestions."""
        local_frames = [f for f in frames if f.get("is_local_project_file")]

        # The primary culprit is generally the innermost local frame
        primary_culprit = local_frames[-1] if local_frames else (frames[-1] if frames else None)

        suggestions: list[str] = []
        summary = f"{error_type} encountered: {error_message}"

        if primary_culprit:
            culprit_str = f"{os.path.basename(primary_culprit['file'])}:{primary_culprit['line']} in '{primary_culprit['function']}'"
            summary += f" Root issue originated at {culprit_str}."

            if "NoneType" in error_message:
                suggestions.append(f"Check for None or uninitialized object references at {culprit_str}.")
            elif "KeyError" in error_type:
                suggestions.append(f"Verify dictionary keys exist or use .get() at {culprit_str}.")
            elif "FileNotFoundError" in error_type or "no such file" in error_message.lower():
                suggestions.append(f"Ensure target path exists and check canonical sandbox resolution at {culprit_str}.")
            elif "OperationalError" in error_type and "no such table" in error_message.lower():
                suggestions.append("Run missing database migrations (alembic upgrade head).")
            else:
                suggestions.append(f"Inspect variables and parameter handling at {culprit_str}.")
        else:
            suggestions.append("Check external module arguments or environment configuration.")

        return {
            "primary_culprit": primary_culprit,
            "summary": summary,
            "suggestions": suggestions,
        }
