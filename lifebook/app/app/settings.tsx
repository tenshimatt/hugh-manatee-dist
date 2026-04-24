import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, fontSize, spacing } from "../src/lib/theme";
import { useProfile } from "../src/lib/useProfile";
import { clearProfile } from "../src/db/profile";
import { setProfile } from "../src/db/profile";
import { StickyFooter } from "../src/components/StickyFooter";
import { PLACEHOLDER_VOICES } from "../src/lib/profile";

const MFS = 1.15;

function friendlyVoiceLabel(voice_id: string): string {
  return PLACEHOLDER_VOICES.find((v) => v.voice_id === voice_id)?.label ?? "Custom";
}

export default function Settings() {
  const router = useRouter();
  const { profile, refresh } = useProfile();
  const [changingVoice, setChangingVoice] = useState(false);

  const handleVoiceChange = async (voice_id: string, agent_id: string) => {
    if (!profile) return;
    await setProfile({ ...profile, voice_id, agent_id });
    await refresh();
    setChangingVoice(false);
  };

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading} maxFontSizeMultiplier={MFS}>Settings</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton} accessibilityRole="button">
          <Text style={styles.closeText} maxFontSizeMultiplier={MFS}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Section title="Profile">
          <Row label="Name" value={profile?.first_name ?? "—"} />
          <Row label="Born" value={profile?.birth_year?.toString() ?? "—"} />
          <Row label="Hometown" value={profile?.hometown ?? "—"} />
        </Section>

        <Section title="Hugh's voice">
          <Pressable
            style={styles.voiceRow}
            onPress={() => setChangingVoice((v) => !v)}
            accessibilityRole="button"
          >
            <Text style={styles.voiceCurrent} maxFontSizeMultiplier={MFS}>
              {profile ? friendlyVoiceLabel(profile.voice_id) : "—"}
            </Text>
            <Text style={styles.voiceChangeLink} maxFontSizeMultiplier={MFS}>
              {changingVoice ? "Cancel" : "Change"}
            </Text>
          </Pressable>

          {changingVoice && (
            <View style={styles.voicePicker}>
              {PLACEHOLDER_VOICES.map((v) => {
                const selected = profile?.voice_id === v.voice_id;
                return (
                  <Pressable
                    key={v.voice_id}
                    style={[styles.voiceOption, selected && styles.voiceOptionSelected]}
                    onPress={() => handleVoiceChange(v.voice_id, v.agent_id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={styles.voiceOptionLabel} maxFontSizeMultiplier={MFS}>
                      {v.label}
                    </Text>
                    <Text style={styles.voiceOptionDesc} maxFontSizeMultiplier={MFS}>
                      {v.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Section>

        <Section title="Your data">
          <Text style={styles.hint} maxFontSizeMultiplier={MFS}>
            Export coming soon — a zip of audio and transcripts.
          </Text>
        </Section>
      </ScrollView>

      <StickyFooter>
        <Pressable style={styles.dangerButton} onPress={confirmDelete} accessibilityRole="button">
          <Text style={styles.dangerText} maxFontSizeMultiplier={MFS}>Delete everything</Text>
        </Pressable>
      </StickyFooter>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={MFS}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} maxFontSizeMultiplier={MFS}>{label}</Text>
      <Text style={styles.rowValue} maxFontSizeMultiplier={MFS}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgTop },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  heading: { fontSize: fontSize.heading, color: colors.ink, fontWeight: "600" },
  closeButton: { padding: spacing.md, minHeight: 56, justifyContent: "center" },
  closeText: { fontSize: fontSize.label, color: colors.accent },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.label,
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: { fontSize: fontSize.body, color: colors.inkSoft },
  rowValue: { fontSize: fontSize.body, color: colors.ink, fontWeight: "500" },
  voiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  voiceCurrent: { fontSize: fontSize.body, color: colors.ink, fontWeight: "500" },
  voiceChangeLink: { fontSize: fontSize.label, color: colors.accent },
  voicePicker: { gap: spacing.sm, paddingTop: spacing.sm },
  voiceOption: {
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  voiceOptionSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  voiceOptionLabel: { fontSize: fontSize.body, color: colors.ink, fontWeight: "600" },
  voiceOptionDesc: { fontSize: fontSize.caption, color: colors.inkSoft, marginTop: 2 },
  dangerButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.danger,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  dangerText: { color: colors.danger, fontSize: fontSize.bodyLarge, fontWeight: "600" },
  hint: { fontSize: fontSize.caption, color: colors.inkFaint },
});
