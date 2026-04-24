import { lazy, Suspense } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors, fontSize, spacing } from "../src/lib/theme";

/**
 * Conversation route.
 *
 * The real voice loop requires native modules (LiveKit WebRTC via
 * @elevenlabs/react-native) that Expo Go doesn't ship. To keep the rest of
 * the app testable in Expo Go, we:
 *
 *   1. Keep the ElevenLabs-dependent code in src/screens/ConversationLive.tsx
 *   2. Lazy-load that module only when we're NOT running in Expo Go
 *   3. Render a plain "not available here" stub when we ARE in Expo Go
 *
 * executionEnvironment values:
 *   - "storeClient" → Expo Go
 *   - "standalone"  → EAS-built app
 *   - "bare"        → bare React Native workflow
 */

const ConversationLive = lazy(() => import("../src/screens/ConversationLive"));

export default function ConversationRoute() {
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  if (isExpoGo) return <ExpoGoStub />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ConversationLive />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgTop, colors.bgBottom]}
        style={StyleSheet.absoluteFillObject}
      />
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

function ExpoGoStub() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgTop, colors.bgBottom]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.panel}>
        <Text style={styles.heading}>Voice isn't available in Expo Go</Text>
        <Text style={styles.body}>
          Hugh's voice uses native audio modules that Expo Go can't load. To hear him, run a
          development build on a real device.
        </Text>
        <Text style={styles.hintLabel}>What you can still test here</Text>
        <Text style={styles.body}>
          Onboarding, your memories list, and settings.
        </Text>
        <Pressable onPress={() => router.replace("/library")} style={styles.button}>
          <Text style={styles.buttonText}>See memories</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/settings")} style={styles.ghostButton}>
          <Text style={styles.ghostText}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: { padding: spacing.xl, gap: spacing.md, maxWidth: 520 },
  heading: { fontSize: fontSize.heading, color: colors.ink, fontWeight: "600" },
  body: {
    fontSize: fontSize.bodyLarge,
    color: colors.ink,
    lineHeight: fontSize.bodyLarge * 1.4,
  },
  hintLabel: {
    fontSize: fontSize.label,
    color: colors.inkSoft,
    marginTop: spacing.md,
    textTransform: "uppercase",
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing.lg,
    minHeight: 56,
    justifyContent: "center",
  },
  buttonText: { color: colors.surface, fontSize: fontSize.bodyLarge, fontWeight: "600" },
  ghostButton: { padding: spacing.md, alignItems: "center", minHeight: 56 },
  ghostText: { color: colors.inkSoft, fontSize: fontSize.label },
});
