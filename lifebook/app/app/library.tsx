import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, fontSize, spacing } from "../src/lib/theme";
import { listSessions, type SessionSummary } from "../src/db/sessions";

export default function Library() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>Memories</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No memories yet. Talk to Hugh to make one.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/session/${item.id}`)}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle}>{item.title ?? "Untitled"}</Text>
              <Text style={styles.cardMeta}>{formatDate(item.started_at)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgTop },
  header: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { fontSize: fontSize.heading, color: colors.ink, fontWeight: "600" },
  closeButton: { padding: spacing.md, minHeight: 56, justifyContent: "center" },
  closeText: { fontSize: fontSize.label, color: colors.accent },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyText: {
    fontSize: fontSize.bodyLarge,
    color: colors.inkSoft,
    textAlign: "center",
    lineHeight: fontSize.bodyLarge * 1.4,
  },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 14,
    gap: spacing.xs,
  },
  cardTitle: { fontSize: fontSize.bodyLarge, color: colors.ink, fontWeight: "600" },
  cardMeta: { fontSize: fontSize.caption, color: colors.inkSoft },
});
