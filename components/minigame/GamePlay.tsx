"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { questions } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import WrappingBar, { WrapResult } from "./WrappingBar";

type IngKey = "gao" | "thit" | "dau" | "la";
interface Inventory { gao: number; thit: number; dau: number; la: number; }
interface Player { name: string; teamId: string | null; bags: number; }
interface Team { name: string; color: string; score: number; inventory: Inventory; banh: { thuong: number; dep: number; hiem: number }; }
interface Room { host: string; gameStartTime: number; phase: string; teams: Record<string, Team>; players: Record<string, Player>; answers: Record<string, Record<string, number>>; }

const ING_LABELS: Record<IngKey, string> = { gao: "🌾 Gạo", thit: "🥩 Thịt", dau: "🫘 Đậu", la: "🌿 Lá" };
const ING_KEYS: IngKey[] = ["gao", "gao", "thit", "dau", "la"]; // gao weighted x2

const QUESTION_DURATION = 12000; // 12s per question (10s answer + 2s gap)
const GAME_DURATION = 7 * 60 * 1000; // 7 minutes

const WRAP_POINTS = { thuong: 1, dep: 2, hiem: 4 };

function canWrap(inv: Inventory) {
  return inv.gao >= 2 && inv.thit >= 1 && inv.dau >= 1 && inv.la >= 1;
}

function randomIngredient(): IngKey {
  return ING_KEYS[Math.floor(Math.random() * ING_KEYS.length)];
}

function formatTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function GamePlay({ playerId, roomCode }: { playerId: string; roomCode: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<number>(-1); // question index last answered
  const [showWrap, setShowWrap] = useState(false);
  const [openingBag, setOpeningBag] = useState(false);
  const [lastIngredient, setLastIngredient] = useState<IngKey | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), (snap) => {
      if (snap.exists()) setRoom(snap.val() as Room);
    });
    return unsub;
  }, [roomCode]);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Reset selection when question changes
  const questionIndex = room ? Math.min(Math.floor((now - room.gameStartTime) / QUESTION_DURATION), questions.length - 1) : 0;
  useEffect(() => {
    setSelected(null);
  }, [questionIndex]);

  // End game when timer runs out
  useEffect(() => {
    if (!room) return;
    const elapsed = now - room.gameStartTime;
    if (elapsed >= GAME_DURATION && room.phase === "playing") {
      update(ref(db, `rooms/${roomCode}`), { phase: "ended" });
    }
  }, [now, room, roomCode]);

  const myPlayer = room?.players?.[playerId];
  const myTeamId = myPlayer?.teamId;
  const myTeam = myTeamId ? room?.teams?.[myTeamId] : null;
  const myBags = myPlayer?.bags ?? 0;

  const timeLeft = room ? Math.max(0, GAME_DURATION - (now - room.gameStartTime)) : 0;
  const questionTimeLeft = room ? Math.max(0, QUESTION_DURATION - ((now - room.gameStartTime) % QUESTION_DURATION)) : 0;
  const questionProgress = 100 - (questionTimeLeft / QUESTION_DURATION) * 100;

  const currentQ = questions[questionIndex];
  const hasAnsweredThis = answered === questionIndex;
  const correctIdx = currentQ?.correct;

  async function handleAnswer(optionIdx: number) {
    if (hasAnsweredThis || selected !== null) return;
    setSelected(optionIdx);

    // Check if already answered this question in Firebase
    const snap = await get(ref(db, `rooms/${roomCode}/answers/${questionIndex}/${playerId}`));
    if (snap.exists()) { setAnswered(questionIndex); return; }

    // Record answer
    await update(ref(db, `rooms/${roomCode}/answers/${questionIndex}`), { [playerId]: optionIdx });

    if (optionIdx === correctIdx) {
      // Award bag
      const bags = (myPlayer?.bags ?? 0) + 1;
      await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { bags });
    }
    setAnswered(questionIndex);
  }

  async function openBag() {
    if (openingBag || myBags <= 0) return;
    setOpeningBag(true);
    const ing = randomIngredient();
    setLastIngredient(ing);

    const newBags = Math.max(0, myBags - 1);
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { bags: newBags });

    if (myTeamId) {
      const currentInv = myTeam?.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
      await update(ref(db, `rooms/${roomCode}/teams/${myTeamId}/inventory`), {
        [ing]: (currentInv[ing] ?? 0) + 1,
      });
    }

    setTimeout(() => { setOpeningBag(false); setLastIngredient(null); }, 2000);
  }

  async function handleWrapResult(result: WrapResult) {
    setShowWrap(false);
    if (!myTeamId || !myTeam) return;

    const inv = myTeam.inventory;
    if (!canWrap(inv)) return;

    const points = WRAP_POINTS[result];
    const newScore = (myTeam.score ?? 0) + points;
    const newBanh = { ...myTeam.banh, [result]: (myTeam.banh?.[result] ?? 0) + 1 };
    const newInv = { gao: inv.gao - 2, thit: inv.thit - 1, dau: inv.dau - 1, la: inv.la - 1 };

    await update(ref(db, `rooms/${roomCode}/teams/${myTeamId}`), {
      score: newScore,
      banh: newBanh,
      inventory: newInv,
    });
  }

  if (!room || !currentQ) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const teams = Object.entries(room.teams || {}).sort(([, a], [, b]) => b.score - a.score);
  const inv = myTeam?.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
  const canWrapNow = myTeamId && canWrap(inv);

  return (
    <div className="max-w-2xl mx-auto p-3 space-y-3">
      {showWrap && <WrappingBar onResult={handleWrapResult} onCancel={() => setShowWrap(false)} />}

      {/* Timer bar */}
      <div className="flex items-center justify-between gap-3">
        <div className={cn("font-mono text-xl font-bold tabular-nums", timeLeft < 30000 && "text-red-500 animate-pulse")}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground">
          Câu {questionIndex + 1}/{questions.length} • {myTeam?.name ?? "Chưa vào team"}
        </div>
        <Badge variant="secondary">🎋 {myTeam?.score ?? 0}đ</Badge>
      </div>

      {/* Question progress */}
      <Progress value={questionProgress} className="h-1.5" />

      {/* Question card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="font-serif text-base leading-snug">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {currentQ.options.map((opt, i) => {
            const isSelected = selected === i;
            const showCorrect = hasAnsweredThis;
            const isCorrect = i === correctIdx;

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={hasAnsweredThis}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all",
                  !hasAnsweredThis && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                  hasAnsweredThis && isCorrect && "border-green-500 bg-green-50 text-green-800 font-medium",
                  hasAnsweredThis && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-700",
                  hasAnsweredThis && !isSelected && !isCorrect && "opacity-40",
                  !hasAnsweredThis && isSelected && "border-primary bg-primary/5",
                  !hasAnsweredThis && !isSelected && "border-border bg-background"
                )}
              >
                <span className="font-medium mr-2 text-muted-foreground">{["A", "B", "C", "D"][i]}.</span>
                {opt}
                {showCorrect && isCorrect && <span className="float-right">✅</span>}
                {showCorrect && isSelected && !isCorrect && <span className="float-right">❌</span>}
              </button>
            );
          })}

          {hasAnsweredThis && selected === correctIdx && (
            <p className="text-sm text-green-600 font-medium text-center pt-1">🎉 Đúng rồi! +1 túi nguyên liệu</p>
          )}
          {hasAnsweredThis && selected !== null && selected !== correctIdx && (
            <p className="text-sm text-red-500 text-center pt-1">Sai rồi, cố lên! Không bị trừ điểm đâu</p>
          )}
        </CardContent>
      </Card>

      {/* Inventory + Bags */}
      <div className="grid grid-cols-2 gap-3">
        {/* Team inventory */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Kho Team {myTeam?.name ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(ING_LABELS) as IngKey[]).map((k) => (
                <div key={k} className={cn(
                  "flex items-center justify-between px-2 py-1 rounded-md text-xs border",
                  inv[k] > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/30 opacity-60"
                )}>
                  <span>{ING_LABELS[k]}</span>
                  <span className="font-bold">{inv[k]}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Cần: 2🌾 + 1🥩 + 1🫘 + 1🌿
            </div>
          </CardContent>
        </Card>

        {/* My bags */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Túi của bạn
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="text-center">
              <span className="text-3xl">🎁</span>
              <p className="text-2xl font-bold text-primary">{myBags}</p>
              <p className="text-xs text-muted-foreground">túi chưa mở</p>
            </div>
            {lastIngredient && (
              <p className="text-center text-sm font-medium text-green-600 animate-bounce">
                +1 {ING_LABELS[lastIngredient]}!
              </p>
            )}
            <Button
              onClick={openBag}
              disabled={myBags === 0 || openingBag || !myTeamId}
              size="sm"
              variant="outline"
              className="w-full text-xs"
            >
              {openingBag ? "Đang mở..." : myBags === 0 ? "Chưa có túi" : `Mở túi (${myBags})`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Wrap button */}
      {canWrapNow && (
        <Button
          onClick={() => setShowWrap(true)}
          className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          🎋 Gói Bánh Chưng!
        </Button>
      )}

      {/* Scoreboard */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bảng điểm</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-1.5">
          {teams.map(([tid, t], i) => (
            <div key={tid} className={cn(
              "flex items-center justify-between px-3 py-1.5 rounded-lg text-sm",
              tid === myTeamId ? "bg-primary/10 font-medium" : "bg-muted/30"
            )}>
              <span className="flex items-center gap-2">
                <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <span className="truncate">{t.name}</span>
                {t.banh && (t.banh.hiem > 0 || t.banh.dep > 0) && (
                  <span className="text-xs text-muted-foreground">
                    {t.banh.hiem > 0 && `🏆×${t.banh.hiem}`}
                    {t.banh.dep > 0 && `✨×${t.banh.dep}`}
                    {t.banh.thuong > 0 && `🍃×${t.banh.thuong}`}
                  </span>
                )}
              </span>
              <span className="font-bold text-primary">{t.score}đ</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
