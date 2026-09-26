import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FOUR_PLAYER_ORDER, PLAYERS, TWO_PLAYER_ORDER } from "../game/board";
import { HOSTEL_ROAST } from "../memes/hostelRoast";
import { useGame } from "../state/GameProvider";
import { theme } from "../theme";

export default function LobbyScreen() {
  const { settings, updateSettings, startMatch } = useGame();
  const order = settings.count === 2 ? TWO_PLAYER_ORDER : FOUR_PLAYER_ORDER;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Lobby</Text>
        <Text style={styles.title}>Who’s at the table?</Text>
        <Text style={styles.help}>One device. Colors sit clockwise, starting from the bottom-left.</Text>

        <Text style={styles.label}>Players</Text>
        <View style={styles.row}>
          {([2, 4] as const).map((count) => {
            const active = settings.count === count;
            return (
              <Pressable
                key={count}
                testID={`count-${count}`}
                onPress={() => updateSettings({ count })}
                style={[styles.choice, active && styles.choiceOn]}
              >
                <Text style={[styles.choiceText, active && styles.choiceTextOn]}>{count} players</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Names</Text>
        {order.map((color, index) => (
          <View key={color} style={styles.nameRow}>
            <View style={[styles.swatch, { backgroundColor: PLAYERS[color].main }]} />
            <TextInput
              testID={`name-${color}`}
              value={settings.names[color]}
              onChangeText={(value) =>
                updateSettings({ names: { ...settings.names, [color]: value } })
              }
              placeholder={PLAYERS[color].label}
              placeholderTextColor="#8E80A8"
              style={styles.input}
              maxLength={16}
            />
            <Text style={styles.order}>{index + 1}</Text>
          </View>
        ))}

        <Text style={styles.label}>Meme pack</Text>
        <View style={styles.pack}>
          <Text style={styles.packEmoji}>{HOSTEL_ROAST.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.packName}>{HOSTEL_ROAST.name}</Text>
            <Text style={styles.packBlurb}>8 original stingers · Hinglish captions</Text>
          </View>
          <Text style={styles.selected}>On</Text>
        </View>

        <View style={styles.muteRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.muteTitle}>Mute pack</Text>
            <Text style={styles.help}>Toasts stay. Tone stingers go quiet.</Text>
          </View>
          <Switch
            testID="mute"
            value={settings.muted}
            onValueChange={(muted) => updateSettings({ muted })}
            trackColor={{ false: "#3C2A58", true: "#8A6A12" }}
            thumbColor={settings.muted ? theme.accent : "#F4F4F5"}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.ghost} onPress={() => router.back()}>
          <Text style={styles.ghostText}>Back</Text>
        </Pressable>
        <Pressable
          testID="start-match"
          style={styles.start}
          onPress={() => {
            startMatch();
            router.push("/game");
          }}
        >
          <Text style={styles.startText}>Start match</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 10, paddingBottom: 24 },
  kicker: { color: theme.accent, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: theme.text, fontSize: 34, fontWeight: "900" },
  help: { color: theme.muted, fontSize: 14, lineHeight: 19 },
  label: { color: theme.text, fontWeight: "800", marginTop: 10, fontSize: 15 },
  row: { flexDirection: "row", gap: 10 },
  choice: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: theme.bgRaised,
  },
  choiceOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  choiceText: { color: theme.text, fontWeight: "800" },
  choiceTextOn: { color: theme.accentInk },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  input: {
    flex: 1,
    backgroundColor: theme.bgRaised,
    color: theme.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  order: { color: theme.muted, width: 16, fontWeight: "800" },
  pack: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: theme.bgRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.accent,
    padding: 12,
  },
  packEmoji: { fontSize: 26 },
  packName: { color: theme.text, fontWeight: "800" },
  packBlurb: { color: theme.muted, fontSize: 13 },
  selected: { color: theme.accentInk, backgroundColor: theme.accent, fontWeight: "900", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  muteRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  muteTitle: { color: theme.text, fontWeight: "800", fontSize: 16 },
  footer: { flexDirection: "row", gap: 10, padding: 16 },
  ghost: {
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.line,
  },
  ghostText: { color: theme.text, fontWeight: "800" },
  start: { flex: 1, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  startText: { color: theme.accentInk, fontWeight: "900", fontSize: 17 },
});
