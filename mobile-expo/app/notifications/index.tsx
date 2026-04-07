import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, CalendarDays, Heart, ShieldCheck } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";

const notifications = [
  {
    id: "notif_1",
    title: "Puppy Social Mixer",
    message: "A new community event is happening on April 15 at Mission Dolores Park.",
    time: "2m ago",
    icon: CalendarDays,
    accent: "#0ea5e9",
    bg: "#eff6ff",
  },
  {
    id: "notif_2",
    title: "Buddy Listing Updated",
    message: "Your pet is now visible in Discover for adoption inquiries.",
    time: "18m ago",
    icon: Heart,
    accent: "#ec4899",
    bg: "#fdf2f8",
  },
  {
    id: "notif_3",
    title: "Health Reminder",
    message: "Milo's vaccine booster is due soon. Review reminders to stay on track.",
    time: "1h ago",
    icon: ShieldCheck,
    accent: "#10b981",
    bg: "#ecfdf5",
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary, textAlign: "center", marginRight: 40 }}>
          Notifications
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}>
        <View style={{ gap: 12 }}>
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <View
                key={notification.id}
                style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "flex-start" }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: notification.bg, alignItems: "center", justifyContent: "center" }}>
                  <Icon size={22} color={notification.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>{notification.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{notification.time}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 19 }}>
                    {notification.message}
                  </Text>
                </View>
              </View>
            );
          })}

          <View style={{ marginTop: 8, padding: 20, borderRadius: 18, backgroundColor: colors.bgSubtle }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Bell size={18} color={colors.brand} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>All caught up</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
              New event alerts, listing updates, and reminder nudges will appear here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
