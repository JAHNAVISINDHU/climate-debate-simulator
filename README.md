# Climate Policy Debate Simulator

An AI-powered multi-agent debate simulator using FastAPI + Ollama (local LLMs).

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Windows CMD or PowerShell

### Steps

1. Copy the .env file:
```
copy .env.example .env
```

2. Start the services:
```
docker-compose up -d --build
```

3. Pull the LLM model (run once after first boot):
```
docker exec climate_debate_ollama ollama pull llama3:8b
```

4. Open your browser:
```
http://localhost:8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /policies/{country_code} | Get policy doc (usa/eu/china) |
| POST | /debate/start | Start a debate simulation |
| GET | / | Web frontend |

## Debate Request Example

```json
POST /debate/start
{
  "topic": "Carbon tariffs on developing nations should be abolished",
  "rounds": 2
}
```
