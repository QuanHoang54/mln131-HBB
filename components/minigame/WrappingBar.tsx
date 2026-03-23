"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

export type WrapResult = "thuong" | "dep" | "hiem";

interface Zone { start: number; end: number; type: WrapResult; }

interface Props {
  onResult: (result: WrapResult) => void;
  onCancel: () => void;
}

function generateZones(): Zone[] {
  // Total: 100 units. Hiếm: 10%, Đẹp: 20%, Thường: 70%
  // Randomize position of the Đẹp+Hiếm cluster within the bar
  const clusterWidth = 30; // Đẹp(20) + Hiếm(10)
  const clusterStart = Math.floor(Math.random() * (100 - clusterWidth - 10)) + 5;
  const depStart = clusterStart;
  const hiemStart = clusterStart + 20;

  return [
    { start: depStart, end: depStart + 20, type: "dep" },
    { start: hiemStart, end: hiemStart + 10, type: "hiem" },
  ];
}

function getZoneAt(pos: number, zones: Zone[]): WrapResult {
  for (const z of zones) {
    if (pos >= z.start && pos <= z.end) return z.type;
  }
  return "thuong";
}

const RESULT_CONFIG = {
  thuong: { label: "Bánh Thường 🍃", points: 1, color: "bg-gray-100 border-gray-300 text-gray-700", emoji: "🍃" },
  dep: { label: "Bánh Đẹp ✨", points: 2, color: "bg-blue-100 border-blue-300 text-blue-700", emoji: "✨" },
  hiem: { label: "Bánh Hiếm 🏆", points: 4, color: "bg-amber-100 border-amber-400 text-amber-800", emoji: "🏆" },
};

export default function WrappingBar({ onResult, onCancel }: Props) {
  const [zones] = useState<Zone[]>(generateZones);
  const [pos, setPos] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [result, setResult] = useState<WrapResult | null>(null);
  const dirRef = useRef(1);
  const posRef = useRef(0);
  const stoppedRef = useRef(false);

  const tick = useCallback(() => {
    if (stoppedRef.current) return;
    posRef.current += dirRef.current * 1.5;
    if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1; }
    if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
    // Speed up slightly in hiem zone
    const zone = getZoneAt(posRef.current, zones);
    const speed = zone === "hiem" ? 2.5 : 1.5;
    posRef.current = Math.min(100, Math.max(0, posRef.current + (dirRef.current * (speed - 1.5))));
    setPos(posRef.current);
  }, [zones]);

  useEffect(() => {
    const id = setInterval(tick, 16);
    return () => clearInterval(id);
  }, [tick]);

  function stop() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    setStopped(true);
    const r = getZoneAt(posRef.current, zones);
    setResult(r);
    setTimeout(() => onResult(r), 1800);
  }

  const currentZone = getZoneAt(pos, zones);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-5">
        <div className="text-center">
          <h3 className="font-serif text-xl font-semibold">🎋 Hồn Việt Trong Bánh</h3>
          <p className="text-sm text-muted-foreground mt-1">Nhấn DỪNG khi con trỏ vào vùng tốt!</p>
        </div>

        {/* Bar */}
        <div className="space-y-2">
          {/* Zone labels */}
          <div className="relative h-6 text-xs font-medium">
            {zones.map((z, i) => (
              <div
                key={i}
                className="absolute flex items-center justify-center text-center leading-none"
                style={{ left: `${z.start}%`, width: `${z.end - z.start}%` }}
              >
                <span className={z.type === "hiem" ? "text-amber-600" : "text-blue-600"}>
                  {z.type === "hiem" ? "Hiếm" : "Đẹp"}
                </span>
              </div>
            ))}
          </div>

          {/* Main bar */}
          <div className="relative h-10 rounded-full overflow-hidden border-2 border-border bg-gray-100">
            {/* Đẹp zones */}
            {zones.filter((z) => z.type === "dep").map((z, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 bg-blue-300/70"
                style={{ left: `${z.start}%`, width: `${z.end - z.start}%` }}
              />
            ))}
            {/* Hiếm zones */}
            {zones.filter((z) => z.type === "hiem").map((z, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 bg-amber-400/80"
                style={{ left: `${z.start}%`, width: `${z.end - z.start}%` }}
              />
            ))}
            {/* Pointer */}
            <div
              className={`absolute top-0 bottom-0 w-1 rounded-full shadow-lg transition-colors ${
                currentZone === "hiem" ? "bg-amber-500" : currentZone === "dep" ? "bg-blue-500" : "bg-gray-600"
              }`}
              style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">▼</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" />Thường (1đ)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-300 inline-block" />Đẹp (2đ)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Hiếm (4đ)</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-xl border-2 p-4 text-center ${RESULT_CONFIG[result].color} animate-pulse`}>
            <p className="text-2xl">{RESULT_CONFIG[result].emoji}</p>
            <p className="font-semibold text-lg mt-1">{RESULT_CONFIG[result].label}</p>
            <p className="text-sm">+{RESULT_CONFIG[result].points} điểm</p>
          </div>
        )}

        {/* Buttons */}
        {!stopped ? (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">Hủy</Button>
            <Button onClick={stop} className="flex-1 text-lg h-12 bg-green-600 hover:bg-green-700 text-white font-bold">
              🛑 DỪNG!
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Đang xử lý...</p>
        )}
      </div>
    </div>
  );
}
