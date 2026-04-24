import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bell, Syringe, ClipboardList, Calendar, Check } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { userRemindersApi } from "../../services/users/remindersApi";
import { userPetsApi } from "../../services/users/petsApi";

const TYPES = [
  { key: "general", label: "General", icon: Bell },
  { key: "vaccine", label: "Vaccine", icon: Syringe },
  { key: "medication", label: "Medication", icon: ClipboardList },
  { key: "appointment", label: "Appointment", icon: Calendar },
];

const RECURRENCE = ["none", "daily", "weekly", "monthly"];

export default function EditReminderScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const [loading, setLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(true);
  const [pets, setPets] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("general");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  useEffect(() => {
    const loadPets = async () => {
      try {
        const data = await userPetsApi.listPets();
        setPets(data || []);
      } catch {
        // pets are optional for a reminder
      } finally {
        setPetsLoading(false);
      }
    };

    const loadReminder = async () => {
      if (!params.id) return;
      try {
        const reminders = await userRemindersApi.listReminders();
        const reminder = reminders.find((r: any) => String(r.id) === String(params.id));
        if (reminder) {
          setTitle(reminder.title || "");
          setNotes(reminder.notes || "");
          setType(reminder.type || "general");
          setDate(reminder.date ? String(reminder.date).slice(0, 10) : "");
          setTime(reminder.time || "");
          setRecurrence(reminder.recurrence || "none");
          setSelectedPetId(reminder.petId ? String(reminder.petId) : null);
        }
      } catch {
        // ignore
      }
    };

    loadPets();
    if (isEditing) loadReminder();
  }, [params.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for this reminder.");
      return;
    }

    setLoading(true);
    const payload: Record<string, unknown> = {
      title: title.trim(),
      type,
      recurrence,
      ...(notes.trim() && { notes: notes.trim() }),
      ...(date && { date }),
      ...(time && { time }),
      ...(selectedPetId && { petId: selectedPetId }),
    };

    try {
      if (isEditing && params.id) {
        await userRemindersApi.updateReminder(params.id, payload);
      } else {
        await userRemindersApi.createReminder(payload);
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save reminder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>
          {isEditing ? "Edit Reminder" : "New Reminder"}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brand, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Check size={15} color="#fff" />}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{isEditing ? "Update" : "Save"}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 110 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}>

          {/* Title */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Rabies vaccine due"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: colors.textPrimary }}
            />
          </View>

          {/* Type */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TYPES.map(({ key, label, icon: Icon }) => (
                <Pressable
                  key={key}
                  onPress={() => setType(key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: type === key ? colors.brand : colors.border, backgroundColor: type === key ? colors.brand + '15' : colors.bgCard }}
                >
                  <Icon size={14} color={type === key ? colors.brand : colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: type === key ? '700' : '500', color: type === key ? colors.brand : colors.textPrimary }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Due Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: colors.textPrimary }}
            />
          </View>

          {/* Time */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Time</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM (optional)"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: colors.textPrimary }}
            />
          </View>

          {/* Recurrence */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Repeat</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {RECURRENCE.map(r => (
                <Pressable
                  key={r}
                  onPress={() => setRecurrence(r)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: recurrence === r ? colors.brand : colors.border, backgroundColor: recurrence === r ? colors.brand + '15' : colors.bgCard }}
                >
                  <Text style={{ fontSize: 13, fontWeight: recurrence === r ? '700' : '500', color: recurrence === r ? colors.brand : colors.textPrimary, textTransform: 'capitalize' }}>{r === 'none' ? 'No repeat' : r}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Pet selection */}
          {!petsLoading && pets.length > 0 && (
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>For Pet</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pressable
                  onPress={() => setSelectedPetId(null)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: !selectedPetId ? colors.brand : colors.border, backgroundColor: !selectedPetId ? colors.brand + '15' : colors.bgCard }}
                >
                  <Text style={{ fontSize: 13, fontWeight: !selectedPetId ? '700' : '500', color: !selectedPetId ? colors.brand : colors.textPrimary }}>General</Text>
                </Pressable>
                {pets.map((pet: any) => (
                  <Pressable
                    key={pet.id}
                    onPress={() => setSelectedPetId(String(pet.id))}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: selectedPetId === String(pet.id) ? colors.brand : colors.border, backgroundColor: selectedPetId === String(pet.id) ? colors.brand + '15' : colors.bgCard }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: selectedPetId === String(pet.id) ? '700' : '500', color: selectedPetId === String(pet.id) ? colors.brand : colors.textPrimary }}>{pet.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
