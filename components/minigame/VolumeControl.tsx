"use client";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { useState } from "react";

interface Props { audioRef: { current: HTMLAudioElement | null } }

export default function VolumeControl({ audioRef }: Props) {
  const [volume, setVolume] = useState(0.4);
  const [muted, setMuted]   = useState(false);

  function toggleMute() {
    const next = !muted;
    if (audioRef.current) audioRef.current.muted = next;
    setMuted(next);
  }

  function handleSlider(v: number) {
    setVolume(v);
    if (!audioRef.current) return;
    audioRef.current.volume = v;
    const shouldMute = v === 0;
    if (shouldMute !== muted) { audioRef.current.muted = shouldMute; setMuted(shouldMute); }
  }

  const Icon = (muted || volume === 0) ? VolumeX : volume < 0.35 ? Volume1 : Volume2;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border/60 rounded-full px-3 py-2 shadow-xl">
      <button onClick={toggleMute} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
        <Icon className="w-4 h-4" />
      </button>
      <input
        type="range" min={0} max={1} step={0.05}
        value={muted ? 0 : volume}
        onChange={e => handleSlider(Number(e.target.value))}
        className="w-20 accent-primary cursor-pointer"
      />
      <span className="text-xs text-muted-foreground w-7 text-right tabular-nums">
        {muted ? "0%" : `${Math.round(volume * 100)}%`}
      </span>
    </div>
  );
}
