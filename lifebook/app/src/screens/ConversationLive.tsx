import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AppState,
  Alert,
  type AppStateStatus,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ConversationProvider, useConversation, useConversationInput } from "@elevenlabs/react-native";
import { CollageBackground } from "../components/CollageBackground";
import { colors, fontSize, spacing } from "../lib/theme";
import { useProfile } from "../lib/useProfile";
import { fetchAgentConfig, fetchSessionAnchor } from "../services/worker";
import {
  createSession,
  appendTurn,
  endSession,
  getLastSessionAnchor,
} from "../db/sessions";

/**
 * Conversation screen — the product.
 *
 * Wire:
 *   1. Fetch agent config from Worker (agent_id, conversation_token, first_turn,
 *      runtime_context).
 *   2. Create a local session row, cache the id.
 *   3. Start ElevenLabs CAI via useConversation.
 *   4. Speak the deterministic first_turn via sendContextualUpdate (the agent's
 *      "first message" is configured empty in ElevenLabs — we render the opener
 *      client-side so it never varies).
 *   5. Forward every message event into the turns table.
 *   6. On end / background / explicit close: endSession(), then call
 *      /session/anchor with the last 10 turns to get anchor_phrase + title.
 *
 * What's deliberately NOT here:
 *   - Audio file persistence. ElevenLabs streams audio; we don't currently
 *     buffer it. Adding that is a separate task (DATA-02 in Plane).
 *   - Dynamic variables injection via overrides. The current RN SDK surface
 *     supports `overrides.agent.firstMessage` + `overrides.agent.prompt.prompt`
 *     + `dynamicVariables` — we leave the prompt stock and pass dynamic vars
 *     once we've wired the opener contextual update. See VOICE-03.
 */

export default function ConversationLive() {
  // Provider must wrap the hook caller, and since the root _layout can't hold
  // it (it'd pull native modules in Expo Go), we scope it to this screen.
  return (
    <ConversationProvider>
      <Conversation />
    </ConversationProvider>
  );
}

function Conversation() {
  const router = useRouter();
  const { profile } = useProfile();

  const sessionIdRef = useRef<string | null>(null);
  const turnOrdinalRef = useRef(0);
  const turnsRef = useRef<{ speaker: "user" | "hugh"; text: string }[]>([]);
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const firstTurnRef = useRef<string | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "live" | "ending" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [firstTurn, setFirstTurn] = useState<string | null>(null);

  const { isMuted, setMuted } = useConversationInput();

  // Mute the mic whenever this screen isn't in the foreground (settings, library, etc.)
  // so Hugh stops listening the moment the user navigates away.
  useFocusEffect(
    useCallback(() => {
      setMuted(false);
      return () => setMuted(true);
    }, [setMuted]),
  );

  const conversation = useConversation({
    onConnect: ({ conversationId }: { conversationId: string }) => {
      console.log("[hugh] connected", conversationId);
      setStatus("live");
      Haptics.selectionAsync().catch(() => {});
      // The deterministic opener is delivered via the `first_turn` dynamic
      // variable — the ElevenLabs agent's First Message field is configured as
      // `{{first_turn}}`, so the agent speaks the Worker-rendered string
      // verbatim on connect. No contextual-update dance required.
    },
    onDisconnect: () => {
      console.log("[hugh] disconnected");
    },
    onMessage: ({ role, message }) => {
      const text = message?.trim();
      if (!text) return;
      const speaker: "user" | "hugh" = role === "agent" ? "hugh" : "user";
      turnsRef.current.push({ speaker, text });
      const sid = sessionIdRef.current;
      if (sid) {
        turnOrdinalRef.current++;
        appendTurn(sid, speaker, text).catch((e) =>
          console.warn("[hugh] appendTurn failed", e),
        );
      }
    },
    onError: (message: string) => {
      console.warn("[hugh] error", message);
      setError(message);
      setStatus("error");
    },
  });

  /** Fetch config + open session. Runs once when profile is ready. */
  useEffect(() => {
    if (!profile || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const lastAnchor = await getLastSessionAnchor();
        const cfg = await fetchAgentConfig({
          first_name: profile.first_name,
          birth_year: profile.birth_year,
          hometown: profile.hometown,
          voice_id: profile.voice_id,
          last_anchor: lastAnchor,
        });

        firstTurnRef.current = cfg.first_turn;
        setFirstTurn(cfg.first_turn);

        // Create a local session row before the mic opens.
        const newSession = await createSession({ prompt_version: "agent-2026-04-23" });
        sessionIdRef.current = newSession.id;

        setStatus("ready");
        await conversation.startSession({
          conversationToken: cfg.conversation_token,
          connectionType: "webrtc",
          dynamicVariables: {
            first_turn: cfg.first_turn,
            first_name: profile.first_name,
            birth_year: profile.birth_year ?? "",
            hometown: profile.hometown ?? "",
            last_memory_topic: lastAnchor ?? "",
            suggested_seeds: cfg.runtime_context.seed_prompts.join(" | "),
            era_hooks: cfg.runtime_context.era_hooks.join(" | "),
          },
        });
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        setError(m);
        setStatus("error");
      }
    })();
  }, [profile, conversation]);

  const finishSession = useCallback(
    async (reason: "user" | "background" | "error") => {
      if (endedRef.current) return;
      endedRef.current = true;
      setStatus("ending");

      try {
        await conversation.endSession();
      } catch (e) {
        console.warn("[hugh] endSession failed", e);
      }

      const sid = sessionIdRef.current;
      if (!sid) return;

      let title: string | undefined;
      let anchor: string | undefined;
      try {
        const tail = turnsRef.current.slice(-10);
        if (tail.length > 0) {
          const anchorRes = await fetchSessionAnchor({ turns: tail });
          title = anchorRes.title_suggestion || undefined;
          anchor = anchorRes.anchor_phrase || undefined;
        }
      } catch (e) {
        console.warn("[hugh] anchor fetch failed; continuing", e);
      }

      await endSession(sid, { title, anchor }).catch((e) =>
        console.warn("[hugh] endSession persist failed", e),
      );

      if (reason === "user") router.replace("/library");
    },
    [conversation, router],
  );

  // End the session when the app backgrounds — don't keep the mic open silently.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next !== "active" && !endedRef.current) {
        finishSession("background").catch(() => {});
      }
    });
    return () => sub.remove();
  }, [finishSession]);

  // End the session on unmount.
  useEffect(() => {
    return () => {
      if (!endedRef.current) finishSession("background").catch(() => {});
    };
  }, [finishSession]);

  const statusText = (() => {
    switch (status) {
      case "loading":
        return "Finding Hugh…";
      case "ready":
        return "Opening the mic…";
      case "live":
        return conversation.isSpeaking ? "Hugh is speaking." : "Hugh is listening.";
      case "ending":
        return "Saving the memory…";
      case "error":
        return "Couldn't reach Hugh.";
    }
  })();

  return (
    <View style={styles.root}>
      <CollageBackground
        birthYear={profile?.birth_year ?? null}
        hometown={profile?.hometown ?? null}
      />
      <View style={styles.centerPanel}>
        {(status === "loading" || status === "ready" || status === "ending") && (
          <ActivityIndicator size="large" color={colors.accent} />
        )}
        <Text style={styles.statusText}>{statusText}</Text>
        {status === "live" && firstTurn && turnsRef.current.length === 0 ? (
          <Text style={styles.firstTurn}>{firstTurn}</Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push("/library")}
          style={styles.ghostButton}
          accessibilityRole="button"
          accessibilityLabel="Memories"
        >
          <Ionicons name="albums-outline" size={22} color={colors.inkSoft} />
          <Text style={styles.ghostButtonText}>Memories</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert("End this session?", "Hugh will save what you've said.", [
              { text: "Keep talking", style: "cancel" },
              { text: "End", style: "destructive", onPress: () => finishSession("user") },
            ]);
          }}
          style={[styles.endButton, status === "ending" && styles.endButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="End session"
          disabled={status === "ending"}
        >
          <Text style={styles.endButtonText}>{status === "ending" ? "Saving…" : "End"}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.ghostButton}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={22} color={colors.inkSoft} />
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
  errorText: {
    fontSize: fontSize.body,
    color: colors.danger,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  ghostButton: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    gap: 3,
    minHeight: 44,
  },
  ghostButtonText: { fontSize: 11, color: colors.inkSoft },
  endButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  endButtonDisabled: { backgroundColor: colors.inkFaint },
  endButtonText: { color: colors.surface, fontSize: fontSize.label, fontWeight: "600" },
});
