import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAYERS } from "../game/board";
import { clipFor } from "../memes/hostelRoast";
import { useGame } from "../state/GameProvider";
import { theme } from "../theme";

export function MemeToast() {
  const insets = useSafeAreaInsets();
  const { state, dismissToast } = useGame();
  const toast = state?.toasts[0];

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissToast(toast.id), 1450);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!state || !toast) return null;
  const clip = clipFor(toast.event);
  const actor = state.players.find((player) => player.color === toast.actor);
  const victim = toast.victim
    ? state.players.find((player) => player.color === toast.victim)
    : undefined;
  const actorName = actor?.name ?? PLAYERS[toast.actor].label;
  const victimName = victim?.name;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]}>
      <View style={[styles.card, { borderColor: PLAYERS[toast.actor].main }]}>
        <Text style={styles.emoji}>{clip.emoji}</Text>
        <View style={styles.copy}>
          <Text style={styles.kicker}>
            {clip.label}
            {toast.event === "capture" && victimName ? ` · ${actorName} got ${victimName}` : ` · ${actorName}`}
          </Text>
          <Text style={styles.caption}>{clip.caption}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 20,
    pointerEvents: "none",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#2A1844",
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  emoji: { fontSize: 34 },
  copy: { flex: 1 },
  kicker: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  caption: { color: theme.text, fontSize: 18, fontWeight: "800", lineHeight: 22 },
});
