import { AgentSession } from "@fishaudio/agent-client";

const agentIdInput = document.getElementById("agent-id") as HTMLInputElement;
const startButton = document.getElementById("start") as HTMLButtonElement;
const endButton = document.getElementById("end") as HTMLButtonElement;
const muteButton = document.getElementById("mute") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;
const errorEl = document.getElementById("error")!;
const transcriptEl = document.getElementById("transcript")!;

let session: AgentSession | null = null;

function setInCall(inCall: boolean): void {
  startButton.disabled = inCall;
  endButton.disabled = !inCall;
  muteButton.disabled = !inCall;
  muteButton.textContent = "Mute";
}

// Both transcript events carry the full segment text so far; render one line
// per segmentId and replace its text as updates stream in.
function upsertLine(segmentId: string, role: "user" | "agent", text: string): void {
  const id = `seg-${segmentId}`;
  let line = document.getElementById(id);
  if (!line) {
    line = document.createElement("p");
    line.id = id;
    line.className = role;
    transcriptEl.appendChild(line);
  }
  line.textContent = `${role === "user" ? "You" : "Agent"}: ${text}`;
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

startButton.addEventListener("click", async () => {
  const agentId = agentIdInput.value.trim();
  if (!agentId) {
    errorEl.textContent = "Enter an agent id first.";
    return;
  }
  errorEl.textContent = "";
  transcriptEl.replaceChildren();
  startButton.disabled = true;
  try {
    session = await AgentSession.start({
      agentId,
      callbacks: {
        onStatusChange: (status) => (statusEl.textContent = status),
        onUserTranscript: ({ segmentId, text }) => upsertLine(segmentId, "user", text),
        onAgentResponseDelta: ({ segmentId, text }) => upsertLine(segmentId, "agent", text),
        onError: (error) => (errorEl.textContent = `${error.code}: ${error.message}`),
        onDisconnect: ({ reason }) => {
          statusEl.textContent = `ended (${reason})`;
          session = null;
          setInCall(false);
        },
      },
    });
    setInCall(true);
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : String(error);
    statusEl.textContent = "idle";
    setInCall(false);
  }
});

endButton.addEventListener("click", () => {
  void session?.end();
});

muteButton.addEventListener("click", async () => {
  if (!session) return;
  const muted = !session.micMuted;
  try {
    await session.setMicMuted(muted);
    muteButton.textContent = muted ? "Unmute" : "Mute";
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : String(error);
  }
});
