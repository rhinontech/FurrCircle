import React from "react";
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Sliders } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    pushEnabled,
    marketingEnabled,
    setPushNotificationsEnabled,
    setMarketingEnabled,
    refreshPreferences,
  } = useNotifications();
  
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    refreshPreferences().finally(() => setLoading(false));
  }, [refreshPreferences]);

  const togglePush = async () => {
    try {
      await setPushNotificationsEnabled(!pushEnabled);
    } catch {
      // Reversion handled by context
    }
  };

  const toggleMarketing = async () => {
    try {
      await setMarketingEnabled(!marketingEnabled);
    } catch {
      // Reversion handled by context
    }
  };

  const sections = [
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Push Notifications", action: togglePush, value: pushEnabled, toggle: true, key: "push" },
        { icon: Bell, label: "Marketing Updates", action: toggleMarketing, value: marketingEnabled, toggle: true, key: "marketing" },
      ]
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Notifications</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <View style={{ marginBottom: 32, alignItems: 'center', paddingVertical: 20 }}>
             <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Bell size={40} color={colors.brand} />
             </View>
             <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Stay Updated</Text>
             <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 }}>Control how you receive updates about your pets, appointments, and new features.</Text>
          </View>

          {sections.map((section, idx) => (
            <View key={idx} style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 12 }}>{section.title}</Text>
              <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                {section.items.map((item, i) => (
                  <Pressable
                    key={item.label}
                    disabled={item.toggle}
                    onPress={item.action}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i < section.items.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={18} color={colors.textMuted} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.label}</Text>
                    {item.toggle && (
                      <Switch 
                        value={!!item.value} 
                        onValueChange={item.action} 
                        trackColor={{ false: colors.border, true: colors.brand }} 
                        thumbColor="#fff" 
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
