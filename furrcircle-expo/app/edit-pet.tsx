import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Platform, Image, KeyboardAvoidingView, ActivityIndicator, Keyboard } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Camera, LocateFixed, ChevronDown } from "../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { AdaptiveSheet } from "../src/components/AdaptiveSheet";
import { petApi } from "../services/pet/petApi";
import { uploadImage } from "../services/user/userApi";
import { colors } from "../src/lib/theme";
import { useTokens, useThemeStore } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LocationPickerModal, LocationResult } from "../src/components/LocationPickerModal";
import * as Location from "expo-location";

const PERSONALITY_TAGS = ["Friendly", "Playful", "Calm", "Active", "Independent", "Cuddly", "Protective", "Curious"];
const SPECIES_OPTIONS = ["dog", "cat", "rabbit", "horse", "pigeon", "goat", "cow", "other"];

export default function EditPetScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const dark = useThemeStore((s) => s.dark);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [selectedOption, setSelectedOption] = useState("dog");
  const [otherSpecies, setOtherSpecies] = useState("");
  const [showSpeciesSheet, setShowSpeciesSheet] = useState(false);
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

  const getPersonalityLabel = (tag: string) => {
    switch (tag) {
      case "Friendly": return t("personalityFriendly");
      case "Playful": return t("personalityPlayful");
      case "Calm": return t("personalityCalm");
      case "Active": return t("personalityActive");
      case "Independent": return t("personalityIndependent");
      case "Cuddly": return t("personalityCuddly");
      case "Protective": return t("personalityProtective");
      case "Curious": return t("personalityCurious");
      default: return tag;
    }
  };

  const getSpeciesLabel = (opt: string) => {
    switch (opt) {
      case "dog": return t("speciesDog");
      case "cat": return t("speciesCat");
      case "rabbit": return t("speciesRabbit");
      case "horse": return t("speciesHorse");
      case "pigeon": return t("speciesPigeon");
      case "goat": return t("speciesGoat");
      case "cow": return t("speciesCow");
      case "other": return t("speciesOther");
      default: return opt;
    }
  };

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

  useEffect(() => {
    if (id) {
      petApi.getPetById(id)
        .then(pet => {
          if (pet.name) setName(pet.name);
          if (pet.species) {
            setSpecies(pet.species);
            const lowerSp = String(pet.species).toLowerCase();
            if (SPECIES_OPTIONS.includes(lowerSp)) {
              setSelectedOption(lowerSp);
              setOtherSpecies("");
            } else {
              setSelectedOption("other");
              setOtherSpecies(pet.species);
            }
          }
          if (pet.breed) setBreed(pet.breed);
          if (pet.gender) setGender(pet.gender as "male" | "female");
          if (pet.birth_date) {
            setBirthDate(new Date(pet.birth_date));
          } else if (pet.age) {
            // Very rough fallback if they only had age previously
            const guessedDate = new Date();
            const years = parseInt(pet.age);
            if (!isNaN(years)) {
              guessedDate.setFullYear(guessedDate.getFullYear() - years);
              setBirthDate(guessedDate);
            }
          }
          if (pet.avatar_url) setPhoto(pet.avatar_url);
          if (pet.microchip_id) setMicrochipId(pet.microchip_id);
          if (pet.weight) setWeight(pet.weight);
          if (pet.city) setCity(pet.city);
          if (pet.personality && Array.isArray(pet.personality) && pet.personality.length > 0) {
            setPersonality(pet.personality);
          } else if (pet.description) {
            setPersonality(pet.description.split(',').map((t: string) => t.trim()));
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load pet:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]);

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
        Alert.alert(t("permissionDeniedTitle"), t("allowLocationAccessSettings"));
        return;
      }
      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      if (!location) {
        Alert.alert(t("errorTitle"), t("failedToFetchLocation"));
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
      Alert.alert(t("errorTitle"), t("failedToFetchCurrentLocation"));
    } finally {
      setLocating(false);
    }
  };

  const toggleTag = (t: string) =>
    setPersonality((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const save = async () => {
    if (!name.trim()) { Alert.alert(t("requiredTitle"), t("pleaseEnterPetName")); return; }
    if (!species.trim()) { Alert.alert(t("requiredTitle"), t("pleaseSelectPetSpecies")); return; }
    if (!breed.trim()) { Alert.alert(t("requiredTitle"), t("pleaseEnterPetBreed")); return; }
    if (!birthDate) { Alert.alert(t("requiredTitle"), t("pleaseSelectPetDOB")); return; }
    if (!id) return;
    setSaving(true);

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    const calculatedAge = years > 0 ? `${years}` : (months > 0 ? t("monthsShort").replace("{months}", String(months)) : t("lessThanOneMonth"));

    try {
      let avatarUrl = photo;
      if (photo?.startsWith('file://') || (photo && !photo.startsWith('http'))) {
        const result = await uploadImage(photo, 'pets');
        avatarUrl = result?.url ?? result;
      }
      await petApi.updatePet(id, {
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
      Alert.alert(t("errorUpdatingPet"), err?.response?.data?.message || err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer noAmbient={true}>
        <View style={[styles.container, { backgroundColor: tk.bg, justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: tk.text }}>{t("loading")}</Text>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer noAmbient={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
          <ScreenHeader title={t("editPetHeaderTitle")} />
          <ScrollView
          showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 60 + (insets.bottom > 0 ? insets.bottom : 0), paddingHorizontal: 20 }}
          >
            <TouchableOpacity onPress={pickPhoto} style={[styles.photoBtn, { borderColor: tk.border, backgroundColor: tk.card }]} activeOpacity={0.8}>
              {photo ? (
                <>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", gap: 8 }]}>
                    <Camera size={32} color="#FFFFFF" />
                    <Text style={[styles.photoBtnText, { color: "#FFFFFF" }]}>{t("changePhotoBtn")}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Camera size={32} color={tk.textMuted} />
                  <Text style={[styles.photoBtnText, { color: tk.textMuted }]}>{t("addPhotoBtn")}</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("nameLabel")}</Text>
            <TextInput value={name} onChangeText={setName} placeholder={t("petNamePlaceholder")} placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("speciesLabel")}</Text>
            <TouchableOpacity
              onPress={() => setShowSpeciesSheet(true)}
              style={[styles.input, { backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              activeOpacity={0.7}
            >
              <Text style={{ color: selectedOption ? tk.text : tk.textMuted, fontFamily: "Inter_400Regular" }}>
                {selectedOption ? getSpeciesLabel(selectedOption) : t("selectSpeciesPlaceholder")}
              </Text>
              <ChevronDown size={20} color={tk.textMuted} />
            </TouchableOpacity>

            {selectedOption === "other" && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.label, { color: tk.textMuted, marginTop: 4 }]}>{t("customSpeciesLabel")}</Text>
                <TextInput
                  value={otherSpecies}
                  onChangeText={(val) => {
                    setOtherSpecies(val);
                    setSpecies(val.trim());
                  }}
                  placeholder={t("customSpeciesPlaceholder")}
                  placeholderTextColor={tk.textMuted}
                  style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]}
                />
              </View>
            )}

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("breedLabel")}</Text>
            <TextInput value={breed} onChangeText={setBreed} placeholder={t("breedPlaceholder")} placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("weightStatLabel")}</Text>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="e.g. 12" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            {/* <Text style={[styles.label, { color: tk.textMuted }]}>City</Text>
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
        </View> */}

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("genderLabel")}</Text>
            <View style={styles.toggle}>
              {(["female", "male"] as const).map((g) => {
                const isActive = gender === g;
                return (
                  <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.toggleBtn, { backgroundColor: isActive ? tk.text : tk.card }]}>
                    <Text style={[styles.toggleText, { color: isActive ? tk.bg : tk.textMuted }]}>{g === "female" ? t("femaleGenderOption") : t("maleGenderOption")}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("dateOfBirthLabel")}</Text>
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
                    {birthDate ? birthDate.toLocaleDateString() : t("selectDateOfBirthPlaceholder")}
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

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("microchipIdLabel")}</Text>
            <TextInput value={microchipId} onChangeText={setMicrochipId} placeholder={t("microchipIdPlaceholder")} placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>{t("personalityLabel")}</Text>
            <View style={styles.tagRow}>
              {PERSONALITY_TAGS.map((tagItem) => {
                const isActive = personality.includes(tagItem);
                return (
                  <TouchableOpacity key={tagItem} onPress={() => toggleTag(tagItem)} style={[styles.tag, { backgroundColor: isActive ? "rgba(37,99,235,0.12)" : tk.card }]}>
                    <Text style={[styles.tagText, { color: isActive ? colors.primary : tk.textMuted }]}>{getPersonalityLabel(tagItem)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={save} disabled={saving} style={styles.saveBtn} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{saving ? t("savingProgress") : t("saveChangesBtn")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleLocationSelect}
      />

      <AdaptiveSheet visible={showSpeciesSheet} onClose={() => setShowSpeciesSheet(false)}>
        <View style={{ padding: 24, backgroundColor: tk.card }}>
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: tk.text, marginBottom: 16 }}>
            {t("selectSpeciesPlaceholder")}
          </Text>
          <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
            {SPECIES_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setSelectedOption(opt);
                  if (opt !== "other") {
                    setSpecies(opt);
                  } else {
                    setSpecies(otherSpecies.trim());
                  }
                  setShowSpeciesSheet(false);
                }}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: tk.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text style={{
                  fontFamily: selectedOption === opt ? "Poppins_600SemiBold" : "Inter_400Regular",
                  fontSize: 16,
                  color: selectedOption === opt ? colors.primary : tk.text
                }}>
                  {getSpeciesLabel(opt)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </AdaptiveSheet>
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
