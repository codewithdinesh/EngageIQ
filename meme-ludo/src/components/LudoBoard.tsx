import { Pressable, StyleSheet, Text, View } from "react-native";
import { CELL_MAP, PLAYERS, type CellKind, outerCell } from "../game/board";
import type { GameState, Token } from "../game/logic";
import { theme } from "../theme";

const YARD_SLOTS = [
  { col: 1.7, row: 1.7 },
  { col: 3.7, row: 1.7 },
  { col: 1.7, row: 3.7 },
  { col: 3.7, row: 3.7 },
];

function fillFor(kind: CellKind): string {
  if (kind.type === "yard") return PLAYERS[kind.color].yard;
  if (kind.type === "home" || kind.type === "start") return PLAYERS[kind.color].main;
  if (kind.type === "center") return theme.center;
  if (kind.type === "safe") return theme.safe;
  return theme.path;
}

function tokenCenter(token: Token, indexInGroup: number, groupSize: number, cell: number) {
  let row: number;
  let col: number;
  if (token.zone === "yard") {
    const slot = Number(token.id.split("-")[1] ?? 0);
    const origin = PLAYERS[token.color].yardOrigin;
    const spot = YARD_SLOTS[slot] ?? YARD_SLOTS[0];
    row = origin.row + spot.row;
    col = origin.col + spot.col;
  } else if (token.zone === "done") {
    const anchor = PLAYERS[token.color].finishAnchor;
    const slot = Number(token.id.split("-")[1] ?? 0);
    row = anchor.row + 0.35 + (slot % 2) * 0.42;
    col = anchor.col + 0.28 + Math.floor(slot / 2) * 0.42;
  } else if (token.pos <= 50) {
    const at = outerCell(token.color, token.pos);
    row = at.row + 0.5;
    col = at.col + 0.5;
  } else {
    const home = PLAYERS[token.color].home[token.pos - 51];
    row = home.row + 0.5;
    col = home.col + 0.5;
  }

  if (token.zone === "track" && groupSize > 1) {
    const angle = (Math.PI * 2 * indexInGroup) / groupSize - Math.PI / 2;
    const radius = groupSize === 2 ? 0.16 : 0.2;
    col += Math.cos(angle) * radius;
    row += Math.sin(angle) * radius;
  }

  return { x: col * cell, y: row * cell };
}

export function LudoBoard({
  state,
  size,
  onToken,
}: {
  state: GameState;
  size: number;
  onToken: (id: string) => void;
}) {
  const cell = size / 15;
  const groups = new Map<string, Token[]>();
  state.tokens.forEach((token) => {
    if (token.zone !== "track") return;
    const at =
      token.pos <= 50 ? outerCell(token.color, token.pos) : PLAYERS[token.color].home[token.pos - 51];
    const physical = `${at.row},${at.col}`;
    const list = groups.get(physical) ?? [];
    list.push(token);
    groups.set(physical, list);
  });

  return (
    <View style={[styles.board, { width: size, height: size }]}>
      {CELL_MAP.map((row, r) =>
        row.map((kind, c) => (
          <View key={`${r}-${c}`} style={{ width: cell, height: cell, padding: 0.6 }}>
            <View style={[styles.cell, { backgroundColor: fillFor(kind) }]}>
              {kind.type === "safe" ? <Text style={styles.star}>✦</Text> : null}
            </View>
          </View>
        )),
      )}
      {state.tokens.map((token) => {
        const group =
          token.zone === "track"
            ? (groups.get(
                token.pos <= 50
                  ? `${outerCell(token.color, token.pos).row},${outerCell(token.color, token.pos).col}`
                  : `${PLAYERS[token.color].home[token.pos - 51].row},${PLAYERS[token.color].home[token.pos - 51].col}`,
              ) ?? [token])
            : [token];
        const index = Math.max(0, group.findIndex((item) => item.id === token.id));
        const { x, y } = tokenCenter(token, index, group.length, cell);
        const legal = state.legalIds.includes(token.id);
        const diameter = cell * (group.length > 1 ? 0.62 : 0.78);
        const def = PLAYERS[token.color];
        const n = Number(token.id.split("-")[1] ?? 0) + 1;
        return (
          <Pressable
            key={token.id}
            testID={`token-${token.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${def.label} token ${n}${legal ? ", can move" : ""}`}
            disabled={!legal}
            onPress={() => onToken(token.id)}
            style={[
              styles.token,
              {
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                backgroundColor: def.main,
                borderColor: legal ? "#FFFFFF" : "rgba(0,0,0,0.35)",
                borderWidth: legal ? 3 : 1.5,
                left: x - diameter / 2,
                top: y - diameter / 2,
                zIndex: legal ? 4 : 2,
              },
            ]}
          >
            <Text style={[styles.tokenNum, { color: def.ink, fontSize: diameter * 0.42 }]}>{n}</Text>
          </Pressable>
        );
      })}
      <View style={[styles.centerLabel, { width: cell * 3, height: cell * 3, left: cell * 6, top: cell * 6 }]}>
        <Text style={[styles.home, { fontSize: Math.max(10, cell * 0.42) }]}>HOME</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#0B0716",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#F3E2B8",
  },
  cell: {
    flex: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  star: { color: "#8A6A12", fontSize: 11, fontWeight: "800" },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    pointerEvents: "none",
  },
  home: {
    color: "#FFF6E8",
    fontWeight: "900",
    letterSpacing: 1,
  },
  token: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenNum: { fontWeight: "900" },
});
