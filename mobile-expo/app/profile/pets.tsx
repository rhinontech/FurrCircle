import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

export default function LegacyProfilePetsRedirect() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    router.replace("/(tabs)/pets");
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}
