"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ref, onValue, update, get, push, runTransaction } from "firebase/database";
import { db } from "@/lib/firebase";
import { questions } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import WrappingBar, { WrapResult } from "./WrappingBar";
import { X, ArrowRightLeft, Check } from "lucide-react";

type IngKey = "gao" | "thit" | "dau" | "la";
interface Inventory { gao: number; thit: number; dau: number; la: number; }
interface Player { name: string; teamId: string | null; }
interface Team { name: string; color: string; score: number; bags?: number; questionsAnswered?: number; inventory: Inventory; banh: { thuong: number; dep: number; hiem: number }; lastTradeBonusAt?: number; tradesCount?: number; }
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
const ALL_INGS: IngKey[] = ["gao", "thit", "dau", "la"];
const DROP_POOLS: IngKey[][] = [
  ["gao","gao","gao","thit","thit","thit","la","dau"],  // A — team1,5,...
  ["la","la","la","dau","dau","dau","gao","thit"],       // B — team2,6,...
  ["gao","gao","gao","la","la","la","thit","dau"],       // C — team3,7,...
  ["thit","thit","thit","dau","dau","dau","gao","la"],   // D — team4,8,...
];
function getDropPool(teamId: string | null): IngKey[] {
  if (!teamId) return DROP_POOLS[0];
  const n = parseInt(teamId.replace("team", ""), 10) || 1;
  return DROP_POOLS[(n - 1) % 4];
}

const GAME_DURATION = 10 * 60 * 1000;

function calcScore(banh: { thuong: number; dep: number; hiem: number } | undefined): number {
  if (!banh) return 0;
  return (banh.thuong ?? 0) * 1 + (banh.dep ?? 0) * 2 + (banh.hiem ?? 0) * 4;
}

function canWrap(inv: Inventory) {
  return inv.gao >= 2 && inv.thit >= 1 && inv.dau >= 1 && inv.la >= 1;
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
    if (myOffer) { setMsg("Bạn đã có 1 đề xuất đang chờ. Hủy trước rồi đăng lại."); return; }
    setPosting(true); setMsg("");
    // Atomically deduct the ingredient — locks it so it can't be double-spent
    const deductResult = await runTransaction(
      ref(db, `rooms/${roomCode}/teams/${myTeamId}/inventory/${giveIng}`),
      (current) => (current === null || current < 1) ? undefined : current - 1
    );
    if (!deductResult.committed) {
      setMsg(`Bạn không có ${ING_NAME[giveIng]} để đổi!`);
      setPosting(false); return;
    }
    await push(ref(db, `rooms/${roomCode}/market`), {
      fromTeam: myTeamId, fromTeamName: myTeamName, give: giveIng, want: wantIng,
    });
    setMsg("Đã đăng! Chờ team khác chấp nhận...");
    setPosting(false);
  }

  async function cancelOffer(id: string, giveIng: IngKey) {
    // Use runTransaction instead of remove — only restore if offer still exists (not already accepted)
    const claimResult = await runTransaction(
      ref(db, `rooms/${roomCode}/market/${id}`),
      (current) => current === null ? undefined : null
    );
    if (!claimResult.committed) {
      setMsg("Đề xuất vừa được nhóm khác chấp nhận rồi!");
      return;
    }
    await runTransaction(
      ref(db, `rooms/${roomCode}/teams/${myTeamId}/inventory/${giveIng}`),
      (current) => (current ?? 0) + 1
    );
    setMsg("");
  }

  async function acceptOffer(id: string, offer: TradeOffer) {
    if (offer.fromTeam === myTeamId) { setMsg("Không thể chấp nhận đề xuất của chính nhóm mình!"); return; }
    setAccepting(id); setMsg("");

    // Atomically claim (remove) the offer first — prevents two teams accepting simultaneously
    const claimResult = await runTransaction(
      ref(db, `rooms/${roomCode}/market/${id}`),
      (current) => current === null ? undefined : null
    );
    if (!claimResult.committed) {
      setMsg("Đề xuất này vừa được nhóm khác chấp nhận rồi!");
      setAccepting(null); return;
    }

    // Re-fetch both teams' inventories after claiming
    const roomSnap = await get(ref(db, `rooms/${roomCode}`));
    if (!roomSnap.exists()) { setAccepting(null); return; }
    const freshRoom = roomSnap.val() as Room;

    const offerTeamInv: Inventory = freshRoom.teams[offer.fromTeam]?.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
    const myFreshInv: Inventory   = freshRoom.teams[myTeamId]?.inventory    ?? { gao: 0, thit: 0, dau: 0, la: 0 };

    // offer.give was already deducted from poster at postOffer time — don't check/deduct again
    // Only check that MY team has the want ingredient
    if ((myFreshInv[offer.want] ?? 0) < 1) {
      // Restore poster's locked ingredient since trade can't complete
      await runTransaction(
        ref(db, `rooms/${roomCode}/teams/${offer.fromTeam}/inventory/${offer.give}`),
        (current) => (current ?? 0) + 1
      );
      setMsg(`Nhóm bạn không có ${ING_NAME[offer.want]} để đổi!`);
      setAccepting(null); return;
    }

    // Single atomic multi-path update — all-or-nothing, no partial failure
    const now = Date.now();
    await update(ref(db, `rooms/${roomCode}`), {
      [`teams/${offer.fromTeam}/inventory/${offer.want}`]: (offerTeamInv[offer.want] ?? 0) + 1,
      [`teams/${offer.fromTeam}/lastTradeBonusAt`]: now,
      [`teams/${offer.fromTeam}/tradesCount`]: (freshRoom.teams[offer.fromTeam]?.tradesCount ?? 0) + 1,
      [`teams/${myTeamId}/inventory/${offer.want}`]: myFreshInv[offer.want] - 1,
      [`teams/${myTeamId}/inventory/${offer.give}`]: (myFreshInv[offer.give] ?? 0) + 1,
      [`teams/${myTeamId}/lastTradeBonusAt`]: now,
      [`teams/${myTeamId}/tradesCount`]: (freshRoom.teams[myTeamId]?.tradesCount ?? 0) + 1,
    });
    setMsg(`✅ Đã đổi thành công! +1 ${ING_NAME[offer.give]}  🤝 Nhóm được -3s nghỉ ngơi!`);
    setAccepting(null);
  }

  // Offers from other teams
  const otherOffers = Object.entries(market).filter(([, o]) => o.fromTeam !== myTeamId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/pictures/shop.png" alt="shop" width={28} height={28} className="object-contain" />
            <h3 className="font-semibold text-base">Quầy Quây Quần</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Post offer */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Đăng đề xuất đổi</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tôi cho</p>
              <div className="grid grid-cols-4 gap-2">
                {ALL_INGS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setGiveIng(k)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-1 py-2 rounded-xl border-2 text-xs transition-all",
                      giveIng === k ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background",
                      (myInv[k] ?? 0) === 0 && "opacity-40"
                    )}
                  >
                    <IngImg k={k} size={24} />
                    <span>{ING_NAME[k]}</span>
                    <span className="text-muted-foreground font-normal">×{myInv[k] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-border" />
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tôi muốn</p>
              <div className="grid grid-cols-4 gap-2">
                {ALL_INGS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setWantIng(k)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-1 py-2 rounded-xl border-2 text-xs transition-all",
                      wantIng === k ? "border-green-500 bg-green-50 font-semibold" : "border-border bg-background"
                    )}
                  >
                    <IngImg k={k} size={24} />
                    <span>{ING_NAME[k]}</span>
                  </button>
                ))}
              </div>
            </div>

            {myOffer ? (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-amber-700">
                  Đang chờ: <strong>{ING_NAME[myOffer[1].give]}</strong> → <strong>{ING_NAME[myOffer[1].want]}</strong>
                </p>
                <Button size="sm" variant="ghost" onClick={() => cancelOffer(myOffer[0], myOffer[1].give)} className="text-sm h-7 text-red-500 hover:text-red-700">
                  Hủy
                </Button>
              </div>
            ) : (
              <Button onClick={postOffer} disabled={posting} className="w-full h-10 text-sm gap-2">
                <Image src="/pictures/shop.png" alt="shop" width={18} height={18} className="object-contain" />
                Đăng đổi: 1 {ING_NAME[giveIng]} → 1 {ING_NAME[wantIng]}
              </Button>
            )}
          </div>

          {/* Offers from others */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
              Đề xuất từ nhóm khác ({otherOffers.length})
            </p>
            {otherOffers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-5 italic">Chưa có đề xuất nào...</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {otherOffers.map(([id, offer]) => (
                  <div key={id} className="bg-background border border-border rounded-xl p-3.5 space-y-2.5">
                    <p className="text-sm font-semibold">{offer.fromTeamName}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 text-center">
                        <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-1">Bạn sẽ mất</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <IngImg k={offer.want} size={22} />
                          <span className="text-sm font-bold text-red-700">{ING_NAME[offer.want]}</span>
                        </div>
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-2.5 py-2 text-center">
                        <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide mb-1">Bạn sẽ nhận</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <IngImg k={offer.give} size={22} />
                          <span className="text-sm font-bold text-green-700">{ING_NAME[offer.give]}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => acceptOffer(id, offer)}
                      disabled={accepting === id || (myInv[offer.want] ?? 0) < 1}
                      className="w-full h-10 text-sm gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {accepting === id ? <span className="animate-spin">⏳</span> : <><Check className="w-4 h-4" />Đổi ngay</>}
                    </Button>
                    {(myInv[offer.want] ?? 0) < 1 && (
                      <p className="text-xs text-red-500 text-center -mt-1">Bạn không có {ING_NAME[offer.want]} để đổi</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg && (
            <p className={cn("text-sm text-center rounded-xl px-3 py-2.5",
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
  const [playerCooldown, setPlayerCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const lastTradeBonusRef = useRef<number>(0);
  const [showScoreModal, setShowScoreModal] = useState(false);

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
  const myBags   = myTeam?.bags ?? 0;

  const timeLeft = room ? Math.max(0, GAME_DURATION - (now - room.gameStartTime)) : 0;
  const currentQ = shuffledQuestions[quizQIdx % shuffledQuestions.length];
  const correctIdx = currentQ?.correct;

  // Per-player cooldown countdown
  useEffect(() => {
    if (playerCooldown <= 0) return;
    cooldownRef.current = setTimeout(() => setPlayerCooldown(c => Math.max(0, c - 1)), 1000);
    return () => { if (cooldownRef.current) clearTimeout(cooldownRef.current); };
  }, [playerCooldown]);

  // Trade bonus: detect lastTradeBonusAt change → -3s cooldown
  const myTeamForBonus = myTeamId ? room?.teams?.[myTeamId] : null;
  useEffect(() => {
    const newBonus = myTeamForBonus?.lastTradeBonusAt ?? 0;
    if (newBonus > lastTradeBonusRef.current) {
      lastTradeBonusRef.current = newBonus;
      setPlayerCooldown(c => Math.max(0, c - 3));
    }
  }, [myTeamForBonus?.lastTradeBonusAt]);

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
          setPlayerCooldown(10);
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
    setPlayerCooldown(10);
    if (myPlayer && myTeamId) {
      await runTransaction(
        ref(db, `rooms/${roomCode}/teams/${myTeamId}/questionsAnswered`),
        (current) => (current ?? 0) + 1
      );
      if (optionIdx === correctIdx) {
        await runTransaction(
          ref(db, `rooms/${roomCode}/teams/${myTeamId}/bags`),
          (current) => (current ?? 0) + 1
        );
      }
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
    const pool = getDropPool(myTeamId);
    const ing = pool[Math.floor(Math.random() * pool.length)];
    // Atomic decrement first — only show ingredient if bags actually decremented
    const bagResult = await runTransaction(
      ref(db, `rooms/${roomCode}/teams/${myTeamId}/bags`),
      (current) => (current === null || current <= 0) ? undefined : current - 1
    );
    if (bagResult.committed) {
      setLastIngredient(ing);
      await runTransaction(
        ref(db, `rooms/${roomCode}/teams/${myTeamId}/inventory/${ing}`),
        (current) => (current ?? 0) + 1
      );
    }
    setTimeout(() => { setOpeningBag(false); setLastIngredient(null); }, 2000);
  }

  async function handleWrapResult(result: WrapResult) {
    setShowWrap(false);
    if (!myTeamId) return;
    // Atomic transaction on the whole team node — eliminates TOCTOU race between teammates
    // If two players wrap simultaneously, only the first commit succeeds; the second sees
    // canWrap = false after the first has already deducted and aborts cleanly.
    await runTransaction(ref(db, `rooms/${roomCode}/teams/${myTeamId}`), (current) => {
      if (!current) return undefined;
      const inv: Inventory = current.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
      if (!canWrap(inv)) return undefined; // abort — not enough or already used by teammate
      return {
        ...current,
        inventory: { gao: inv.gao - 2, thit: inv.thit - 1, dau: inv.dau - 1, la: inv.la - 1 },
        banh: {
          thuong: current.banh?.thuong ?? 0,
          dep:    current.banh?.dep    ?? 0,
          hiem:   current.banh?.hiem   ?? 0,
          [result]: (current.banh?.[result] ?? 0) + 1,
        },
      };
    });
  }

  if (!room || !currentQ) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const teams      = Object.entries(room.teams || {}).sort(([, a], [, b]) => calcScore(b.banh) - calcScore(a.banh));
  const inv        = myTeam?.inventory ?? { gao: 0, thit: 0, dau: 0, la: 0 };
  const canWrapNow = myTeamId && canWrap(inv);
  const market     = room.market ?? {};
  const pendingOffers = Object.values(market).filter((o) => o.fromTeam !== myTeamId).length;

  const colorMap: Record<IngKey, string> = {
    gao:  "bg-yellow-50 border-yellow-300",
    thit: "bg-red-50 border-red-300",
    dau:  "bg-green-50 border-green-300",
    la:   "bg-emerald-50 border-emerald-300",
  };

  return (
    <div className="max-w-xl mx-auto p-5 space-y-4">
      {showWrap && <WrappingBar onResult={handleWrapResult} onCancel={() => setShowWrap(false)} />}
      {showTrade && myTeamId && (
        <TradePanel
          roomCode={roomCode} myTeamId={myTeamId} myTeamName={myTeam?.name ?? ""}
          myInv={inv} market={market}
          onClose={() => setShowTrade(false)}
        />
      )}

      {/* Scoreboard modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowScoreModal(false)}>
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-sm p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Image src="/pictures/podium.png" alt="podium" width={18} height={18} className="object-contain" />
                Bảng điểm
              </h3>
              <button onClick={() => setShowScoreModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {teams.map(([tid, t], i) => (
                <div key={tid} className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-sm border-2",
                  i === 0 ? "bg-amber-50 border-amber-300 shadow-sm" :
                  tid === myTeamId ? "bg-primary/10 border-primary/30 font-medium" :
                  "bg-muted/30 border-transparent"
                )}>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</span>
                    <span className="truncate font-medium">{t.name}</span>
                  </span>
                  <span className={cn("font-extrabold text-base shrink-0 ml-2", i === 0 ? "text-amber-600" : "text-primary")}>
                    {calcScore(t.banh)} Điểm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quiz modal */}
      {showQuiz && currentQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Image src="/pictures/question.png" alt="quiz" width={28} height={28} className="object-contain" />
                <p className="font-semibold text-base">Tìm Nguyên Liệu</p>
              </div>
              <div className="flex items-center gap-3">
                {!quizAnswered && (
                  <span className={cn("font-mono text-lg font-bold w-8 text-center", quizTimeLeft <= 3 ? "text-red-500 animate-pulse" : "text-muted-foreground")}>
                    {quizTimeLeft}s
                  </span>
                )}
                {!quizAnswered && (
                  <button onClick={() => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); setShowQuiz(false); setQuizQIdx(i => i + 1); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="font-serif text-base leading-relaxed">{currentQ.question}</p>
              <div className="space-y-2">
                {currentQ.options.map((opt, i) => {
                  const isSelected = quizSelected === i;
                  const isCorrect  = i === correctIdx;
                  return (
                    <button key={i} onClick={() => handleQuizAnswer(i)} disabled={quizAnswered}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border-2 text-base transition-all",
                        !quizAnswered && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                        quizAnswered && isCorrect  && "border-green-500 bg-green-50 text-green-800 font-medium",
                        quizAnswered && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-700",
                        quizAnswered && !isSelected && !isCorrect && "opacity-40",
                        !quizAnswered && isSelected  && "border-primary bg-primary/5",
                        !quizAnswered && !isSelected && "border-border bg-background"
                      )}>
                      <span className="font-semibold mr-2 text-muted-foreground">{["A","B","C","D"][i]}.</span>
                      {opt}
                      {quizAnswered && isCorrect  && <span className="float-right">✅</span>}
                      {quizAnswered && isSelected && !isCorrect && <span className="float-right">❌</span>}
                    </button>
                  );
                })}
              </div>
              {quizAnswered && quizSelected === correctIdx && (
                <p className="text-base text-green-600 font-semibold text-center">🎉 Đúng! +1 túi nguyên liệu</p>
              )}
              {quizAnswered && quizSelected !== null && quizSelected !== correctIdx && (
                <p className="text-base text-red-500 text-center">Sai rồi, cố lên! Không bị trừ điểm</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Timer bar */}
      <div className="flex items-center justify-between gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/40 shadow-md">
        <div className={cn("font-mono text-3xl font-extrabold tabular-nums tracking-tight", timeLeft < 30000 ? "text-red-500 animate-pulse" : "text-foreground")}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div className="text-base font-medium text-foreground/70 truncate">{myTeam?.name ?? "Chưa vào nhóm"}</div>
        <Badge variant="secondary" className="text-base font-bold px-4 py-1.5">🎋 {calcScore(myTeam?.banh)} Điểm</Badge>
      </div>

      {/* 2. Inventory — compact 4-column */}
      <Card className="border-2 border-border/60 shadow-sm">
        <CardContent className="px-4 py-4">
          <div className="grid grid-cols-4 gap-3">
            {ALL_INGS.map((k) => (
              <div key={k} className={cn(
                "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all",
                inv[k] > 0 ? colorMap[k] : "bg-muted/20 border-border/30 opacity-50"
              )}>
                <IngImg k={k} size={32} />
                <span className="text-sm font-medium text-muted-foreground">{ING_NAME[k]}</span>
                <span className="text-xl font-extrabold leading-none">{inv[k]}</span>
              </div>
            ))}
          </div>
          {lastIngredient && (
            <p className="text-center text-sm font-semibold text-green-600 animate-bounce mt-3">+1 {ING_NAME[lastIngredient]}!</p>
          )}
          <p className="text-sm font-medium text-muted-foreground text-center mt-3">Cần: 2 Gạo + 1 Thịt + 1 Đậu + 1 Lá</p>
        </CardContent>
      </Card>

      {/* 3. HERO: Gói Bánh */}
      <Button
        onClick={() => setShowWrap(true)}
        disabled={!canWrapNow}
        className="w-full h-20 text-2xl font-bold gap-3 shadow-lg"
        style={canWrapNow ? { background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 4px 20px rgba(22,163,74,0.45)", color: "white" } : {}}
      >
        <Image src="/pictures/chung-cake.png" alt="bánh chưng" width={40} height={40} className="object-contain" />
        Gói Bánh
      </Button>

      {/* 4. Tìm nguyên liệu + Mở túi */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={openQuiz}
          disabled={!myTeamId || quizAnswered || playerCooldown > 0}
          className="h-14 text-base font-bold text-white gap-2"
          style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
        >
          <Image src="/pictures/question.png" alt="quiz" width={18} height={18} className="object-contain" />
          {playerCooldown > 0 ? `Nghỉ ${playerCooldown}s...` : "Tìm nguyên liệu"}
        </Button>
        <Button
          onClick={openBag}
          disabled={myBags === 0 || openingBag || !myTeamId}
          className="h-14 text-base font-bold border-2 border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 gap-2"
        >
          🎁 {openingBag ? "Đang mở..." : myBags === 0 ? "Chưa có túi" : `Mở túi (${myBags})`}
        </Button>
      </div>

      {/* 5. Trade */}
      <Button
        onClick={() => setShowTrade(true)}
        disabled={!myTeamId}
        className="w-full h-14 text-base font-bold gap-2 relative bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Image src="/pictures/shop.png" alt="shop" width={18} height={18} className="object-contain" />
        Quầy Quây Quần
        {pendingOffers > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {pendingOffers}
          </span>
        )}
      </Button>

      {/* 6. Xem bảng điểm CTA */}
      <button
        onClick={() => setShowScoreModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 text-base font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
      >
        <Image src="/pictures/podium.png" alt="podium" width={14} height={14} className="object-contain opacity-60" />
        Xem bảng điểm
      </button>
    </div>
  );
}
