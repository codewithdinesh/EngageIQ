import { Pressable, StyleSheet, View } from "react-native";
import { theme } from "../theme";

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

export function Dice({
  value,
  disabled,
  onPress,
}: {
  value: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const face = Math.min(6, Math.max(1, value));
  return (
    <Pressable
      testID="dice"
      accessibilityRole="button"
      accessibilityLabel={disabled ? `Dice showing ${face}` : "Roll dice"}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.die, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      {PIPS[face].map(([x, y]) => (
        <View key={`${x}-${y}`} style={[styles.pip, { left: `${x}%`, top: `${y}%` }]} />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  die: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: "#FFF8EE",
    position: "relative",
  },
  disabled: { opacity: 0.72 },
  pressed: { transform: [{ scale: 0.96 }] },
  pip: {
    position: "absolute",
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    borderRadius: 6,
    backgroundColor: theme.bg,
  },
});
