"use client";

import { useState } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Plus, LogIn, Loader2, Users } from "lucide-react";

interface Props {
  playerId: string;
  onJoined: (roomCode: string, isAdmin?: boolean) => void;
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

const RULES = [
  { icon: "❓", text: "Trả lời đúng → nhận 1 túi nguyên liệu" },
  { icon: "🎁", text: "Mở túi → ngẫu nhiên: Gạo / Thịt / Đậu / Lá" },
  { icon: "🍃", text: "Gói bánh = 2 Gạo + 1 Thịt + 1 Đậu + 1 Lá" },
  { icon: "🏪", text: "Đổi nguyên liệu tại Quầy Quây Quần!" },
  { icon: "🏆", text: "Gói đẹp hơn → điểm cao hơn!" },
];

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
      players: {},
    });
    onJoined(code, true);
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

    const teamCount = Object.keys(room.teams || {}).length;
    const maxPlayers = teamCount * 3;
    const currentPlayers = Object.keys(room.players || {}).length;
    if (currentPlayers >= maxPlayers) {
      setError(`Phòng đã đủ ${maxPlayers} người (${teamCount} nhóm × 3)!`);
      setLoading(false); return;
    }

    await set(ref(db, `rooms/${code}/players/${playerId}`), { name: name.trim(), teamId: null, bags: 0 });
    onJoined(code);
    setLoading(false);
  }

  return (
    <div className="min-h-[520px] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl border-2 border-border/40">
        {/* ── Header ── */}
        <CardHeader className="text-center pb-5 pt-7">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 shadow-md flex items-center justify-center">
              <Image src="/pictures/chung-cake.png" alt="bánh chưng" width={48} height={48} className="object-contain drop-shadow" />
            </div>
          </div>
          <CardTitle className="font-serif text-2xl font-bold flex items-center justify-center gap-2">
            Hồn Việt Trong Bánh
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Trả lời câu hỏi · Gói bánh chưng · Đổi nguyên liệu
          </p>
        </CardHeader>

        <CardContent className="space-y-5 pb-7">
          {/* ── Name input ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground block">Tên của bạn</label>
            <Input
              placeholder="Nhập tên hiển thị..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
              className="h-11 text-sm border-2 border-border/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-colors"
            />
          </div>

          {/* ── Tabs ── */}
          <div className="bg-muted/60 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setTab("create")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === "create"
                  ? "bg-white shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="w-4 h-4" />
              Tạo phòng
            </button>
            <button
              onClick={() => setTab("join")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === "join"
                  ? "bg-white shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Vào phòng
            </button>
          </div>

          {/* ── Tab content ── */}
          {tab === "create" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  Số nhóm
                  <span className="font-normal text-muted-foreground ml-1">
                    ({teamCount} nhóm × 3 người = tối đa {teamCount * 3} người)
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={teamCount}
                    onChange={(e) => setTeamCount(Number(e.target.value))}
                    className="flex-1 accent-primary h-2"
                  />
                  <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 font-extrabold text-primary text-base shrink-0">
                    {teamCount}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {TEAM_PRESETS.slice(0, teamCount).map((t) => (
                    <span key={t.color} className="text-xs bg-primary/5 border border-primary/15 rounded-full px-2.5 py-0.5 font-medium">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={loading}
                className="w-full h-12 text-base font-bold gap-2 text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", boxShadow: "0 4px 14px rgba(245,158,11,0.4)" }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Tạo phòng ({teamCount} nhóm)
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">Mã phòng</label>
                <Input
                  placeholder="VD: AB12CD"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="h-14 text-center tracking-[0.35em] font-mono text-xl uppercase border-2 border-border/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
              <Button
                onClick={handleJoin}
                disabled={loading}
                className="w-full h-12 text-base font-bold gap-2 text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 4px 14px rgba(59,130,246,0.4)" }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Vào phòng
              </Button>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-xl py-2.5 px-4">
              {error}
            </p>
          )}

          {/* ── Rules ── */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3">
              <Image src="/pictures/question-sign.png" alt="luật chơi" width={16} height={16} className="object-contain" />
              Luật chơi nhanh
            </p>
            {RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <span className="shrink-0 text-sm leading-none mt-0.5">{r.icon}</span>
                <span className="leading-relaxed">{r.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
