import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, ScrollView, Image, Pressable, Switch } from "react-native";
import { ChevronRight, CalendarDays, Users, Star, Clock, LogOut, Moon, Sun, UserCheck, Stethoscope, MapPin, Phone, Pencil, Shield } from "@/components/ui/IconCompat";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CustomPawPrint } from "../(tabs)/index";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { PawPrint, Heart } from "@/components/ui/IconCompat";

export default function VetProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  useFocusEffect(useCallback(() => { refreshUser(); }, []));
  const ratingLabel = user?.rating != null && user?.rating !== "" ? String(user.rating) : "New";
  const experienceLabel = user?.yearsExp ? String(user.yearsExp) : "Add";
  const profilePills = [
    { icon: MapPin, label: user?.city || "Add clinic city" },
    { icon: Phone, label: user?.phone || "Add clinic phone" },
    { icon: Clock, label: user?.working_hours || "Add working hours" },
  ];
  const vetMenuItems = [
    { icon: CalendarDays, label: "Appointment History", action: () => router.push("/vet-profile/appointment-history") },
    { icon: Users, label: "All Patients", action: () => router.push("/vet-profile/patients") },
    { icon: Star, label: "My Reviews", action: () => router.push("/vet-profile/reviews") },
    { icon: Clock, label: "Working Hours", action: () => router.push("/vet-profile/working-hours") },
    { icon: UserCheck, label: "Verification Status", action: () => router.push("/vet-profile/verification") },
    { icon: Shield, label: "Privacy & Security", action: () => router.push("/profile/security") },
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

          {/* Vet Hero Card - Modernized */}
          <View style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 24 }}>
            <LinearGradient
              colors={['#3b82f6', '#1e3a8a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}
            >
              {/* Background Paw Prints */}
              <CustomPawPrint size={100} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -10, top: -10 }} />
              <CustomPawPrint size={60} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: 40, bottom: 60 }} />

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', padding: 3 }}>
                  <View style={{ flex: 1, borderRadius: 41, overflow: 'hidden', backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Stethoscope size={36} color={colors.textMuted} />
                    )}
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>
                    {user?.name || "Dr. Anonymous"}
                  </Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' }}>
                    {user?.clinic_name || "Pet Clinic"} · {user?.specialty || "Veterinarian"}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 16, lineHeight: 19 }}>
                {user?.bio || "Add your clinic details, working hours, and a stronger introduction so pet parents know what kind of care you provide."}
              </Text>

              {/* Profile Pills */}
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
                  { n: ratingLabel, l: "Rating", icon: Star },
                  { n: experienceLabel, l: "Experience", icon: Clock },
                  { n: user?.isVerified ? "Verified" : "Pending", l: "Status", icon: Shield },
                ].map((s, idx, arr) => (
                  <React.Fragment key={s.l}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                          <s.icon size={12} color="#fff" />
                        </View>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>{s.l}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{s.n}</Text>
                    </View>
                    {idx < arr.length - 1 && <View style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                  </React.Fragment>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Dark Mode */}
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {isDark ? <Moon size={20} color={colors.brandText} /> : <Sun size={20} color="#f59e0b" />}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>Dark Mode</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{isDark ? 'Currently dark' : 'Currently light'}</Text>
                </View>
              </View>
              <Switch value={isDark} onValueChange={async () => await toggleTheme()} trackColor={{ false: colors.border, true: colors.brand }} thumbColor="#fff" ios_backgroundColor={colors.border} />
            </View>
          </View>

          {/* Menu */}
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 16 }}>
            {vetMenuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={item.action}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < vetMenuItems.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
                >
                  <Icon size={20} color={colors.textMuted} />
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>{item.label}</Text>
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
