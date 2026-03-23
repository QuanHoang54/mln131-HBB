"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Copy, Check, PlayCircle, StopCircle, Users, LogOut } from "lucide-react";

type IngKey = "gao" | "thit" | "dau" | "la";
interface Player { name: string; teamId: string | null; }
interface Team {
  name: string; color: string; score: number;
  bags?: number;
  questionsAnswered?: number;
  inventory: Record<IngKey, number>;
  banh: { thuong: number; dep: number; hiem: number };
  tradesCount?: number;
}
interface Room {
  host: string; phase: string; gameStartTime: number;
  teams: Record<string, Team>;
  players: Record<string, Player>;
}

const GAME_DURATION = 10 * 60 * 1000;

const ING_IMG: Record<IngKey, string> = {
  gao: "/pictures/gao.png", thit: "/pictures/thit_ba_chi.png",
  dau: "/pictures/dau.png", la:   "/pictures/la.png",
};
const ING_NAME: Record<IngKey, string> = { gao: "Gạo", thit: "Thịt", dau: "Đậu", la: "Lá" };
const ALL_INGS: IngKey[] = ["gao", "thit", "dau", "la"];

const TEAM_ACCENT: Record<string, { border: string; header: string }> = {
  red:    { border: "border-red-300",    header: "bg-red-50"    },
  blue:   { border: "border-blue-300",   header: "bg-blue-50"   },
  yellow: { border: "border-yellow-300", header: "bg-yellow-50" },
  green:  { border: "border-green-300",  header: "bg-green-50"  },
  orange: { border: "border-orange-300", header: "bg-orange-50" },
  purple: { border: "border-purple-300", header: "bg-purple-50" },
  pink:   { border: "border-pink-300",   header: "bg-pink-50"   },
  brown:  { border: "border-amber-400",  header: "bg-amber-50"  },
  teal:   { border: "border-teal-300",   header: "bg-teal-50"   },
  silver: { border: "border-slate-300",  header: "bg-slate-50"  },
  black:  { border: "border-zinc-400",   header: "bg-zinc-100"  },
  tiger:  { border: "border-yellow-500", header: "bg-yellow-50" },
};
function calcScore(banh: { thuong: number; dep: number; hiem: number } | undefined): number {
  if (!banh) return 0;
  return (banh.thuong ?? 0) * 1 + (banh.dep ?? 0) * 2 + (banh.hiem ?? 0) * 4;
}

const ING_CHIP: Record<IngKey, string> = {
  gao:  "bg-yellow-50 border-yellow-300",
  thit: "bg-red-50 border-red-300",
  dau:  "bg-green-50 border-green-300",
  la:   "bg-emerald-50 border-emerald-300",
};

interface Props { roomCode: string; onLeave: () => void; }

export default function AdminDashboard({ roomCode, onLeave }: Props) {
  const [room, setRoom]     = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), snap => {
      if (snap.exists()) {
        const data = snap.val() as Room;
        setRoom(data);
        if (data.phase === "ended") unsub();
      }
    });
    return unsub;
  }, [roomCode]);

  // Auto-end: schedule a timeout for exactly when time runs out
  useEffect(() => {
    if (!room || room.phase !== "playing") return;
    const remaining = GAME_DURATION - (Date.now() - room.gameStartTime);
    if (remaining <= 0) {
      update(ref(db, `rooms/${roomCode}`), { phase: "ended" });
      return;
    }
    const id = setTimeout(() => {
      update(ref(db, `rooms/${roomCode}`), { phase: "ended" });
    }, remaining);
    return () => clearTimeout(id);
  }, [room?.gameStartTime, room?.phase, roomCode]);

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function startGame() {
    await update(ref(db, `rooms/${roomCode}`), { phase: "playing", gameStartTime: Date.now() });
  }

  async function endGame() {
    await update(ref(db, `rooms/${roomCode}`), { phase: "ended" });
  }

  if (!room) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const teams      = Object.entries(room.teams   || {}).sort(([, a], [, b]) => calcScore(b.banh) - calcScore(a.banh));
  const players    = room.players || {};
  const playerCount = Object.keys(players).length;
  const allInTeam  = Object.values(players).every(p => p.teamId !== null);
  const phase      = room.phase;

  const phaseMeta = {
    waiting: { label: "Phòng chờ", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    playing: { label: "Đang chơi 🔴", cls: "bg-green-100 text-green-700 border-green-200 animate-pulse" },
    ended:   { label: "Kết thúc",  cls: "bg-gray-100 text-gray-600 border-gray-200" },
  }[phase] ?? { label: phase, cls: "" };

  const gridCols = teams.length <= 2 ? "grid-cols-1 sm:grid-cols-2"
    : teams.length <= 4 ? "grid-cols-2"
    : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      {/* ── Header ── */}
      <Card className="border-2 border-border/50 shadow-md">
        <CardContent className="pt-4 pb-4 px-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Room code */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Mã phòng</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold tracking-widest text-primary">{roomCode}</span>
                  <button onClick={copyCode} className="w-7 h-7 flex items-center justify-center rounded-lg border border-border/60 hover:bg-muted transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              {/* Badges */}
              <div className="flex flex-col gap-1.5">
                <Badge className={cn("border text-xs px-2 py-0.5 font-semibold w-fit", phaseMeta.cls)}>{phaseMeta.label}</Badge>
                <Badge variant="secondary" className="gap-1 text-xs w-fit">
                  <Users className="w-3 h-3" />{playerCount} người chơi
                </Badge>
              </div>
              <Badge className="bg-amber-500 text-white h-fit">👑 Chủ Phòng</Badge>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {phase === "waiting" && (
                <Button
                  onClick={startGame}
                  disabled={playerCount < 2 || !allInTeam}
                  className="gap-2 text-white font-bold shadow-md"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
                >
                  <PlayCircle className="w-4 h-4" />
                  {!allInTeam ? "Chờ mọi người vào nhóm" : playerCount < 2 ? "Cần ≥2 người" : "Bắt đầu!"}
                </Button>
              )}
              {phase === "playing" && (
                <Button onClick={endGame} variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50">
                  <StopCircle className="w-4 h-4" />Kết thúc sớm
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onLeave} className="gap-1.5">
                <LogOut className="w-4 h-4" />Rời
              </Button>
            </div>
          </div>

          {/* Waiting: players not in team */}
          {phase === "waiting" && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Chưa vào nhóm:</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(players).filter(([, p]) => !p.teamId).length === 0 ? (
                  <span className="text-xs text-green-600 font-medium">✅ Tất cả đã vào nhóm!</span>
                ) : (
                  Object.entries(players).filter(([, p]) => !p.teamId).map(([pid, p]) => (
                    <span key={pid} className="text-xs border border-border/50 rounded-full px-2.5 py-0.5 bg-muted/40">{p.name}</span>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top Rankings (playing / ended only) ── */}
      {phase !== "waiting" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Top Điểm */}
          <Card className="border border-amber-200 bg-amber-50/60">
            <CardContent className="px-3 pt-3 pb-3 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 flex items-center gap-1">🏆 Điểm cao nhất</p>
              {[...teams].sort(([,a],[,b]) => calcScore(b.banh) - calcScore(a.banh)).slice(0,3).map(([tid,team],i) => (
                <div key={tid} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] shrink-0">{i===0?"🥇":i===1?"🥈":"🥉"}</span>
                  <span className="text-xs font-medium truncate flex-1">{team.name}</span>
                  <span className="text-xs font-extrabold text-amber-700 shrink-0">{calcScore(team.banh)}đ</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Trade */}
          <Card className="border border-blue-200 bg-blue-50/60">
            <CardContent className="px-3 pt-3 pb-3 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 flex items-center gap-1">🤝 Đổi nhiều nhất</p>
              {[...teams].sort(([,a],[,b]) => (b.tradesCount??0) - (a.tradesCount??0)).slice(0,3).map(([tid,team],i) => (
                <div key={tid} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] shrink-0">{i===0?"🥇":i===1?"🥈":"🥉"}</span>
                  <span className="text-xs font-medium truncate flex-1">{team.name}</span>
                  <span className="text-xs font-extrabold text-blue-700 shrink-0">{team.tradesCount??0} lần</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Teams grid ── */}
      <div className={`grid ${gridCols} gap-4`}>
        {teams.map(([tid, team], rank) => {
          const accent   = TEAM_ACCENT[team.color] || { border: "border-gray-300", header: "bg-gray-50" };
          const members  = Object.entries(players).filter(([, p]) => p.teamId === tid);
          const qTotal   = team.questionsAnswered ?? 0;
          const bagsTotal = team.bags ?? 0;
          const inv      = team.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
          const isLeader = rank === 0 && phase !== "waiting";

          return (
            <Card key={tid} className={cn(
              "border-2 overflow-hidden shadow-sm transition-all",
              accent.border,
              isLeader && "ring-2 ring-amber-400 ring-offset-1 shadow-amber-100"
            )}>
              {/* Colored header */}
              <div className={cn("px-3 pt-2.5 pb-2 border-b flex items-center justify-between", accent.header, accent.border)}>
                <span className="font-bold text-sm truncate">{team.name}</span>
                <span className={cn("font-extrabold text-lg", isLeader ? "text-amber-600" : "text-foreground")}>
                  {phase !== "waiting" ? `${calcScore(team.banh)} Điểm` : `${members.length}/3`}
                </span>
              </div>

              <CardContent className="px-3 py-3 space-y-2.5">
                {/* Members */}
                <div className="flex flex-wrap gap-1">
                  {members.length === 0
                    ? <span className="text-[10px] text-muted-foreground italic">Chưa có thành viên</span>
                    : members.map(([pid, p]) => (
                        <span key={pid} className="text-[10px] bg-white/70 border border-border/50 rounded-full px-2 py-0.5">{p.name}</span>
                      ))
                  }
                </div>

                {phase !== "waiting" && (
                  <>
                    {/* Bread */}
                    <div className="flex flex-wrap gap-1">
                      {team.banh?.hiem > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">🏆×{team.banh.hiem}</span>
                      )}
                      {team.banh?.dep > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">✨×{team.banh.dep}</span>
                      )}
                      {team.banh?.thuong > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">🍃×{team.banh.thuong}</span>
                      )}
                      {!team.banh?.hiem && !team.banh?.dep && !team.banh?.thuong && (
                        <span className="text-[10px] text-muted-foreground italic">Chưa gói bánh</span>
                      )}
                    </div>

                    {/* Ingredients */}
                    <div className="grid grid-cols-4 gap-1">
                      {ALL_INGS.map(k => (
                        <div key={k} className={cn(
                          "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg border-2 text-center",
                          (inv[k] ?? 0) > 0 ? ING_CHIP[k] : "bg-muted/20 border-border/20 opacity-40"
                        )}>
                          <Image src={ING_IMG[k]} alt={ING_NAME[k]} width={20} height={20} className="object-contain" />
                          <span className="text-xs font-extrabold leading-none">{inv[k] ?? 0}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5 border-t border-border/30">
                      <span className="flex items-center gap-1">
                        <Image src="/pictures/question.png" alt="câu" width={12} height={12} className="object-contain" />
                        <strong className="text-foreground">{qTotal}</strong> câu
                      </span>
                      <span className="flex items-center gap-1">
                        <Image src="/pictures/shop.png" alt="đổi" width={12} height={12} className="object-contain" />
                        <strong className="text-foreground">{team.tradesCount ?? 0}</strong> đổi
                      </span>
                      <span className="flex items-center gap-1">
                        🎁 <strong className="text-foreground">{bagsTotal}</strong> túi
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
