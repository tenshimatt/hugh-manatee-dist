import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import { colors, fontSize, spacing } from "../src/lib/theme";
import { PLACEHOLDER_VOICES, type VoiceOption } from "../src/lib/profile";
import { setProfile } from "../src/db/profile";
import { useProfile } from "../src/lib/useProfile";

type Step = "name" | "voice" | "extras" | "privacy";

export default function Onboarding() {
  const router = useRouter();
  const { refresh } = useProfile();
  const [step, setStep] = useState<Step>("name");
  const [firstName, setFirstName] = useState("");
  const [voice, setVoice] = useState<VoiceOption | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [hometown, setHometown] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") return;
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.FirstName],
        pageSize: 1,
      });
      const ownerGuess = data[0]?.firstName;
      if (ownerGuess && !firstName) setFirstName(ownerGuess);
    })();
  }, []);

  const finish = async () => {
    if (!firstName.trim() || !voice) return;
    await setProfile({
      first_name: firstName.trim(),
      birth_year: birthYear ? Number(birthYear) : null,
      hometown: hometown.trim() || null,
      voice_id: voice.voice_id,
      agent_id: voice.agent_id,
    });
    await refresh();
    router.replace("/conversation");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === "name" && (
        <View style={styles.section}>
          <Text style={styles.heading}>What should Hugh call you?</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="words"
            accessibilityLabel="First name"
          />
          <Pressable
            disabled={!firstName.trim()}
            onPress={() => setStep("voice")}
            style={[styles.button, !firstName.trim() && styles.buttonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      )}

      {step === "voice" && (
        <View style={styles.section}>
          <Text style={styles.heading}>Pick Hugh's voice</Text>
          <Text style={styles.subheading}>You can change this later.</Text>
          {PLACEHOLDER_VOICES.map((v) => (
            <Pressable
              key={v.voice_id}
              onPress={() => setVoice(v)}
              style={[styles.voiceCard, voice?.voice_id === v.voice_id && styles.voiceCardSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected: voice?.voice_id === v.voice_id }}
            >
              <Text style={styles.voiceLabel}>{v.label}</Text>
              <Text style={styles.voiceDesc}>{v.description}</Text>
            </Pressable>
          ))}
          <Pressable
            disabled={!voice}
            onPress={() => setStep("extras")}
            style={[styles.button, !voice && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      )}

      {step === "extras" && (
        <View style={styles.section}>
          <Text style={styles.heading}>A couple of small things</Text>
          <Text style={styles.subheading}>
            Both optional. They help Hugh ask better questions.
          </Text>
          <Text style={styles.label}>Year you were born</Text>
          <TextInput
            value={birthYear}
            onChangeText={(t) => setBirthYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="e.g. 1948"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Birth year"
          />
          <Text style={styles.label}>Town you grew up in</Text>
          <TextInput
            value={hometown}
            onChangeText={setHometown}
            style={styles.input}
            placeholder="e.g. Glasgow"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="words"
            accessibilityLabel="Hometown"
          />
          <Pressable onPress={() => setStep("privacy")} style={styles.button}>
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      )}

      {step === "privacy" && (
        <View style={styles.section}>
          <Text style={styles.heading}>Your memories stay with you</Text>
          <Text style={styles.body}>
            Everything you say to Hugh is saved only on this phone. Nothing is sent anywhere
            unless you decide to share a memory with someone.
          </Text>
          <Text style={styles.body}>
            If you lose this phone, these memories are lost with it. You can export a copy any
            time from Settings.
          </Text>
          <Pressable onPress={finish} style={styles.button}>
            <Text style={styles.buttonText}>Meet Hugh</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xxl, flexGrow: 1 },
  section: { gap: spacing.md },
  heading: { fontSize: fontSize.heading, color: colors.ink, fontWeight: "600" },
  subheading: { fontSize: fontSize.bodyLarge, color: colors.inkSoft },
  body: { fontSize: fontSize.bodyLarge, color: colors.ink, lineHeight: fontSize.bodyLarge * 1.5 },
  label: { fontSize: fontSize.label, color: colors.inkSoft, marginTop: spacing.sm },
  input: {
    fontSize: fontSize.bodyLarge,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: spacing.md,
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
  buttonDisabled: { backgroundColor: colors.inkFaint },
  buttonText: { color: colors.surface, fontSize: fontSize.bodyLarge, fontWeight: "600" },
  voiceCard: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  voiceCardSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  voiceLabel: { fontSize: fontSize.bodyLarge, color: colors.ink, fontWeight: "600" },
  voiceDesc: { fontSize: fontSize.body, color: colors.inkSoft, marginTop: spacing.xs },
});
