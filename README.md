
# Climate Policy Debate Simulator

An AI-powered multi-agent debate simulator using FastAPI and Ollama to orchestrate local LLMs in a structured discussion about global climate policies.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/JAHNAVISINDHU/climate-debate-simulator)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-white?logo=ollama)](https://ollama.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🚀 Overview

The **Climate Policy Debate Simulator** leverages a multi-agent architecture where different AI personas (representing various geopolitical entities) debate complex climate topics. The system uses local LLMs via Ollama to ensure data privacy and high-speed local inference.

### Key Features
- **Multi-Agent Orchestration**: Different agents represent specific regional interests (USA, EU, China).
- **Local Inference**: Runs entirely on your hardware using Ollama—no API keys required.
- **Real-time Simulation**: Watch agents respond to each other's arguments dynamically.
- **Policy Grounding**: Agents utilize pre-defined policy documents to inform their arguments.

---

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.10+)
- **LLM Engine**: Ollama (Llama 3 8B)
- **Environment**: Docker & Docker Compose
- **Frontend**: Responsive HTML/JS interface for real-time debate visualization

---

## 📂 Project Structure

```text
climate-debate-simulator/
├── app/
│   ├── main.py             # FastAPI entry point
│   ├── agents/             # Agent logic and prompt templates
│   ├── policies/           # Country-specific policy JSON/Text files
│   └── static/             # Frontend assets (HTML/CSS/JS)
├── docker-compose.yml      # Service orchestration
├── Dockerfile              # App containerization
└── .env.example            # Environment configuration
````

-----

## ⚡ Quick Start

### Prerequisites

  - **Docker Desktop** installed and running.
  - Minimum 8GB RAM (16GB recommended for Llama 3).

### Steps

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/JAHNAVISINDHU/climate-debate-simulator.git](https://github.com/JAHNAVISINDHU/climate-debate-simulator.git)
    cd climate-debate-simulator
    ```

2.  **Setup Environment:**

    ```bash
    copy .env.example .env
    ```

3.  **Start the Services:**

    ```bash
    docker-compose up -d --build
    ```

4.  **Pull the LLM Model:**

    ```bash
    docker exec climate_debate_ollama ollama pull llama3:8b
    ```

5.  **Access the Simulator:**
    Navigate to: [http://localhost:8000](https://www.google.com/search?q=http://localhost:8000)

-----

## 🔗 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Web frontend / UI |
| `GET` | `/health` | Service health status |
| `GET` | `/policies/{code}` | Fetch policy docs (e.g., `usa`, `eu`, `china`) |
| `POST` | `/debate/start` | Trigger a new debate simulation |

### Debate Request Example

```json
{
  "topic": "Carbon tariffs on developing nations should be abolished",
  "rounds": 2
}
```

-----

## 🤖 Agent Personas

The simulator includes specialized prompts for:

  - **United States**: Focuses on innovation, economic leadership, and domestic policy balance.
  - **European Union**: Prioritizes regulatory frameworks, Carbon Border Adjustment Mechanisms (CBAM), and sustainability.
  - **China**: Focuses on manufacturing transition, developing nation rights, and long-term infrastructure.

-----

## 🔧 Troubleshooting

  - **Ollama Connection Refused**: Ensure the `climate_debate_ollama` container is fully started before running the `ollama pull` command.
  - **Slow Responses**: Running 8B models requires a decent CPU/GPU. If the simulation times out, try using a smaller model like `phi3` or `tinyllama`.
  - **Port Conflict**: If port `8000` or `11434` is taken, update the mapping in `docker-compose.yml`.

-----

**Developed by [Jahnavi Sindhu](https://www.google.com/search?q=https://github.com/JAHNAVISINDHU)**
