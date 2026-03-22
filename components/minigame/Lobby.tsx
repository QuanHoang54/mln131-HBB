"use client";

import { useState } from "react";
import { ref, set, get, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Plus, LogIn, Loader2 } from "lucide-react";

interface Props {
  playerId: string;
  onJoined: (roomCode: string) => void;
}

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function Lobby({ playerId, onJoined }: Props) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
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
      teams: {
        team1: { name: "Team Đỏ 🔴", color: "red", score: 0, inventory: { gao: 0, thit: 0, dau: 0, la: 0 }, banh: { thuong: 0, dep: 0, hiem: 0 } },
        team2: { name: "Team Xanh 🔵", color: "blue", score: 0, inventory: { gao: 0, thit: 0, dau: 0, la: 0 }, banh: { thuong: 0, dep: 0, hiem: 0 } },
        team3: { name: "Team Vàng 🟡", color: "yellow", score: 0, inventory: { gao: 0, thit: 0, dau: 0, la: 0 }, banh: { thuong: 0, dep: 0, hiem: 0 } },
      },
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
    const players = room.players || {};
    if (Object.keys(players).length >= 9) { setError("Phòng đã đủ 9 người (3 team × 3)!"); setLoading(false); return; }
    await set(ref(db, `rooms/${code}/players/${playerId}`), { name: name.trim(), teamId: null, bags: 0 });
    onJoined(code);
    setLoading(false);
  }

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-primary" />
            </div>
          </div>
          <CardTitle className="font-serif text-2xl">🎋 Gói Bánh Đoàn Kết</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Trả lời câu hỏi • Gói bánh chưng • Cùng thắng</p>
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
            <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tạo phòng mới
            </Button>
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
            <p>• Mở túi → ngẫu nhiên: 🌾Gạo / 🥩Thịt / 🫘Đậu / 🌿Lá</p>
            <p>• Gói bánh = 2 Gạo + 1 Thịt + 1 Đậu + 1 Lá</p>
            <p>• Gói đẹp hơn → điểm cao hơn!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
