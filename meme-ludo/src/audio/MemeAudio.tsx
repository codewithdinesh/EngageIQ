import { useAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";
import type { MemeEvent } from "../game/logic";
import { useGame } from "../state/GameProvider";

const SOURCES: Record<MemeEvent, number> = {
  capture: require("../../assets/sounds/capture.wav"),
  captured: require("../../assets/sounds/captured.wav"),
  six: require("../../assets/sounds/six.wav"),
  chaos: require("../../assets/sounds/chaos.wav"),
  home: require("../../assets/sounds/home.wav"),
  blocked: require("../../assets/sounds/blocked.wav"),
  safe: require("../../assets/sounds/safe.wav"),
  win: require("../../assets/sounds/win.wav"),
};

function useClip(event: MemeEvent): AudioPlayer {
  return useAudioPlayer(SOURCES[event]);
}

/** Preloads the Hostel Roast stingers and plays whichever toast is on screen. */
export function MemeAudio() {
  const { state } = useGame();
  const capture = useClip("capture");
  const captured = useClip("captured");
  const six = useClip("six");
  const chaos = useClip("chaos");
  const home = useClip("home");
  const blocked = useClip("blocked");
  const safe = useClip("safe");
  const win = useClip("win");
  const players: Record<MemeEvent, AudioPlayer> = {
    capture,
    captured,
    six,
    chaos,
    home,
    blocked,
    safe,
    win,
  };
  const played = useRef<number | null>(null);
  const playersRef = useRef(players);
  playersRef.current = players;
  const head = state?.toasts[0];

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return undefined;
    const unlock = () => {
      try {
        (Object.keys(playersRef.current) as MemeEvent[]).forEach((event) => {
          const player = playersRef.current[event];
          player.volume = 0;
          player.play();
          player.pause();
          player.volume = 1;
        });
        window.removeEventListener("pointerdown", unlock);
      } catch {
        // The next tap tries again if the browser rejected the unlock.
      }
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!head || state?.muted) return;
    if (played.current === head.id) return;
    played.current = head.id;
    const player = players[head.event];
    player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => {});
    // Players are stable for the lifetime of this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head?.id, state?.muted]);

  return null;
}
