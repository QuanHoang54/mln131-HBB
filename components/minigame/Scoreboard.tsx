"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Trophy } from "lucide-react";

interface Team { name: string; color: string; score: number; banh: { thuong: number; dep: number; hiem: number }; inventory: Record<string, number>; }
interface Room { teams: Record<string, Team>; players: Record<string, { name: string; teamId: string | null; bags: number }>; }

const MEDALS = ["🥇", "🥈", "🥉"];
const COLOR_MAP: Record<string, string> = {
  red: "border-red-300 bg-red-50",
  blue: "border-blue-300 bg-blue-50",
  yellow: "border-yellow-300 bg-yellow-50",
};

interface Props { roomCode: string; onPlayAgain: () => void; }

export default function Scoreboard({ roomCode, onPlayAgain }: Props) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), (snap) => {
      if (snap.exists()) setRoom(snap.val() as Room);
    });
    return unsub;
  }, [roomCode]);

  if (!room) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const sorted = Object.entries(room.teams || {}).sort(([, a], [, b]) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="max-w-lg mx-auto p-4 space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="font-serif text-2xl font-semibold">Kết thúc!</h2>
        {winner && (
          <p className="text-muted-foreground">
            🎉 <strong>{winner[1].name}</strong> chiến thắng với <strong>{winner[1].score} điểm</strong>!
          </p>
        )}
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 h-28">
        {sorted.slice(0, 3).map(([tid, team], i) => {
          const heights = ["h-28", "h-20", "h-14"];
          const colorClass = COLOR_MAP[team.color] || "border-gray-300 bg-gray-50";
          return (
            <div key={tid} className={`flex-1 flex flex-col items-center justify-end ${heights[i]}`}>
              <p className="text-2xl mb-1">{MEDALS[i]}</p>
              <div className={`w-full rounded-t-lg border-2 ${colorClass} flex flex-col items-center justify-center p-1 ${heights[i]}`}>
                <p className="text-xs font-semibold text-center leading-tight">{team.name}</p>
                <p className="text-lg font-bold">{team.score}đ</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed scores */}
      <div className="space-y-3">
        {sorted.map(([tid, team], i) => (
          <Card key={tid} className={`border-2 ${COLOR_MAP[team.color] || ""}`}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  {MEDALS[i] || "🏅"} {team.name}
                </span>
                <span className="text-xl font-bold text-primary">{team.score}đ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {team.banh?.hiem > 0 && <span>🏆 Bánh Hiếm ×{team.banh.hiem} (×4đ)</span>}
                {team.banh?.dep > 0 && <span>✨ Bánh Đẹp ×{team.banh.dep} (×2đ)</span>}
                {team.banh?.thuong > 0 && <span>🍃 Bánh Thường ×{team.banh.thuong} (×1đ)</span>}
                {!team.banh?.hiem && !team.banh?.dep && !team.banh?.thuong && (
                  <span className="italic">Chưa gói được bánh nào</span>
                )}
              </div>
              {/* Members */}
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(room.players || {})
                  .filter(([, p]) => p.teamId === tid)
                  .map(([pid, p]) => (
                    <span key={pid} className="text-xs bg-background/80 border border-border rounded-full px-2 py-0.5">{p.name}</span>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4 text-center">
          <p className="font-serif text-sm text-foreground/80 italic leading-relaxed">
            "Không có chiếm dụng — chỉ có 54 dân tộc từ một bọc trứng, cùng xây một Việt Nam."
          </p>
        </CardContent>
      </Card>

      <Button onClick={onPlayAgain} className="w-full gap-2" variant="outline">
        <RotateCcw className="w-4 h-4" />
        Chơi lại
      </Button>
    </div>
  );
}
