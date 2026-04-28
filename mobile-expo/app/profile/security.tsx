import React from "react";
import { View, ScrollView, Pressable, Switch } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { useRouter } from "expo-router";
import { ChevronLeft, Lock, Shield, Trash2 } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";

export default function SecurityScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [isFaceIdEnabled, setIsFaceIdEnabled] = React.useState(true);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = React.useState(false);
  const [showLocation, setShowLocation] = React.useState(true);

  const securitySections = [
    {
      title: "Account Security",
      items: [
        { 
          icon: Lock, 
          label: "Change Password", 
          action: () => router.push("/profile/change-password"),
          toggle: false,
          value: undefined
        },
      ]
    },
    {
      title: "Privacy Settings",
      items: [
        {
          icon: Shield,
          label: "Show My Location",
          action: () => setShowLocation(!showLocation),
          value: showLocation,
          toggle: true
        },
      ]
    }
  ];

  const dangerItems = [
    {
      icon: Trash2,
      label: "Delete Account",
      action: () => router.push("/profile/delete-account"),
      danger: true,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Privacy & Security</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {securitySections.map((section, idx) => (
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
                  {item.toggle ? (
                    <Switch value={!!item.value} onValueChange={item.action} trackColor={{ false: colors.border, true: colors.brand }} thumbColor="#fff" />
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{item?.value || ""}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#D9534F', textTransform: 'uppercase', marginBottom: 12 }}>Danger Zone</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: '#FFD0D0', overflow: 'hidden' }}>
            {dangerItems.map((item) => (
              <Pressable
                key={item.label}
                onPress={item.action}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={18} color="#D9534F" />
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#D9534F' }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
