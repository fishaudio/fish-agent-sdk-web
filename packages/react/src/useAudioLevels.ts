import type { AgentSession } from "@fishaudio/agent-client";
import { useEffect, useState } from "react";
import { useOptionalAgentSessionContext } from "./provider.js";

export interface AudioLevels {
  /** Microphone RMS in [0, 1]. */
  input: number;
  /** Agent audio RMS in [0, 1]. */
  output: number;
}

/** Polls session audio levels for meters/animations. */
export function useAudioLevels(session?: AgentSession | null, fps = 20): AudioLevels {
  const context = useOptionalAgentSessionContext();
  const active = session !== undefined ? session : (context?.session ?? null);
  const [levels, setLevels] = useState<AudioLevels>({ input: 0, output: 0 });

  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = setInterval(
      () => {
        setLevels({ input: active.getInputVolume(), output: active.getOutputVolume() });
      },
      Math.max(1000 / fps, 16),
    );
    return () => {
      clearInterval(timer);
    };
  }, [active, fps]);

  return levels;
}
