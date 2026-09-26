import {
  ColorId,
  FINISH_POS,
  FOUR_PLAYER_ORDER,
  LAST_OUTER_POS,
  PLAYERS,
  TWO_PLAYER_ORDER,
  isSafeOuter,
  outerIndex,
} from "./board";

export type MemeEvent =
  | "capture"
  | "captured"
  | "six"
  | "chaos"
  | "home"
  | "blocked"
  | "safe"
  | "win";

export const MEME_EVENTS: MemeEvent[] = [
  "capture",
  "captured",
  "six",
  "chaos",
  "home",
  "blocked",
  "safe",
  "win",
];

export type TokenZone = "yard" | "track" | "done";

export type Token = {
  id: string;
  color: ColorId;
  zone: TokenZone;
  /** 0–55 while on the track. Ignored in the yard and after finishing. */
  pos: number;
};

export type Player = {
  color: ColorId;
  name: string;
};

export type Phase = "handoff" | "roll" | "select" | "over";

export type Toast = {
  id: number;
  event: MemeEvent;
  actor: ColorId;
  victim?: ColorId;
  /** When false, the moment is a replay and does not change the recap counts. */
  record: boolean;
};

export type GameState = {
  players: Player[];
  tokens: Token[];
  turn: number;
  phase: Phase;
  dice: number | null;
  consecutiveSixes: number;
  legalIds: string[];
  toasts: Toast[];
  toastSeq: number;
  memeCounts: Record<MemeEvent, number>;
  winner: ColorId | null;
  muted: boolean;
  rollLog: number[];
};

export type MatchOptions = {
  count: 2 | 4;
  names: Partial<Record<ColorId, string>>;
  muted: boolean;
};

export function emptyCounts(): Record<MemeEvent, number> {
  return {
    capture: 0,
    captured: 0,
    six: 0,
    chaos: 0,
    home: 0,
    blocked: 0,
    safe: 0,
    win: 0,
  };
}

export function tokenId(color: ColorId, index: number): string {
  return `${color}-${index}`;
}

export function createMatch(options: MatchOptions): GameState {
  const order = options.count === 2 ? TWO_PLAYER_ORDER : FOUR_PLAYER_ORDER;
  const players: Player[] = order.map((color) => ({
    color,
    name: (options.names[color] ?? "").trim() || PLAYERS[color].label,
  }));
  const tokens: Token[] = [];
  players.forEach((player) => {
    for (let i = 0; i < 4; i += 1) {
      tokens.push({ id: tokenId(player.color, i), color: player.color, zone: "yard", pos: 0 });
    }
  });
  return {
    players,
    tokens,
    turn: 0,
    phase: "handoff",
    dice: null,
    consecutiveSixes: 0,
    legalIds: [],
    toasts: [],
    toastSeq: 0,
    memeCounts: emptyCounts(),
    winner: null,
    muted: options.muted,
    rollLog: [],
  };
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.turn];
}

function pushToast(
  state: GameState,
  event: MemeEvent,
  actor: ColorId,
  victim?: ColorId,
  record = true,
): GameState {
  const toast: Toast = {
    id: state.toastSeq + 1,
    event,
    actor,
    victim,
    record,
  };
  const memeCounts = { ...state.memeCounts };
  if (record) memeCounts[event] += 1;
  const toasts = [...state.toasts, toast].slice(-6);
  return { ...state, toasts, toastSeq: toast.id, memeCounts };
}

function tokensOnOuter(state: GameState, index: number, ignoreId?: string): Token[] {
  return state.tokens.filter((token) => {
    if (token.id === ignoreId || token.zone !== "track" || token.pos > LAST_OUTER_POS) return false;
    return outerIndex(token.color, token.pos) === index;
  });
}

function opponentBlock(tokens: Token[], color: ColorId, safe: boolean): boolean {
  if (safe) return false;
  const opponents = tokens.filter((token) => token.color !== color);
  return opponents.length >= 2;
}

function canTravel(state: GameState, token: Token, dice: number): boolean {
  if (token.zone === "done") return false;
  if (token.zone === "yard") return dice === 6;

  const dest = token.pos + dice;
  if (dest > FINISH_POS) return false;
  if (dest === FINISH_POS) return true;

  for (let step = token.pos + 1; step <= dest; step += 1) {
    if (step > LAST_OUTER_POS) continue;
    const index = outerIndex(token.color, step);
    const safe = isSafeOuter(index);
    const occupying = tokensOnOuter(state, index, token.id);
    if (opponentBlock(occupying, token.color, safe)) return false;
  }
  return true;
}

export function legalTokenIds(state: GameState, dice: number): string[] {
  const color = currentPlayer(state).color;
  return state.tokens
    .filter((token) => token.color === color && canTravel(state, token, dice))
    .map((token) => token.id);
}

function captureOn(state: GameState, token: Token, destPos: number): Token | null {
  if (destPos > LAST_OUTER_POS) return null;
  const index = outerIndex(token.color, destPos);
  if (isSafeOuter(index)) return null;
  const opponents = tokensOnOuter(state, index, token.id).filter((other) => other.color !== token.color);
  if (opponents.length !== 1) return null;
  return opponents[0];
}

function landsOnSafe(token: Token, dice: number): boolean {
  if (token.zone !== "track") return false;
  const dest = token.pos + dice;
  if (dest > LAST_OUTER_POS) return false;
  return isSafeOuter(outerIndex(token.color, dest));
}

function nextTurn(state: GameState): GameState {
  return {
    ...state,
    turn: (state.turn + 1) % state.players.length,
    phase: "handoff",
    dice: null,
    legalIds: [],
    consecutiveSixes: 0,
  };
}

export function applyHandoff(state: GameState): GameState {
  if (state.phase !== "handoff") return state;
  return { ...state, phase: "roll", dice: null, legalIds: [] };
}

export function applyRoll(state: GameState, dice: number): GameState {
  if (state.phase !== "roll" || state.winner) return state;
  if (dice < 1 || dice > 6) return state;

  const actor = currentPlayer(state).color;
  const rollLog = [...state.rollLog, dice].slice(-8);
  const sixes = dice === 6 ? state.consecutiveSixes + 1 : 0;
  const base: GameState = { ...state, dice, rollLog, consecutiveSixes: sixes };

  if (dice === 6 && sixes >= 3) {
    const toasted = pushToast({ ...base, consecutiveSixes: 0 }, "chaos", actor);
    return nextTurn(toasted);
  }

  const legalIds = legalTokenIds(base, dice);
  if (legalIds.length === 0) {
    const toasted = pushToast({ ...base, consecutiveSixes: 0, legalIds }, "blocked", actor);
    return nextTurn(toasted);
  }

  const withSix = dice === 6 ? pushToast(base, "six", actor) : base;
  return { ...withSix, phase: "select", legalIds };
}

export function applySelect(state: GameState, tokenId: string): GameState {
  if (state.phase !== "select" || state.dice == null) return state;
  if (!state.legalIds.includes(tokenId)) return state;

  const dice = state.dice;
  const actor = currentPlayer(state).color;
  const token = state.tokens.find((item) => item.id === tokenId);
  if (!token) return state;

  const captured = token.zone === "track" ? captureOn(state, token, token.pos + dice) : null;
  const safe = landsOnSafe(token, dice);
  const dest = token.zone === "yard" ? 0 : token.pos + dice;
  const finishedThis = token.zone === "track" && dest === FINISH_POS;

  const tokens = state.tokens.map((item) => {
    if (captured && item.id === captured.id) {
      return { ...item, zone: "yard" as const, pos: 0 };
    }
    if (item.id !== token.id) return item;
    if (item.zone === "yard") return { ...item, zone: "track" as const, pos: 0 };
    if (dest === FINISH_POS) return { ...item, zone: "done" as const, pos: 0 };
    return { ...item, pos: dest };
  });

  let next: GameState = { ...state, tokens, legalIds: [], dice: null };
  const allHome = next.tokens.filter((item) => item.color === actor).every((item) => item.zone === "done");

  if (allHome) {
    next = pushToast(next, "win", actor);
    return { ...next, phase: "over", winner: actor, consecutiveSixes: 0 };
  }

  if (captured) {
    next = pushToast(next, "capture", actor, captured.color);
    next = pushToast(next, "captured", captured.color, actor);
  } else if (finishedThis) {
    next = pushToast(next, "home", actor);
  } else if (safe) {
    next = pushToast(next, "safe", actor);
  }

  const extra = dice === 6 || captured != null;
  if (extra) {
    return { ...next, phase: "roll" };
  }
  return nextTurn(next);
}

export function dismissToast(state: GameState, id: number): GameState {
  if (!state.toasts.some((toast) => toast.id === id)) return state;
  return { ...state, toasts: state.toasts.filter((toast) => toast.id !== id) };
}

export function replayMeme(state: GameState, event: MemeEvent): GameState {
  const actor = state.winner ?? currentPlayer(state).color;
  return pushToast(state, event, actor, undefined, false);
}

export function setMuted(state: GameState, muted: boolean): GameState {
  return { ...state, muted };
}

export function topMemes(state: GameState, limit = 3): { event: MemeEvent; count: number }[] {
  const priority: MemeEvent[] = ["capture", "win", "chaos", "home", "six", "captured", "safe", "blocked"];
  return MEME_EVENTS.map((event) => ({ event, count: state.memeCounts[event] }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || priority.indexOf(a.event) - priority.indexOf(b.event))
    .slice(0, limit);
}
