import os
import json
import httpx
import random
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Climate Policy Debate Simulator")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "llama3:8b")
POLICIES_DIR = Path("data/policies")

AGENTS = ["USA", "EU", "China"]

SYSTEM_PROMPTS = {
    "USA": """You are a senior US diplomat representing the United States in a formal climate policy debate.
You must stay strictly in character. Your positions are driven by:
- Market-driven, innovation-led solutions
- Economic competitiveness and protecting American jobs
- Technology investment (nuclear, renewables, CCS)
- Voluntary international cooperation, not binding mandates
- Skepticism of agreements that disadvantage the US economically

Speak with authority, confidence, and patriotism. Reference specific US initiatives when relevant.
Be assertive and sometimes push back on the EU's binding mandates or China's 'differentiated responsibilities' framing.
Keep your response to 3-4 concise, impactful sentences.""",

    "EU": """You are a senior European Union diplomat representing the EU bloc in a formal climate policy debate.
You must stay strictly in character. Your positions are driven by:
- The European Green Deal and achieving climate neutrality by 2050
- Binding international agreements and enforcement mechanisms
- Carbon pricing and the Carbon Border Adjustment Mechanism (CBAM)
- Urgency — the 1.5°C target must be defended at all costs
- Leadership through regulation and international diplomacy

Speak with moral authority, urgency, and technical precision. You are the most progressive voice in the room.
Frequently challenge weaker commitments from the USA or China.
Keep your response to 3-4 concise, impactful sentences.""",

    "China": """You are a senior Chinese diplomat representing the People's Republic of China in a formal climate policy debate.
You must stay strictly in character. Your positions are driven by:
- Common but differentiated responsibilities (developed nations must act first)
- China's sovereign right to develop economically while transitioning to green energy
- Opposition to carbon tariffs as trade protectionism
- Demanding climate finance and technology transfer from developed nations
- Highlighting China's massive renewable energy investments as evidence of commitment

Speak with measured confidence, strategic patience, and firm principle.
Push back strongly on EU carbon tariffs and US lectures about responsibility.
Keep your response to 3-4 concise, impactful sentences."""
}


def load_policy(country_code: str) -> dict:
    filename = f"{country_code.lower()}_policy.json"
    filepath = POLICIES_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Policy for '{country_code}' not found.")
    with open(filepath, "r") as f:
        return json.load(f)


def classify_stance(text: str) -> str:
    text_lower = text.lower()
    supportive_words = ["support", "agree", "commend", "endorse", "welcome", "encourage", "propose", "commit", "invest", "lead", "proud", "opportunity"]
    opposed_words = ["oppose", "reject", "disagree", "cannot accept", "unfair", "protectionist", "wrong", "challenge", "criticize", "unacceptable", "must not", "demand"]
    
    s_score = sum(1 for w in supportive_words if w in text_lower)
    o_score = sum(1 for w in opposed_words if w in text_lower)
    
    if o_score > s_score:
        return "opposed"
    elif s_score > o_score:
        return "supportive"
    else:
        return "neutral"


async def call_ollama(agent: str, topic: str, history: list[dict], policy: dict) -> str:
    policy_summary = json.dumps({
        "key_positions": policy.get("key_positions", []),
        "red_lines": policy.get("red_lines", []),
        "stance_summary": policy.get("stance_summary", "")
    }, indent=2)

    history_text = ""
    if history:
        history_text = "\n\nDebate so far:\n"
        for msg in history[-6:]:  # last 6 messages for context
            history_text += f"{msg['agent']}: {msg['message']}\n"

    user_prompt = f"""Topic: {topic}

Your policy brief:
{policy_summary}
{history_text}
Now give your position on this topic as the {agent} representative."""

    payload = {
        "model": LLM_MODEL_NAME,
        "prompt": f"{SYSTEM_PROMPTS[agent]}\n\n{user_prompt}",
        "stream": False,
        "options": {
            "temperature": 0.8,
            "num_predict": 200
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()
    except Exception as e:
        # Fallback response if Ollama is unavailable
        fallbacks = {
            "USA": f"The United States firmly believes that innovation and market-driven solutions are the most effective path forward on {topic}. We have committed billions to clean energy R&D and will not accept agreements that disadvantage American workers.",
            "EU": f"The European Union insists that binding commitments are non-negotiable when addressing {topic}. Voluntary pledges have repeatedly failed — we need enforceable targets with real consequences.",
            "China": f"China has invested more in renewable energy than any other nation, and we will not accept lectures on {topic} from historical emitters. Developed nations must first honor their climate finance pledges before imposing new conditions."
        }
        return fallbacks[agent]


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/policies/{country_code}")
async def get_policy(country_code: str):
    valid = {"usa", "eu", "china"}
    if country_code.lower() not in valid:
        raise HTTPException(status_code=404, detail=f"Country code must be one of: {', '.join(valid)}")
    return load_policy(country_code)


class DebateRequest(BaseModel):
    topic: str
    rounds: int = Field(..., ge=1, le=5)


@app.post("/debate/start")
async def start_debate(request: DebateRequest):
    messages = []
    history = []

    # Preload all policies
    policies = {
        "USA": load_policy("usa"),
        "EU": load_policy("eu"),
        "China": load_policy("china")
    }

    for round_num in range(1, request.rounds + 1):
        for agent in AGENTS:
            content = await call_ollama(agent, request.topic, history, policies[agent])
            if not content:
                content = f"The {agent} delegation has no further comment at this time."

            stance = classify_stance(content)
            timestamp = datetime.now(timezone.utc).isoformat()

            entry = {
                "round": round_num,
                "agent": agent,
                "message": content,
                "stance": stance,
                "timestamp": timestamp
            }
            messages.append(entry)
            history.append({"agent": agent, "message": content})

    return {"messages": messages}


# ── Static files (must be last) ──────────────────────────────────────────────

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/index.html")
