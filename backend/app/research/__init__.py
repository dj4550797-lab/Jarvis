"""Research Assistant Subsystem.

Complies with Phase 7 requirements, PRD Section 18, and SECURITY.md:
- Structured research sessions and evidence capture
- Explicit fact vs uncertain claims distinction (Strict Honesty Rule)
- Source tracking with verifiable citations and confidence ratings
- Markdown and JSON report exports
"""

from app.research.service import ResearchService

__all__ = ["ResearchService"]
