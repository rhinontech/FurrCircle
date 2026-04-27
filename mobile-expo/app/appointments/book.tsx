import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Modal, Platform, KeyboardAvoidingView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Calendar as CalendarIcon, Clock, PawPrint, Plus } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userAppointmentsApi } from "@/services/users/appointmentsApi";
import { userPetsApi } from "@/services/users/petsApi";

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatTimeValue(d: Date) {
  // Backend expects HH:MM 24h
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const firstParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default function BookAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vetId?: string | string[]; vetName?: string | string[] }>();
  const vetId = firstParam(params.vetId);
  const vetName = firstParam(params.vetName) || "Vet Clinic";
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState<Date>(new Date());

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const data = await userPetsApi.listPets();
        setPets(data);
        if (data.length > 0) setSelectedPet(data[0].id);
      } catch (error) {
        console.error("Error fetching pets", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, []);

  const handleBook = async () => {
    if (!vetId) {
      Alert.alert("Vet missing", "Please open this screen from a vet profile.");
      return;
    }

    if (!selectedPet || !date || !time || !reason) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await userAppointmentsApi.bookAppointment({
        vetId,
        petId: selectedPet,
        date,
        time,
        reason,
      });
      Alert.alert("Success", "Appointment request sent!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: 40 }}>Book Appointment</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0} style={{ flex: 1, backgroundColor: colors.bg }}>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 16 }}>With {vetName}</Text>

        {/* Select Pet */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>Select Pet</Text>
        {pets.length === 0 ? (
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 24, alignItems: "center", gap: 10 }}>
            <PawPrint size={28} color={colors.textMuted} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>Add a pet first</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 }}>
              Appointments are linked to a pet so the vet knows who the visit is for.
            </Text>
            <Pressable
              onPress={() => router.push("/pets/add")}
              style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brand, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 }}
            >
              <Plus size={15} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Add Pet</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }} contentContainerStyle={{ gap: 12 }}>
            {pets.map((pet) => (
              <Pressable
                key={pet.id}
                onPress={() => setSelectedPet(pet.id)}
                style={{ padding: 12, borderRadius: 16, borderWidth: 2, borderColor: selectedPet === pet.id ? colors.brand : colors.border, backgroundColor: colors.bgCard, width: 100, alignItems: 'center' }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: colors.brand }}>{pet.name[0]}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: selectedPet === pet.id ? colors.brand : colors.textPrimary }} numberOfLines={1}>{pet.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Date */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Date</Text>
          <Pressable
            onPress={() => {
              setPickerDate(date ? new Date(date) : new Date());
              setShowDatePicker(true);
            }}
            style={{ backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: date ? colors.brand : colors.border, paddingHorizontal: 16, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 16, color: date ? colors.textPrimary : colors.textMuted }}>
              {date ? new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date'}
            </Text>
            <CalendarIcon size={18} color={colors.textMuted} />
          </Pressable>

          {Platform.OS === 'ios' && (
            <Modal visible={showDatePicker} transparent animationType="slide">
              <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                    </Pressable>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Select Date</Text>
                    <Pressable onPress={() => { setDate(formatDate(pickerDate)); setShowDatePicker(false); }}>
                      <Text style={{ fontSize: 16, color: colors.brand, fontWeight: '700' }}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={(_e, d) => { if (d) setPickerDate(d); }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={{ backgroundColor: colors.bgCard }}
                  />
                </View>
              </View>
            </Modal>
          )}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_e, d) => { setShowDatePicker(false); if (d) setDate(formatDate(d)); }}
            />
          )}
        </View>

        {/* Time */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Time</Text>
          <Pressable
            onPress={() => {
              if (time) {
                const [h, m] = time.split(':');
                const d = new Date(); d.setHours(Number(h), Number(m), 0, 0);
                setPickerTime(d);
              }
              setShowTimePicker(true);
            }}
            style={{ backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: time ? colors.brand : colors.border, paddingHorizontal: 16, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 16, color: time ? colors.textPrimary : colors.textMuted }}>
              {time ? formatTime((() => { const d = new Date(); const [h,m] = time.split(':'); d.setHours(Number(h),Number(m)); return d; })()) : 'Select time'}
            </Text>
            <Clock size={18} color={colors.textMuted} />
          </Pressable>

          {Platform.OS === 'ios' && (
            <Modal visible={showTimePicker} transparent animationType="slide">
              <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Pressable onPress={() => setShowTimePicker(false)}>
                      <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                    </Pressable>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Select Time</Text>
                    <Pressable onPress={() => { setTime(formatTimeValue(pickerTime)); setShowTimePicker(false); }}>
                      <Text style={{ fontSize: 16, color: colors.brand, fontWeight: '700' }}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={pickerTime}
                    mode="time"
                    display="spinner"
                    onChange={(_e, d) => { if (d) setPickerTime(d); }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={{ backgroundColor: colors.bgCard }}
                  />
                </View>
              </View>
            </Modal>
          )}
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={pickerTime}
              mode="time"
              display="default"
              onChange={(_e, d) => { setShowTimePicker(false); if (d) setTime(formatTimeValue(d)); }}
            />
          )}
        </View>

        {/* Reason */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Reason for Visit</Text>
          <TextInput
            placeholder="Describe the reason for your visit..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            style={{ backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, minHeight: 100, textAlignVertical: 'top', color: colors.textPrimary }}
          />
        </View>

        <Pressable
          onPress={handleBook}
          disabled={submitting || pets.length === 0 || !vetId}
          style={{ backgroundColor: colors.brand, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', opacity: submitting || pets.length === 0 || !vetId ? 0.55 : 1 }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Request Appointment</Text>}
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
