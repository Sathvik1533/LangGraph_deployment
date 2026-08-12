# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.0] - 2026-08-12

### Added
- **Verified Production Resilience Patterns Documentation**: Fully documented and cited source line references for `circuit_breaker` (`agent.py:L65-69`), `jittered_wait` (`agent.py:L1234-1265`), `RateLimiter` (`app.py:L71-111`), `thread_id` session tracking (`app.py:L331`), `validate_task_input` (`agent.py:L1288`), and `should_continue` (`agent.py:L1766`).
- **Dynamic Input & Output OWASP Guardrails Architecture**: Fully documented and aligned 6 input scanners (`Prompt Injection LLM01`, `Sensitive Data LLM02`, `Excessive Agency LLM06`, `Unbounded Consumption LLM10`, `Topic Boundary`, `Content Safety`) and 4 output scanners (`Dangerous Code`, `PII Leaks`, `Code Relevance`, `Language Correctness`).
- **Persistent Governance & Error Recovery Banners**: Integrated persistent canvas banners (`#hitlGovernanceBanner` and `#workflowErrorBanner`) providing immediate `[Re-open Review Gate]`, `[Abort Task]`, and `[Reset Workflow]` escape hatches.
- **LLM Engine Mode Badge**: Real-time header indicator displaying `Live LLM: Groq llama-3.3-70b` vs `Template Fallback Mode`.

### Security & Hardening
- **Isolated Subprocess Python Execution**: Replaced in-process `exec()` in `run_python_code()` with an isolated `subprocess.run()` sandbox using temporary Python files, `timeout=5`, and a stripped environment (`env={}`).
- **Honest Static Syntax Checks**: Removed fake execution mocks for Java and C++; relabeled results accurately as `[STATIC SYNTAX CHECK — not compiled or executed]`.
- **HITL Review Natural Language Guard**: Added client-side (`isNaturalLanguageText`) and backend HTTP 400 validation guards preventing natural language guidance from bypassing model generation in `Edit & Approve` mode.

### Fixed
- **Terminal HITL Action Guard & Governance Banner Suppression**: Added backend HTTP 400 validation (`app.py:L935`) rejecting review actions submitted to already completed or terminated runs. Suppressed `#hitlGovernanceBanner` on workflow completion (`workflow.html:L2803`) and prevented `reopenWorkflowHitlModal()` on finished runs.
- **HITL Node Inspector State Synchronization**: Synchronized `nodeStore['human_review']` resolution statuses (`APPROVED`, `EDITED & APPROVED`, `CHANGES_REQUESTED`, `ABORTED`) and logs across all review decision paths, ensuring the Active Node Inspector automatically follows active node execution and never displays stale `waiting_for_human` state after completion.
- **Inline Workspace Execution**: Fixed `/generate` button to execute inline without triggering page navigation.
- **SSE Live Mode Isolation**: Separated `LIVE: Execute API` real execution streams from simulation overrides in `app.py` and `workflow.html`.
- **Page Reload & Thread State Management**: Ensured page reloads generate fresh unique run IDs (`run_...`) and update browser history via `replaceState`, while backend `/stream` and reset endpoints cleanly purge stale thread memory and `hitl_sessions`.

---

## [3.0.0] - 2026-08-11

### Added
- **Human-in-the-Loop (HITL) Gate**: Interactive checkpointing before sandbox execution with full support for Approve, Edit & Approve, Request Changes, and Abort actions.
- **Real-Time SSE Streaming**: Server-Sent Events architecture broadcasting granular agent step transitions and telemetry data.
- **OWASP LLM Guardrails Engine**: Active input injection detection, output command sanitization, and PII redactor.
- **Multi-Language Sandbox**: First-class compilation and execution verification for Python 3.11, Java 17, and C++ 20.
- **Audit History & Playback**: Persistent JSON run ledger with task replay and detailed execution trace inspection.

### Fixed
- Resolved DOM null-safety exceptions during HITL callback rendering.
- Standardized navigation layout variables across all multi-page viewports.
- Enhanced retry routing to isolate self-healing feedback edges dynamically.

---

## [2.0.0] - 2026-08-01

### Added
- Modular multi-page UI architecture (`dashboard.html`, `generate.html`, `workflow.html`, `history.html`, `execution.html`).
- LangGraph state graph with conditional edges and cyclic self-healing retry logic.
- Sliding window IP rate limiter and circuit breaker protection.

---

## [1.0.0] - 2026-07-15

### Added
- Initial release with FastAPI backend, Groq LLM integration, and basic code generator.
