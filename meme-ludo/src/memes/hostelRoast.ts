import type { MemeEvent } from "../game/logic";

export type MemeClip = {
  event: MemeEvent;
  emoji: string;
  /** Original Hinglish. Not a film line. */
  caption: string;
  label: string;
};

export const HOSTEL_ROAST = {
  id: "hostel-roast",
  name: "Hostel Roast",
  emoji: "🏠",
  blurb: "Original Hinglish captions with synthesized tone stingers. No film or song audio.",
  clips: {
    capture: {
      event: "capture",
      emoji: "🔥",
      caption: "Majja aa gaya — seedha yard!",
      label: "Capture",
    },
    captured: {
      event: "captured",
      emoji: "😭",
      caption: "Bhai ne kaat diya, wapas room.",
      label: "Got captured",
    },
    six: {
      event: "six",
      emoji: "🎲",
      caption: "Chhakka! Ek aur chance, maggi bonus.",
      label: "Rolled a 6",
    },
    chaos: {
      event: "chaos",
      emoji: "🌀",
      caption: "Teen chhakke? Warden aa gaya — turn cancel.",
      label: "Chaos sixes",
    },
    home: {
      event: "home",
      emoji: "🏡",
      caption: "Token ghar pahuncha. Room lock, chappal bahar.",
      label: "Token home",
    },
    blocked: {
      event: "blocked",
      emoji: "🧱",
      caption: "Rasta band hai bro. Agla player.",
      label: "Blocked",
    },
    safe: {
      event: "safe",
      emoji: "🛡️",
      caption: "Safe zone. Tension mat le.",
      label: "Safe square",
    },
    win: {
      event: "win",
      emoji: "🏆",
      caption: "Jeet gaya! Chai mere taraf se.",
      label: "Win",
    },
  } satisfies Record<MemeEvent, MemeClip>,
};

export function clipFor(event: MemeEvent): MemeClip {
  return HOSTEL_ROAST.clips[event];
}
