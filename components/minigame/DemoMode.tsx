"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { questions } from "@/lib/questions";
import WrappingBar, { WrapResult } from "./WrappingBar";
import {
  PlayCircle, ChevronRight, Users, Trophy,
  Copy, Check, RotateCcw, ArrowLeft,
  X, ArrowRightLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
type IngKey = "gao" | "thit" | "dau" | "la";
interface Inventory { gao: number; thit: number; dau: number; la: number; }
interface TradeOffer { id: string; fromTeam: string; fromTeamName: string; give: IngKey; want: IngKey; }

// ─── Constants ────────────────────────────────────────────────
const ING_IMG: Record<IngKey, string> = {
  gao:  "/pictures/gao.png",
  thit: "/pictures/thit_ba_chi.png",
  dau:  "/pictures/dau.png",
  la:   "/pictures/la.png",
};
const ING_NAME: Record<IngKey, string> = { gao: "Gạo", thit: "Thịt", dau: "Đậu", la: "Lá" };
const ALL_INGS: IngKey[] = ["gao", "thit", "dau", "la"];
const GAME_DURATION = 7 * 60 * 1000;
const MEDALS = ["🥇", "🥈", "🥉"];

const MOCK_TEAMS = {
  team1: { name: "Người Kinh",   color: "red",    score: 4, inventory: { gao: 1, thit: 1, dau: 0, la: 0 } as Inventory, banh: { thuong: 1, dep: 1, hiem: 0 } },
  team2: { name: "Người Tày",    color: "blue",   score: 2, inventory: { gao: 0, thit: 0, dau: 1, la: 1 } as Inventory, banh: { thuong: 1, dep: 0, hiem: 0 } },
  team3: { name: "Người Thái",   color: "yellow", score: 8, inventory: { gao: 2, thit: 1, dau: 1, la: 1 } as Inventory, banh: { thuong: 0, dep: 1, hiem: 1 } },
};
const MOCK_PLAYERS = {
  player1: { name: "Minh Khoa", teamId: "team1" },
  player2: { name: "Thu Hà",   teamId: "team1" },
  player3: { name: "Bảo Nam",  teamId: "team2" },
  player4: { name: "Linh Chi", teamId: "team2" },
  player5: { name: "Tuấn Anh", teamId: "team3" },
  player6: { name: "Mỹ Dung",  teamId: "team3" },
};
const INITIAL_TRADE_OFFERS: TradeOffer[] = [
  { id: "o1", fromTeam: "team2", fromTeamName: "Người Tày",  give: "la",   want: "gao" },
  { id: "o2", fromTeam: "team3", fromTeamName: "Người Thái", give: "thit", want: "dau" },
];
const TEAM_COLORS: Record<string, string> = {
  red:    "bg-red-50 border-red-300 text-red-800",
  blue:   "bg-blue-50 border-blue-300 text-blue-800",
  yellow: "bg-yellow-50 border-yellow-300 text-yellow-800",
};

// ─── Helpers ──────────────────────────────────────────────────
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
function canWrap(inv: Inventory) {
  return inv.gao >= 2 && inv.thit >= 1 && inv.dau >= 1 && inv.la >= 1;
}

// ─── Ingredient image ─────────────────────────────────────────
function IngImg({ k, size = 24 }: { k: IngKey; size?: number }) {
  return (
    <Image src={ING_IMG[k]} alt={ING_NAME[k]} width={size} height={size} className="object-contain rounded" />
  );
}

// ─── Phase types ──────────────────────────────────────────────
type Phase = "lobby" | "waiting" | "playing" | "scoreboard";
const STEPS: { key: Phase; label: string }[] = [
  { key: "lobby",      label: "Lobby" },
  { key: "waiting",    label: "Phòng chờ" },
  { key: "playing",    label: "Chơi game" },
  { key: "scoreboard", label: "Kết quả" },
];

// ─── Lobby ────────────────────────────────────────────────────
function DemoLobby({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tên của bạn</label>
          <input readOnly value="Minh Khoa" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-muted/30" />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <div className="flex-1 py-2 text-sm font-medium text-center bg-primary text-primary-foreground">Tạo phòng</div>
          <div className="flex-1 py-2 text-sm font-medium text-center text-muted-foreground">Vào phòng</div>
        </div>
        <Button onClick={onNext} className="w-full gap-2"><PlayCircle className="w-4 h-4" />Tạo phòng mới</Button>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground mb-1">📋 Luật chơi nhanh:</p>
        <p>• Ấn "Tìm nguyên liệu" → trả lời câu hỏi → nhận túi</p>
        <p>• Mở túi → ngẫu nhiên: Gạo / Thịt / Đậu / Lá</p>
        <p>• Gói bánh = 2 Gạo + 1 Thịt + 1 Đậu + 1 Lá</p>
        <p>• Đổi nguyên liệu tại 🏪 Quầy Quây Quần!</p>
      </div>
    </div>
  );
}

// ─── Waiting room ─────────────────────────────────────────────
function DemoWaitingRoom({ onNext }: { onNext: () => void }) {
  const [copied, setCopied] = useState(false);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  function copy() { setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return (
    <div className="space-y-3">
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Mã phòng</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-widest text-primary">AB12CD</span>
                <button onClick={copy}>{copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}</button>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="gap-1"><Users className="w-3 h-3" />6 người</Badge>
              <Badge className="bg-amber-500 text-white">👑 Host</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {Object.entries(MOCK_TEAMS).map(([tid, team]) => {
          const members = Object.entries(MOCK_PLAYERS).filter(([, p]) => p.teamId === tid);
          const isMyTeam = myTeam === tid;
          return (
            <Card key={tid} className={`border-2 ${isMyTeam ? "ring-2 ring-primary ring-offset-1" : ""}`}>
              <CardHeader className="pb-1 pt-2 px-2">
                <CardTitle className="text-xs font-semibold flex justify-between">
                  <span>{team.name}</span>
                  <Badge variant="outline" className="text-xs">{members.length}/3</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2 space-y-1">
                {members.map(([pid, p]) => (
                  <div key={pid} className={`text-xs px-1.5 py-0.5 rounded border ${TEAM_COLORS[team.color]} truncate`}>
                    {pid === "player1" && "👑 "}{p.name}
                  </div>
                ))}
                <Button size="sm" onClick={() => setMyTeam(isMyTeam ? null : tid)} variant={isMyTeam ? "outline" : "default"}
                  className="w-full text-xs h-6 mt-1" disabled={members.length >= 3 && !isMyTeam}>
                  {isMyTeam ? "Rời team" : "Vào team"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={onNext} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
        <PlayCircle className="w-4 h-4" />Bắt đầu Game!
      </Button>
    </div>
  );
}

// ─── Trade panel (local state, no Firebase) ───────────────────
function DemoTradePanel({
  myInv, offers, onClose,
}: {
  myInv: Inventory;
  offers: TradeOffer[];
  onClose: (acceptedOffer?: TradeOffer) => void;
}) {
  const [give, setGive] = useState<IngKey>("gao");
  const [want, setWant] = useState<IngKey>("thit");
  const [msg, setMsg] = useState("");

  function postOffer() {
    if (give === want) { setMsg("Chọn hai nguyên liệu khác nhau!"); return; }
    if (myInv[give] < 1) { setMsg(`Bạn không có ${ING_NAME[give]}!`); return; }
    setMsg("✅ Đã đăng! (Demo: không kết nối thật)");
  }

  function acceptOffer(offer: TradeOffer) {
    if (myInv[offer.want] < 1) { setMsg(`Bạn không có ${ING_NAME[offer.want]} để đổi!`); return; }
    onClose(offer);
  }

  const otherOffers = offers.filter(o => o.fromTeam !== "team1");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Image src="/pictures/shop.png" alt="shop" width={24} height={24} className="object-contain" />
            <h3 className="font-semibold">Quầy Quây Quần</h3>
          </div>
          <button onClick={() => onClose()} className="text-muted-foreground hover:text-foreground">
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
                  {ALL_INGS.map(k => (
                    <button key={k} onClick={() => setGive(k)}
                      className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all",
                        give === k ? "border-primary bg-primary/10 font-medium" : "border-border bg-background",
                        myInv[k] === 0 && "opacity-40")}>
                      <IngImg k={k} size={18} />
                      <span>{ING_NAME[k]}</span>
                      <span className="ml-auto text-muted-foreground">×{myInv[k]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Tôi muốn</p>
                <div className="grid grid-cols-2 gap-1">
                  {ALL_INGS.map(k => (
                    <button key={k} onClick={() => setWant(k)}
                      className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all",
                        want === k ? "border-green-500 bg-green-50 font-medium" : "border-border bg-background")}>
                      <IngImg k={k} size={18} />
                      <span>{ING_NAME[k]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={postOffer} size="sm" className="w-full gap-1.5">
              <Image src="/pictures/shop.png" alt="shop" width={16} height={16} className="object-contain" />
              Đăng: 1 {ING_NAME[give]} → 1 {ING_NAME[want]}
            </Button>
          </div>

          {/* Offers from others */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Đề xuất từ team khác ({otherOffers.length})
            </p>
            {otherOffers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic">Chưa có đề xuất...</p>
            ) : (
              <div className="space-y-2">
                {otherOffers.map(offer => (
                  <div key={offer.id} className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2 gap-2">
                    <div>
                      <p className="text-xs font-medium">{offer.fromTeamName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <IngImg k={offer.give} size={16} />
                        <span className="text-xs">{ING_NAME[offer.give]}</span>
                        <ArrowRightLeft className="w-3 h-3 text-muted-foreground mx-0.5" />
                        <IngImg k={offer.want} size={16} />
                        <span className="text-xs">{ING_NAME[offer.want]}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => acceptOffer(offer)}
                      disabled={myInv[offer.want] < 1}
                      className="text-xs h-7 gap-1 bg-green-600 hover:bg-green-700 text-white shrink-0">
                      <Check className="w-3 h-3" />Đổi
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg && (
            <p className={cn("text-xs text-center rounded-lg px-3 py-2",
              msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground")}>
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Gameplay ─────────────────────────────────────────────────
function DemoGamePlay({ onWrap, startTime }: { onWrap: () => void; startTime: number }) {
  const [now, setNow]           = useState(Date.now());
  const [bags, setBags]         = useState(2);
  const [lastIng, setLast]      = useState<IngKey | null>(null);
  const [inv, setInv]           = useState<Inventory>({ gao: 1, thit: 1, dau: 0, la: 0 });
  const [showTrade, setTrade]   = useState(false);
  const [tradeOffers, setOffers]= useState<TradeOffer[]>(INITIAL_TRADE_OFFERS);
  const [showQuiz, setQuiz]       = useState(false);
  const [quizQIdx, setQuizQIdx]   = useState(0);
  const [quizSel, setQuizSel]     = useState<number | null>(null);
  const [quizDone, setQuizDone]   = useState(false);
  const [quizTimeLeft, setQuizTL] = useState(10);
  const quizTimerRef              = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const shuffledQ = useMemo(() => seededShuffle([...questions], startTime), [startTime]);
  const currentQ  = shuffledQ[quizQIdx % shuffledQ.length];
  const elapsed   = now - startTime;
  const timeLeft  = Math.max(0, GAME_DURATION - elapsed);
  const canWrapNow = canWrap(inv);
  const pendingOffers = tradeOffers.filter(o => o.fromTeam !== "team1").length;

  const sorted = Object.entries(MOCK_TEAMS).sort(([, a], [, b]) => b.score - a.score);

  // Countdown 10s — auto-close quiz on timeout
  useEffect(() => {
    if (!showQuiz || quizDone) return;
    setQuizTL(10);
    quizTimerRef.current = setInterval(() => {
      setQuizTL(t => {
        if (t <= 1) {
          clearInterval(quizTimerRef.current!);
          setQuiz(false);
          setQuizQIdx(n => n + 1);
          return 10;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuiz]);

  function openQuiz() { setQuizSel(null); setQuizDone(false); setQuiz(true); }

  function answerQuiz(i: number) {
    if (quizDone) return;
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    setQuizSel(i);
    setQuizDone(true);
    if (i === currentQ.correct) setBags(b => b + 1);
    setTimeout(() => {
      setQuiz(false);
      setQuizQIdx(n => n + 1);
      setQuizSel(null);
      setQuizDone(false);
    }, 1800);
  }

  function openBag() {
    if (bags <= 0) return;
    const pool: IngKey[] = ["gao", "gao", "thit", "dau", "la"];
    const ing = pool[Math.floor(Math.random() * pool.length)];
    setBags(b => b - 1);
    setInv(v => ({ ...v, [ing]: v[ing] + 1 }));
    setLast(ing);
    setTimeout(() => setLast(null), 2000);
  }

  function handleTradeClose(accepted?: TradeOffer) {
    if (accepted) {
      setInv(v => ({ ...v, [accepted.give]: v[accepted.give] + 1, [accepted.want]: Math.max(0, v[accepted.want] - 1) }));
      setOffers(os => os.filter(o => o.id !== accepted.id));
    }
    setTrade(false);
  }

  return (
    <div className="space-y-3">
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
                {!quizDone && (
                  <span className={cn(
                    "font-mono text-sm font-bold w-6 text-center",
                    quizTimeLeft <= 3 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                  )}>
                    {quizTimeLeft}s
                  </span>
                )}
                {!quizDone && (
                  <button onClick={() => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); setQuiz(false); setQuizQIdx(n => n + 1); }}
                    className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-serif text-sm leading-snug">{currentQ.question}</p>
              <div className="space-y-1.5">
                {currentQ.options.map((opt, i) => {
                  const isSel = quizSel === i;
                  const isRight = i === currentQ.correct;
                  return (
                    <button key={i} onClick={() => answerQuiz(i)} disabled={quizDone}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all",
                        !quizDone && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                        quizDone && isRight && "border-green-500 bg-green-50 text-green-800 font-medium",
                        quizDone && isSel && !isRight && "border-red-400 bg-red-50 text-red-700",
                        quizDone && !isSel && !isRight && "opacity-40",
                        !quizDone && isSel && "border-primary bg-primary/5",
                        !quizDone && !isSel && "border-border bg-background"
                      )}>
                      <span className="font-medium mr-2 text-muted-foreground">{["A","B","C","D"][i]}.</span>
                      {opt}
                      {quizDone && isRight && <span className="float-right">✅</span>}
                      {quizDone && isSel && !isRight && <span className="float-right">❌</span>}
                    </button>
                  );
                })}
              </div>
              {quizDone && quizSel === currentQ.correct && (
                <p className="text-sm text-green-600 font-medium text-center">🎉 Đúng! +1 túi nguyên liệu</p>
              )}
              {quizDone && quizSel !== null && quizSel !== currentQ.correct && (
                <p className="text-sm text-red-500 text-center">Sai rồi, cố lên! Không bị trừ điểm</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trade panel */}
      {showTrade && (
        <DemoTradePanel myInv={inv} offers={tradeOffers} onClose={handleTradeClose} />
      )}

      {/* Timer */}
      <div className="flex items-center justify-between gap-3">
        <div className={cn("font-mono text-xl font-bold", timeLeft < 30000 && "text-red-500 animate-pulse")}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground">Người Kinh</div>
        <Badge variant="secondary">🎋 4đ</Badge>
      </div>

      {/* Inventory + Bags */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-border/50">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Kho Người Kinh</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="grid grid-cols-2 gap-1">
              {ALL_INGS.map(k => (
                <div key={k} className={cn("flex items-center gap-1.5 px-2 py-1 rounded border text-xs",
                  inv[k] > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/30 opacity-50")}>
                  <IngImg k={k} size={20} />
                  <span className="flex-1 truncate">{ING_NAME[k]}</span>
                  <span className="font-bold">{inv[k]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1.5">2🌾+1🥩+1🫘+1🌿</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Túi của bạn</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2 text-center space-y-1.5">
            <div>
              <p className="text-2xl">🎁</p>
              <p className="text-xl font-bold text-primary">{bags}</p>
              <p className="text-xs text-muted-foreground">túi chưa mở</p>
            </div>
            {lastIng && <p className="text-xs text-green-600 font-medium animate-bounce">+1 {ING_NAME[lastIng]}!</p>}
            <Button onClick={openQuiz} disabled={quizDone} size="sm"
              className="w-full text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white">
              <Image src="/pictures/question.png" alt="quiz" width={16} height={16} className="object-contain" />
              Tìm nguyên liệu
            </Button>
            <Button onClick={openBag} disabled={bags === 0} size="sm" variant="outline" className="w-full text-xs h-7">
              {bags === 0 ? "Chưa có túi" : `Mở túi (${bags})`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Trade + Wrap */}
      <div className="flex gap-2">
        <Button onClick={() => setTrade(true)} variant="outline" size="sm"
          className="flex-1 text-xs gap-1.5 relative">
          <Image src="/pictures/shop.png" alt="shop" width={16} height={16} className="object-contain" />
          Quầy Quây Quần
          {pendingOffers > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {pendingOffers}
            </span>
          )}
        </Button>
        <Button onClick={onWrap} variant={canWrapNow ? "default" : "outline"}
          className={cn("flex-1 text-xs font-semibold gap-1",
            canWrapNow && "bg-green-600 hover:bg-green-700 text-white")}>
          🎋 {canWrapNow ? "Gói Bánh!" : "Xem thử Gói →"}
        </Button>
      </div>

      {/* Scoreboard */}
      <Card className="border-border/50">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Bảng điểm</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2 space-y-1">
          {sorted.map(([tid, t], i) => (
            <div key={tid} className={cn("flex justify-between px-2 py-1 rounded text-xs",
              tid === "team1" ? "bg-primary/10 font-medium" : "bg-muted/30")}>
              <span>{MEDALS[i]} {t.name}</span>
              <span className="font-bold text-primary">{t.score}đ</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Scoreboard ───────────────────────────────────────────────
function DemoScoreboard({ onRestart }: { onRestart: () => void }) {
  const sorted = Object.entries(MOCK_TEAMS).sort(([, a], [, b]) => b.score - a.score);
  const COLOR_MAP: Record<string, string> = {
    red: "border-red-300 bg-red-50", blue: "border-blue-300 bg-blue-50", yellow: "border-yellow-300 bg-yellow-50",
  };
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <Trophy className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="font-serif text-xl font-semibold">Kết thúc!</h3>
        <p className="text-sm text-muted-foreground">🎉 <strong>{sorted[0][1].name}</strong> chiến thắng với <strong>{sorted[0][1].score} điểm</strong>!</p>
      </div>

      <div className="flex items-end justify-center gap-2 h-24">
        {sorted.slice(0, 3).map(([tid, team], i) => {
          const heights = ["h-24", "h-16", "h-12"];
          return (
            <div key={tid} className={`flex-1 flex flex-col items-center ${heights[i]}`}>
              <p className="text-xl mb-1">{MEDALS[i]}</p>
              <div className={`w-full rounded-t-lg border-2 ${COLOR_MAP[team.color]} flex flex-col items-center justify-center flex-1`}>
                <p className="text-xs font-semibold text-center px-1 leading-tight">{team.name}</p>
                <p className="text-base font-bold">{team.score}đ</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {sorted.map(([tid, team], i) => (
          <Card key={tid} className={`border-2 ${COLOR_MAP[team.color]}`}>
            <CardContent className="px-3 py-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{MEDALS[i]} {team.name}</span>
                <span className="text-lg font-bold text-primary">{team.score}đ</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 flex-wrap">
                {team.banh.hiem > 0 && <span>🏆 Hiếm ×{team.banh.hiem}</span>}
                {team.banh.dep  > 0 && <span>✨ Đẹp ×{team.banh.dep}</span>}
                {team.banh.thuong > 0 && <span>🍃 Thường ×{team.banh.thuong}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-3 pb-3 text-center">
          <p className="font-serif text-xs text-foreground/80 italic leading-relaxed">
            "Không có chiếm dụng — chỉ có 54 dân tộc từ một bọc trứng, cùng xây một Việt Nam."
          </p>
        </CardContent>
      </Card>

      <Button onClick={onRestart} variant="outline" className="w-full gap-2">
        <RotateCcw className="w-4 h-4" />Xem lại từ đầu
      </Button>
    </div>
  );
}

// ─── Main wrapper ─────────────────────────────────────────────
export default function DemoMode({ onExit }: { onExit: () => void }) {
  const [phase, setPhase]   = useState<Phase>("lobby");
  const [showWrap, setWrap] = useState(false);
  const [startTime]         = useState(() => Date.now());
  const currentStep         = STEPS.findIndex(s => s.key === phase);

  function handleWrapResult(_result: WrapResult) {
    setWrap(false);
    setTimeout(() => setPhase("scoreboard"), 500);
  }

  // suppress unused ref warning
  const _ref = useRef(null);
  void _ref;

  return (
    <div className="max-w-xl mx-auto">
      {showWrap && <WrappingBar onResult={handleWrapResult} onCancel={() => setWrap(false)} />}

      {/* Demo banner */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={onExit} className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors drop-shadow">
          <ArrowLeft className="w-3.5 h-3.5" />Thoát demo
        </button>
        <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 bg-amber-50">
          👁 Chế độ xem thử — không kết nối Firebase
        </Badge>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-5 px-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <button onClick={() => setPhase(s.key)} className="flex flex-col items-center gap-0.5">
              <div className={cn(
                "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                i < currentStep  && "bg-primary border-primary text-primary-foreground",
                i === currentStep && "border-primary text-primary bg-primary/10 scale-110",
                i > currentStep  && "border-border text-muted-foreground bg-white/80"
              )}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className={cn("text-xs hidden sm:block drop-shadow",
                i === currentStep ? "text-white font-medium" : "text-white/70")}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-6 mx-1 sm:w-10 transition-colors", i < currentStep ? "bg-primary" : "bg-white/30")} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-4">
        {phase === "lobby"      && <DemoLobby      onNext={() => setPhase("waiting")} />}
        {phase === "waiting"    && <DemoWaitingRoom onNext={() => setPhase("playing")} />}
        {phase === "playing"    && <DemoGamePlay    onWrap={() => setWrap(true)} startTime={startTime} />}
        {phase === "scoreboard" && <DemoScoreboard  onRestart={() => setPhase("lobby")} />}
      </div>

      {/* Nav buttons */}
      {phase !== "lobby" && phase !== "scoreboard" && (
        <div className="flex justify-between mt-3 px-1">
          <Button variant="ghost" size="sm" onClick={() => {
            const i = STEPS.findIndex(s => s.key === phase);
            if (i > 0) setPhase(STEPS[i - 1].key);
          }} className="text-xs gap-1 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-3.5 h-3.5" />Quay lại
          </Button>
          {phase !== "playing" && (
            <Button variant="ghost" size="sm" onClick={() => {
              const i = STEPS.findIndex(s => s.key === phase);
              if (i < STEPS.length - 1) setPhase(STEPS[i + 1].key);
            }} className="text-xs gap-1 text-white/80 hover:text-white hover:bg-white/10">
              Bước tiếp<ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
