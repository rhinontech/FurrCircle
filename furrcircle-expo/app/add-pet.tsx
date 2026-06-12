import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Platform, Image, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Camera, LocateFixed } from "../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { petApi } from "../services/pet/petApi";
import { uploadImage } from "../services/user/userApi";
import { colors } from "../src/lib/theme";
import { useTokens, useThemeStore } from "../src/lib/theme-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LocationPickerModal, LocationResult } from "../src/components/LocationPickerModal";
import * as Location from "expo-location";

const PERSONALITY_TAGS = ["Friendly", "Playful", "Calm", "Active", "Independent", "Cuddly", "Protective", "Curious"];

export default function AddPetScreen() {
  const router = useRouter();
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const dark = useThemeStore((s) => s.dark);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>();
  const [personality, setPersonality] = useState<string[]>([]);
  const [microchipId, setMicrochipId] = useState("");
  const [weight, setWeight] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleLocationSelect = (loc: LocationResult) => {
    setLocationModalVisible(false);
    setCity(loc.city);
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
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setLocating(false);
    }
  };

  const toggleTag = (t: string) =>
    setPersonality((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const save = async () => {
    if (!name.trim()) { Alert.alert("Required", "Please enter your pet's name."); return; }
    if (!breed.trim()) { Alert.alert("Required", "Please enter your pet's breed."); return; }
    if (!birthDate) { Alert.alert("Required", "Please select your pet's Date of Birth."); return; }
    setSaving(true);

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    const calculatedAge = years > 0 ? `${years}` : (months > 0 ? `${months} mo` : '< 1 mo');

    try {
      let avatarUrl = photo;
      if (photo?.startsWith('file://') || (photo && !photo.startsWith('http'))) {
        const result = await uploadImage(photo, 'pets');
        avatarUrl = result?.url ?? result;
      }
      await petApi.createPet({
        name: name.trim(),
        species,
        breed: breed.trim(),
        gender,
        age: calculatedAge,
        birth_date: birthDate.toISOString().split('T')[0],
        avatar_url: avatarUrl,
        microchip_id: microchipId.trim() || null,
        weight: weight.trim() || null,
        city: city.trim() || null,
        personality
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Error adding pet", err?.response?.data?.message || err.message);
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
          <ScreenHeader title="Add a pet" />
          <ScrollView contentContainerStyle={{ paddingBottom: 60 + (insets.bottom > 0 ? insets.bottom : 0), paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={pickPhoto} style={[styles.photoBtn, { borderColor: tk.border, backgroundColor: tk.card }]} activeOpacity={0.8}>
              {photo ? (
                <>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", gap: 8 }]}>
                    <Camera size={32} color="#FFFFFF" />
                    <Text style={[styles.photoBtnText, { color: "#FFFFFF" }]}>Change photo</Text>
                  </View>
                </>
              ) : (
                <>
                  <Camera size={32} color={tk.textMuted} />
                  <Text style={[styles.photoBtnText, { color: tk.textMuted }]}>Add photo</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: tk.textMuted }]}>Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Moona" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>Species</Text>
            <View style={styles.toggle}>
              {["dog", "cat", "other"].map((s) => {
                const isActive = species === s;
                return (
                  <TouchableOpacity key={s} onPress={() => setSpecies(s)} style={[styles.toggleBtn, { backgroundColor: isActive ? tk.text : tk.card }]}>
                    <Text style={[styles.toggleText, { color: isActive ? tk.bg : tk.textMuted }]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: tk.textMuted }]}>Breed</Text>
            <TextInput value={breed} onChangeText={setBreed} placeholder="e.g. Border Collie" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>Weight</Text>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="e.g. 12" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>City</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.input, { flex: 1, backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border, justifyContent: 'center' }]}
                onPress={() => setLocationModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: city ? tk.text : tk.textMuted, fontFamily: "Inter_400Regular" }}>
                  {city || "Select your city"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAutoLocate} disabled={locating} style={[styles.input, { width: 52, paddingHorizontal: 0, alignItems: "center", justifyContent: "center", backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <LocateFixed size={20} color={colors.primary} />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: tk.textMuted }]}>Gender</Text>
            <View style={styles.toggle}>
              {(["female", "male"] as const).map((g) => {
                const isActive = gender === g;
                return (
                  <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.toggleBtn, { backgroundColor: isActive ? tk.text : tk.card }]}>
                    <Text style={[styles.toggleText, { color: isActive ? tk.bg : tk.textMuted }]}>{g === "female" ? "♀ Female" : "♂ Male"}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: tk.textMuted }]}>Date of Birth</Text>
            {Platform.OS === 'ios' ? (
              <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                <DateTimePicker
                  value={birthDate || new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  themeVariant={dark ? "dark" : "light"}
                  onChange={(e, date) => {
                    if (date) setBirthDate(date);
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border, justifyContent: 'center' }]} activeOpacity={0.8}>
                  <Text style={{ color: birthDate ? tk.text : tk.textMuted, fontFamily: "Inter_400Regular" }}>
                    {birthDate ? birthDate.toLocaleDateString() : "Select Date of Birth"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={birthDate || new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(e, date) => {
                      setShowDatePicker(false);
                      if (date) setBirthDate(date);
                    }}
                  />
                )}
              </>
            )}

            <Text style={[styles.label, { color: tk.textMuted }]}>Microchip ID</Text>
            <TextInput value={microchipId} onChangeText={setMicrochipId} placeholder="e.g. 981020000345119" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>Personality</Text>
            <View style={styles.tagRow}>
              {PERSONALITY_TAGS.map((t) => {
                const isActive = personality.includes(t);
                return (
                  <TouchableOpacity key={t} onPress={() => toggleTag(t)} style={[styles.tag, { backgroundColor: isActive ? "rgba(37,99,235,0.12)" : tk.card }]}>
                    <Text style={[styles.tagText, { color: isActive ? colors.primary : tk.textMuted }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={save} disabled={saving} style={styles.saveBtn} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Add pet"}</Text>
            </TouchableOpacity>
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
  photoBtn: { height: 140, borderRadius: 24, borderWidth: 2, borderColor: "rgba(26,26,46,0.15)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginVertical: 16, gap: 8, overflow: "hidden" },
  photoPreview: { position: "absolute", width: "100%", height: "100%", borderRadius: 22 },
  photoBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.foreground + "88" },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.foreground + "99", marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  toggle: { flexDirection: "row", gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: "center" },
  toggleBtnActive: { backgroundColor: colors.foreground },
  toggleText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.foreground + "99" },
  toggleTextActive: { color: colors.white },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  tagActive: { backgroundColor: "rgba(37,99,235,0.1)" },
  tagText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.foreground + "88" },
  tagTextActive: { color: colors.primary },
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
