# Audio visualization

Both APIs resolve their session like every other consumer: explicit argument/prop, or the surrounding [provider](provider.md).

## `useAudioLevels(session?, fps?)`

Polled `{ input, output }` RMS levels in `[0, 1]` — `input` is the microphone, `output` is the agent's voice. Defaults to 20 samples per second; raise `fps` for snappier meters, lower it to save work. Both are `0` before the session connects.

```tsx
function MicMeter() {
  const { input } = useAudioLevels();
  return (
    <div style={{ width: 120, background: "#eee" }}>
      <div style={{ width: `${input * 100}%`, height: 8, background: "#22c55e" }} />
    </div>
  );
}
```

## `<AgentAudioVisualizer />`

Canvas frequency bars for the agent's voice, animated with `requestAnimationFrame`. Bars are colored by the canvas's CSS `color`, so it themes like text:

```tsx
<AgentAudioVisualizer bars={32} width={320} height={80} className="agent-bars" />
```

```css
.agent-bars {
  color: var(--accent);
}
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `session` | `AgentSession \| null` | provider's | Explicit session, or omit to use the provider. |
| `bars` | `number` | `24` | Number of frequency bars. |
| `width` / `height` | `number` | `240` / `64` | Canvas size in pixels. |
| `className` | `string` | — | Passed to the `<canvas>`; set `color` through it to theme the bars. |

For a fully custom visualizer, read the session's analyser data directly: `getOutputFrequencyData()` / `getInputFrequencyData()` return `Uint8Array` FFT bins — see the [session API](../sessions.md#session-api).
