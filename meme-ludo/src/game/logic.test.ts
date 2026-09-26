import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OUTER, PLAYERS, SAFE_OUTER, classifyCell, type ColorId } from "./board";
import {
  applyHandoff,
  applyRoll,
  applySelect,
  createMatch,
  topMemes,
  type GameState,
  type Token,
  type TokenZone,
} from "./logic";

function boot(count: 2 | 4 = 2): GameState {
  return applyHandoff(createMatch({ count, names: {}, muted: true }));
}

function place(state: GameState, id: string, zone: TokenZone, pos = 0): GameState {
  return {
    ...state,
    tokens: state.tokens.map((token) => (token.id === id ? { ...token, zone, pos } : token)),
  };
}

function token(state: GameState, id: string): Token {
  const found = state.tokens.find((item) => item.id === id);
  assert.ok(found, id);
  return found;
}

describe("board geometry", () => {
  it("has 52 connected outer cells and 8 safe squares", () => {
    assert.equal(OUTER.length, 52);
    assert.equal(new Set(OUTER.map((cell) => `${cell.row},${cell.col}`)).size, 52);
    assert.equal(SAFE_OUTER.size, 8);
    for (let i = 0; i < OUTER.length; i += 1) {
      const a = OUTER[i];
      const b = OUTER[(i + 1) % OUTER.length];
      const dist = Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
      assert.equal(dist, 1, `gap between ${i} and ${(i + 1) % OUTER.length}`);
    }
  });

  it("keeps yards, home columns, and the outer track from overlapping", () => {
    for (const cell of OUTER) {
      const kind = classifyCell(cell.row, cell.col);
      assert.ok(kind.type === "start" || kind.type === "safe" || kind.type === "path");
    }
    (Object.keys(PLAYERS) as ColorId[]).forEach((color) => {
      const def = PLAYERS[color];
      const start = OUTER[def.startIndex];
      assert.deepEqual(classifyCell(start.row, start.col), { type: "start", color });
      assert.equal(def.home.length, 5);
      def.home.forEach((cell) => {
        assert.deepEqual(classifyCell(cell.row, cell.col), { type: "home", color });
      });
    });
  });
});

describe("classic rules subset", () => {
  it("needs a 6 to leave the yard, then grants an extra turn", () => {
    let state = boot();
    state = applyRoll(state, 5);
    assert.equal(state.phase, "handoff");
    assert.equal(state.players[state.turn].color, "yellow");
    assert.equal(state.memeCounts.blocked, 1);
    assert.equal(token(state, "red-0").zone, "yard");

    state = applyHandoff(state);
    state = applyRoll(state, 6);
    assert.equal(state.players[state.turn].color, "yellow");
    assert.equal(state.phase, "select");
    assert.deepEqual(state.legalIds, ["yellow-0", "yellow-1", "yellow-2", "yellow-3"]);
    state = applySelect(state, "yellow-0");
    assert.equal(token(state, "yellow-0").zone, "track");
    assert.equal(token(state, "yellow-0").pos, 0);
    assert.equal(state.phase, "roll");
    assert.equal(state.players[state.turn].color, "yellow");
    assert.equal(state.memeCounts.six, 1);
  });

  it("captures a single opponent, sends them to the yard, and rolls again", () => {
    let state = place(boot(), "red-0", "track", 9);
    state = place(state, "yellow-0", "track", 38);
    state = applyRoll(state, 3);
    state = applySelect(state, "red-0");
    assert.equal(token(state, "red-0").pos, 12);
    assert.equal(token(state, "yellow-0").zone, "yard");
    assert.equal(state.phase, "roll");
    assert.equal(state.players[state.turn].color, "red");
    assert.equal(state.memeCounts.capture, 1);
    assert.equal(state.memeCounts.captured, 1);
  });

  it("does not capture on a safe square", () => {
    let state = place(boot(), "red-0", "track", 12);
    state = place(state, "yellow-0", "track", 39);
    state = applyRoll(state, 1);
    state = applySelect(state, "red-0");
    assert.equal(token(state, "yellow-0").zone, "track");
    assert.equal(state.memeCounts.capture, 0);
    assert.equal(state.memeCounts.safe, 1);
    assert.equal(state.phase, "handoff");
  });

  it("stops opponents on a block of two tokens", () => {
    let state = place(boot(), "red-0", "track", 9);
    state = place(state, "yellow-0", "track", 37);
    state = place(state, "yellow-1", "track", 37);
    state = applyRoll(state, 3);
    assert.equal(state.legalIds.includes("red-0"), false);
    assert.equal(state.phase, "handoff");
    assert.equal(state.memeCounts.blocked, 1);

    state = boot();
    state = place(state, "red-0", "track", 10);
    state = place(state, "yellow-0", "track", 37);
    state = place(state, "yellow-1", "track", 37);
    state = applyRoll(state, 1);
    assert.equal(state.legalIds.includes("red-0"), false);
  });

  it("lets tokens share a safe square even when two opponents sit there", () => {
    let state = place(boot(), "red-0", "track", 7);
    state = place(state, "yellow-0", "track", 34);
    state = place(state, "yellow-1", "track", 34);
    state = applyRoll(state, 1);
    assert.equal(state.legalIds.includes("red-0"), true);
    state = applySelect(state, "red-0");
    assert.equal(token(state, "yellow-0").zone, "track");
    assert.equal(state.memeCounts.safe, 1);
    assert.equal(state.memeCounts.capture, 0);
  });

  it("requires an exact roll to finish and celebrates a single token coming home", () => {
    let state = place(boot(), "red-0", "track", 55);
    state = applyRoll(state, 2);
    assert.equal(state.legalIds.includes("red-0"), false);

    state = boot();
    state = place(state, "red-0", "track", 55);
    state = applyRoll(state, 1);
    state = applySelect(state, "red-0");
    assert.equal(token(state, "red-0").zone, "done");
    assert.equal(state.winner, null);
    assert.equal(state.memeCounts.home, 1);
    assert.equal(state.phase, "handoff");
  });

  it("ends the match when all four tokens are home", () => {
    let state = boot();
    state = place(state, "red-0", "done");
    state = place(state, "red-1", "done");
    state = place(state, "red-2", "done");
    state = place(state, "red-3", "track", 55);
    state = applyRoll(state, 1);
    state = applySelect(state, "red-3");
    assert.equal(state.winner, "red");
    assert.equal(state.phase, "over");
    assert.equal(state.memeCounts.win, 1);
    assert.equal(state.memeCounts.home, 0);
    const stuck = applyRoll(state, 6);
    assert.equal(stuck.phase, "over");
  });

  it("cancels the turn on a third six in a row", () => {
    let state = boot();
    state = applyRoll(state, 6);
    state = applySelect(state, "red-0");
    assert.equal(token(state, "red-0").pos, 0);
    state = applyRoll(state, 6);
    state = applySelect(state, "red-0");
    assert.equal(token(state, "red-0").pos, 6);
    state = applyRoll(state, 6);
    assert.equal(token(state, "red-0").pos, 6);
    assert.equal(state.memeCounts.chaos, 1);
    assert.equal(state.phase, "handoff");
    assert.equal(state.players[state.turn].color, "yellow");
  });

  it("seats 2 and 4 players in the documented order", () => {
    const two = createMatch({ count: 2, names: { red: "A", yellow: "B" }, muted: false });
    assert.deepEqual(
      two.players.map((player) => player.color),
      ["red", "yellow"],
    );
    assert.equal(two.players[0].name, "A");
    const four = createMatch({ count: 4, names: {}, muted: false });
    assert.deepEqual(
      four.players.map((player) => player.color),
      ["red", "blue", "yellow", "green"],
    );
    assert.equal(four.tokens.length, 16);
  });

  it("ranks the loudest memes for the recap", () => {
    let state = place(boot(), "red-0", "track", 9);
    state = place(state, "yellow-0", "track", 38);
    state = applyRoll(state, 3);
    state = applySelect(state, "red-0");
    const top = topMemes(state);
    assert.equal(top[0].event, "capture");
    assert.equal(top[0].count, 1);
    assert.equal(top[1].event, "captured");
  });
});
