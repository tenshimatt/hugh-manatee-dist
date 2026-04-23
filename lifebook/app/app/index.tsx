import { Redirect } from "expo-router";
import { useProfile } from "../src/lib/useProfile";
import { View } from "react-native";
import { colors } from "../src/lib/theme";

export default function Index() {
  const { profile, loading } = useProfile();

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bgTop }} />;
  if (!profile) return <Redirect href="/onboarding" />;
  return <Redirect href="/conversation" />;
}
