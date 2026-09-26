import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dice } from "../components/Dice";
import { LudoBoard } from "../components/LudoBoard";
import { PLAYERS } from "../game/board";
import { currentPlayer } from "../game/logic";
import { useGame } from "../state/GameProvider";
import { theme } from "../theme";

export default function GameScreen() {
  const { state, confirmHandoff, roll, selectToken, setMuted } = useGame();
  const { width, height } = useWindowDimensions();
  const [face, setFace] = useState(1);
  const [rolling, setRolling] = useState(false);
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state) return undefined;
    const timer = setTimeout(() => {
      router.replace("/lobby");
    }, 400);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state?.phase === "over") {
      const timer = setTimeout(() => router.replace("/result"), 900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state?.phase]);

  useEffect(() => {
    if (state?.phase !== "select" || state.legalIds.length !== 1) return undefined;
    const only = state.legalIds[0];
    const timer = setTimeout(() => selectToken(only), 380);
    return () => clearTimeout(timer);
  }, [state?.phase, state?.legalIds, selectToken]);

  useEffect(() => {
    return () => {
      if (rollTimer.current) clearTimeout(rollTimer.current);
    };
  }, []);

  if (!state) return <View style={styles.safe} />;

  const player = currentPlayer(state);
  const def = PLAYERS[player.color];
  const cell = Math.floor(Math.min(width - 16, height * 0.62, 560) / 15);
  const board = Math.max(15, cell * 15);
  const shown = state.phase === "select" && state.dice ? state.dice : face;

  function onRoll() {
    if (rolling || state?.phase !== "roll") return;
    const value = 1 + Math.floor(Math.random() * 6);
    setRolling(true);
    let ticks = 0;
    const tick = () => {
      ticks += 1;
      if (ticks < 5) {
        setFace(1 + Math.floor(Math.random() * 6));
        rollTimer.current = setTimeout(tick, 60);
        return;
      }
      setFace(value);
      setRolling(false);
      roll(value);
    };
    tick();
  }

  const hint =
    state.phase === "handoff"
      ? "Pass the phone"
      : state.phase === "select"
        ? state.legalIds.length === 1
          ? "Only one token can move"
          : "Tap a glowing token"
        : state.phase === "roll"
          ? "Tap the dice"
          : "Match over";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Now playing</Text>
          <Text style={[styles.turn, { color: def.main }]}>{player.name}</Text>
        </View>
        <Pressable testID="mute-game" onPress={() => setMuted(!state.muted)} style={styles.mute}>
          <Text style={styles.muteText}>{state.muted ? "Muted" : "Sound on"}</Text>
        </Pressable>
      </View>

      <View style={styles.progressRow}>
        {state.players.map((item) => {
          const done = state.tokens.filter((token) => token.color === item.color && token.zone === "done").length;
          const active = item.color === player.color && state.phase !== "over";
          return (
            <View key={item.color} style={[styles.progress, active && { borderColor: PLAYERS[item.color].main }]}>
              <Text style={[styles.progressName, { color: PLAYERS[item.color].main }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.progressMeta}>{done}/4 home</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.boardWrap}>
        <LudoBoard state={state} size={board} onToken={selectToken} />
      </View>

      <View style={styles.bottom}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hint}>{hint}</Text>
          <Text style={styles.log}>
            {state.rollLog.length ? `Rolls ${state.rollLog.join(" · ")}` : "Fair dice, every face equal"}
          </Text>
        </View>
        <Dice value={shown} disabled={rolling || state.phase !== "roll"} onPress={onRoll} />
      </View>

      {state.phase === "handoff" ? (
        <View style={styles.handoff}>
          <View style={[styles.handoffCard, { borderColor: def.main }]}>
            <Text style={styles.handoffKicker}>Pass the phone</Text>
            <Text style={[styles.handoffName, { color: def.main }]}>{player.name}</Text>
            <Text style={styles.handoffBody}>Don’t roll for them. Hand it over, then confirm.</Text>
            <Pressable testID="confirm-handoff" style={[styles.confirm, { backgroundColor: def.main }]} onPress={confirmHandoff}>
              <Text style={[styles.confirmText, { color: def.ink }]}>I’m {player.name}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  kicker: { color: theme.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  turn: { fontSize: 28, fontWeight: "900" },
  mute: { borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  muteText: { color: theme.text, fontWeight: "800", fontSize: 13 },
  progressRow: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  progress: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: theme.bgRaised,
  },
  progressName: { fontWeight: "800", fontSize: 12 },
  progressMeta: { color: theme.muted, fontSize: 11 },
  boardWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  hint: { color: theme.text, fontSize: 16, fontWeight: "800" },
  log: { color: theme.muted, marginTop: 4, fontSize: 12 },
  handoff: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8,4,16,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 10,
  },
  handoffCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.bgRaised,
    borderRadius: 24,
    borderWidth: 3,
    padding: 22,
    gap: 8,
  },
  handoffKicker: { color: theme.accent, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  handoffName: { fontSize: 40, fontWeight: "900" },
  handoffBody: { color: theme.muted, fontSize: 15, marginBottom: 8 },
  confirm: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  confirmText: { fontWeight: "900", fontSize: 18 },
});
