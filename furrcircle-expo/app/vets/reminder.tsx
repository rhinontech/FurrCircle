import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { petApi } from "../../services/pet/petApi";
import { placesApi } from "../../services/places/placesApi";
import { reminderApi } from "../../services/reminder/reminderApi";
import { colors } from "../../src/lib/theme";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronDown, Calendar, Clock } from "lucide-react-native";

export default function SetReminderScreen() {
  const router = useRouter();
  const { id, vetId } = useLocalSearchParams<{ id?: string; vetId?: string }>();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [vetName, setVetName] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("appointment");
  const [notes, setNotes] = useState("");
  
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [loadingVet, setLoadingVet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  useEffect(() => {
    // Load pets
    petApi.getMyPets().then(data => {
      setPets(data || []);
      if (data && data.length > 0 && !id) setSelectedPet(data[0].id);
    }).catch(err => console.error(err));

    // Load vet info or edit existing reminder
    if (id) {
      setLoadingVet(true);
      reminderApi.getMyReminders().then(list => {
        const rem = list.find((item: any) => item.id === id);
        if (rem) {
          setTitle(rem.title);
          setType(rem.type);
          setNotes(rem.notes || "");
          setSelectedPet(rem.petId);

          if (rem.date) {
            const dParts = rem.date.split('-'); // [YYYY, MM, DD]
            const parsedDate = new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2]));
            setDate(parsedDate);
            
            if (rem.time) {
              const tParts = rem.time.split(':'); // [HH, MM]
              const parsedTime = new Date(
                parsedDate.getFullYear(),
                parsedDate.getMonth(),
                parsedDate.getDate(),
                Number(tParts[0]),
                Number(tParts[1])
              );
              setTime(parsedTime);
            }
          }
        }
        setLoadingVet(false);
      }).catch(err => {
        console.error(err);
        setLoadingVet(false);
      });
    } else if (vetId) {
      setLoadingVet(true);
      placesApi.getPlaceDetails(vetId).then(vet => {
        if (vet?.name) {
          setVetName(vet.name);
          setTitle(`Vet Appointment - ${vet.name}`);
        } else {
          setTitle("Vet Appointment");
        }
        setLoadingVet(false);
      }).catch(err => {
        console.error(err);
        setTitle("Vet Appointment");
        setLoadingVet(false);
      });
    } else {
      setTitle("Vet Appointment");
    }
  }, [id, vetId]);

  const save = async () => {
    if (!selectedPet) {
      Alert.alert("Error", "Please select a pet");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a reminder title");
      return;
    }

    // Combine date and time to validate it is in the future
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0
    );

    if (combinedDateTime <= new Date()) {
      Alert.alert("Invalid Date/Time", "You cannot set a reminder for a date and time that has already passed. Please select a future time.");
      return;
    }

    setSaving(true);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    try {
      const payload = {
        title: title.trim(),
        type,
        date: dateStr,
        time: timeStr,
        petId: selectedPet,
        notes: notes.trim() || undefined,
      };

      if (id) {
        await reminderApi.updateReminder(id, payload);
        Alert.alert("Success", "Reminder updated successfully!");
      } else {
        await reminderApi.createReminder(payload);
        Alert.alert("Success", "Reminder set successfully!");
      }
      
      router.back();
    } catch (err: any) {
      Alert.alert("Error saving reminder", err?.response?.data?.message || err.message);
      setSaving(false);
    }
  };

  const reminderTypes = [
    { label: "Vet Appointment", value: "appointment" },
    { label: "Vaccination", value: "vaccination" },
    { label: "Medication", value: "medication" },
    { label: "Grooming", value: "grooming" },
    { label: "Other", value: "other" }
  ];

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={id ? "Edit Reminder" : "Set Reminder"} />
        
        {loadingVet ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20 }}>
            
            {/* Select Pet */}
            <Text style={[styles.label, { color: tk.textMuted }]}>Select Pet</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowPetDropdown(!showPetDropdown);
                setShowTypeDropdown(false);
              }} 
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

            {/* Reminder Title */}
            <Text style={[styles.label, { color: tk.textMuted }]}>Reminder Title</Text>
            <TextInput 
              value={title} 
              onChangeText={setTitle} 
              placeholder="e.g. Vet checkup appointment" 
              placeholderTextColor={tk.textMuted} 
              style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} 
            />

            {/* Reminder Type */}
            <Text style={[styles.label, { color: tk.textMuted }]}>Reminder Type</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowPetDropdown(false);
              }} 
              style={[styles.dropdownHeader, { backgroundColor: tk.inputBg, borderColor: tk.border }]} 
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: tk.text }}>
                {reminderTypes.find(t => t.value === type)?.label || "Select Type"}
              </Text>
              <ChevronDown size={20} color={tk.textMuted} />
            </TouchableOpacity>

            {showTypeDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: tk.card, borderColor: tk.border }]}>
                {reminderTypes.map((t) => (
                  <TouchableOpacity 
                    key={t.value} 
                    style={[styles.dropdownItem, { borderBottomColor: tk.border }]} 
                    onPress={() => { setType(t.value); setShowTypeDropdown(false); }}
                  >
                    <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: type === t.value ? colors.primary : tk.text }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date */}
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
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.pickerInput, { backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border }]} activeOpacity={0.8}>
                  <Calendar size={18} color={tk.textMuted} style={{ marginRight: 10 }} />
                  <Text style={{ color: tk.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>{date.toLocaleDateString()}</Text>
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

            {/* Time */}
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
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.pickerInput, { backgroundColor: tk.inputBg, borderWidth: 1, borderColor: tk.border }]} activeOpacity={0.8}>
                  <Clock size={18} color={tk.textMuted} style={{ marginRight: 10 }} />
                  <Text style={{ color: tk.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Notes */}
            <Text style={[styles.label, { color: tk.textMuted }]}>Notes / Reason</Text>
            <TextInput 
              value={notes} 
              onChangeText={setNotes} 
              placeholder="Add details, prep instructions, etc." 
              placeholderTextColor={tk.textMuted} 
              style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border, minHeight: 80 }]} 
              multiline
            />

            {/* Save Button */}
            <TouchableOpacity 
              onPress={save} 
              disabled={saving || !selectedPet} 
              style={[styles.saveBtn, (!selectedPet || saving) && { opacity: 0.6 }]} 
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving Changes…" : (id ? "Save Changes" : "Set Reminder")}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 8 },
  pickerInput: { flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 },
  dropdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, marginBottom: 8 },
  dropdownMenu: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  saveBtn: { marginTop: 32, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
