import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import { colors, spacing } from "../src/lib/theme";
import { PLACEHOLDER_VOICES, type VoiceOption } from "../src/lib/profile";
import { setProfile } from "../src/db/profile";
import { useProfile } from "../src/lib/useProfile";

// Cap iOS Large Text scaling — our sizes are already generous
const MFS = 1.15;

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

  // Button config per step — always rendered in sticky footer
  const nextDisabled = step === "name" ? !firstName.trim() : step === "voice" ? !voice : false;
  const nextLabel = step === "privacy" ? "Meet Hugh" : "Next";
  const onNext = step === "name" ? () => setStep("voice")
    : step === "voice" ? () => setStep("extras")
    : step === "extras" ? () => setStep("privacy")
    : finish;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Scrollable content — no button inside */}
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "name" && (
            <View style={styles.section}>
              <Text style={styles.heading} maxFontSizeMultiplier={MFS}>
                What should Hugh call you?
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholder="Your first name"
                placeholderTextColor={colors.inkFaint}
                autoCapitalize="words"
                autoFocus
                maxFontSizeMultiplier={MFS}
                accessibilityLabel="First name"
              />
            </View>
          )}

          {step === "voice" && (
            <View style={styles.section}>
              <Text style={styles.heading} maxFontSizeMultiplier={MFS}>Pick Hugh's voice</Text>
              <Text style={styles.subheading} maxFontSizeMultiplier={MFS}>You can change this later.</Text>
              {PLACEHOLDER_VOICES.map((v) => (
                <Pressable
                  key={v.voice_id}
                  onPress={() => setVoice(v)}
                  style={[styles.voiceCard, voice?.voice_id === v.voice_id && styles.voiceCardSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: voice?.voice_id === v.voice_id }}
                >
                  <Text style={styles.voiceLabel} maxFontSizeMultiplier={MFS}>{v.label}</Text>
                  <Text style={styles.voiceDesc} maxFontSizeMultiplier={MFS}>{v.description}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {step === "extras" && (
            <View style={styles.section}>
              <Text style={styles.heading} maxFontSizeMultiplier={MFS}>A couple of small things</Text>
              <Text style={styles.subheading} maxFontSizeMultiplier={MFS}>
                Both optional — they help Hugh ask better questions.
              </Text>
              <Text style={styles.label} maxFontSizeMultiplier={MFS}>Year you were born</Text>
              <TextInput
                value={birthYear}
                onChangeText={(t) => setBirthYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
                style={styles.input}
                keyboardType="number-pad"
                placeholder="e.g. 1948"
                placeholderTextColor={colors.inkFaint}
                maxFontSizeMultiplier={MFS}
                accessibilityLabel="Birth year"
              />
              <Text style={styles.label} maxFontSizeMultiplier={MFS}>Town you grew up in</Text>
              <TextInput
                value={hometown}
                onChangeText={setHometown}
                style={styles.input}
                placeholder="e.g. Glasgow"
                placeholderTextColor={colors.inkFaint}
                autoCapitalize="words"
                maxFontSizeMultiplier={MFS}
                accessibilityLabel="Hometown"
              />
            </View>
          )}

          {step === "privacy" && (
            <View style={styles.section}>
              <Text style={styles.heading} maxFontSizeMultiplier={MFS}>Your memories stay with you</Text>
              <Text style={styles.body} maxFontSizeMultiplier={MFS}>
                Everything you say to Hugh is saved only on this phone. Nothing is sent anywhere
                unless you decide to share a memory with someone.
              </Text>
              <Text style={styles.body} maxFontSizeMultiplier={MFS}>
                If you lose this phone, these memories are lost with it. You can export a copy any
                time from Settings.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky footer — always visible above keyboard */}
        <View style={styles.footer}>
          <Pressable
            disabled={nextDisabled}
            onPress={onNext}
            style={[styles.button, nextDisabled && styles.buttonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText} maxFontSizeMultiplier={MFS}>{nextLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const OB = { heading: 24, body: 17, bodyLarge: 19, label: 15, button: 17 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgTop },
  kav: { flex: 1 },
  container: { padding: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
  section: { gap: spacing.md },
  heading: { fontSize: OB.heading, color: colors.ink, fontWeight: "600", lineHeight: OB.heading * 1.25 },
  subheading: { fontSize: OB.bodyLarge, color: colors.inkSoft },
  body: { fontSize: OB.bodyLarge, color: colors.ink, lineHeight: OB.bodyLarge * 1.5 },
  label: { fontSize: OB.label, color: colors.inkSoft, marginTop: spacing.sm },
  input: {
    fontSize: OB.bodyLarge,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 48,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bgTop,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  buttonDisabled: { backgroundColor: colors.inkFaint },
  buttonText: { color: colors.surface, fontSize: OB.button, fontWeight: "600" },
  voiceCard: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  voiceCardSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  voiceLabel: { fontSize: OB.bodyLarge, color: colors.ink, fontWeight: "600" },
  voiceDesc: { fontSize: OB.body, color: colors.inkSoft, marginTop: spacing.xs },
});
