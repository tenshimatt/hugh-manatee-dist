import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, fontSize, spacing } from "../../src/lib/theme";
import { getSession } from "../../src/db/sessions";
import type { Session, Turn } from "../../src/db/sessions";

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);

  useEffect(() => {
    if (!id) return;
    getSession(id).then((r) => {
      if (r) {
        setSession(r.session);
        setTurns(r.turns);
      }
    });
  }, [id]);

  if (!session) {
    return (
      <View style={styles.root}>
        <Text style={styles.empty}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.heading} numberOfLines={1}>
          {session.title ?? session.anchor_phrase ?? "Memory"}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.transcript}>
        {turns.map((t) => (
          <View
            key={t.id}
            style={[styles.turn, t.speaker === "hugh" ? styles.hughTurn : styles.userTurn]}
          >
            <Text style={styles.speaker}>{t.speaker === "hugh" ? "Hugh" : "You"}</Text>
            <Text style={styles.turnText}>{t.text}</Text>
          </View>
        ))}
        {turns.length === 0 && (
          <Text style={styles.empty}>No transcript for this session.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgTop },
  header: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backButton: { padding: spacing.sm, minHeight: 56, justifyContent: "center" },
  backText: { fontSize: fontSize.label, color: colors.accent },
  heading: { fontSize: fontSize.heading, color: colors.ink, fontWeight: "600", flex: 1 },
  transcript: { padding: spacing.lg, gap: spacing.md },
  turn: { padding: spacing.md, borderRadius: 12, gap: spacing.xs },
  hughTurn: { backgroundColor: colors.surface },
  userTurn: { backgroundColor: colors.surfaceAlt },
  speaker: { fontSize: fontSize.caption, color: colors.inkSoft, fontWeight: "600" },
  turnText: {
    fontSize: fontSize.bodyLarge,
    color: colors.ink,
    lineHeight: fontSize.bodyLarge * 1.4,
  },
  empty: { fontSize: fontSize.body, color: colors.inkFaint, textAlign: "center" },
});
