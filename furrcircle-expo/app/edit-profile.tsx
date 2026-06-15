import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { MapPin, User, Camera, Check, AlertCircle, LocateFixed } from "../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useAuthStore } from "../src/lib/auth-store";
import { authApi } from "../services/auth/authApi";
import { LocationPickerModal, LocationResult } from "../src/components/LocationPickerModal";
import * as Location from "expo-location";

const boyDog = require("../src/assets/doodle-boy-dog.png");

export default function EditProfileScreen() {
  const router = useRouter();
  const tk = useTokens();
  const { user } = useAuthStore();

  const [username, setUsername] = useState(user?.username || "");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/^\+91/, "") : "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [latitude, setLatitude] = useState(user?.latitude || undefined);
  const [longitude, setLongitude] = useState(user?.longitude || undefined);
  const [photo, setPhoto] = useState<string | undefined>(user?.avatar_url || undefined);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);

  // Live username check state
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState("");
  const checkTimeoutRef = useRef<any>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Check if anything has actually changed
  const hasChanges = 
    username.trim() !== (user?.username || "") ||
    name.trim() !== (user?.name || "") ||
    email.trim() !== (user?.email || "") ||
    phone.trim() !== (user?.phone ? user.phone.replace(/^\+91/, "") : "") ||
    address.trim() !== (user?.address || "") ||
    city.trim() !== (user?.city || "") ||
    latitude !== (user?.latitude || undefined) ||
    longitude !== (user?.longitude || undefined) ||
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
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }
    if (phone.trim() && phone.trim().length !== 10) {
      Alert.alert("Invalid phone number", "Phone number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      const { userApi } = require('../services/user/userApi');
      const authStore = useAuthStore.getState();
      
      let newAvatarUrl = user?.avatar_url;
      if (photo && photo !== user?.avatar_url) {
        const uploadRes = await userApi.uploadImage(photo, 'profiles');
        newAvatarUrl = uploadRes.url;
      }

      const fullPhone = phone.trim() ? `+91${phone.trim()}` : null;

      const res = await userApi.updateProfile({
        name,
        username,
        email: email.trim() || null,
        phone: fullPhone,
        address,
        city,
        latitude,
        longitude,
        avatar_url: newAvatarUrl
      });
      
      if (res.success && res.user) {
         await authStore.setSession({ ...user, ...res.user });
         Alert.alert("Success", "Profile updated successfully!", [
           { text: "OK", onPress: () => router.back() }
         ]);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
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

  const handleLocationSelect = (loc: LocationResult) => {
    setLocationModalVisible(false);
    setCity(loc.city);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAddress(loc.address);
  };

  const handleAutoLocate = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access in device settings.');
        return;
      }
      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      
      if (!location) {
        Alert.alert('Error', 'Failed to fetch location.');
        setLocating(false);
        return;
      }
      
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
        headers: { 'User-Agent': 'FurrCircleApp/1.0' }
      });
      const data = await response.json();
      
      if (data && data.address) {
        const foundCity = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown City";
        setCity(foundCity);
        setLatitude(lat);
        setLongitude(lon);
        setAddress(data.display_name);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <PageContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
      >
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

            {/* Email Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.text }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { backgroundColor: tk.inputBg, borderColor: tk.border }]}>
                <TextInput
                  style={[styles.input, { color: tk.text }]}
                  placeholder="Email Address"
                  placeholderTextColor={tk.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

             {/* Phone Field */}
             <View style={styles.field}>
               <Text style={[styles.label, { color: tk.text }]}>Phone Number</Text>
               <View style={[styles.inputWrapper, { flexDirection: "row", alignItems: "center", backgroundColor: tk.inputBg, borderColor: tk.border, paddingLeft: 16 }]}>
                 <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: tk.text, marginRight: 8, borderRightWidth: 1.5, borderRightColor: tk.border, paddingRight: 10 }}>+91</Text>
                 <TextInput
                   style={[styles.input, { flex: 1, color: tk.text, height: "100%", paddingHorizontal: 0 }]}
                   placeholder="9876543210"
                   placeholderTextColor={tk.textMuted}
                   keyboardType="phone-pad"
                   autoCapitalize="none"
                   autoCorrect={false}
                   maxLength={10}
                   value={phone}
                   onChangeText={(text) => {
                     const filtered = text.replace(/[^0-9]/g, "");
                     setPhone(filtered);
                   }}
                 />
               </View>
             </View>

            {/* City Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.text }]}>City</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.inputWrapper, { flex: 1, backgroundColor: tk.inputBg, borderColor: tk.border, justifyContent: 'center' }]}
                  onPress={() => setLocationModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: city ? tk.text : tk.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>
                    {city || "Select your city"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAutoLocate} disabled={locating} style={[styles.inputWrapper, { width: 52, paddingHorizontal: 0, alignItems: "center", backgroundColor: tk.card, borderColor: tk.border }]}>
                  {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <LocateFixed size={20} color={colors.primary} />}
                </TouchableOpacity>
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
                (isSaveDisabled || saving) && { backgroundColor: tk.border }
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
    </KeyboardAvoidingView>

      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleLocationSelect}
      />
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
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#FFFFFF"
  }
});
