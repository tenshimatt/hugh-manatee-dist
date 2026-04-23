import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ConversationProvider } from "@elevenlabs/react-native";
import { initDb } from "../src/db/schema";
import { colors } from "../src/lib/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDb().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bgTop }} />;

  return (
    <ConversationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgTop },
        }}
      />
    </ConversationProvider>
  );
}
