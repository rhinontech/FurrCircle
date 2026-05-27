import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { petApi } from "../services/pet/petApi";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";

const PERSONALITY_TAGS = ["Friendly", "Playful", "Calm", "Active", "Independent", "Cuddly", "Protective", "Curious"];

export default function EditPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [ageYears, setAgeYears] = useState("1");
  const [photo, setPhoto] = useState<string | undefined>();
  const [personality, setPersonality] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      petApi.getPetById(id)
        .then(pet => {
          if (pet.name) setName(pet.name);
          if (pet.species) setSpecies(pet.species);
          if (pet.breed) setBreed(pet.breed);
          if (pet.gender) setGender(pet.gender as "male" | "female");
          if (pet.age) setAgeYears(String(pet.age));
          if (pet.avatar_url) setPhoto(pet.avatar_url);
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

  const toggleTag = (t: string) =>
    setPersonality((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const save = async () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    if (!id) return;
    setSaving(true);
    try {
      await petApi.updatePet(id, { 
        name: name.trim(), 
        species, 
        breed: breed.trim(), 
        gender, 
        age: ageYears, 
        avatar_url: photo, 
        personality
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Error updating pet", err?.response?.data?.message || err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <View style={[styles.container, { backgroundColor: tk.bg, justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: tk.text }}>Loading...</Text>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Edit pet" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={pickPhoto} style={[styles.photoBtn, { borderColor: tk.border }]} activeOpacity={0.8}>
          {photo ? null : <Camera size={32} color={tk.textMuted} />}
          <Text style={[styles.photoBtnText, { color: tk.textMuted }]}>{photo ? "Change photo" : "Add photo"}</Text>
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

        <Text style={[styles.label, { color: tk.textMuted }]}>Age (years)</Text>
        <TextInput value={ageYears} onChangeText={setAgeYears} keyboardType="numeric" style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

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
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save changes"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoBtn: { height: 140, borderRadius: 24, borderWidth: 2, borderColor: "rgba(26,26,46,0.15)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginVertical: 16, gap: 8 },
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
