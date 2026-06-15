import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";
import { useState } from "react";
import { healthApi } from "../../services/health/healthApi";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function LogVaccineScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  const [vaccine, setVaccine] = useState("");
  const [dateGiven, setDateGiven] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nextDate, setNextDate] = useState<Date | null>(null);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!vaccine.trim()) {
        Alert.alert("Error", "Please enter vaccine name.");
        return;
    }
    if (!petId) {
        Alert.alert("Error", "No pet selected.");
        return;
    }
    setLoading(true);
    try {
        await healthApi.addVaccine(petId, {
            name: vaccine,
            dateAdministered: dateGiven.toISOString().slice(0, 10),
            nextDueDate: nextDate ? nextDate.toISOString().slice(0, 10) : undefined,
            status: "done"
        });
        Alert.alert("Success", "Vaccine logged successfully.");
        router.back();
    } catch (err) {
        console.error("Failed to add vaccine:", err);
        Alert.alert("Error", "Failed to log vaccine.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Log Vaccine" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={[styles.label, { color: tk.textMuted }]}>Vaccine name</Text>
        <TextInput value={vaccine} onChangeText={setVaccine} placeholder="e.g. DHPP" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        
        <Text style={[styles.label, { color: tk.textMuted }]}>Date Given</Text>
        {Platform.OS === 'ios' ? (
          <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
            <DateTimePicker
              value={dateGiven}
              mode="date"
              display="default"
              maximumDate={new Date()}
              themeVariant={dark ? "dark" : "light"}
              onChange={(e, date) => {
                if (date) setDateGiven(date);
              }}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border, justifyContent: 'center' }]} activeOpacity={0.8}>
              <Text style={{ color: tk.text, fontFamily: "Inter_400Regular" }}>{dateGiven.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateGiven}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setDateGiven(date);
                }}
              />
            )}
          </>
        )}

        <Text style={[styles.label, { color: tk.textMuted }]}>Next due date</Text>
        {Platform.OS === 'ios' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <DateTimePicker
              value={nextDate || new Date()}
              mode="date"
              display="default"
              themeVariant={dark ? "dark" : "light"}
              onChange={(e, date) => {
                if (date) setNextDate(date);
              }}
            />
            {nextDate && (
              <TouchableOpacity onPress={() => setNextDate(null)} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={{ color: colors.coral, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => setShowNextDatePicker(true)} 
                style={[styles.input, { flex: 1, backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border, justifyContent: 'center' }]} 
                activeOpacity={0.8}
              >
                <Text style={{ color: nextDate ? tk.text : tk.textMuted, fontFamily: "Inter_400Regular" }}>
                  {nextDate ? nextDate.toLocaleDateString() : "Select date (Optional)"}
                </Text>
              </TouchableOpacity>
              {nextDate && (
                <TouchableOpacity onPress={() => setNextDate(null)} style={[styles.input, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }]} activeOpacity={0.7}>
                  <Text style={{ color: colors.coral, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {showNextDatePicker && (
              <DateTimePicker
                value={nextDate || new Date()}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowNextDatePicker(false);
                  if (date) setNextDate(date);
                }}
              />
            )}
          </>
        )}

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
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,107,107,0.12)", justifyContent: "center", alignItems: "center" }
});
