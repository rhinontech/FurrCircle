import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useSession } from "../src/store/session";
import { useTheme } from "../src/theme";

/** Entry gate: routes into the right workspace once the session has loaded. */
export default function Index() {
  const { ready, signedIn, workspace } = useSession();
  const { tk } = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: tk.bg }}>
        <ActivityIndicator color={tk.primary} />
      </View>
    );
  }

  if (!signedIn) return <Redirect href="/(auth)/welcome" />;
  return <Redirect href={workspace === "owner" ? "/(owner)/today" : "/(vet)/today"} />;
}
