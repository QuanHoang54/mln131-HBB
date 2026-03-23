"use client";

import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

interface Team { name: string; color: string; score: number; banh: { thuong: number; dep: number; hiem: number }; inventory: Record<string, number>; }
interface Room { teams: Record<string, Team>; players: Record<string, { name: string; teamId: string | null; bags: number }>; }

const MEDAL_IMGS = [
  "/pictures/gold-medal.png",
  "/pictures/silver-medal.png",
  "/pictures/bronze-medal.png",
];

// Per-rank card styles for detail list
const RANK_CARD: Record<number, string> = {
  0: "border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg shadow-amber-200/50",
  1: "border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50 shadow-md shadow-slate-200/40",
  2: "border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50/60 shadow-md",
};
const RANK_SCORE: Record<number, string> = {
  0: "text-2xl font-extrabold text-amber-600",
  1: "text-xl font-bold text-slate-600",
  2: "text-xl font-bold text-orange-600",
};

// Podium column styles (display order: 2nd left, 1st center, 3rd right)
const PODIUM_COL = [
  { bg: "from-slate-400 to-gray-500",   height: "h-24", medal: 32, textColor: "text-white", ringColor: "ring-slate-400"  }, // 2nd
  { bg: "from-amber-400 to-yellow-500", height: "h-32", medal: 40, textColor: "text-white", ringColor: "ring-amber-400"  }, // 1st
  { bg: "from-orange-400 to-amber-500", height: "h-16", medal: 28, textColor: "text-white", ringColor: "ring-orange-400" }, // 3rd
];

function calcScore(banh: { thuong: number; dep: number; hiem: number } | undefined): number {
  if (!banh) return 0;
  return (banh.thuong ?? 0) * 1 + (banh.dep ?? 0) * 2 + (banh.hiem ?? 0) * 4;
}

interface Props { roomCode: string; onPlayAgain: () => void; }

export default function Scoreboard({ roomCode, onPlayAgain }: Props) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    // Game is over — one-time read is enough, no need for persistent listener
    get(ref(db, `rooms/${roomCode}`)).then((snap) => {
      if (snap.exists()) setRoom(snap.val() as Room);
    });
  }, [roomCode]);

  if (!room) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const sorted = Object.entries(room.teams || {}).sort(([, a], [, b]) => calcScore(b.banh) - calcScore(a.banh));
  const winner = sorted[0];

  // Classic podium order: 2nd (left), 1st (center), 3rd (right)
  const podiumDisplay: Array<{ entry: [string, Team]; rank: number; col: typeof PODIUM_COL[0] }> = [];
  const rankToCol = [1, 0, 2]; // rank 0→col 1 (center), rank 1→col 0 (left), rank 2→col 2 (right)
  [sorted[1], sorted[0], sorted[2]].forEach((entry, colIdx) => {
    if (!entry) return;
    const rank = [1, 0, 2][colIdx]; // colIdx 0=left(2nd), 1=center(1st), 2=right(3rd)
    podiumDisplay.push({ entry, rank, col: PODIUM_COL[colIdx] });
  });
  void rankToCol;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* ── Header ── */}
      <div className="text-center space-y-3 pt-2">
        <Image src="/pictures/podium.png" alt="podium" width={96} height={96} className="mx-auto object-contain drop-shadow-md" />
        <h2 className="font-serif text-3xl font-bold tracking-tight">🎉 Kết thúc!</h2>
        {winner && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-300 shadow-sm">
            <Image src={MEDAL_IMGS[0]} alt="gold" width={20} height={20} className="object-contain" />
            <span className="text-sm font-semibold text-amber-800">
              {winner[1].name} chiến thắng với <strong>{calcScore(winner[1].banh)} điểm</strong>!
            </span>
          </div>
        )}
      </div>

      {/* ── Podium (classic 2nd / 1st / 3rd) ── */}
      <div className="flex items-end justify-center gap-3">
        {podiumDisplay.map(({ entry: [tid, team], rank, col }) => (
          <div key={tid} className={`flex-1 flex flex-col items-center justify-end ${col.height}`}>
            {/* Medal */}
            <Image
              src={MEDAL_IMGS[rank]}
              alt={`hạng ${rank + 1}`}
              width={col.medal}
              height={col.medal}
              className="object-contain mb-1.5 drop-shadow"
            />
            {/* Podium block */}
            <div
              className={`w-full rounded-t-xl bg-gradient-to-b ${col.bg} ${col.height} flex flex-col items-center justify-center px-2 py-2 ring-2 ${col.ringColor} ring-inset`}
            >
              <p className={`text-xs font-bold text-center leading-tight ${col.textColor} drop-shadow`}>{team.name}</p>
              <p className={`font-extrabold leading-none mt-1 drop-shadow ${col.textColor} ${rank === 0 ? "text-2xl" : "text-lg"}`}>
                {calcScore(team.banh)} Điểm
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Detailed scores ── */}
      <div className="space-y-3">
        {sorted.map(([tid, team], i) => {
          const cardClass = RANK_CARD[i] ?? "border border-border/50 bg-muted/20";
          const scoreClass = RANK_SCORE[i] ?? "text-lg font-bold text-primary";
          return (
            <Card key={tid} className={cardClass}>
              <CardContent className="px-4 pt-4 pb-3">
                {/* Row 1: rank + name + score */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    {MEDAL_IMGS[i] ? (
                      <Image src={MEDAL_IMGS[i]} alt={`hạng ${i + 1}`} width={24} height={24} className="object-contain shrink-0" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 1}.</span>
                    )}
                    <span className="font-semibold text-base">{team.name}</span>
                  </div>
                  <span className={scoreClass}>{calcScore(team.banh)} Điểm</span>
                </div>

                {/* Row 2: bread breakdown as chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {team.banh?.hiem > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                      🏆 Tinh hoa ×{team.banh.hiem} <span className="text-amber-500">(+4đ)</span>
                    </span>
                  )}
                  {team.banh?.dep > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                      ✨ Hoàn thiện ×{team.banh.dep} <span className="text-blue-500">(+2đ)</span>
                    </span>
                  )}
                  {team.banh?.thuong > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                      🍃 Truyền thống ×{team.banh.thuong} <span className="text-gray-400">(+1đ)</span>
                    </span>
                  )}
                  {!team.banh?.hiem && !team.banh?.dep && !team.banh?.thuong && (
                    <span className="text-xs text-muted-foreground italic px-1">Chưa gói được bánh nào</span>
                  )}
                </div>

                {/* Row 3: members */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(room.players || {})
                    .filter(([, p]) => p.teamId === tid)
                    .map(([pid, p]) => (
                      <span key={pid} className="text-xs bg-white/70 border border-border/50 rounded-full px-2.5 py-0.5 shadow-sm">
                        {p.name}
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Quote ── */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4 text-center">
          <p className="font-serif text-sm text-foreground/80 italic leading-relaxed">
            "Không có chiếm dụng — chỉ có 54 dân tộc từ một bọc trứng, cùng xây một Việt Nam."
          </p>
        </CardContent>
      </Card>

      {/* ── Play again ── */}
      <Button
        onClick={onPlayAgain}
        className="w-full gap-2 h-11 text-sm font-semibold border-2"
        variant="outline"
      >
        <RotateCcw className="w-4 h-4" />
        Chơi lại
      </Button>
    </div>
  );
}
