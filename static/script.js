// ── Climate Debate Simulator — script.js ──────────────────────────────────

const FLAGS = { USA: "🇺🇸", EU: "🇪🇺", China: "🇨🇳" };

// ── Range slider live update
const roundsInput = document.getElementById("roundsInput");
const roundsVal   = document.getElementById("roundsVal");
roundsInput.addEventListener("input", () => {
  roundsVal.textContent = roundsInput.value;
});

// ── Quick topic fill
function setTopic(text) {
  document.getElementById("topicInput").value = text;
}

// ── Main debate launch
async function startDebate() {
  const topic  = document.getElementById("topicInput").value.trim();
  const rounds = parseInt(roundsInput.value, 10);

  if (!topic) {
    showError("Please enter a debate topic before launching.");
    return;
  }

  const startBtn = document.getElementById("startBtn");
  const progressWrap = document.getElementById("progressWrap");
  const progressBar  = document.getElementById("progressBar");
  const progressLabel = document.getElementById("progressLabel");
  const transcriptArea = document.getElementById("transcriptArea");
  const debateMeta = document.getElementById("debateMeta");

  // Reset UI
  startBtn.disabled = true;
  startBtn.querySelector(".btn-text").textContent = "Simulating…";
  transcriptArea.innerHTML = "";
  progressWrap.style.display = "flex";
  progressBar.style.width = "10%";
  progressLabel.textContent = "Contacting AI agents…";
  debateMeta.textContent = "";

  try {
    progressBar.style.width = "30%";
    progressLabel.textContent = `Running ${rounds} round(s) × 3 agents…`;

    const response = await fetch("/debate/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, rounds })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }

    progressBar.style.width = "80%";
    progressLabel.textContent = "Rendering transcript…";

    const data = await response.json();
    const messages = data.messages || [];

    progressBar.style.width = "100%";
    progressLabel.textContent = `Complete — ${messages.length} statements rendered`;

    renderTranscript(messages, topic, rounds);

    debateMeta.textContent = `${rounds} round${rounds > 1 ? "s" : ""} · ${messages.length} statements`;

  } catch (err) {
    transcriptArea.innerHTML = `<div class="error-banner">⚠ ${err.message}</div>`;
  } finally {
    startBtn.disabled = false;
    startBtn.querySelector(".btn-text").textContent = "Launch Debate";
    setTimeout(() => { progressWrap.style.display = "none"; }, 2000);
  }
}

// ── Render full transcript
function renderTranscript(messages, topic, rounds) {
  const area = document.getElementById("transcriptArea");
  area.innerHTML = "";

  // Topic header
  const topicEl = document.createElement("div");
  topicEl.style.cssText = "padding:0.75rem 1rem;background:var(--surface2);border-radius:8px;border:1px solid var(--border);margin-bottom:0.5rem";
  topicEl.innerHTML = `<span style="font-family:var(--mono);font-size:0.65rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:0.25rem">Topic</span><span style="font-size:0.92rem;color:var(--text)">${escapeHtml(topic)}</span>`;
  area.appendChild(topicEl);

  let lastRound = 0;

  messages.forEach((msg, idx) => {
    if (msg.round !== lastRound) {
      lastRound = msg.round;
      const divider = document.createElement("div");
      divider.className = "round-divider";
      divider.innerHTML = `<span class="round-label">Round ${msg.round} of ${rounds}</span>`;
      area.appendChild(divider);
    }

    const card = buildMessageCard(msg, idx);
    area.appendChild(card);
  });

  // Scroll to bottom
  area.scrollTop = area.scrollHeight;
}

// ── Build a single message card
function buildMessageCard(msg, idx) {
  const agentKey = msg.agent; // "USA", "EU", "China"
  const agentClass = agentKey.toLowerCase();
  const flag = FLAGS[agentKey] || "🌐";
  const timeStr = formatTime(msg.timestamp);

  const card = document.createElement("div");
  card.className = `message-card ${agentClass}`;
  card.style.animationDelay = `${idx * 0.06}s`;

  card.innerHTML = `
    <div class="msg-header">
      <span class="msg-flag">${flag}</span>
      <span class="msg-agent">${escapeHtml(msg.agent)}</span>
      <span class="msg-stance stance-${msg.stance}">${msg.stance}</span>
      <span class="msg-time">${timeStr}</span>
    </div>
    <div class="msg-body">${escapeHtml(msg.message)}</div>
  `;

  return card;
}

// ── View Policy Modal
async function viewPolicy(countryCode) {
  const modal = document.getElementById("policyModal");
  const content = document.getElementById("modalContent");

  content.innerHTML = `<p style="color:var(--text-muted);font-family:var(--mono);font-size:0.8rem">Loading policy…</p>`;
  modal.classList.add("active");

  try {
    const res = await fetch(`/policies/${countryCode}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const policy = await res.json();
    content.innerHTML = renderPolicyModal(policy);
  } catch (err) {
    content.innerHTML = `<div class="error-banner">Failed to load policy: ${err.message}</div>`;
  }
}

function renderPolicyModal(policy) {
  const country = policy.country || "Unknown";
  const positions = (policy.key_positions || []).map(p => `<li>${escapeHtml(p)}</li>`).join("");
  const redLines  = (policy.red_lines  || []).map(r => `<li>${escapeHtml(r)}</li>`).join("");
  const summary   = policy.stance_summary ? `<div class="stance-summary">${escapeHtml(policy.stance_summary)}</div>` : "";
  const rank   = policy.current_emissions_rank   || "N/A";
  const invest = policy.gdp_green_investment_percent ? `${policy.gdp_green_investment_percent}%` : "N/A";
  const nz     = policy.net_zero_target_year     || "N/A";

  return `
    <h3>${getFlagEmoji(country)} ${escapeHtml(country)} Policy Brief</h3>
    <h4>Key Positions</h4>
    <ul>${positions}</ul>
    <h4>Red Lines</h4>
    <ul>${redLines}</ul>
    ${summary}
    <div class="policy-meta">
      <div class="meta-item"><span class="meta-label">Emissions Rank</span><span class="meta-val">#${rank}</span></div>
      <div class="meta-item"><span class="meta-label">Green Investment</span><span class="meta-val">${invest}</span></div>
      <div class="meta-item"><span class="meta-label">Net Zero Target</span><span class="meta-val">${nz}</span></div>
    </div>
  `;
}

function getFlagEmoji(country) {
  const map = { USA: "🇺🇸", EU: "🇪🇺", China: "🇨🇳" };
  return map[country] || "🌍";
}

function closeModal() {
  document.getElementById("policyModal").classList.remove("active");
}

// Close modal on Escape
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

// ── Helpers
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch { return iso; }
}

function showError(msg) {
  const area = document.getElementById("transcriptArea");
  area.innerHTML = `<div class="error-banner">⚠ ${msg}</div>`;
}
