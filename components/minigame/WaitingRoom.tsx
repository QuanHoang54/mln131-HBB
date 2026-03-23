"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, PlayCircle, LogOut, Users } from "lucide-react";

interface Player { name: string; teamId: string | null; bags: number; }
interface Team { name: string; color: string; score: number; }
interface Room { host: string; phase: string; teams: Record<string, Team>; players: Record<string, Player>; }

interface Props {
  playerId: string;
  roomCode: string;
  onLeave: () => void;
}

// Member chip colors (used inside slots)
const TEAM_COLORS: Record<string, string> = {
  red:    "bg-red-100 border-red-300 text-red-800",
  blue:   "bg-blue-100 border-blue-300 text-blue-800",
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-800",
  green:  "bg-green-100 border-green-300 text-green-800",
  orange: "bg-orange-100 border-orange-300 text-orange-800",
  purple: "bg-purple-100 border-purple-300 text-purple-800",
  pink:   "bg-pink-100 border-pink-300 text-pink-800",
  brown:  "bg-amber-100 border-amber-400 text-amber-900",
  teal:   "bg-teal-100 border-teal-300 text-teal-800",
  silver: "bg-slate-100 border-slate-300 text-slate-700",
  black:  "bg-zinc-200 border-zinc-400 text-zinc-800",
  tiger:  "bg-yellow-100 border-yellow-500 text-yellow-900",
};

// Card-level accent: border + header bg
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

export default function WaitingRoom({ playerId, roomCode, onLeave }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), (snap) => {
      if (snap.exists()) setRoom(snap.val() as Room);
    });
    return unsub;
  }, [roomCode]);

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function joinTeam(teamId: string) {
    const players = room?.players || {};
    const inTeam = Object.values(players).filter((p) => p.teamId === teamId).length;
    if (inTeam >= 3) return;
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { teamId });
  }

  async function leaveTeam() {
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { teamId: null });
  }

  async function startGame() {
    await update(ref(db, `rooms/${roomCode}`), {
      phase: "playing",
      gameStartTime: Date.now(),
    });
  }

  async function leaveRoom() {
    await set(ref(db, `rooms/${roomCode}/players/${playerId}`), null);
    onLeave();
  }

  if (!room) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const players = room.players || {};
  const teams = room.teams || {};
  const myPlayer = players[playerId];
  const isHost = room.host === playerId;
  const myTeamId = myPlayer?.teamId;
  const allInTeam = Object.values(players).every((p) => p.teamId !== null);
  const playerCount = Object.keys(players).length;
  const teamCount = Object.keys(teams).length;

  const gridCols = teamCount <= 3
    ? "grid-cols-1 sm:grid-cols-3"
    : teamCount <= 6
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  function getTeamMembers(teamId: string) {
    return Object.entries(players).filter(([, p]) => p.teamId === teamId);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5">
      {/* ── Header ── */}
      <Card className="border-2 border-border/50 shadow-md">
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Mã phòng</p>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-3xl font-bold tracking-[0.2em] text-primary">{roomCode}</span>
                <button
                  onClick={copyCode}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/60 hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Chia sẻ mã này cho bạn cùng lớp</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
                <Users className="w-3.5 h-3.5" />
                <span className="font-bold">{playerCount}</span>
                <span className="text-muted-foreground">/ {teamCount * 3} người</span>
              </Badge>
              {isHost && <Badge className="bg-amber-500 text-white px-3 py-1">👑 Chủ phòng</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Teams grid ── */}
      <div className={`grid ${gridCols} gap-3`}>
        {Object.entries(teams).map(([teamId, team]) => {
          const members = getTeamMembers(teamId);
          const isFull = members.length >= 3;
          const isMyTeam = myTeamId === teamId;
          const chipClass = TEAM_COLORS[team.color] || "bg-gray-100 border-gray-300 text-gray-800";
          const accent = TEAM_ACCENT[team.color] || { border: "border-gray-300", header: "bg-gray-50" };

          return (
            <Card
              key={teamId}
              className={`border-2 overflow-hidden transition-all shadow-sm ${accent.border} ${
                isMyTeam ? "ring-2 ring-primary ring-offset-2 shadow-md" : ""
              }`}
            >
              {/* Colored header band */}
              <div className={`px-3 pt-2.5 pb-2 ${accent.header} border-b ${accent.border}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-bold truncate">{team.name}</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                    isFull
                      ? "bg-red-100 text-red-700 border-red-300"
                      : members.length > 0
                        ? "bg-white/80 text-foreground border-border/60"
                        : "bg-white/60 text-muted-foreground border-border/40"
                  }`}>
                    {members.length}/3
                  </span>
                </div>
              </div>

              <CardContent className="px-3 pb-3 pt-2.5 space-y-1.5">
                {/* Members */}
                {members.map(([pid, p]) => (
                  <div key={pid} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${chipClass}`}>
                    {pid === room.host && <span className="text-[11px]">👑</span>}
                    <span className="truncate">{p.name}</span>
                    {pid === playerId && <span className="ml-auto text-[10px] opacity-60 shrink-0">bạn</span>}
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 3 - members.length) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-border/50 text-muted-foreground/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse shrink-0" />
                    Đang chờ...
                  </div>
                ))}

                {/* Join/Leave button */}
                <div className="pt-0.5">
                  {isMyTeam ? (
                    <Button variant="outline" size="sm" onClick={leaveTeam} className="w-full text-xs h-7">
                      Rời nhóm
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => joinTeam(teamId)}
                      disabled={isFull || myTeamId !== null}
                      className="w-full text-xs h-7"
                      variant={isFull ? "ghost" : "default"}
                    >
                      {isFull ? "Đã đủ 3" : myTeamId !== null ? "Rời nhóm cũ trước" : "Vào nhóm"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Players without team ── */}
      {Object.entries(players).filter(([, p]) => !p.teamId).length > 0 && (
        <Card className="border-2 border-border/40 shadow-sm">
          <CardContent className="pt-3.5 pb-3.5 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Chưa vào nhóm</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(players).filter(([, p]) => !p.teamId).map(([pid, p]) => (
                <span key={pid} className="text-xs bg-muted border border-border rounded-full px-3 py-1 font-medium">
                  {p.name}{pid === playerId ? " (bạn)" : ""}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={leaveRoom} className="gap-2 border-2 h-11">
          <LogOut className="w-4 h-4" />
          Rời phòng
        </Button>

        {isHost ? (
          <Button
            onClick={startGame}
            disabled={!allInTeam || playerCount < 2}
            className="flex-1 h-12 text-base font-bold gap-2 text-white shadow-lg disabled:opacity-50"
            style={allInTeam && playerCount >= 2
              ? { background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 4px 15px rgba(22,163,74,0.4)" }
              : {}
            }
          >
            <PlayCircle className="w-5 h-5" />
            {!allInTeam ? "Mọi người chọn nhóm đi!" : playerCount < 2 ? "Cần ít nhất 2 người" : "Bắt đầu!"}
          </Button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2.5 text-sm text-muted-foreground bg-muted/40 rounded-xl border border-border/30 py-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            Chờ chủ phòng bắt đầu...
          </div>
        )}
      </div>
    </div>
  );
}
