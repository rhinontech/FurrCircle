import React from "react";
import { View, Text, ScrollView, Image, Pressable, Switch } from "react-native";
import { Settings, ChevronRight, PawPrint, Bookmark, FileText, Bell, Shield, LogOut, Moon, Sun, Stethoscope } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

import { useRouter } from "expo-router";

// No need for menuItems constant outside since it needs router

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, login } = useAuth();
  const router = useRouter();

  const menuItems = [
    { icon: PawPrint, label: "My Pets", count: String(user?.petCount ?? 3), action: () => router.push('/(tabs)/pets') },
    { icon: Bookmark, label: "Saved Vets", count: "5", action: () => router.push('/profile/vets') },
    { icon: FileText, label: "My Posts", count: "8", action: () => router.push('/profile/posts') },
    { icon: Bell, label: "Notifications", action: () => router.push('/reminders') },
    { icon: Shield, label: "Privacy & Security", action: () => router.push('/profile/security') },
    { icon: Settings, label: "App Settings", action: () => router.push('/profile/settings') },
  ];

  const avatar = user?.avatar ?? require("../../assets/pet-dog.jpg");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 24 }}>Profile</Text>

          {/* Hero */}
          <View style={{ backgroundColor: colors.heroBg, borderRadius: 28, padding: 24, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Image source={avatar} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }} resizeMode="cover" />
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{user?.name ?? "Sarah Johnson"}</Text>
                <Text style={{ fontSize: 14, color: colors.heroSub, marginTop: 2 }}>Pet parent since {user?.memberSince ?? "2022"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 32, marginTop: 20 }}>
              {[
                 { n: String(user?.petCount ?? 3), l: "Pets", action: () => router.push('/(tabs)/pets') }, 
                 { n: "5", l: "Vets", action: () => router.push('/profile/vets') }, 
                 { n: "8", l: "Posts", action: () => router.push('/profile/posts') }
              ].map((s) => (
                <Pressable key={s.l} onPress={s.action} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{s.n}</Text>
                  <Text style={{ fontSize: 12, color: colors.heroSub, marginTop: 2 }}>{s.l}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Theme Toggle Section */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Preferences</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? colors.brand + '15' : '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                  {isDark ? <Moon size={20} color={colors.brand} /> : <Sun size={20} color="#f59e0b" />}
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Dark Mode</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{isDark ? 'Comfortable in the dark' : 'Vibrant for daylight'}</Text>
                </View>
              </View>
              <Switch 
                value={isDark} 
                onValueChange={async () => await toggleTheme()} 
                trackColor={{ false: colors.border, true: colors.brand }} 
                thumbColor="#fff" 
              />
            </View>
          </View>

          {/* Menu */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Dashboard</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 24 }}>
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable 
                  key={item.label} 
                  onPress={item.action}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={colors.textMuted} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{item.label}</Text>
                  {item.count && (
                    <View style={{ backgroundColor: colors.bgSubtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>{item.count}</Text>
                    </View>
                  )}
                  <ChevronRight size={16} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>


          {/* Sign Out */}
          <Pressable onPress={async () => await logout()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' }}>
            <LogOut size={18} color="#e11d48" />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#e11d48' }}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
