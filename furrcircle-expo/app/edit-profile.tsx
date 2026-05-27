import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { MapPin, User, Camera, Check, AlertCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useAuthStore } from "../src/lib/auth-store";
import { authApi } from "../services/auth/authApi";

const boyDog = require("../src/assets/doodle-boy-dog.png");

export default function EditProfileScreen() {
  const router = useRouter();
  const tk = useTokens();
  const { user } = useAuthStore();

  const [username, setUsername] = useState(user?.username || "");
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [photo, setPhoto] = useState<string | undefined>(user?.avatar_url || undefined);
  const [saving, setSaving] = useState(false);

  // Live username check state
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState("");
  const checkTimeoutRef = useRef<any>(null);

  // Check if anything has actually changed
  const hasChanges = 
    username.trim() !== (user?.username || "") ||
    name.trim() !== (user?.name || "") ||
    address.trim() !== (user?.address || "") ||
    city.trim() !== (user?.city || "") ||
    photo !== (user?.avatar_url || undefined);

  // Disable save button if no changes, saving is true, or username check failed (if username has changed)
  const isSaveDisabled = 
    !hasChanges || 
    saving || 
    (usernameCheck !== 'available' && username.trim().toLowerCase() !== user?.username?.trim()?.toLowerCase());

  // Debounced live username checking
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setUsernameCheck('idle');
      setUsernameError("");
      return;
    }

    // If it matches current user's username, it is available/valid
    if (user && trimmedUsername === user.username.trim().toLowerCase()) {
      setUsernameCheck('available');
      setUsernameError("");
      return;
    }

    if (trimmedUsername.length < 3) {
      setUsernameCheck('invalid');
      setUsernameError("Must be at least 3 characters");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setUsernameCheck('invalid');
      setUsernameError("Letters, numbers, underscores, and periods only");
      return;
    }

    setUsernameCheck('checking');
    setUsernameError("");

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(trimmedUsername);
        if (res.available) {
          setUsernameCheck('available');
        } else {
          setUsernameCheck('taken');
          setUsernameError("This username is already taken");
        }
      } catch (err: any) {
        setUsernameCheck('invalid');
        setUsernameError(err.message || "Failed to check username");
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [username, user]);

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need media library permissions to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image pick error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing field", "Please enter your name");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Missing field", "Please enter a username");
      return;
    }
    if (usernameCheck !== 'available' && username.trim().toLowerCase() !== user?.username?.trim()?.toLowerCase()) {
      Alert.alert("Invalid username", usernameError || "Please choose an available username.");
      return;
    }

    setSaving(true);
    // Keep function empty for future backend connection as requested
    setTimeout(() => {
      setSaving(false);
      Alert.alert("Success", "Profile updated successfully (Mocked)!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }, 1200);
  };

  const renderUsernameStatus = () => {
    switch (usernameCheck) {
      case 'checking':
        return <ActivityIndicator size="small" color={colors.primary} style={styles.statusLoader} />;
      case 'available':
        return (
          <View style={styles.statusRow}>
            <Check size={14} color="#10B981" />
            <Text style={[styles.statusAvailable, { color: "#10B981" }]}>Available</Text>
          </View>
        );
      case 'taken':
      case 'invalid':
        return (
          <View style={styles.statusRow}>
            <AlertCircle size={14} color="#EF4444" />
            <Text style={[styles.statusError, { color: "#EF4444" }]}>{usernameError}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} style={[styles.avatarWrap, { borderColor: tk.border, backgroundColor: tk.card }]}>
              <Image 
                source={photo ? { uri: photo } : boyDog} 
                style={styles.avatarImg} 
                resizeMode="cover" 
              />
              <View style={styles.cameraOverlay}>
                <Camera size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.7}>
              <Text style={[styles.avatarLabel, { color: tk.textMuted }]}>Change Profile Picture</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            
            {/* Username Field */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: tk.text }]}>Username</Text>
                {renderUsernameStatus()}
              </View>
              <View style={[
                styles.inputWrapper, 
                { backgroundColor: tk.inputBg, borderColor: tk.border },
                usernameCheck === 'available' && { borderColor: "#10B981" },
                (usernameCheck === 'taken' || usernameCheck === 'invalid') && { borderColor: "#EF4444" }
              ]}>
                <TextInput
                  style={[styles.input, { color: tk.text }]}
                  placeholder="Username"
                  placeholderTextColor={tk.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

            {/* Name Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.text }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: tk.inputBg, borderColor: tk.border }]}>
                <TextInput
                  style={[styles.input, { color: tk.text }]}
                  placeholder="Full Name"
                  placeholderTextColor={tk.textMuted}
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* City Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.text }]}>City</Text>
              <View style={[styles.inputWrapper, { backgroundColor: tk.inputBg, borderColor: tk.border }]}>
                <TextInput
                  style={[styles.input, { color: tk.text }]}
                  placeholder="e.g. Mumbai, India"
                  placeholderTextColor={tk.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            {/* Address Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.text }]}>Address</Text>
              <View style={[
                styles.inputWrapper, 
                styles.textAreaWrapper, 
                { backgroundColor: tk.inputBg, borderColor: tk.border }
              ]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: tk.text }]}
                  placeholder="Enter your street address"
                  placeholderTextColor={tk.textMuted}
                  multiline
                  numberOfLines={3}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={[
                styles.saveBtn, 
                (isSaveDisabled || saving) && { backgroundColor: tk.border, shadowColor: "transparent", elevation: 0 }
              ]} 
              onPress={handleSave}
              disabled={isSaveDisabled || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={tk.textMuted} />
              ) : (
                <Text style={[styles.saveBtnText, (isSaveDisabled || saving) && { color: tk.textMuted }]}>Save Changes</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatarWrap: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    borderWidth: 3, 
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 42 },
  cameraOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  avatarLabel: {
    marginTop: 10,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12
  },
  form: { gap: 20 },
  field: { gap: 6 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, letterSpacing: 0.2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusLoader: { marginRight: 4 },
  statusAvailable: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  statusError: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
    height: 52
  },
  textAreaWrapper: {
    height: 90,
    paddingVertical: 10,
    alignItems: "flex-start"
  },
  input: {
    width: "100%",
    height: "100%",
    fontFamily: "Inter_400Regular",
    fontSize: 15
  },
  textArea: {
    textAlignVertical: "top"
  },
  saveBtn: {
    backgroundColor: colors.coral,
    borderRadius: 24,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  saveBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#FFFFFF"
  }
});
