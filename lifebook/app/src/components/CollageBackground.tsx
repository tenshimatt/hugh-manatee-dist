import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "../lib/theme";
import { fetchCollageImages, type CollageResponse } from "../services/worker";

/**
 * Ambient, soft background behind Hugh.
 *
 * Design rules (from ADRs + decisions log):
 *   - Not overbearing. Sits behind the voice, never competes with it.
 *   - 15% opacity on images so nothing reads as a photograph.
 *   - Blurred, slow Ken Burns pan.
 *   - Defaults to gradient-only if the /collage/images call fails. Network
 *     outage or missing Unsplash key must never block the conversation.
 */
export function CollageBackground({
  birthYear,
  hometown,
  theme,
}: {
  birthYear: number | null;
  hometown: string | null;
  theme?: string;
}) {
  const [collage, setCollage] = useState<CollageResponse | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCollageImages({ birth_year: birthYear, hometown, theme })
      .then((r) => {
        if (alive) setCollage(r);
      })
      .catch((e) => console.warn("[collage] fetch failed; using gradient only", e));
    return () => {
      alive = false;
    };
  }, [birthYear, hometown, theme]);

  const from = collage?.gradient?.from ?? colors.bgTop;
  const to = collage?.gradient?.to ?? colors.bgBottom;
  const images = collage?.images ?? [];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[from, to]} style={StyleSheet.absoluteFill} />
      {images.slice(0, 5).map((img, i) => (
        <DriftingImage key={img.url} url={img.url} index={i} count={images.length} />
      ))}
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
    </View>
  );
}

/**
 * A single image tile that drifts slowly (Ken Burns) and never snaps.
 * Each tile gets a different phase so they don't move in lockstep.
 */
function DriftingImage({
  url,
  index,
  count,
}: {
  url: string;
  index: number;
  count: number;
}) {
  const { width, height } = useMemo(() => Dimensions.get("window"), []);

  // Each tile gets a slightly-offset slot so overlap is varied.
  const slot = useMemo(() => {
    const cols = count <= 2 ? 1 : 2;
    const rows = Math.ceil(count / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      left: (col / cols) * width - width * 0.05,
      top: (row / rows) * height - height * 0.05,
      w: width / cols + width * 0.1,
      h: height / rows + height * 0.1,
    };
  }, [index, count, width, height]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1.05);

  useEffect(() => {
    const jitter = () => Math.random() * 8 - 4;
    translateX.value = withRepeat(
      withSequence(
        withTiming(jitter() * 1.5 + (index % 2 === 0 ? 6 : -6), {
          duration: 28000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(jitter() * 1.5 + (index % 2 === 0 ? -6 : 6), {
          duration: 28000,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(jitter() + 4, {
          duration: 34000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(jitter() - 4, {
          duration: 34000,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 40000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.04, { duration: 40000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [index, translateX, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        { left: slot.left, top: slot.top, width: slot.w, height: slot.h },
        animatedStyle,
      ]}
    >
      <Image
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={600}
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: "absolute",
    opacity: 0.15,
  },
});
