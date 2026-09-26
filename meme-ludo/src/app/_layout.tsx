import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MemeAudio } from "../audio/MemeAudio";
import { MemeToast } from "../components/MemeToast";
import { GameProvider } from "../state/GameProvider";
import { theme } from "../theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <StatusBar style="light" />
          <MemeAudio />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: theme.bg },
              gestureEnabled: false,
            }}
          />
          <MemeToast />
        </View>
      </GameProvider>
    </SafeAreaProvider>
  );
}
