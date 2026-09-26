import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ColorId } from "../game/board";
import {
  applyHandoff,
  applyRoll,
  applySelect,
  createMatch,
  dismissToast,
  replayMeme,
  setMuted as setMutedState,
  type GameState,
  type MemeEvent,
} from "../game/logic";

export type Settings = {
  count: 2 | 4;
  names: Record<ColorId, string>;
  muted: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  count: 2,
  names: { red: "Red", blue: "Blue", yellow: "Yellow", green: "Green" },
  muted: false,
};

type GameApi = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  state: GameState | null;
  startMatch: () => void;
  confirmHandoff: () => void;
  roll: (dice: number) => void;
  selectToken: (id: string) => void;
  dismissToast: (id: number) => void;
  setMuted: (muted: boolean) => void;
  replay: (event: MemeEvent) => void;
};

const GameContext = createContext<GameApi | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<GameState | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);
  const startMatch = useCallback(() => {
    const current = settingsRef.current;
    setState(createMatch({ count: current.count, names: current.names, muted: current.muted }));
  }, []);
  const confirmHandoff = useCallback(() => {
    setState((current) => (current ? applyHandoff(current) : current));
  }, []);
  const roll = useCallback((dice: number) => {
    setState((current) => (current ? applyRoll(current, dice) : current));
  }, []);
  const selectToken = useCallback((id: string) => {
    setState((current) => (current ? applySelect(current, id) : current));
  }, []);
  const dismiss = useCallback((id: number) => {
    setState((current) => (current ? dismissToast(current, id) : current));
  }, []);
  const setMuted = useCallback((muted: boolean) => {
    setSettings((current) => ({ ...current, muted }));
    setState((current) => (current ? setMutedState(current, muted) : current));
  }, []);
  const replay = useCallback((event: MemeEvent) => {
    setState((current) => (current ? replayMeme(current, event) : current));
  }, []);

  const api = useMemo<GameApi>(
    () => ({
      settings,
      updateSettings,
      state,
      startMatch,
      confirmHandoff,
      roll,
      selectToken,
      dismissToast: dismiss,
      setMuted,
      replay,
    }),
    [settings, state, updateSettings, startMatch, confirmHandoff, roll, selectToken, dismiss, setMuted, replay],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
