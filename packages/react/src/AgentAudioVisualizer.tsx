import type { AgentSession } from "@fishaudio/agent-client";
import { useEffect, useRef, type ReactElement } from "react";
import { useOptionalAgentSessionContext } from "./provider.js";

export interface AgentAudioVisualizerProps {
  session?: AgentSession | null;
  bars?: number;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Frequency bars for the agent's voice, drawn from the session's analyser data
 * (no transport objects involved). Colors follow CSS `color` on the canvas.
 */
export function AgentAudioVisualizer({
  session,
  bars = 24,
  width = 240,
  height = 64,
  className,
}: AgentAudioVisualizerProps): ReactElement {
  const context = useOptionalAgentSessionContext();
  const active = session !== undefined ? session : (context?.session ?? null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) {
      return;
    }
    const context2d = canvas.getContext("2d");
    if (!context2d) {
      return;
    }

    let frame = 0;
    const draw = () => {
      const data = active.getOutputFrequencyData();
      context2d.clearRect(0, 0, canvas.width, canvas.height);
      context2d.fillStyle = getComputedStyle(canvas).color;
      const barWidth = canvas.width / bars;
      for (let index = 0; index < bars; index += 1) {
        const sample = data.length
          ? (data[Math.floor((index / bars) * data.length)] ?? 0) / 255
          : 0;
        const barHeight = Math.max(2, sample * canvas.height);
        context2d.fillRect(
          index * barWidth + barWidth * 0.15,
          (canvas.height - barHeight) / 2,
          barWidth * 0.7,
          barHeight,
        );
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [active, bars]);

  return <canvas ref={canvasRef} width={width} height={height} className={className} />;
}
