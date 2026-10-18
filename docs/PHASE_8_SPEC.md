# Phase 8 Specification: Content Production & Multi-Agent System

## 1. Overview
Complies with `PLAN.md` Section 12, `JARVIS_Master_PRD.md` Sections 18 & 20, and `docs/Implementation rule.md`:
- **Content Production Pipeline**: Script generation, structured scene breakdowns, visual/character prompt preparation, audio cues and duration pacing, storyboard packaging, and verifiable export validation. No fabricated external publishing claims.
- **Multi-Agent Orchestration**: Specialized agents (`ResearchAgent`, `CodingAgent`, `ContentAgent`, `DiagnosticsAgent`, `PlanningAgent`) with distinct system prompts, strict non-escalatable tool allowlists, loop/recursion prevention (`max_turns <= 10`), shared task state, and traceable step logging.

---

## 2. Content Production Architecture
### 2.1 Workflow Stages
1. **Topic & Outline**: Define project title, synopsis, target platform (`youtube_documentary`, `short_form`, `educational_explainer`, `podcast_audio`), target duration.
2. **Script & Narration**: Draft structured scripts with distinct acts/sections, narrative hooks, and word count.
3. **Scene Breakdown**: Convert scripts into sequential scene items with narration chunks, visual actions, camera directions, and estimated duration (~140 wpm).
4. **Visual & Character Prompts**: Generate optimized prompts for visual generators (Midjourney/Flux/SD/Runway style) including lighting, lens, aspect ratio, and negative prompts.
5. **Audio & Pacing Integration**: Map background music mood, sound effects (SFX), and speech pacing metadata per scene.
6. **Export & Verification**: Generate verified export package (Markdown production brief, JSON storyboard) with validation checks (empty narration, missing prompts, duration deviations, disclaimer on external tool limits).
7. **Publishing Authorization**: External publishing is a sensitive side-effect requiring explicit user approval. Never claims automated publication unless verified.

---

## 3. Multi-Agent Architecture
### 3.1 Specialized Agent Roles
- **ResearchAgent**: Permitted tools: `search_web`, `read_source`, `extract_citations`. Focuses on fact verification and source synthesis.
- **CodingAgent**: Permitted tools: `coding_diff`, `code_patch`, `code_rollback`, `ast_validate`. Focuses on safe code analysis and patch application.
- **ContentAgent**: Permitted tools: `generate_script`, `breakdown_scenes`, `build_prompts`, `export_package`. Focuses on creative script and storyboard generation.
- **DiagnosticsAgent**: Permitted tools: `check_health`, `verify_devices`, `inspect_logs`, `audit_diagnostics`. Focuses on system and hardware readiness.
- **PlanningAgent**: Permitted tools: `plan_decompose`, `assign_subtask`, `verify_completion`. Focuses on task decomposition and pipeline coordination.

### 3.2 Security and Safety Invariants
1. **Immutable Tool Allowlists**: Agents cannot add tools to their own or peer agents' permission sets.
2. **Runaway Loop Protection**: Hard limit of `max_turns = 10` per workflow run; cycle detection detects repetitive ping-pong messages.
3. **Traceability**: Every agent-to-agent message and tool execution is recorded with `run_id`, `from_agent`, `to_agent`, `intent`, `payload`, and `timestamp`.
4. **Emergency Stop & Cancellation**: Respects global emergency stop; supports real-time task cancellation.

---

## 4. API Endpoints
### Content API (`/api/v1/content`)
- `POST /projects` - Create content project
- `GET /projects` - List content projects
- `GET /projects/{project_id}` - Get project details with scenes
- `PATCH /projects/{project_id}` - Update project metadata/script
- `DELETE /projects/{project_id}` - Delete project
- `POST /projects/{project_id}/generate-script` - Generate script draft
- `POST /projects/{project_id}/breakdown-scenes` - Generate structured scene breakdown
- `POST /projects/{project_id}/generate-prompts` - Generate visual prompts for scenes
- `POST /projects/{project_id}/export` - Export validated production package
- `POST /projects/{project_id}/publish` - Request publishing intent (authorization check)

### Multi-Agent API (`/api/v1/agents`)
- `GET /capabilities` - List registered specialized agents and immutable tool permissions
- `POST /runs` - Start orchestrated multi-agent workflow
- `GET /runs` - List workflow runs
- `GET /runs/{run_id}` - Get run status and execution traces
- `POST /runs/{run_id}/step` - Step forward or trigger orchestration iteration
- `POST /runs/{run_id}/cancel` - Cancel active workflow run
