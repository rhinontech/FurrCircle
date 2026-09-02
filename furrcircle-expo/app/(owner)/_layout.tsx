import { Tabs } from "expo-router";
import React from "react";

import { GlassTabBar, TabMeta } from "../../src/components/nav/GlassTabBar";

const TABS: TabMeta[] = [
  { name: "today", label: "Today", icon: "sunny-outline", iconActive: "sunny" },
  { name: "care", label: "Care", icon: "heart-outline", iconActive: "heart" },
  { name: "community", label: "Community", icon: "people-outline", iconActive: "people" },
  { name: "vet", label: "Vet", icon: "medkit-outline", iconActive: "medkit" },
  { name: "profile", label: "Profile", icon: "person-outline", iconActive: "person" },
];

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
      tabBar={(props) => <GlassTabBar {...props} tabs={TABS} />}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}
