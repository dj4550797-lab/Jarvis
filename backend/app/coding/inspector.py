"""Project Directory Inspector, AST Syntax Validator, and Symbol Searcher.

Complies with Phase 7 requirements, PRD Section 17, and SECURITY.md:
- Sandboxed directory scanning
- Python AST syntax validation with precise line/column diagnostics
- Safe symbol and text searching across project files
"""

from __future__ import annotations

import ast
import os
import re
from pathlib import Path
from typing import Any

from app.tools.security import SandboxGuard
from app.utils.logging import logger

IGNORED_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".idea",
    ".vscode",
    "dist",
    "build",
}

TEXT_EXTENSIONS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".html",
    ".css",
    ".toml",
    ".yaml",
    ".yml",
    ".ini",
    ".env",
    ".txt",
    ".sql",
}


class ProjectInspector:
    """Safely inspects project structures, validates syntax, and searches source code."""

    @staticmethod
    def inspect_directory(
        directory_path: str = r"f:\Jarvis",
        max_files: int = 200,
    ) -> dict[str, Any]:
        """Inspect and return directory tree with metadata, within sandboxed paths."""
        resolved = SandboxGuard.validate_path(directory_path)

        files_info: list[dict[str, Any]] = []
        dir_count = 0

        for root, dirs, files in os.walk(resolved):
            # Prune ignored directories in-place
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
            dir_count += 1

            for f in files:
                ext = Path(f).suffix.lower()
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, resolved)

                try:
                    stat = os.stat(full_path)
                    size_bytes = stat.st_size

                    # Count lines for small-medium text files
                    line_count: int | None = None
                    if ext in TEXT_EXTENSIONS and size_bytes <= 1_000_000:
                        try:
                            with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                                line_count = sum(1 for _ in fp)
                        except Exception:
                            line_count = None

                    files_info.append({
                        "name": f,
                        "relative_path": rel_path.replace("\\", "/"),
                        "absolute_path": full_path,
                        "extension": ext,
                        "size_bytes": size_bytes,
                        "line_count": line_count,
                        "is_text": ext in TEXT_EXTENSIONS,
                    })
                except Exception as exc:
                    logger.debug("Failed to stat file %s: %s", full_path, exc)
                    continue

                if len(files_info) >= max_files:
                    break

            if len(files_info) >= max_files:
                break

        return {
            "root_path": str(resolved),
            "directory_count": dir_count,
            "total_files_scanned": len(files_info),
            "capped": len(files_info) >= max_files,
            "files": files_info,
        }

    @staticmethod
    def validate_python_syntax(code: str) -> dict[str, Any]:
        """Parse Python source code using AST and return syntax validation results."""
        try:
            ast.parse(code)
            return {
                "valid": True,
                "errors": [],
                "message": "Python syntax is valid.",
            }
        except SyntaxError as err:
            return {
                "valid": False,
                "errors": [
                    {
                        "line": err.lineno,
                        "column": err.offset,
                        "message": err.msg,
                        "text": (err.text or "").strip(),
                    }
                ],
                "message": f"SyntaxError at line {err.lineno}, col {err.offset}: {err.msg}",
            }
        except Exception as exc:
            return {
                "valid": False,
                "errors": [{"line": None, "column": None, "message": str(exc), "text": ""}],
                "message": f"Failed to parse syntax: {exc}",
            }

    @staticmethod
    def search_code(
        directory_path: str = r"f:\Jarvis",
        query: str = "",
        is_regex: bool = False,
        case_sensitive: bool = False,
        max_results: int = 50,
    ) -> dict[str, Any]:
        """Search text and symbols line-by-line across project files."""
        if not query:
            return {"matches": [], "total_matches": 0, "query": query}

        resolved = SandboxGuard.validate_path(directory_path)

        flags = 0 if case_sensitive else re.IGNORECASE
        if is_regex:
            try:
                pattern = re.compile(query, flags)
            except re.error as err:
                raise ValueError(f"Invalid regex pattern '{query}': {err}")
        else:
            pattern = re.compile(re.escape(query), flags)

        matches: list[dict[str, Any]] = []

        for root, dirs, files in os.walk(resolved):
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

            for f in files:
                ext = Path(f).suffix.lower()
                if ext not in TEXT_EXTENSIONS:
                    continue

                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, resolved).replace("\\", "/")

                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        for line_num, line_content in enumerate(fp, start=1):
                            if pattern.search(line_content):
                                matches.append({
                                    "file": f,
                                    "relative_path": rel_path,
                                    "absolute_path": full_path,
                                    "line_number": line_num,
                                    "line_content": line_content.strip(),
                                })
                                if len(matches) >= max_results:
                                    break
                except Exception:
                    continue

                if len(matches) >= max_results:
                    break

            if len(matches) >= max_results:
                break

        return {
            "root_path": str(resolved),
            "query": query,
            "is_regex": is_regex,
            "total_matches": len(matches),
            "capped": len(matches) >= max_results,
            "matches": matches,
        }
