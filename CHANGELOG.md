# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
