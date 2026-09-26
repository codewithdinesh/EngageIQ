import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAYERS } from "../game/board";
import { topMemes } from "../game/logic";
import { clipFor } from "../memes/hostelRoast";
import { useGame } from "../state/GameProvider";
import { theme } from "../theme";

const FEEDBACK = ["Would play again", "It was mid", "Too much roast"] as const;

export default function ResultScreen() {
  const { state, startMatch, replay } = useGame();
  const [note, setNote] = useState<string | null>(null);

  if (!state?.winner) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.sub}>No finished match on this phone.</Text>
        <Pressable style={styles.primary} onPress={() => router.replace("/")}>
          <Text style={styles.primaryText}>Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const winner = state.players.find((player) => player.color === state.winner);
  const def = PLAYERS[state.winner];
  const memes = topMemes(state);
  const lead = memes[0];

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.kicker}>Match over</Text>
      <Text style={[styles.winner, { color: def.main }]}>{winner?.name ?? def.label}</Text>
      <Text style={styles.sub}>All four tokens home. Chai’s on them.</Text>

      <Text style={styles.section}>Top memes this match</Text>
      {memes.length === 0 ? (
        <Text style={styles.empty}>Quiet game. Capture someone next round.</Text>
      ) : (
        memes.map((item) => {
          const clip = clipFor(item.event);
          return (
            <View key={item.event} style={styles.meme}>
              <Text style={styles.emoji}>{clip.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.memeLabel}>
                  {clip.label} · {item.count}
                </Text>
                <Text style={styles.memeCaption}>{clip.caption}</Text>
              </View>
            </View>
          );
        })
      )}

      {lead ? (
        <Pressable testID="replay-top" style={styles.secondary} onPress={() => replay(lead.event)}>
          <Text style={styles.secondaryText}>Replay top meme</Text>
        </Pressable>
      ) : null}

      <Text style={styles.section}>Playtest note</Text>
      <View style={styles.feedbackRow}>
        {FEEDBACK.map((item) => (
          <Pressable key={item} style={[styles.chip, note === item && styles.chipOn]} onPress={() => setNote(item)}>
            <Text style={[styles.chipText, note === item && styles.chipTextOn]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {note ? <Text style={styles.thanks}>Noted on this phone: “{note}”. Nothing was uploaded.</Text> : null}

      <View style={{ flex: 1 }} />
      <Pressable
        testID="play-again"
        style={styles.primary}
        onPress={() => {
          startMatch();
          router.replace("/game");
        }}
      >
        <Text style={styles.primaryText}>Play again</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={() => router.replace("/")}>
        <Text style={styles.secondaryText}>Home</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg, padding: 20, gap: 8 },
  kicker: { color: theme.accent, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  winner: { fontSize: 48, fontWeight: "900" },
  sub: { color: theme.muted, fontSize: 16, marginBottom: 8 },
  section: { color: theme.text, fontWeight: "900", fontSize: 16, marginTop: 8 },
  empty: { color: theme.muted },
  meme: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: theme.bgRaised,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.line,
  },
  emoji: { fontSize: 24 },
  memeLabel: { color: theme.accent, fontWeight: "800", fontSize: 12 },
  memeCaption: { color: theme.text, fontWeight: "700" },
  feedbackRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { color: theme.text, fontWeight: "700", fontSize: 13 },
  chipTextOn: { color: theme.accentInk },
  thanks: { color: theme.muted, fontSize: 13 },
  primary: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  primaryText: { color: theme.accentInk, fontWeight: "900", fontSize: 17 },
  secondary: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.line,
  },
  secondaryText: { color: theme.text, fontWeight: "800" },
});
