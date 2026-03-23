"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import Lobby from "./Lobby";
import WaitingRoom from "./WaitingRoom";
import GamePlay from "./GamePlay";
import Scoreboard from "./Scoreboard";
import AdminDashboard from "./AdminDashboard";
import VolumeControl from "./VolumeControl";

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
  const [playerId]            = useState<string>(getOrCreatePlayerId);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [phase, setPhase]     = useState<"lobby" | "waiting" | "playing" | "ended">("lobby");
  const [isAdmin, setIsAdmin] = useState(false);
  const audioRef              = useRef<HTMLAudioElement | null>(null);

  // Background music
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/NhacNenHangRong.MP3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }
    const audio = audioRef.current;
    if (phase !== "lobby" && roomCode) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [phase, roomCode]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

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

  function handleLeave() {
    setRoomCode(null);
    setPhase("lobby");
    setIsAdmin(false);
  }

  if (phase === "lobby" || !roomCode) {
    return (
      <Lobby
        playerId={playerId}
        onJoined={(code, admin = false) => {
          setRoomCode(code);
          setIsAdmin(admin ?? false);
          setPhase("waiting");
        }}
      />
    );
  }

  return (
    <>
      {isAdmin ? (
        <AdminDashboard roomCode={roomCode} onLeave={handleLeave} />
      ) : phase === "waiting" ? (
        <WaitingRoom playerId={playerId} roomCode={roomCode} onLeave={handleLeave} />
      ) : phase === "playing" ? (
        <GamePlay playerId={playerId} roomCode={roomCode} />
      ) : (
        <Scoreboard roomCode={roomCode} onPlayAgain={handleLeave} />
      )}
      <VolumeControl audioRef={audioRef} />
    </>
  );
}
