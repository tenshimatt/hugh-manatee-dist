import "../src/polyfills";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { initDb } from "../src/db/schema";
import { colors } from "../src/lib/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDb().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bgTop }} />;

  // NOTE: ConversationProvider lives on the conversation route itself, not
  // here. It pulls native WebRTC modules (LiveKit) which don't exist in
  // Expo Go — mounting it at the root blocks the whole app from loading in
  // Expo Go. Scoping it to the one screen keeps onboarding/library/settings
  // testable in Expo Go; conversation itself still needs a dev build.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgTop },
      }}
    />
  );
}
