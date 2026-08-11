# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| 2.x.x   | :white_check_mark: |
| < 2.0   | :x:                |

---

## 🛡️ Built-in Security Architecture

AI Workflow Studio implements a comprehensive multi-tier defense architecture aligned with **OWASP Top 10 for LLMs**:

1. **Input Guardrails (`LLM01: Prompt Injection`)**:
   - Multi-layer regex and heuristic pattern detectors for instruction override, system prompt extraction, and roleplay exploits.
   - Non-coding topic boundary enforcement.
   
2. **Output Guardrails (`LLM02: Sensitive Information Disclosure` & `LLM08: Excessive Agency`)**:
   - Dangerous system command filters (`rm -rf`, `mkfs`, `dd`, fork bombs, reverse shells).
   - Strict PII detection (API keys, private keys, credit cards, emails).
   
3. **Execution Sandbox**:
   - Subprocess isolation with strict resource limits and timeouts.
   - Separate test assertion harness preventing host system compromise.

4. **API Protection**:
   - IP-based Sliding Window Rate Limiting (10-60 req/min).
   - Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.
   - UUID-based request tracing (`X-Request-ID`).

---

## 🔒 Reporting a Vulnerability

If you discover a security vulnerability within this repository, please do **NOT** open a public issue.

Please report vulnerabilities directly via:
- **Email:** `security@aiworkflowstudio.dev` or GitHub Security Advisories
- Provide reproduction steps and proof-of-concept where possible.
- You will receive an initial response within 24-48 hours.
