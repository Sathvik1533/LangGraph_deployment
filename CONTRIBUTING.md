# Contributing to AI Workflow Studio (LangGraph Agent Deployment)

Thank you for your interest in contributing! We welcome contributions to our multi-agent orchestration platform, guardrails engine, and real-time visualization tooling.

---

## 🚀 Quick Setup

### 1. Fork & Clone
```bash
git clone https://github.com/Sathvik1533/LangGraph_deployment.git
cd LangGraph_deployment
```

### 2. Environment Setup
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
```

### 3. Configure Secrets
```bash
cp .env.example .env
# Add your GROQ_API_KEY or other required keys
```

### 4. Run Development Server
```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

---

## 🧪 Testing Guidelines

Before submitting any Pull Request, ensure all tests pass:

```bash
# Run backend test suite
pytest tests/ -v

# Run with coverage report
pytest --cov=app --cov=agent --cov=guardrails tests/
```

---

## 📝 Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature or capability
- `fix:` Bug fix or defect correction
- `docs:` Documentation improvements
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring without behavior changes
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates

---

## 🔄 Pull Request Process

1. Create a descriptive branch from `main`: `git checkout -b feat/your-feature-name`
2. Implement your changes following established coding patterns.
3. Write automated tests in `tests/` covering your new functionality.
4. Ensure linting and tests pass: `flake8` and `pytest`.
5. Open a Pull Request referencing any related issues.
