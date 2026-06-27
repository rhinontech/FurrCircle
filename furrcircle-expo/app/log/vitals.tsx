import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useState, useEffect } from "react";
import { healthApi } from "../../services/health/healthApi";
import { petApi } from "../../services/pet/petApi";

export interface AnimalVitals {
  animal: string;
  minBodyTemp: number; // Lowest survivable/clinically seen (°C)
  maxBodyTemp: number; // Highest survivable/clinically seen (°C)
  minHeartRate: number;
  maxHeartRate: number;
}

export const animalVitals: AnimalVitals[] = [
  {
    animal: "Dog",
    minBodyTemp: 32.0,
    maxBodyTemp: 43.0,
    minHeartRate: 40,
    maxHeartRate: 250,
  },
  {
    animal: "Cat",
    minBodyTemp: 32.0,
    maxBodyTemp: 42.5,
    minHeartRate: 80,
    maxHeartRate: 280,
  },
  {
    animal: "Rabbit",
    minBodyTemp: 34.0,
    maxBodyTemp: 42.0,
    minHeartRate: 80,
    maxHeartRate: 350,
  },
  {
    animal: "Horse",
    minBodyTemp: 34.0,
    maxBodyTemp: 42.0,
    minHeartRate: 20,
    maxHeartRate: 240,
  },
  {
    animal: "Pigeon",
    minBodyTemp: 36.0,
    maxBodyTemp: 45.0,
    minHeartRate: 120,
    maxHeartRate: 700,
  },
  {
    animal: "Parrot",
    minBodyTemp: 36.0,
    maxBodyTemp: 44.5,
    minHeartRate: 100,
    maxHeartRate: 450,
  },
  {
    animal: "Goat",
    minBodyTemp: 34.0,
    maxBodyTemp: 42.0,
    minHeartRate: 40,
    maxHeartRate: 180,
  },
  {
    animal: "Cow",
    minBodyTemp: 34.0,
    maxBodyTemp: 42.0,
    minHeartRate: 30,
    maxHeartRate: 170,
  },
];

export default function LogVitalsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const tk = useTokens();
  const [weight, setWeight] = useState("");
  const [temp, setTemp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [petSpecies, setPetSpecies] = useState<string | null>(null);
  const [fetchingPet, setFetchingPet] = useState(true);

  useEffect(() => {
    if (petId) {
      setFetchingPet(true);
      petApi.getPetById(petId)
        .then(pet => {
          if (pet && pet.species) {
            setPetSpecies(pet.species);
          }
        })
        .catch(err => {
          console.error("Failed to fetch pet for vitals verification:", err);
        })
        .finally(() => {
          setFetchingPet(false);
        });
    } else {
      setFetchingPet(false);
    }
  }, [petId]);

  const matchingVital = petSpecies
    ? animalVitals.find(v => v.animal.toLowerCase() === petSpecies.toLowerCase())
    : null;

  const handleSave = async () => {
    if (!weight.trim() && !temp.trim() && !heartRate.trim()) {
        Alert.alert("Error", "Please enter at least weight, temperature, or heart rate.");
        return;
    }
    if (!petId) {
        Alert.alert("Error", "No pet selected.");
        return;
    }
    if (fetchingPet) {
        Alert.alert("Please wait", "Still loading pet information...");
        return;
    }

    if (matchingVital) {
      if (temp.trim()) {
        const tempVal = Number(temp);
        if (isNaN(tempVal) || tempVal < matchingVital.minBodyTemp || tempVal > matchingVital.maxBodyTemp) {
          Alert.alert(
            "Invalid Temperature",
            `For a ${petSpecies}, the temperature must be between ${matchingVital.minBodyTemp.toFixed(1)}°C and ${matchingVital.maxBodyTemp.toFixed(1)}°C.`
          );
          return;
        }
      }
      if (heartRate.trim()) {
        const hrVal = Number(heartRate);
        if (isNaN(hrVal) || hrVal < matchingVital.minHeartRate || hrVal > matchingVital.maxHeartRate) {
          Alert.alert(
            "Invalid Heart Rate",
            `For a ${petSpecies}, the heart rate must be between ${matchingVital.minHeartRate} and ${matchingVital.maxHeartRate} bpm.`
          );
          return;
        }
      }
    }

    setLoading(true);
    try {
        await healthApi.addVital(petId, {
            weight: weight ? Number(weight) : undefined,
            temperature: temp ? Number(temp) : undefined,
            heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
            notes: notes.trim() || undefined,
            timestamp: new Date().toISOString()
        });
        Alert.alert("Success", "Vitals logged successfully.");
        router.back();
    } catch (err) {
        console.error("Failed to log vitals:", err);
        Alert.alert("Error", "Failed to log vitals.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Log Vitals" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={[styles.label, { color: tk.textMuted }]}>Weight (kg)</Text>
        <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="e.g. 14.2" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Temperature (°C)</Text>
        <TextInput value={temp} onChangeText={setTemp} keyboardType="decimal-pad" placeholder="e.g. 38.5" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        {matchingVital && (
          <Text style={[styles.rangeHint, { color: tk.textMuted }]}>
            Normal range: {matchingVital.minBodyTemp.toFixed(1)}°C - {matchingVital.maxBodyTemp.toFixed(1)}°C
          </Text>
        )}
        <Text style={[styles.label, { color: tk.textMuted }]}>Heart Rate (bpm)</Text>
        <TextInput value={heartRate} onChangeText={setHeartRate} keyboardType="number-pad" placeholder="e.g. 80" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        {matchingVital && (
          <Text style={[styles.rangeHint, { color: tk.textMuted }]}>
            Normal range: {matchingVital.minHeartRate} - {matchingVital.maxHeartRate} bpm
          </Text>
        )}
        <Text style={[styles.label, { color: tk.textMuted }]}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder="Any observations…" placeholderTextColor={tk.textMuted} style={[styles.input, styles.textarea, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.foreground + "99", marginTop: 20, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground },
  textarea: { height: 100, textAlignVertical: "top" },
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  rangeHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, marginLeft: 4 },
});
