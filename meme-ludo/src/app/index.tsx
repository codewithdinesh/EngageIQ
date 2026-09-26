import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HOSTEL_ROAST } from "../memes/hostelRoast";
import { theme } from "../theme";

const RULES = [
  "2 or 4 players, one phone, pass it on your turn.",
  "Four tokens each. Roll a 6 to leave the yard — the token lands on its colored start.",
  "Land exactly on the center to bring a token home. First to bring all four home wins.",
  "Landing on one opponent token sends it back to the yard. Safe squares (starts and ✦) cannot capture.",
  "Two of your tokens on a normal square block opponents. They cannot land on it or pass it.",
  "A 6 and a capture each give another roll. Three 6s in a row cancel the turn.",
];

export default function HomeScreen() {
  const [open, setOpen] = useState(false);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Hostel edition · pass and play</Text>
        <Text style={styles.title}>Meme{"\n"}Ludo</Text>
        <Text style={styles.sub}>Pass one phone. Capture a token. Get roasted.</Text>
        <View style={styles.pack}>
          <Text style={styles.packEmoji}>{HOSTEL_ROAST.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.packName}>{HOSTEL_ROAST.name}</Text>
            <Text style={styles.packBlurb}>{HOSTEL_ROAST.blurb}</Text>
          </View>
        </View>
      </View>
      <Pressable testID="play" style={styles.play} onPress={() => router.push("/lobby")}>
        <Text style={styles.playText}>Play</Text>
      </Pressable>
      <Pressable testID="how" style={styles.secondary} onPress={() => setOpen(true)}>
        <Text style={styles.secondaryText}>How memes work</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.sheetTitle}>The roast is the point</Text>
              <Text style={styles.sheetBody}>
                High-signal moments fire a Hostel Roast sting under 1.5 seconds. Captions are original
                Hinglish. The audio is synthesized tones — not film dialogue.
              </Text>
              {Object.values(HOSTEL_ROAST.clips).map((clip) => (
                <View key={clip.event} style={styles.clipRow}>
                  <Text style={styles.clipEmoji}>{clip.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clipLabel}>{clip.label}</Text>
                    <Text style={styles.clipCaption}>{clip.caption}</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.sheetTitle}>Rules on this table</Text>
              {RULES.map((rule) => (
                <Text key={rule} style={styles.rule}>
                  • {rule}
                </Text>
              ))}
            </ScrollView>
            <Pressable style={styles.play} onPress={() => setOpen(false)}>
              <Text style={styles.playText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg, padding: 22, justifyContent: "center", gap: 14 },
  hero: { gap: 12, marginBottom: 12 },
  kicker: {
    color: theme.accent,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
  },
  title: { color: theme.text, fontSize: 72, lineHeight: 74, fontWeight: "900" },
  sub: { color: theme.muted, fontSize: 18, lineHeight: 24 },
  pack: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: theme.bgRaised,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.line,
  },
  packEmoji: { fontSize: 28 },
  packName: { color: theme.text, fontWeight: "800", fontSize: 16 },
  packBlurb: { color: theme.muted, fontSize: 13, marginTop: 2 },
  play: {
    backgroundColor: theme.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  playText: { color: theme.accentInk, fontSize: 18, fontWeight: "900" },
  secondary: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.line,
  },
  secondaryText: { color: theme.text, fontWeight: "800", fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "88%",
    backgroundColor: theme.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  sheetTitle: { color: theme.text, fontSize: 22, fontWeight: "900" },
  sheetBody: { color: theme.muted, fontSize: 15, lineHeight: 21 },
  clipRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  clipEmoji: { fontSize: 22, width: 32 },
  clipLabel: { color: theme.accent, fontSize: 12, fontWeight: "800" },
  clipCaption: { color: theme.text, fontSize: 15, fontWeight: "700" },
  rule: { color: theme.muted, fontSize: 14, lineHeight: 20 },
});
