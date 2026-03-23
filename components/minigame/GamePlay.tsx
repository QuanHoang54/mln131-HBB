"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ref, onValue, update, get, push, remove, runTransaction } from "firebase/database";
import { db } from "@/lib/firebase";
import { questions } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import WrappingBar, { WrapResult } from "./WrappingBar";
import { X, ArrowRightLeft, Check } from "lucide-react";

type IngKey = "gao" | "thit" | "dau" | "la";
interface Inventory { gao: number; thit: number; dau: number; la: number; }
interface Player { name: string; teamId: string | null; bags: number; }
interface Team { name: string; color: string; score: number; inventory: Inventory; banh: { thuong: number; dep: number; hiem: number }; }
interface TradeOffer { fromTeam: string; fromTeamName: string; give: IngKey; want: IngKey; }
interface Room {
  host: string; gameStartTime: number; phase: string;
  teams: Record<string, Team>;
  players: Record<string, Player>;
  answers: Record<string, Record<string, number>>;
  market?: Record<string, TradeOffer>;
}

// Ingredient images and labels
const ING_IMG: Record<IngKey, string> = {
  gao:  "/pictures/gao.png",
  thit: "/pictures/thit_ba_chi.png",
  dau:  "/pictures/dau.png",
  la:   "/pictures/la.png",
};
const ING_NAME: Record<IngKey, string> = { gao: "Gạo", thit: "Thịt", dau: "Đậu", la: "Lá" };
const ING_KEYS: IngKey[] = ["gao", "gao", "thit", "dau", "la"]; // gao weighted x2
const ALL_INGS: IngKey[] = ["gao", "thit", "dau", "la"];

const GAME_DURATION = 7 * 60 * 1000;
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

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─── Ingredient Image component ────────────────────────────────
function IngImg({ k, size = 28 }: { k: IngKey; size?: number }) {
  return (
    <Image
      src={ING_IMG[k]}
      alt={ING_NAME[k]}
      width={size}
      height={size}
      className="object-contain rounded"
    />
  );
}

// ─── Trade Panel ────────────────────────────────────────────────
function TradePanel({
  roomCode, myTeamId, myTeamName, myInv, market,
  onClose,
}: {
  roomCode: string;
  myTeamId: string;
  myTeamName: string;
  myInv: Inventory;
  market: Record<string, TradeOffer>;
  onClose: () => void;
}) {
  const [giveIng, setGiveIng] = useState<IngKey>("gao");
  const [wantIng, setWantIng] = useState<IngKey>("thit");
  const [posting, setPosting] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  // My open offer (if any)
  const myOffer = Object.entries(market).find(([, o]) => o.fromTeam === myTeamId);

  async function postOffer() {
    if (giveIng === wantIng) { setMsg("Chọn hai nguyên liệu khác nhau!"); return; }
    if ((myInv[giveIng] ?? 0) < 1) { setMsg(`Bạn không có ${ING_NAME[giveIng]} để đổi!`); return; }
    if (myOffer) { setMsg("Bạn đã có 1 đề xuất đang chờ. Hủy trước rồi đăng lại."); return; }
    setPosting(true); setMsg("");
    await push(ref(db, `rooms/${roomCode}/market`), {
      fromTeam: myTeamId,
      fromTeamName: myTeamName,
      give: giveIng,
      want: wantIng,
    });
    setMsg("Đã đăng! Chờ team khác chấp nhận...");
    setPosting(false);
  }

  async function cancelOffer(id: string) {
    await remove(ref(db, `rooms/${roomCode}/market/${id}`));
    setMsg("");
  }

  async function acceptOffer(id: string, offer: TradeOffer) {
    if (offer.fromTeam === myTeamId) { setMsg("Không thể chấp nhận đề xuất của chính team mình!"); return; }
    setAccepting(id); setMsg("");

    // Re-fetch both teams' inventories for safety
    const roomSnap = await get(ref(db, `rooms/${roomCode}`));
    if (!roomSnap.exists()) { setAccepting(null); return; }
    const freshRoom = roomSnap.val() as Room;

    const offerTeamInv: Inventory = freshRoom.teams[offer.fromTeam]?.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
    const myFreshInv: Inventory   = freshRoom.teams[myTeamId]?.inventory    ?? { gao: 0, thit: 0, dau: 0, la: 0 };

    if ((offerTeamInv[offer.give] ?? 0) < 1) {
      setMsg(`${offer.fromTeamName} không còn ${ING_NAME[offer.give]} nữa!`);
      await remove(ref(db, `rooms/${roomCode}/market/${id}`));
      setAccepting(null); return;
    }
    if ((myFreshInv[offer.want] ?? 0) < 1) {
      setMsg(`Team bạn không có ${ING_NAME[offer.want]} để đổi!`);
      setAccepting(null); return;
    }

    // Execute swap
    await update(ref(db, `rooms/${roomCode}/teams/${offer.fromTeam}/inventory`), {
      [offer.give]: offerTeamInv[offer.give] - 1,
      [offer.want]: (offerTeamInv[offer.want] ?? 0) + 1,
    });
    await update(ref(db, `rooms/${roomCode}/teams/${myTeamId}/inventory`), {
      [offer.want]: myFreshInv[offer.want] - 1,
      [offer.give]: (myFreshInv[offer.give] ?? 0) + 1,
    });
    await remove(ref(db, `rooms/${roomCode}/market/${id}`));
    setMsg(`✅ Đã đổi thành công! +1 ${ING_NAME[offer.give]}`);
    setAccepting(null);
  }

  // Offers from other teams
  const otherOffers = Object.entries(market).filter(([, o]) => o.fromTeam !== myTeamId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Image src="/pictures/shop.png" alt="shop" width={24} height={24} className="object-contain" />
            <h3 className="font-semibold">Quầy Quây Quần</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Post offer */}
          <div className="bg-muted/40 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Đăng đề xuất đổi</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Tôi cho</p>
                <div className="grid grid-cols-2 gap-1">
                  {ALL_INGS.map((k) => (
                    <button
                      key={k}
                      onClick={() => setGiveIng(k)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all",
                        giveIng === k ? "border-primary bg-primary/10 font-medium" : "border-border bg-background",
                        (myInv[k] ?? 0) === 0 && "opacity-40"
                      )}
                    >
                      <IngImg k={k} size={20} />
                      <span>{ING_NAME[k]}</span>
                      <span className="ml-auto text-muted-foreground">×{myInv[k] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              <ArrowRightLeft className="w-4 h-4 text-muted-foreground shrink-0" />

              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Tôi muốn</p>
                <div className="grid grid-cols-2 gap-1">
                  {ALL_INGS.map((k) => (
                    <button
                      key={k}
                      onClick={() => setWantIng(k)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all",
                        wantIng === k ? "border-green-500 bg-green-50 font-medium" : "border-border bg-background"
                      )}
                    >
                      <IngImg k={k} size={20} />
                      <span>{ING_NAME[k]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {myOffer ? (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700">
                  Đang chờ: <strong>{ING_NAME[myOffer[1].give]}</strong> → <strong>{ING_NAME[myOffer[1].want]}</strong>
                </p>
                <Button size="sm" variant="ghost" onClick={() => cancelOffer(myOffer[0])} className="text-xs h-6 text-red-500 hover:text-red-700">
                  Hủy
                </Button>
              </div>
            ) : (
              <Button onClick={postOffer} disabled={posting} size="sm" className="w-full gap-1.5">
                <Image src="/pictures/shop.png" alt="shop" width={16} height={16} className="object-contain" />
                Đăng đổi: 1 {ING_NAME[giveIng]} → 1 {ING_NAME[wantIng]}
              </Button>
            )}
          </div>

          {/* Offers from others */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Đề xuất từ team khác ({otherOffers.length})
            </p>
            {otherOffers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic">Chưa có đề xuất nào...</p>
            ) : (
              <div className="space-y-2">
                {otherOffers.map(([id, offer]) => (
                  <div key={id} className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2 gap-2">
                    <div>
                      <p className="text-xs font-medium">{offer.fromTeamName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <IngImg k={offer.give} size={18} />
                        <span className="text-xs">{ING_NAME[offer.give]}</span>
                        <ArrowRightLeft className="w-3 h-3 text-muted-foreground mx-0.5" />
                        <IngImg k={offer.want} size={18} />
                        <span className="text-xs">{ING_NAME[offer.want]}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => acceptOffer(id, offer)}
                      disabled={accepting === id || (myInv[offer.want] ?? 0) < 1}
                      className="text-xs h-7 gap-1 bg-green-600 hover:bg-green-700 text-white shrink-0"
                    >
                      {accepting === id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <><Check className="w-3 h-3" />Đổi</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg && (
            <p className={cn("text-xs text-center rounded-lg px-3 py-2",
              msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
            )}>
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main GamePlay ──────────────────────────────────────────────
export default function GamePlay({ playerId, roomCode }: { playerId: string; roomCode: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showWrap, setShowWrap] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQIdx, setQuizQIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState(10);
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    if (!room) return;
    const elapsed = now - room.gameStartTime;
    if (elapsed >= GAME_DURATION && room.phase === "playing") {
      update(ref(db, `rooms/${roomCode}`), { phase: "ended" });
    }
  }, [now, room, roomCode]);

  const shuffledQuestions = useMemo(
    () => room ? seededShuffle([...questions], room.gameStartTime) : questions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room?.gameStartTime]
  );

  const myPlayer = room?.players?.[playerId];
  const myTeamId = myPlayer?.teamId;
  const myTeam   = myTeamId ? room?.teams?.[myTeamId] : null;
  const myBags   = myPlayer?.bags ?? 0;

  const timeLeft = room ? Math.max(0, GAME_DURATION - (now - room.gameStartTime)) : 0;
  const currentQ = shuffledQuestions[quizQIdx % shuffledQuestions.length];
  const correctIdx = currentQ?.correct;

  // Quiz countdown — starts at 10s when modal opens, auto-closes on 0
  useEffect(() => {
    if (!showQuiz || quizAnswered) return;
    setQuizTimeLeft(10);
    quizTimerRef.current = setInterval(() => {
      setQuizTimeLeft(t => {
        if (t <= 1) {
          clearInterval(quizTimerRef.current!);
          setShowQuiz(false);
          setQuizQIdx(i => i + 1);
          return 10;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuiz]);

  function openQuiz() {
    setQuizSelected(null);
    setQuizAnswered(false);
    setShowQuiz(true);
  }

  async function handleQuizAnswer(optionIdx: number) {
    if (quizAnswered) return;
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    setQuizSelected(optionIdx);
    setQuizAnswered(true);
    if (optionIdx === correctIdx && myPlayer) {
      await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { bags: (myPlayer.bags ?? 0) + 1 });
    }
    setTimeout(() => {
      setShowQuiz(false);
      setQuizQIdx(i => i + 1);
      setQuizSelected(null);
      setQuizAnswered(false);
    }, 1800);
  }

  async function openBag() {
    if (openingBag || myBags <= 0 || !myTeamId) return;
    setOpeningBag(true);
    const ing = randomIngredient();
    setLastIngredient(ing);
    // Atomic decrement — prevents double-open race condition
    const bagResult = await runTransaction(
      ref(db, `rooms/${roomCode}/players/${playerId}/bags`),
      (current) => (current === null || current <= 0) ? undefined : current - 1
    );
    if (bagResult.committed) {
      // Atomic increment on team inventory
      await runTransaction(
        ref(db, `rooms/${roomCode}/teams/${myTeamId}/inventory/${ing}`),
        (current) => (current ?? 0) + 1
      );
    }
    setTimeout(() => { setOpeningBag(false); setLastIngredient(null); }, 2000);
  }

  async function handleWrapResult(result: WrapResult) {
    setShowWrap(false);
    if (!myTeamId || !myTeam) return;
    const inv = myTeam.inventory;
    if (!canWrap(inv)) return;
    const points   = WRAP_POINTS[result];
    const newScore = (myTeam.score ?? 0) + points;
    const newBanh  = { ...myTeam.banh, [result]: (myTeam.banh?.[result] ?? 0) + 1 };
    const newInv   = { gao: inv.gao - 2, thit: inv.thit - 1, dau: inv.dau - 1, la: inv.la - 1 };
    await update(ref(db, `rooms/${roomCode}/teams/${myTeamId}`), {
      score: newScore, banh: newBanh, inventory: newInv,
    });
  }

  if (!room || !currentQ) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const teams      = Object.entries(room.teams || {}).sort(([, a], [, b]) => b.score - a.score);
  const inv        = myTeam?.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
  const canWrapNow = myTeamId && canWrap(inv);
  const market     = room.market ?? {};
  const pendingOffers = Object.values(market).filter((o) => o.fromTeam !== myTeamId).length;

  return (
    <div className="max-w-2xl mx-auto p-3 space-y-3">
      {showWrap  && <WrappingBar onResult={handleWrapResult} onCancel={() => setShowWrap(false)} />}
      {showTrade && myTeamId && (
        <TradePanel
          roomCode={roomCode}
          myTeamId={myTeamId}
          myTeamName={myTeam?.name ?? ""}
          myInv={inv}
          market={market}
          onClose={() => setShowTrade(false)}
        />
      )}

      {/* Quiz modal */}
      {showQuiz && currentQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Image src="/pictures/question.png" alt="quiz" width={24} height={24} className="object-contain" />
                <p className="font-medium text-sm">Tìm Nguyên Liệu</p>
              </div>
              <div className="flex items-center gap-2">
                {!quizAnswered && (
                  <span className={cn(
                    "font-mono text-sm font-bold w-6 text-center",
                    quizTimeLeft <= 3 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                  )}>
                    {quizTimeLeft}s
                  </span>
                )}
                {!quizAnswered && (
                  <button onClick={() => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); setShowQuiz(false); setQuizQIdx(i => i + 1); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-serif text-sm leading-snug">{currentQ.question}</p>
              <div className="space-y-1.5">
                {currentQ.options.map((opt, i) => {
                  const isSelected = quizSelected === i;
                  const isCorrect  = i === correctIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => handleQuizAnswer(i)}
                      disabled={quizAnswered}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all",
                        !quizAnswered && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                        quizAnswered && isCorrect  && "border-green-500 bg-green-50 text-green-800 font-medium",
                        quizAnswered && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-700",
                        quizAnswered && !isSelected && !isCorrect && "opacity-40",
                        !quizAnswered && isSelected  && "border-primary bg-primary/5",
                        !quizAnswered && !isSelected && "border-border bg-background"
                      )}
                    >
                      <span className="font-medium mr-2 text-muted-foreground">{["A","B","C","D"][i]}.</span>
                      {opt}
                      {quizAnswered && isCorrect  && <span className="float-right">✅</span>}
                      {quizAnswered && isSelected && !isCorrect && <span className="float-right">❌</span>}
                    </button>
                  );
                })}
              </div>
              {quizAnswered && quizSelected === correctIdx && (
                <p className="text-sm text-green-600 font-medium text-center">🎉 Đúng! +1 túi nguyên liệu</p>
              )}
              {quizAnswered && quizSelected !== null && quizSelected !== correctIdx && (
                <p className="text-sm text-red-500 text-center">Sai rồi, cố lên! Không bị trừ điểm</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timer bar */}
      <div className="flex items-center justify-between gap-3">
        <div className={cn("font-mono text-xl font-bold tabular-nums", timeLeft < 30000 && "text-red-500 animate-pulse")}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground">{myTeam?.name ?? "Chưa vào team"}</div>
        <Badge variant="secondary">🎋 {myTeam?.score ?? 0}đ</Badge>
      </div>

      {/* Inventory + Bags + Trade */}
      <div className="grid grid-cols-2 gap-3">
        {/* Team inventory */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Kho {myTeam?.name ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_INGS.map((k) => (
                <div
                  key={k}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md border",
                    inv[k] > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/30 opacity-50"
                  )}
                >
                  <IngImg k={k} size={22} />
                  <span className="text-xs flex-1 truncate">{ING_NAME[k]}</span>
                  <span className="text-xs font-bold">{inv[k]}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Cần: 2 Gạo + 1 Thịt + 1 Đậu + 1 Lá
            </div>
          </CardContent>
        </Card>

        {/* Bags + Trade */}
        <div className="space-y-2">
          <Card className="border-border/50">
            <CardHeader className="pb-1 pt-2 px-3">
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
                <p className="text-center text-xs font-medium text-green-600 animate-bounce">
                  +1 {ING_NAME[lastIngredient]}!
                </p>
              )}
              <Button
                onClick={openQuiz}
                disabled={!myTeamId || quizAnswered}
                size="sm"
                className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
              >
                <Image src="/pictures/question.png" alt="quiz" width={16} height={16} className="object-contain" />
                Tìm nguyên liệu
              </Button>
              <Button
                onClick={openBag}
                disabled={myBags === 0 || openingBag || !myTeamId}
                size="sm" variant="outline" className="w-full text-xs"
              >
                {openingBag ? "Đang mở..." : myBags === 0 ? "Chưa có túi" : `Mở túi (${myBags})`}
              </Button>
            </CardContent>
          </Card>

          {/* Trade button */}
          <Button
            onClick={() => setShowTrade(true)}
            disabled={!myTeamId}
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5 relative"
          >
            <Image src="/pictures/shop.png" alt="shop" width={16} height={16} className="object-contain" />
            Quầy Quây Quần
            {pendingOffers > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {pendingOffers}
              </span>
            )}
          </Button>
        </div>
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

      {/* Live scoreboard */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bảng điểm</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-1">
          {teams.map(([tid, t], i) => (
            <div key={tid} className={cn(
              "flex items-center justify-between px-3 py-1.5 rounded-lg text-sm",
              tid === myTeamId ? "bg-primary/10 font-medium" : "bg-muted/30"
            )}>
              <span className="flex items-center gap-2">
                <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</span>
                <span className="truncate">{t.name}</span>
                {t.banh && (t.banh.hiem > 0 || t.banh.dep > 0 || t.banh.thuong > 0) && (
                  <span className="text-xs text-muted-foreground">
                    {t.banh.hiem > 0 && `🏆×${t.banh.hiem} `}
                    {t.banh.dep  > 0 && `✨×${t.banh.dep} `}
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
