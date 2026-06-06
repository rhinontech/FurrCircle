import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { petApi } from "../../services/pet/petApi";
import { appointmentApi } from "../../services/appointment/appointmentApi";
import { reminderApi } from "../../services/reminder/reminderApi";
import { colors } from "../../src/lib/theme";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronDown } from "lucide-react-native";

export default function BookVetScreen() {
  const router = useRouter();
  const { vetId } = useLocalSearchParams<{ vetId: string }>();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPetDropdown, setShowPetDropdown] = useState(false);

  useEffect(() => {
    petApi.getMyPets().then(data => {
      setPets(data);
      if (data.length > 0) setSelectedPet(data[0].id);
    }).catch(err => console.error(err));
  }, []);

  const save = async () => {
    if (!selectedPet) { Alert.alert("Error", "Please select a pet"); return; }
    if (!reason.trim()) { Alert.alert("Error", "Please enter a reason for the visit"); return; }
    if (!vetId) { Alert.alert("Error", "Invalid Vet"); return; }
    
    setSaving(true);
    
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(vetId));
      if (isUuid) {
        await appointmentApi.createAppointment({ 
          vetId,
          petId: selectedPet,
          date: dateStr,
          time: timeStr,
          reason: reason.trim()
        });
      } else {
        await reminderApi.createReminder({
          title: "Vet Appointment",
          type: "appointment",
          date: dateStr,
          time: timeStr,
          petId: selectedPet,
          notes: reason.trim() ? `Reason: ${reason.trim()}` : undefined
        });
      }
      
      Alert.alert("Success", "Appointment reminder set!");
      router.back();
    } catch (err: any) {
      Alert.alert("Error booking appointment", err?.response?.data?.message || err.message);
      setSaving(false);
    }
  };

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Book Appointment" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20 }}>
        
        <Text style={[styles.label, { color: tk.textMuted }]}>Select Pet</Text>
        <TouchableOpacity 
          onPress={() => setShowPetDropdown(!showPetDropdown)} 
          style={[styles.dropdownHeader, { backgroundColor: tk.inputBg, borderColor: tk.border }]} 
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: tk.text }}>
            {selectedPet ? pets.find(p => p.id === selectedPet)?.name || "Select a pet" : "Select a pet"}
          </Text>
          <ChevronDown size={20} color={tk.textMuted} />
        </TouchableOpacity>

        {showPetDropdown && (
          <View style={[styles.dropdownMenu, { backgroundColor: tk.card, borderColor: tk.border }]}>
            {pets.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                style={[styles.dropdownItem, { borderBottomColor: tk.border }]} 
                onPress={() => { setSelectedPet(p.id); setShowPetDropdown(false); }}
              >
                <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: selectedPet === p.id ? colors.primary : tk.text }}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
            {pets.length === 0 && (
              <View style={styles.dropdownItem}>
                <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: tk.textMuted }}>No pets found</Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.label, { color: tk.textMuted }]}>Reason for visit</Text>
        <TextInput 
          value={reason} 
          onChangeText={setReason} 
          placeholder="e.g. Annual vaccination" 
          placeholderTextColor={tk.textMuted} 
          style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border, minHeight: 80 }]} 
          multiline
        />

        <Text style={[styles.label, { color: tk.textMuted }]}>Date</Text>
        {Platform.OS === 'ios' ? (
          <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              themeVariant={dark ? "dark" : "light"}
              onChange={(e, d) => d && setDate(d)}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border, justifyContent: 'center' }]} activeOpacity={0.8}>
              <Text style={{ color: tk.text, fontFamily: "Inter_400Regular" }}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
              />
            )}
          </>
        )}

        <Text style={[styles.label, { color: tk.textMuted }]}>Time</Text>
        {Platform.OS === 'ios' ? (
          <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              themeVariant={dark ? "dark" : "light"}
              onChange={(e, t) => t && setTime(t)}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.input, { backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border, justifyContent: 'center' }]} activeOpacity={0.8}>
              <Text style={{ color: tk.text, fontFamily: "Inter_400Regular" }}>
                {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={(e, t) => { setShowTimePicker(false); if (t) setTime(t); }}
              />
            )}
          </>
        )}

        <TouchableOpacity onPress={save} disabled={saving || !selectedPet} style={[styles.saveBtn, (!selectedPet || saving) && { opacity: 0.6 }]} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{saving ? "Booking…" : "Confirm Booking"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 8 },
  dropdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, marginBottom: 8 },
  dropdownMenu: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  saveBtn: { marginTop: 32, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
