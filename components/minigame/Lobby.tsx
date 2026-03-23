"use client";

import { useState } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Plus, LogIn, Loader2, Users } from "lucide-react";

interface Props {
  playerId: string;
  onJoined: (roomCode: string) => void;
}

// 12 team names — đại diện 54 dân tộc Việt Nam
const TEAM_PRESETS = [
  { name: "Người Kinh",   color: "red"    },
  { name: "Người Tày",    color: "blue"   },
  { name: "Người Thái",   color: "yellow" },
  { name: "Người Mường",  color: "green"  },
  { name: "Người Khmer",  color: "orange" },
  { name: "Người H'Mông", color: "purple" },
  { name: "Người Nùng",   color: "pink"   },
  { name: "Người Hoa",    color: "brown"  },
  { name: "Người Dao",    color: "teal"   },
  { name: "Người Gia Rai",color: "silver" },
  { name: "Người Ê Đê",  color: "black"  },
  { name: "Người Ba Na",  color: "tiger"  },
];

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function buildTeams(count: number) {
  const teams: Record<string, object> = {};
  for (let i = 0; i < count; i++) {
    const preset = TEAM_PRESETS[i];
    teams[`team${i + 1}`] = {
      name: preset.name,
      color: preset.color,
      score: 0,
      inventory: { gao: 0, thit: 0, dau: 0, la: 0 },
      banh: { thuong: 0, dep: 0, hiem: 0 },
    };
  }
  return teams;
}

export default function Lobby({ playerId, onJoined }: Props) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [teamCount, setTeamCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"create" | "join">("create");

  async function handleCreate() {
    if (!name.trim()) { setError("Nhập tên của bạn trước nhé!"); return; }
    setLoading(true); setError("");
    const code = generateRoomCode();
    await set(ref(db, `rooms/${code}`), {
      phase: "waiting",
      host: playerId,
      gameStartTime: null,
      teams: buildTeams(teamCount),
      players: {
        [playerId]: { name: name.trim(), teamId: null, bags: 0 },
      },
    });
    onJoined(code);
    setLoading(false);
  }

  async function handleJoin() {
    if (!name.trim()) { setError("Nhập tên của bạn trước nhé!"); return; }
    if (!joinCode.trim()) { setError("Nhập mã phòng!"); return; }
    setLoading(true); setError("");
    const code = joinCode.trim().toUpperCase();
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) { setError("Không tìm thấy phòng. Kiểm tra lại mã!"); setLoading(false); return; }
    const room = snap.val();
    if (room.phase !== "waiting") { setError("Phòng này đã bắt đầu chơi rồi!"); setLoading(false); return; }

    // Count max capacity: number of teams × 3
    const teamCount = Object.keys(room.teams || {}).length;
    const maxPlayers = teamCount * 3;
    const currentPlayers = Object.keys(room.players || {}).length;
    if (currentPlayers >= maxPlayers) {
      setError(`Phòng đã đủ ${maxPlayers} người (${teamCount} team × 3)!`);
      setLoading(false); return;
    }

    await set(ref(db, `rooms/${code}/players/${playerId}`), { name: name.trim(), teamId: null, bags: 0 });
    onJoined(code);
    setLoading(false);
  }

  return (
    <div className="min-h-[520px] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-primary" />
            </div>
          </div>
          <CardTitle className="font-serif text-2xl">🎋 Hồn Việt Trong Bánh</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Trả lời câu hỏi • Gói bánh chưng • Đổi nguyên liệu</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Name input */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tên của bạn</label>
            <Input
              placeholder="Nhập tên hiển thị..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
            />
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setTab("create")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "create" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Tạo phòng
            </button>
            <button
              onClick={() => setTab("join")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "join" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Vào phòng
            </button>
          </div>

          {tab === "create" ? (
            <div className="space-y-3">
              {/* Team count picker */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Số team ({teamCount} team × 3 người = tối đa {teamCount * 3} người)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={teamCount}
                    onChange={(e) => setTeamCount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-8 text-center font-bold text-primary">{teamCount}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {TEAM_PRESETS.slice(0, teamCount).map((t) => (
                    <span key={t.color} className="text-xs bg-muted rounded px-1.5 py-0.5">{t.name}</span>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tạo phòng ({teamCount} team)
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Nhập mã phòng (VD: AB12CD)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center tracking-widest font-mono text-lg uppercase"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <Button onClick={handleJoin} disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Vào phòng
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg py-2 px-3">{error}</p>
          )}

          {/* Rules */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground mb-1">📋 Luật chơi nhanh:</p>
            <p>• Trả lời đúng → nhận 1 túi nguyên liệu</p>
            <p>• Mở túi → ngẫu nhiên: Gạo / Thịt / Đậu / Lá</p>
            <p>• Gói bánh = 2 Gạo + 1 Thịt + 1 Đậu + 1 Lá</p>
            <p>• Đổi nguyên liệu tại 🏪 Quầy Quây Quần!</p>
            <p>• Gói đẹp hơn → điểm cao hơn!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
