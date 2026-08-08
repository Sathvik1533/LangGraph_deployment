# LangGraph Dev/Test Agent

> Production-ready AI coding assistant using LangGraph, FastAPI, and Groq

A multi-agent system that generates, tests, and self-corrects Python code with automatic retry logic and intelligent error handling.

## Features

- **Self-Correcting Workflow**: Automatically fixes errors through conditional routing (max 3 iterations)
- **API Resilience**: Exponential backoff retry logic for network failures and rate limits
- **Conversation History**: Native LangGraph message history for context-aware code generation
- **Production-Ready**: Comprehensive error handling, logging, and safety guards

## Quick Start

### Prerequisites
- Python 3.11+
- Groq API key ([Get one here](https://console.groq.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Sathvik1533/LangGraph_deployment.git
cd LangGraph_deployment

# Install dependencies
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### Run Locally

```bash
# Start the API server
uvicorn app:app --reload

# Test with curl
curl -X POST "http://localhost:8000/agent/invoke" \
  -H "Content-Type: application/json" \
  -d '{"input": {"task": "Write a function to calculate factorial"}}'
```

Visit `http://localhost:8000/docs` for interactive API documentation.

## Architecture

```
START → Developer Agent → Tester Agent → Conditional Router
              ↑                              ↓
              └────────(if failed)───────────┘
                                             ↓
                                       (if passed) → END
```

**Key Components**:
- **Developer Agent**: Generates Python code based on task + conversation history
- **Tester Agent**: Creates test cases and executes code
- **Conditional Router**: Routes back to developer if tests fail (max 3 attempts)
- **Tenacity Retry**: Auto-retries LLM calls on network errors (exponential backoff)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/info` | GET | Agent capabilities and configuration |
| `/docs` | GET | Interactive API documentation |
| `/agent/invoke` | POST | Run the agent workflow |
| `/agent/batch` | POST | Batch processing |
| `/agent/stream` | POST | Streaming responses |

### Request/Response Format

**Request**:
```json
{
  "input": {
    "task": "Write a function to reverse a string"
  }
}
```

**Response**:
```json
{
  "output": {
    "code": "def reverse_string(s):\n    return s[::-1]",
    "report": "### EXECUTION OUTPUT:\n...",
    "execution_success": true,
    "iterations": 1
  }
}
```

## Configuration

Set these environment variables in `.env`:

```bash
GROQ_API_KEY=your_api_key_here          # Required
GROQ_MODEL=llama-3.3-70b-versatile      # Optional (default shown)
```

**Available Models**:
- `llama-3.3-70b-versatile` (default)
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`

## Deployment

### Render

1. Push to GitHub
2. Create new Web Service on Render
3. Connect this repository
4. Set environment variable: `GROQ_API_KEY`
5. Deploy with:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Other Platforms (Heroku, Railway, etc.)

Ensure `GROQ_API_KEY` is set and run:
```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

## Project Structure

```
├── agent.py           # LangGraph workflow & agent logic
├── app.py             # FastAPI application
├── requirements.txt   # Python dependencies
├── runtime.txt        # Python version
├── test_agent.py      # Testing script
└── .env              # Environment variables (not committed)
```

## Development

### Testing

```bash
# Test the agent directly
python test_agent.py

# Test specific task
python test_agent.py "Write a function to add two numbers"
```

### Configuration Options

**Max Self-Correction Iterations** (in `agent.py`):
```python
MAX_ITERATIONS = 3  # Adjust in should_continue()
```

**API Retry Settings** (in `agent.py`):
```python
llm_retry = retry(
    stop=stop_after_attempt(3),              # Max API retries
    wait=wait_exponential(min=1, max=10)     # Backoff timing
)
```

## Technical Details

### State Reducers
Messages are appended to history using LangGraph's state reducers:
```python
messages: Annotated[List[BaseMessage], add]
```

### Self-Correction Loop
The workflow uses conditional routing to automatically fix errors:
- Max 3 iterations per request
- Full conversation history preserved
- LLM sees errors and learns to fix them

### API Resilience
Tenacity handles transient failures:
- Exponential backoff (1s → 2s → 4s → 8s, max 10s)
- Retries on connection errors, timeouts, rate limits
- No retry on authentication or validation errors

## License

MIT

## Acknowledgments

Built with:
- [LangGraph](https://github.com/langchain-ai/langgraph) - Agent orchestration
- [LangChain](https://github.com/langchain-ai/langchain) - LLM framework
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [Groq](https://groq.com/) - Fast LLM inference
- [Tenacity](https://github.com/jd/tenacity) - Retry logic