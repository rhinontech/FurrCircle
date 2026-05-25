import "../src/global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { useEffect } from "react";
import { useThemeStore, useTokens } from "../src/lib/theme-store";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const load = useThemeStore((s) => s.load);
  const dark = useThemeStore((s) => s.dark);
  const tokens = useTokens();

  useEffect(() => { load(); }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#F7F8FA" }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: tokens.bg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={dark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="thread/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="community/[slug]" options={{ presentation: "card" }} />
          <Stack.Screen name="u/[handle]" options={{ presentation: "card" }} />
          <Stack.Screen name="p/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="pet" options={{ presentation: "card" }} />
          <Stack.Screen name="records" options={{ presentation: "card" }} />
          <Stack.Screen name="care" options={{ presentation: "card" }} />
          <Stack.Screen name="log/vitals" options={{ presentation: "card" }} />
          <Stack.Screen name="log/meds" options={{ presentation: "card" }} />
          <Stack.Screen name="log/vaccine" options={{ presentation: "card" }} />
          <Stack.Screen name="notifications" options={{ presentation: "card" }} />
          <Stack.Screen name="settings" options={{ presentation: "card" }} />
          <Stack.Screen name="today" options={{ presentation: "card" }} />
          <Stack.Screen name="events" options={{ presentation: "card" }} />
          <Stack.Screen name="lost" options={{ presentation: "card" }} />
          <Stack.Screen name="memory" options={{ presentation: "card" }} />
          <Stack.Screen name="book" options={{ presentation: "card" }} />
          <Stack.Screen name="reels" options={{ presentation: "card" }} />
          <Stack.Screen name="chat" options={{ presentation: "card" }} />
          <Stack.Screen name="compose" options={{ presentation: "modal" }} />
          <Stack.Screen name="add-pet" options={{ presentation: "modal" }} />
          <Stack.Screen name="ask" options={{ presentation: "modal" }} />
          <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
