import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, ScrollView, Image, Pressable, Switch } from "react-native";
import {
  Settings,
  ChevronRight,
  PawPrint,
  Bookmark,
  FileText,
  Bell,
  Shield,
  LogOut,
  Moon,
  Sun,
  MapPin,
  Mail,
  Phone,
  Pencil,
  CalendarDays,
} from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userDiscoverApi } from "../../services/users/discoverApi";
import { userCommunityApi } from "../../services/users/communityApi";

import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CustomPawPrint } from "./index";
import { Camera, Heart, Calendar } from "@/components/ui/IconCompat";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [savedVetsCount, setSavedVetsCount] = useState<number | null>(null);
  const [myPostsCount, setMyPostsCount] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    refreshUser();
    userDiscoverApi.getSavedVetsCount().then(setSavedVetsCount).catch(() => {});
    userCommunityApi.getMyPosts().then(p => setMyPostsCount(p.length)).catch(() => {});
  }, [refreshUser]));

  const menuItems = [
    {
      icon: PawPrint,
      label: "My Pets",
      count: String(user?.petCount ?? 0),
      action: () => router.push("/profile/pets"),
    },
    {
      icon: CalendarDays,
      label: "My Appointments",
      action: () => router.push("/appointments"),
    },
    {
      icon: Bookmark,
      label: "Saved",
      // count: savedVetsCount !== null ? String(savedVetsCount) : undefined,
      action: () => router.push("/profile/saved"),
    },
    {
      icon: FileText,
      label: "My Posts",
      count: myPostsCount !== null ? String(myPostsCount) : undefined,
      action: () => router.push("/profile/posts"),
    },
    {
      icon: Bell,
      label: "Notifications",
      action: () => router.push("/profile/notifications"),
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      action: () => router.push("/profile/security"),
    },
    {
      icon: Settings,
      label: "App Settings",
      action: () => router.push("/profile/settings"),
    },
  ];

  const avatar = user?.avatar
    ? { uri: user.avatar }
    : require("../../assets/pet-dog.jpg");
  const profilePills = [
    { icon: MapPin, label: user?.city || "Add city" },
    { icon: Phone, label: user?.phone || "Add phone" },
    { icon: Mail, label: user?.email || "Add email" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>Profile</Text>
            <Pressable
              onPress={() => router.push('/profile/edit')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.bgSubtle, borderWidth: 1, borderColor: colors.border }}
            >
              <Pencil size={15} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Edit</Text>
            </Pressable>
          </View>

          {/* Hero */}
          <View style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 24 }}>
            <LinearGradient
              colors={['#3b82f6', '#1e3a8a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}
            >
              {/* Background Paw Prints */}
              <CustomPawPrint size={100} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -10, top: -10, }} />
              <CustomPawPrint size={60} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: 40, bottom: 60 }} />

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', padding: 3 }}>
                  <View style={{ flex: 1, borderRadius: 41, overflow: 'hidden', backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={avatar}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                  {/* <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, padding: 2 }}>
                    <View style={{ backgroundColor: '#3b82f6', borderRadius: 10, padding: 4 }}>
                      <Camera size={12} color="#fff" />
                    </View>
                  </View> */}
                </View>

                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>
                    {user?.name ?? "Sarah Johnson"}
                  </Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' }}>
                    {user?.memberSince ? `Pet parent since ${user.memberSince}` : "Build a profile that feels like you"}
                  </Text>
                  {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                      <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>{user?.role === "shelter" ? "Shelter Account" : "Premium Member"}</Text>
                    </View>
                  </View> */}
                </View>
              </View>

              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 16, lineHeight: 19 }}>
                {user?.bio || "Add a short bio, your city, and a profile photo so vets and shelters can understand you faster."}
              </Text>

              {/* Profile Info Pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                {profilePills.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Icon size={12} color="#fff" />
                      <Text style={{ fontSize: 11, color: "#fff", fontWeight: '500' }}>
                        {item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={{ height: 1, marginVertical: 18, backgroundColor: 'rgba(255,255,255,0.1)' }} />

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {[
                  { n: String(user?.petCount ?? 0), l: "Pets", icon: PawPrint, action: () => router.push("/profile/pets") },
                  { n: user?.role === "shelter" ? "Shelter" : "Owner", l: "Account", icon: Shield },
                  { n: user?.isVerified ? "Verified" : "Active", l: "Status", icon: Heart },
                ].map((s, idx, arr) => (
                  <React.Fragment key={s.l}>
                    <Pressable
                      onPress={s.action}
                      disabled={!s.action}
                      style={{ flex: 1, alignItems: 'center' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                          <s.icon size={12} color="#fff" />
                        </View>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>{s.l}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{s.n}</Text>
                    </Pressable>
                    {idx < arr.length - 1 && <View style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                  </React.Fragment>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Theme Toggle Section */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 16,
            }}
          >
            Preferences
          </Text>
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: isDark ? colors.brand + "15" : "#fff7ed",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isDark ? (
                    <Moon size={20} color={colors.brand} />
                  ) : (
                    <Sun size={20} color="#f59e0b" />
                  )}
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: colors.textPrimary,
                    }}
                  >
                    Dark Mode
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isDark
                      ? "Comfortable in the dark"
                      : "Vibrant for daylight"}
                  </Text>
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
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 16,
            }}
          >
            Dashboard
          </Text>
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={item.action}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: i < menuItems.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: colors.bgSubtle,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={20} color={colors.textMuted} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {item.label}
                  </Text>
                  {item.count && (
                    <View
                      style={{
                        backgroundColor: colors.bgSubtle,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: colors.textMuted,
                        }}
                      >
                        {item.count}
                      </Text>
                    </View>
                  )}
                  <ChevronRight size={16} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={async () => await logout()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: "#fff1f2",
              borderWidth: 1,
              borderColor: "#fecdd3",
            }}
          >
            <LogOut size={18} color="#e11d48" />
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#e11d48" }}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
