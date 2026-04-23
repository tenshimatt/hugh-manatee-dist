import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, fontSize, spacing } from "../src/lib/theme";
import { useProfile } from "../src/lib/useProfile";
import { fetchAgentConfig, type AgentConfigResponse } from "../src/services/worker";
import type { HughStatus } from "../src/services/elevenlabs";

/**
 * Conversation screen.
 *
 * v0 (this file): connects to the Worker to fetch agent config, shows a
 * gentle status surface ("Connecting", "Hugh is listening", etc.).
 *
 * v1 (next task): integrate @elevenlabs/react-native hooks to stream audio
 * both ways and capture turns into SQLite. See VOICE-01..VOICE-07 in Plane.
 */
export default function Conversation() {
  const router = useRouter();
  const { profile } = useProfile();
  const [config, setConfig] = useState<AgentConfigResponse | null>(null);
  const [status, setStatus] = useState<HughStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const c = await fetchAgentConfig({
          first_name: profile.first_name,
          birth_year: profile.birth_year,
          hometown: profile.hometown,
          voice_id: profile.voice_id,
        });
        setConfig(c);
        setStatus("listening");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    })();
  }, [profile]);

  const statusText = (() => {
    switch (status) {
      case "connecting":
        return "Connecting...";
      case "listening":
        return "Hugh is listening.";
      case "speaking":
        return "Hugh is speaking.";
      case "thinking":
        return "Hugh is thinking.";
      case "ended":
        return "Session ended.";
      case "error":
        return "Couldn't reach Hugh.";
      default:
        return "";
    }
  })();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgTop, colors.bgBottom]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.centerPanel}>
        {status === "connecting" ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : null}
        <Text style={styles.statusText}>{statusText}</Text>
        {config?.first_turn ? <Text style={styles.firstTurn}>{config.first_turn}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push("/library")}
          style={styles.ghostButton}
          accessibilityRole="button"
          accessibilityLabel="Memories"
        >
          <Text style={styles.ghostButtonText}>Memories</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.ghostButton}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.ghostButtonText}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centerPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  statusText: { fontSize: fontSize.bodyLarge, color: colors.inkSoft },
  firstTurn: {
    fontSize: fontSize.heading,
    color: colors.ink,
    textAlign: "center",
    lineHeight: fontSize.heading * 1.4,
  },
  errorText: { fontSize: fontSize.body, color: colors.danger, textAlign: "center" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  ghostButton: {
    padding: spacing.md,
    minHeight: 56,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: { fontSize: fontSize.label, color: colors.inkSoft },
});
