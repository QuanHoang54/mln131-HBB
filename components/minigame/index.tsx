"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import Lobby from "./Lobby";
import WaitingRoom from "./WaitingRoom";
import GamePlay from "./GamePlay";
import Scoreboard from "./Scoreboard";

function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return Math.random().toString(36).slice(2, 10);
  let id = sessionStorage.getItem("minigame_pid");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem("minigame_pid", id);
  }
  return id;
}

export default function MinigameRoot() {
  const [playerId] = useState<string>(getOrCreatePlayerId);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<"lobby" | "waiting" | "playing" | "ended">("lobby");

  useEffect(() => {
    if (!roomCode) return;
    const phaseRef = ref(db, `rooms/${roomCode}/phase`);
    const unsub = onValue(phaseRef, (snap) => {
      const p = snap.val() as string | null;
      if (p === "playing") setPhase("playing");
      else if (p === "ended") setPhase("ended");
      else if (p === "waiting") setPhase("waiting");
    });
    return unsub;
  }, [roomCode]);

  if (phase === "lobby" || !roomCode) {
    return (
      <Lobby
        playerId={playerId}
        onJoined={(code) => {
          setRoomCode(code);
          setPhase("waiting");
        }}
      />
    );
  }

  if (phase === "waiting") {
    return (
      <WaitingRoom
        playerId={playerId}
        roomCode={roomCode}
        onLeave={() => { setRoomCode(null); setPhase("lobby"); }}
      />
    );
  }

  if (phase === "playing") {
    return <GamePlay playerId={playerId} roomCode={roomCode} />;
  }

  return <Scoreboard roomCode={roomCode} onPlayAgain={() => { setRoomCode(null); setPhase("lobby"); }} />;
}
