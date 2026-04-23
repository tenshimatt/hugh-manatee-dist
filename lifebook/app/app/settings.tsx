import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { colors, fontSize, spacing } from "../src/lib/theme";
import { useProfile } from "../src/lib/useProfile";
import { clearProfile } from "../src/db/profile";

export default function Settings() {
  const router = useRouter();
  const { profile, refresh } = useProfile();

  const confirmDelete = () => {
    Alert.alert(
      "Delete everything?",
      "This removes all memories, audio, and settings from this phone. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            await clearProfile();
            await refresh();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      <Section title="Profile">
        <Row label="Name" value={profile?.first_name ?? "—"} />
        <Row label="Year you were born" value={profile?.birth_year?.toString() ?? "—"} />
        <Row label="Hometown" value={profile?.hometown ?? "—"} />
      </Section>

      <Section title="Voice">
        <Row label="Hugh's voice" value={profile?.voice_id ?? "—"} />
        <Pressable style={styles.button} onPress={() => router.push("/onboarding")}>
          <Text style={styles.buttonText}>Change voice</Text>
        </Pressable>
      </Section>

      <Section title="Your data">
        <Pressable style={styles.button} disabled>
          <Text style={styles.buttonText}>Export all memories</Text>
        </Pressable>
        <Text style={styles.hint}>Coming soon — a zip of audio + transcripts.</Text>
        <Pressable style={[styles.button, styles.dangerButton]} onPress={confirmDelete}>
          <Text style={[styles.buttonText, styles.dangerText]}>Delete everything</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: fontSize.heading, color: colors.ink, fontWeight: "600" },
  closeButton: { padding: spacing.md, minHeight: 56, justifyContent: "center" },
  closeText: { fontSize: fontSize.label, color: colors.accent },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.label, color: colors.inkSoft, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: { fontSize: fontSize.body, color: colors.inkSoft },
  rowValue: { fontSize: fontSize.body, color: colors.ink, fontWeight: "500" },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  buttonText: { color: colors.surface, fontSize: fontSize.bodyLarge, fontWeight: "600" },
  dangerButton: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.danger },
  dangerText: { color: colors.danger },
  hint: { fontSize: fontSize.caption, color: colors.inkFaint, textAlign: "center" },
});
