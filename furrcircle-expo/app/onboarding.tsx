import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// UI Components
import { PageContainer } from "../src/components/PageContainer";
import { GlassCard, glassSurface } from "../src/components/ui/Glass";
import { LocationPickerModal, LocationResult } from "../src/components/LocationPickerModal";

// Icons
import {
  Camera,
  MapPin,
  Bell,
  ChevronLeft,
  CheckCircle2,
  Plus,
  Check,
  Bone,
  User,
  ArrowRight,
  TrendingUp,
} from "../src/components/ui/icons";

// Styles & Themes
import { colors } from "../src/lib/theme";
import { useTokens, useThemeStore } from "../src/lib/theme-store";

// State Stores
import { useAuthStore } from "../src/lib/auth-store";
import { useLocationStore } from "../src/lib/location-store";

// APIs
import { authApi } from "../services/auth/authApi";
import { petApi } from "../services/pet/petApi";
import { userApi } from "../services/user/userApi";
import { circleApi } from "../services/community/circleApi";
import { requestNotificationPermissionEarly } from "../helpers/requestNotificationPermission";

export default function OnboardingScreen() {
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const { user, setSession, setJustSignedUp } = useAuthStore();
  const locationStore = useLocationStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStep = async () => {
      if (user?.id) {
        try {
          const saved = await AsyncStorage.getItem(`onboarding_step_${user.id}`);
          if (saved) setStepIndex(parseInt(saved, 10));
        } catch (e) {}
      }
      setIsReady(true);
    };
    loadStep();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && isReady) {
      AsyncStorage.setItem(`onboarding_step_${user.id}`, stepIndex.toString()).catch(() => {});
    }
  }, [stepIndex, user?.id, isReady]);

  // -------------------------------------------------------------
  // Step 1: Location & Notifications State
  // -------------------------------------------------------------
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [notifPermissionStatus, setNotifPermissionStatus] = useState<string>("undetermined");

  // -------------------------------------------------------------
  // Step 2: Add First Pet State
  // -------------------------------------------------------------
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("dog");
  const [petBreed, setPetBreed] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petPhoto, setPetPhoto] = useState<string | undefined>();
  const [petCreated, setPetCreated] = useState(false);
  const [createdPetInfo, setCreatedPetInfo] = useState<any>(null);

  // -------------------------------------------------------------
  // Step 3: Complete Profile State
  // -------------------------------------------------------------
  const [profileBio, setProfileBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [profileUpdated, setProfileUpdated] = useState(false);

  // -------------------------------------------------------------
  // Step 4: Join Circles State
  // -------------------------------------------------------------
  const [circles, setCircles] = useState<any[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [joinedCircleIds, setJoinedCircleIds] = useState<Set<string>>(new Set());

  // -------------------------------------------------------------
  // Back Handler for Android
  // -------------------------------------------------------------
  useEffect(() => {
    const onBackPress = () => {
      if (stepIndex > 0) {
        setStepIndex(stepIndex - 1);
        return true;
      }
      // If at step 0, ignore back and don't exit to signup
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => {
      subscription.remove();
    };
  }, [stepIndex]);

  // Check notification permission status on mount
  useEffect(() => {
    const checkNotifPermission = async () => {
      if (Platform.OS === 'web') {
        setNotifPermissionStatus("skipped");
        return;
      }
      try {
        if (Constants.appOwnership === 'expo') {
          const Notifications = require('expo-notifications');
          const { status } = await Notifications.getPermissionsAsync();
          setNotifPermissionStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
          return;
        }

        const messaging = require('@react-native-firebase/messaging').default;
        if (messaging) {
          const authStatus = await messaging().hasPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          setNotifPermissionStatus(enabled ? "granted" : "undetermined");
        }
      } catch (err) {
        console.warn("Error checking initial notifications permission:", err);
        try {
          const Notifications = require('expo-notifications');
          const { status } = await Notifications.getPermissionsAsync();
          setNotifPermissionStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
        } catch {
          setNotifPermissionStatus("undetermined");
        }
      }
    };
    checkNotifPermission();
  }, []);

  // Load circles when we navigate to Step 4 (index 3)
  useEffect(() => {
    if (stepIndex === 3) {
      loadTrendingCircles();
    }
  }, [stepIndex]);

  // -------------------------------------------------------------
  // Location Handlers
  // -------------------------------------------------------------
  const handleAutoLocate = async () => {
    setLoading(true);
    try {
      await locationStore.fetchLiveLocation(true);
      // If store got updated, save location to backend profile too (optional but nice)
      const freshCity = useLocationStore.getState().city;
      
      if (!freshCity) {
        Alert.alert(
          "Location Access Required",
          "Please enable location access in your device Settings to continue.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      const freshLat = useLocationStore.getState().latitude;
      const freshLng = useLocationStore.getState().longitude;
      
      await userApi.updateProfile({
        city: freshCity,
        latitude: freshLat ?? undefined,
        longitude: freshLng ?? undefined,
      });
    } catch (err) {
      console.warn("Failed to auto locate:", err);
      Alert.alert("Location failed", "Could not automatically resolve your location. Please select manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocationSelect = async (loc: LocationResult) => {
    setLocationModalVisible(false);
    locationStore.updateLocation(loc.city, loc.latitude, loc.longitude);
    locationStore.setUseGPS(false);
    
    setLoading(true);
    try {
      await userApi.updateProfile({
        city: loc.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    } catch (err) {
      console.warn("Failed to save manual location to backend:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Notification Handlers
  // -------------------------------------------------------------
  const handleRequestNotifications = async () => {
    setLoading(true);
    try {
      const res = await requestNotificationPermissionEarly();
      setNotifPermissionStatus(res);
    } catch (err) {
      console.warn("Notification permission request failed:", err);
      setNotifPermissionStatus("denied");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Image Pickers
  // -------------------------------------------------------------
  const pickPetPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled) setPetPhoto(result.assets[0].uri);
  };

  const pickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled) setProfilePhoto(result.assets[0].uri);
  };

  // -------------------------------------------------------------
  // Pet API Call
  // -------------------------------------------------------------
  const savePet = async () => {
    if (!petName.trim()) {
      Alert.alert("Required", "Please enter your pet's name.");
      return;
    }
    setLoading(true);
    try {
      let avatarUrl = petPhoto;
      if (petPhoto && (petPhoto.startsWith("file://") || !petPhoto.startsWith("http"))) {
        const uploadRes = await userApi.uploadImage(petPhoto, "pets");
        avatarUrl = uploadRes?.url ?? uploadRes;
      }

      const res = await petApi.createPet({
        name: petName.trim(),
        species: petSpecies,
        breed: petBreed.trim() || undefined,
        weight: petWeight.trim() || undefined,
        avatar_url: avatarUrl || undefined,
        birth_date: new Date().toISOString().split("T")[0], // default DOB to today for onboarding
        age: "1",
        gender: "female",
      });

      setCreatedPetInfo(res);
      setPetCreated(true);
      setStepIndex(2); // Go to Profile step
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err.message || "Failed to create pet.";
      Alert.alert(
        "Error adding pet",
        msg,
        [
          { text: "Retry", style: "default" },
          { text: "Skip Step", style: "cancel", onPress: () => setStepIndex(2) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Profile API Call
  // -------------------------------------------------------------
  const saveProfile = async () => {
    // If no bio or photo, just skip to next step
    if (!profileBio.trim() && !profilePhoto) {
      setStepIndex(3);
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = profilePhoto;
      if (profilePhoto && (profilePhoto.startsWith("file://") || !profilePhoto.startsWith("http"))) {
        const uploadRes = await userApi.uploadImage(profilePhoto, "profiles");
        avatarUrl = uploadRes?.url ?? uploadRes;
      }

      await userApi.updateProfile({
        bio: profileBio.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });

      setProfileUpdated(true);
      setStepIndex(3); // Go to Circles step
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err.message || "Failed to update profile.";
      Alert.alert(
        "Error updating profile",
        msg,
        [
          { text: "Retry", style: "default" },
          { text: "Skip Step", style: "cancel", onPress: () => setStepIndex(3) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Circle Handlers
  // -------------------------------------------------------------
  const loadTrendingCircles = async () => {
    setLoadingCircles(true);
    try {
      const [trendingData, myCirclesData] = await Promise.all([
        circleApi.getTrending().catch(() => []),
        circleApi.getMyCircles().catch(() => [])
      ]);
      
      let data = trendingData;
      if (!data || data.length === 0) {
        data = await circleApi.getAllCircles().catch(() => []);
      }
      
      setCircles(data.slice(0, 6));
      
      if (myCirclesData && Array.isArray(myCirclesData)) {
        const joinedSet = new Set<string>(myCirclesData.map((c: any) => c.id));
        setJoinedCircleIds(joinedSet);
      }
    } catch (err) {
      console.warn("Failed to fetch trending circles:", err);
    } finally {
      setLoadingCircles(false);
    }
  };

  const handleToggleJoinCircle = async (circleId: string) => {
    // Optimistic toggle
    const updated = new Set(joinedCircleIds);
    const isJoined = updated.has(circleId);

    if (isJoined) {
      updated.delete(circleId);
    } else {
      updated.add(circleId);
    }
    setJoinedCircleIds(updated);

    try {
      await circleApi.joinCircle(circleId);
    } catch (err) {
      console.warn("Failed to join circle:", err);
      // Revert silently on failure
      const reverted = new Set(joinedCircleIds);
      if (isJoined) {
        reverted.add(circleId);
      } else {
        reverted.delete(circleId);
      }
      setJoinedCircleIds(reverted);
    }
  };

  // -------------------------------------------------------------
  // Complete Onboarding & Finish Wizard
  // -------------------------------------------------------------
  const finish = async () => {
    setLoading(true);
    try {
      const res = await authApi.completeOnboarding();
      if (user?.id) {
        AsyncStorage.removeItem(`onboarding_step_${user.id}`).catch(() => {});
      }
      // Crucial: token merge so the user stays logged in
      await setSession({
        ...user,
        ...res,
        token: user?.token ?? res.token,
      });
    } catch (err) {
      console.warn("Failed to complete onboarding on backend:", err);
      // Fallback: don't block navigation even if backend fails
    } finally {
      setLoading(false);
      setJustSignedUp(false);
      // Let _layout.tsx auth guard handle navigation to avoid blank screen issue
    }
  };

  // -------------------------------------------------------------
  // Navigation Next Step Router
  // -------------------------------------------------------------
  const handleNextStep = () => {
    if (loading) return;
    if (stepIndex === 0) {
      if (!locationStore.city || notifPermissionStatus !== "granted") {
        Alert.alert("Permissions Required", "Please allow both location and notifications to continue.");
        return;
      }
      setStepIndex(1);
    } else if (stepIndex === 1) {
      if (petName.trim()) {
        savePet();
      } else {
        setStepIndex(2); // Skip pet if form empty
      }
    } else if (stepIndex === 2) {
      saveProfile();
    } else if (stepIndex === 3) {
      setStepIndex(4); // Go to final review step
    } else if (stepIndex === 4) {
      finish();
    }
  };

  const handleBackStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  // -------------------------------------------------------------
  // Render Steps
  // -------------------------------------------------------------
  const renderStepContent = () => {
    switch (stepIndex) {
      // --- STEP 1: PERMISSIONS ---
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: tk.text }]}>Permissions & Location 📍</Text>
            <Text style={[styles.stepSubtitle, { color: tk.textMuted }]}>
              Let's customize your experience to find local vets and events.
            </Text>

            {/* Location Card */}
            <GlassCard style={styles.permissionCard}>
              <View style={styles.cardHeader}>
                <MapPin size={24} color={colors.coral} />
                <Text style={[styles.cardTitle, { color: tk.text }]}>Find Local Pet Circles</Text>
              </View>
              <Text style={[styles.cardDesc, { color: tk.textMuted }]}>
                Share location to locate neighborhood dog parks, vets, and dog playdates near you.
              </Text>
              {!locationStore.city && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: colors.primary, width: "100%" }]}
                    onPress={handleAutoLocate}
                  >
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      style={styles.primaryActionBtnText}
                    >
                      Allow Location
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {locationStore.city && (
                <View style={styles.statusRow}>
                  <CheckCircle2 size={18} color={colors.success} />
                  <Text style={[styles.statusText, { color: tk.text }]}>
                    Location set to: <Text style={styles.boldText}>{locationStore.city}</Text>
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Notification Card */}
            <GlassCard style={[styles.permissionCard, { marginTop: 20 }]}>
              <View style={styles.cardHeader}>
                <Bell size={24} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: tk.text }]}>Stay Connected</Text>
              </View>
              <Text style={[styles.cardDesc, { color: tk.textMuted }]}>
                Receive alerts for vaccination reminders, messages, and missing pets in your area.
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: colors.primary, width: "100%" },
                    notifPermissionStatus === "granted" && { backgroundColor: colors.success }
                  ]}
                  onPress={handleRequestNotifications}
                  disabled={notifPermissionStatus === "granted"}
                >
                  <Text 
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={styles.primaryActionBtnText}
                  >
                    {notifPermissionStatus === "granted" ? "Notifications Enabled ✓" : "Enable Notifications"}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            <LocationPickerModal
              visible={isLocationModalVisible}
              onClose={() => setLocationModalVisible(false)}
              onSelectLocation={handleManualLocationSelect}
            />
          </View>
        );

      // --- STEP 2: ADD PET ---
      case 1:
        return (
          <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepTitle, { color: tk.text }]}>Add Your First Pet 🐾</Text>
            <Text style={[styles.stepSubtitle, { color: tk.textMuted }]}>
              Create your pet's profile card. You can add more pets later.
            </Text>

            <TouchableOpacity onPress={pickPetPhoto} style={[styles.photoBtn, { borderColor: tk.border, backgroundColor: tk.card }]} activeOpacity={0.8}>
              {petPhoto ? (
                <>
                  <Image source={{ uri: petPhoto }} style={styles.photoPreview} />
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", gap: 8 }]}>
                    <Camera size={32} color="#FFFFFF" />
                    <Text style={styles.photoPreviewText}>Change photo</Text>
                  </View>
                </>
              ) : (
                <>
                  <Camera size={32} color={tk.textMuted} />
                  <Text style={[styles.photoBtnText, { color: tk.textMuted }]}>Add Pet Photo (optional)</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Pet Name</Text>
            <TextInput
              value={petName}
              onChangeText={setPetName}
              placeholder="e.g. Bella"
              placeholderTextColor={tk.textMuted}
              style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border }]}
            />

            <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Species</Text>
            <View style={styles.speciesContainer}>
              {["dog", "cat", "other"].map((s) => {
                const isActive = petSpecies === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setPetSpecies(s)}
                    style={[
                      styles.speciesChip,
                      { backgroundColor: tk.card },
                      isActive && { backgroundColor: tk.text }
                    ]}
                  >
                    <Text style={[styles.speciesChipText, { color: tk.textMuted }, isActive && { color: tk.bg }]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Breed</Text>
            <TextInput
              value={petBreed}
              onChangeText={setPetBreed}
              placeholder="e.g. Golden Retriever (optional)"
              placeholderTextColor={tk.textMuted}
              style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border }]}
            />

            <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Weight (kg)</Text>
            <TextInput
              value={petWeight}
              onChangeText={setPetWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 15 (optional)"
              placeholderTextColor={tk.textMuted}
              style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border }]}
            />
          </ScrollView>
        );

      // --- STEP 3: COMPLETE PROFILE ---
      case 2:
        return (
          <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepTitle, { color: tk.text }]}>Complete Your Profile 👤</Text>
            <Text style={[styles.stepSubtitle, { color: tk.textMuted }]}>
              Customize your profile photo and tell the community about yourself.
            </Text>

            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickProfilePhoto} style={[styles.avatarPicker, { borderColor: tk.border, backgroundColor: tk.card }]} activeOpacity={0.8}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={48} color={tk.textMuted} />
                    <View style={styles.avatarCameraIcon}>
                      <Camera size={16} color="#FFFFFF" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.avatarPickerText, { color: tk.textMuted }]}>Upload Profile Photo</Text>
            </View>

            <Text style={[styles.inputLabel, { color: tk.textMuted }]}>About You (Bio)</Text>
            <TextInput
              value={profileBio}
              onChangeText={setProfileBio}
              placeholder="Tell other pet owners about yourself..."
              placeholderTextColor={tk.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.bioInput, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border }]}
            />
          </ScrollView>
        );

      // --- STEP 4: JOIN CIRCLES ---
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: tk.text }]}>Join Popular Circles 🌐</Text>
            <Text style={[styles.stepSubtitle, { color: tk.textMuted }]}>
              Join groups that match your interests to stay updated.
            </Text>

            {loadingCircles ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : circles.length === 0 ? (
              <Text style={[styles.emptyText, { color: tk.textMuted }]}>No active circles found. You can create your own circles later!</Text>
            ) : (
              <FlatListContainer>
                {circles.map((item) => {
                  const isJoined = joinedCircleIds.has(item.id);
                  return (
                    <GlassCard key={item.id} style={styles.circleRow}>
                      <View style={styles.circleInfo}>
                        <View style={[styles.circleAvatar, { backgroundColor: tk.border }]}>
                          {item.coverImage ? (
                            <Image source={{ uri: item.coverImage }} style={styles.circleAvatarImg} />
                          ) : (
                            <Bone size={20} color={tk.textMuted} />
                          )}
                        </View>
                        <View style={styles.circleDetails}>
                          <Text style={[styles.circleName, { color: tk.text }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.circleDesc, { color: tk.textMuted }]} numberOfLines={1}>
                            {item.description || `${item.membersCount || 0} members`}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleToggleJoinCircle(item.id)}
                        style={[
                          styles.joinBtn,
                          isJoined && { backgroundColor: "rgba(76,175,80,0.15)" }
                        ]}
                      >
                        <Text style={[styles.joinBtnText, { color: colors.primary }, isJoined && { color: colors.success }]}>
                          {isJoined ? "Joined ✓" : "Join"}
                        </Text>
                      </TouchableOpacity>
                    </GlassCard>
                  );
                })}
              </FlatListContainer>
            )}
          </View>
        );

      // --- STEP 5: YOU'RE ALL SET ---
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: tk.text }]}>Welcome to FurrCircle! 🎉</Text>
            <Text style={[styles.stepSubtitle, { color: tk.textMuted }]}>
              Here's a summary of your configuration. Let's start exploring!
            </Text>

            <GlassCard style={styles.summaryCard}>
              {/* Account summary */}
              <View style={[styles.summaryItem, { borderBottomColor: tk.border }]}>
                <View style={styles.summaryIconBox}>
                  <User size={20} color={colors.primary} />
                </View>
                <View style={styles.summaryTextCol}>
                  <Text style={[styles.summaryItemTitle, { color: tk.text }]}>Profile Card</Text>
                  <Text style={[styles.summaryItemSubtitle, { color: tk.textMuted }]} numberOfLines={1}>
                    {profileBio.trim() ? profileBio : "Bio skipped"}
                  </Text>
                </View>
              </View>

              {/* Pet summary */}
              <View style={[styles.summaryItem, { borderBottomColor: tk.border }]}>
                <View style={styles.summaryIconBox}>
                  <Bone size={20} color={colors.coral} />
                </View>
                <View style={styles.summaryTextCol}>
                  <Text style={[styles.summaryItemTitle, { color: tk.text }]}>Your Pet</Text>
                  <Text style={[styles.summaryItemSubtitle, { color: tk.textMuted }]}>
                    {petName.trim() ? `${petName} (${petBreed || petSpecies})` : "Skipped adding first pet"}
                  </Text>
                </View>
              </View>

              {/* Location summary */}
              <View style={[styles.summaryItem, { borderBottomColor: tk.border }]}>
                <View style={styles.summaryIconBox}>
                  <MapPin size={20} color="#EAB308" />
                </View>
                <View style={styles.summaryTextCol}>
                  <Text style={[styles.summaryItemTitle, { color: tk.text }]}>Location</Text>
                  <Text style={[styles.summaryItemSubtitle, { color: tk.textMuted }]}>
                    {locationStore.city || "Not provided"}
                  </Text>
                </View>
              </View>

              {/* Communities summary */}
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <TrendingUp size={20} color={colors.success} />
                </View>
                <View style={styles.summaryTextCol}>
                  <Text style={[styles.summaryItemTitle, { color: tk.text }]}>Circles Joined</Text>
                  <Text style={[styles.summaryItemSubtitle, { color: tk.textMuted }]}>
                    {joinedCircleIds.size} communities joined
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, opacity: isReady ? 1 : 0 }}
        >
          {/* Header */}
          <View style={styles.header}>
            {stepIndex > 0 ? (
              <TouchableOpacity onPress={handleBackStep} style={styles.backBtn} activeOpacity={0.7}>
                <ChevronLeft size={24} color={tk.text} />
                <Text style={[styles.headerBtnText, { color: tk.text }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}

            {stepIndex < 4 && stepIndex > 0 ? (
              <TouchableOpacity onPress={finish} style={styles.skipHeaderBtn} activeOpacity={0.7}>
                <Text style={[styles.headerBtnText, { color: tk.textMuted }]}>Skip All</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Main Step Wrapper */}
          <View style={styles.body}>{renderStepContent()}</View>

          {/* Footer Navigation Bar */}
          <View style={styles.footer}>
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3, 4].map((index) => {
                const isActive = stepIndex === index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { backgroundColor: tk.border },
                      isActive && { backgroundColor: colors.primary, width: 18 }
                    ]}
                  />
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleNextStep}
              disabled={loading || (stepIndex === 0 && (!locationStore.city || notifPermissionStatus !== "granted"))}
              style={[
                styles.nextBtn, 
                { backgroundColor: colors.primary },
                (stepIndex === 0 && (!locationStore.city || notifPermissionStatus !== "granted")) && { opacity: 0.5 }
              ]}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {stepIndex === 4 ? "Get Started" : "Continue"}
                  </Text>
                  {stepIndex < 4 && <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PageContainer>
  );
}

// FlatList helper since we don't want deep nested scroll behaviors
function FlatListContainer({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  skipHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  headerBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  body: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  // Step 1 styling
  permissionCard: {
    padding: 20,
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  glassBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  glassBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  primaryActionBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  statusText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  boldText: {
    fontFamily: "Inter_600SemiBold",
  },
  // Step 2 styling
  photoBtn: {
    height: 120,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    overflow: "hidden",
  },
  photoPreview: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  photoPreviewText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  photoBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginTop: 4,
  },
  inputLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  speciesContainer: {
    flexDirection: "row",
    gap: 10,
  },
  speciesChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  speciesChipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  // Step 3 styling
  avatarContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCameraIcon: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
  },
  avatarPickerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginTop: 8,
  },
  // Step 4 styling
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  circleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 18,
  },
  circleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  circleAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circleAvatarImg: {
    width: "100%",
    height: "100%",
  },
  circleDetails: {
    flex: 1,
  },
  circleName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  circleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  joinBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  joinBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },
  // Step 5 styling
  summaryCard: {
    padding: 18,
    borderRadius: 24,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryItemTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  summaryItemSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  // Footer navigation styling
  footer: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: Platform.OS === "ios" ? 10 : 20,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    justifyContent: "center",
  },
  nextBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
});
