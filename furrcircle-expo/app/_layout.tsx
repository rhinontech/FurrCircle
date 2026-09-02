import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SessionProvider } from "../src/store/session";
import { ThemeProvider, useTheme } from "../src/theme";

function RootStack() {
  const { tk, scheme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tk.bg }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          // Screens paint their own ambient backdrop; a solid scene background
          // would cover it during the push transition.
          contentStyle: { backgroundColor: tk.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(owner)" />
        <Stack.Screen name="(vet)" />
        <Stack.Screen
          name="consult/[id]"
          options={{ presentation: "fullScreenModal", animation: "fade_from_bottom" }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <RootStack />
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
