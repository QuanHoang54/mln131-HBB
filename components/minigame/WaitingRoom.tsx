"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set, update, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const TEAM_COLORS: Record<string, string> = {
  red: "bg-red-100 border-red-300 text-red-800",
  blue: "bg-blue-100 border-blue-300 text-blue-800",
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-800",
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

  if (!room) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const players = room.players || {};
  const teams = room.teams || {};
  const myPlayer = players[playerId];
  const isHost = room.host === playerId;
  const myTeamId = myPlayer?.teamId;
  const allInTeam = Object.values(players).every((p) => p.teamId !== null);
  const playerCount = Object.keys(players).length;

  function getTeamMembers(teamId: string) {
    return Object.entries(players).filter(([, p]) => p.teamId === teamId);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Mã phòng</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-2xl font-bold tracking-widest text-primary">{roomCode}</span>
                <button onClick={copyCode} className="text-muted-foreground hover:text-primary transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Chia sẻ mã này cho bạn cùng lớp</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1"><Users className="w-3 h-3" />{playerCount} người</Badge>
              {isHost && <Badge className="bg-amber-500 text-white">👑 Host</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(teams).map(([teamId, team]) => {
          const members = getTeamMembers(teamId);
          const isFull = members.length >= 3;
          const isMyTeam = myTeamId === teamId;
          const colorClass = TEAM_COLORS[team.color] || "bg-gray-100 border-gray-300 text-gray-800";

          return (
            <Card key={teamId} className={`border-2 transition-all ${isMyTeam ? "ring-2 ring-primary ring-offset-1" : ""}`}>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>{team.name}</span>
                  <Badge variant="outline" className={`text-xs ${isFull ? "opacity-50" : ""}`}>
                    {members.length}/3
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-1.5">
                {members.map(([pid, p]) => (
                  <div key={pid} className={`text-xs px-2 py-1 rounded-md border ${colorClass} flex items-center gap-1`}>
                    {pid === room.host && <span>👑</span>}
                    <span className="truncate">{p.name}</span>
                    {pid === playerId && <span className="ml-auto opacity-60">(bạn)</span>}
                  </div>
                ))}
                {members.length < 3 && Array.from({ length: 3 - members.length }).map((_, i) => (
                  <div key={i} className="text-xs px-2 py-1 rounded-md border border-dashed border-border text-muted-foreground">
                    Trống...
                  </div>
                ))}

                <div className="pt-1">
                  {isMyTeam ? (
                    <Button variant="outline" size="sm" onClick={leaveTeam} className="w-full text-xs h-7">
                      Rời team
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => joinTeam(teamId)}
                      disabled={isFull || myTeamId !== null}
                      className="w-full text-xs h-7"
                      variant={isFull ? "ghost" : "default"}
                    >
                      {isFull ? "Đã đủ người" : myTeamId !== null ? "Rời team cũ trước" : "Vào team"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Players without team */}
      {Object.entries(players).filter(([, p]) => !p.teamId).length > 0 && (
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-sm text-muted-foreground mb-2">Chưa vào team:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(players).filter(([, p]) => !p.teamId).map(([pid, p]) => (
                <Badge key={pid} variant="outline">{p.name}{pid === playerId ? " (bạn)" : ""}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={leaveRoom} className="gap-2">
          <LogOut className="w-4 h-4" />
          Rời phòng
        </Button>
        {isHost && (
          <Button
            onClick={startGame}
            disabled={!allInTeam || playerCount < 2}
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <PlayCircle className="w-4 h-4" />
            {!allInTeam ? "Mọi người chọn team đã!" : playerCount < 2 ? "Cần ít nhất 2 người" : "Bắt đầu Game!"}
          </Button>
        )}
        {!isHost && (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            ⏳ Chờ host bắt đầu...
          </div>
        )}
      </div>
    </div>
  );
}
