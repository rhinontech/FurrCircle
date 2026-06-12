import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, Modal, Pressable, Alert, ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { colors } from "../src/lib/theme";
import { useThemeStore, useTokens } from "../src/lib/theme-store";
import { useAuthStore } from "../src/lib/auth-store";
import {
  Moon, Sun, Eye, Lock, ShieldAlert, MapPin,
  Bell, Trash2, ChevronRight, LogOut,
} from "../src/components/ui/icons";
import { userApi } from "../services/user/userApi";
import { authApi } from "../services/auth/authApi";
import { blockApi } from "../services/user/blockApi";
import { notificationApi } from "../services/notification/notificationApi";
import * as SecureStore from "expo-secure-store";
import { LocationPickerModal, LocationResult } from "../src/components/LocationPickerModal";
import * as Location from 'expo-location';
import { AdaptiveSheet } from "../src/components/AdaptiveSheet";
import { useLocationStore } from "../src/lib/location-store";


export default function SettingsScreen() {
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  const setDark = useThemeStore((s) => s.setDark);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  const locationCity = useLocationStore(s => s.city);
  const updateLocation = useLocationStore(s => s.updateLocation);

  function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  const privateProfile = user?.isPrivate || false;
  const twoFactorEnabled = user?.twoFactorEnabled || false;
  const [pushNotifs, setPushNotifs] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [blockedCount, setBlockedCount] = useState<number | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      setConfirmDelete(false);
      Alert.alert("Account Deleted", "Your account has been permanently removed.");
      await logout();
      router.replace("/login");
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      Alert.alert("Error", err.message || "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    blockApi.getBlockedUsers()
      .then(list => setBlockedCount(list.length))
      .catch(() => setBlockedCount(0));

    SecureStore.getItemAsync("push_notifications_enabled")
      .then((val) => {
        if (val !== null) {
          setPushNotifs(val === "true");
        }
      })
      .catch(() => {});
  }, []);

  const togglePushNotifs = async (val: boolean) => {
    setPushNotifs(val);
    try {
      await SecureStore.setItemAsync("push_notifications_enabled", val ? "true" : "false");
      await notificationApi.togglePushEnabled(val);
    } catch (err) {
      console.error("Failed to toggle push notifications:", err);
      setPushNotifs(!val);
      try {
        await SecureStore.setItemAsync("push_notifications_enabled", !val ? "true" : "false");
      } catch {}
    }
  };

  const togglePrivateProfile = async (val: boolean) => {
    // Optimistic update
    if (user) await setSession({ ...user, isPrivate: val });
    try {
      const res = await userApi.updateProfile({ isPrivate: val });
      if (res.success && res.user && user) {
        await setSession({ ...user, ...res.user });
      }
    } catch (err) {
      // Revert on failure
      if (user) await setSession({ ...user, isPrivate: !val });
      console.error('Failed to update privacy', err);
    }
  };

  const toggleTwoFA = async (val: boolean) => {
    // Optimistic update
    if (user) await setSession({ ...user, twoFactorEnabled: val });
    try {
      const res = await userApi.updateProfile({ twoFactorEnabled: val });
      if (res.success && res.user && user) {
        await setSession({ ...user, ...res.user });
      }
    } catch (err) {
      // Revert on failure
      if (user) await setSession({ ...user, twoFactorEnabled: !val });
      console.error('Failed to update two-factor auth settings', err);
    }
  };



  const handleManualLocationSelect = async (loc: LocationResult) => {
    setLocationModalVisible(false);
    try {
      updateLocation(loc.city || null, loc.latitude, loc.longitude);
    } catch (err) {
      console.error('Failed to update location manually', err);
      Alert.alert('Error', 'Failed to save location.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>

        <Section title="Appearance" tk={tk}>
          <Row tk={tk} icon={dark ? Moon : Sun} iconBg="rgba(37,99,235,0.12)" iconColor={colors.primary}
            label="Dark mode" sub="Easier on the eyes at night"
            toggle={dark} onToggle={setDark} />
        </Section>

        <Section title="Privacy & security" tk={tk}>
          <Row tk={tk} icon={Eye} iconBg="rgba(255,111,207,0.15)" iconColor={colors.pinky}
            label="Private profile" sub="Only followers see your posts"
            toggle={privateProfile} onToggle={togglePrivateProfile} />
          <Row tk={tk} icon={Lock} iconBg="rgba(76,175,80,0.15)" iconColor={colors.success}
            label="Two-factor auth" sub="Extra step on new logins"
            toggle={twoFactorEnabled} onToggle={toggleTwoFA} />
          <TouchableOpacity onPress={() => router.push('/blocked-accounts' as any)} activeOpacity={0.8}>
            <View pointerEvents="none">
              <Row tk={tk} icon={ShieldAlert} iconBg="rgba(255,107,107,0.15)" iconColor={colors.coral}
                label="Blocked accounts" sub={blockedCount === null ? "Loading..." : `${blockedCount} blocked`} isLink />
            </View>
          </TouchableOpacity>
        </Section>

        <Section title="Location" tk={tk}>
          <TouchableOpacity onPress={() => setLocationModalVisible(true)} activeOpacity={0.8}>
            <View pointerEvents="none">
              <Row tk={tk} icon={MapPin} iconBg="rgba(37,99,235,0.1)" iconColor={colors.primary}
                label="Home city" sub={locationCity || "Tap to set location"} isLink />
            </View>
          </TouchableOpacity>
        </Section>

        <Section title="Notifications" tk={tk}>
          <Row tk={tk} icon={Bell} iconBg="rgba(255,217,61,0.4)" iconColor={colors.foreground}
            label="Push notifications" sub="Likes, comments, matches"
            toggle={pushNotifs} onToggle={togglePushNotifs} />
        </Section>

        {/* <Section title="Account" tk={tk}>
          <TouchableOpacity onPress={handleLogout}
            style={[styles.dangerRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <View style={[styles.dangerIcon, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
              <LogOut size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerLabel, { color: colors.primary }]}>Sign out</Text>
              <Text style={[styles.dangerSub, { color: tk.textMuted }]}>{user?.email ?? ""}</Text>
            </View>
            <ChevronRight size={16} color={tk.textMuted} />
          </TouchableOpacity>
        </Section> */}

        <Section title="Danger zone" tk={tk}>
          <TouchableOpacity onPress={() => setConfirmDelete(true)}
            style={[styles.dangerRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <View style={styles.dangerIcon}>
              <Trash2 size={20} color="#EF4444" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerLabel}>Delete account</Text>
              <Text style={[styles.dangerSub, { color: tk.textMuted }]}>Permanently remove your data</Text>
            </View>
            <ChevronRight size={16} color={tk.textMuted} />
          </TouchableOpacity>
        </Section>

        <Text style={[styles.footer, { color: tk.textMuted }]}>Furr Circle v0.1 · Made with 🐾</Text>
      </ScrollView>

      {/* Delete confirmation modal */}
      <AdaptiveSheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth={380}>
          <View style={{ padding: 28, alignItems: "center" }}>
            <View style={styles.modalIcon}>
              <Trash2 size={28} color="#EF4444" strokeWidth={2} />
            </View>
            <Text style={[styles.modalTitle, { color: tk.text }]}>Delete your account?</Text>
            <Text style={[styles.modalBody, { color: tk.textMuted }]}>
              Your pets, posts, and circles will be removed. This can't be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmDelete(false)}
                style={[styles.modalBtn, { backgroundColor: tk.bg }]}
                disabled={isDeleting}
              >
                <Text style={[styles.modalBtnText, { color: tk.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={[styles.modalBtn, styles.modalBtnDanger]}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
      </AdaptiveSheet>

      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleManualLocationSelect}
      />
    </View>
  );
}

function Section({ title, children, tk }: { title: string; children: React.ReactNode; tk: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tk.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={styles.sectionRows}>{children}</View>
    </View>
  );
}

function Row({
  tk, icon: Icon, iconBg, iconColor, label, sub, toggle, onToggle, isLink,
}: {
  tk: any; icon: any; iconBg: string; iconColor: string;
  label: string; sub?: string;
  toggle?: boolean; onToggle?: (v: boolean) => void;
  isLink?: boolean;
}) {
  return (
    <View style={[styles.row, { backgroundColor: tk.card }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: tk.text }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: tk.textMuted }]}>{sub}</Text>}
      </View>
      {typeof toggle === "boolean"
        ? <Switch value={toggle} onValueChange={onToggle}
            trackColor={{ false: tk.border, true: colors.primary }}
            thumbColor="#fff" />
        : isLink
        ? <ChevronRight size={16} color={tk.textMuted} />
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginTop: 28 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 1.2, paddingHorizontal: 24, marginBottom: 8 },
  sectionRows: { gap: 8, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 16 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  dangerRow: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 16, marginHorizontal: 16 },
  dangerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center" },
  dangerLabel: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#EF4444" },
  dangerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  footer: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 32, paddingBottom: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40, alignItems: "center" },
  modalIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, marginBottom: 8 },
  modalBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: { flex: 1, borderRadius: 24, paddingVertical: 14, alignItems: "center" },
  modalBtnDanger: { backgroundColor: "#EF4444" },
  modalBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
});
