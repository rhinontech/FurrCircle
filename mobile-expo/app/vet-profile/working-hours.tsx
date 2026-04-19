import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const timeDate = (hour: number, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

const parseExistingDays = (value?: string) => {
  if (!value) return DAYS.slice(0, 5);
  const matched = DAYS.filter((day) => value.includes(day));
  return matched.length > 0 ? matched : DAYS.slice(0, 5);
};

const parseExistingTime = (value: string | undefined, index: 0 | 1, fallback: Date) => {
  const matches = value?.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi);
  const raw = matches?.[index];
  if (!raw) return fallback;

  const parsed = new Date(`2000-01-01 ${raw}`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

export default function VetWorkingHoursScreen() {
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState<string[]>(() => parseExistingDays(user?.working_hours));
  const [startTime, setStartTime] = useState(() => parseExistingTime(user?.working_hours, 0, timeDate(9)));
  const [endTime, setEndTime] = useState(() => parseExistingTime(user?.working_hours, 1, timeDate(18)));
  const [picker, setPicker] = useState<"start" | "end" | null>(null);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(
    () => `${selectedDays.join(", ")} • ${formatTime(startTime)} - ${formatTime(endTime)}`,
    [selectedDays, startTime, endTime]
  );

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : DAYS.filter((item) => [...current, day].includes(item))
    );
  };

  const onTimeChange = (_event: any, date?: Date) => {
    if (Platform.OS === "android") setPicker(null);
    if (!date || !picker) return;
    if (picker === "start") setStartTime(date);
    if (picker === "end") setEndTime(date);
  };

  const save = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Choose days", "Please select at least one working day.");
      return;
    }

    if (endTime <= startTime) {
      Alert.alert("Check time", "End time should be after start time.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ working_hours: preview });
      Alert.alert("Saved", "Your working hours are updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not update working hours.");
    } finally {
      setSaving(false);
    }
  };

  const pickerValue = picker === "end" ? endTime : startTime;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Working Hours</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16 }}>
          <Clock size={24} color={colors.brand} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: 12 }}>Clinic availability</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: 6 }}>Pet parents will see this on your public vet profile.</Text>
          <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: "700", marginTop: 14 }}>{preview}</Text>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 }}>Working days</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {DAYS.map((day) => {
            const selected = selectedDays.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={{ minWidth: 68, alignItems: "center", paddingVertical: 11, borderRadius: 12, backgroundColor: selected ? colors.brand : colors.bgCard, borderWidth: 1, borderColor: selected ? colors.brand : colors.border }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? "#fff" : colors.textPrimary }}>{day}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 }}>Time</Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 22 }}>
          <Pressable onPress={() => setPicker("start")} style={{ flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "700", marginBottom: 6 }}>Starts</Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: "700" }}>{formatTime(startTime)}</Text>
          </Pressable>
          <Pressable onPress={() => setPicker("end")} style={{ flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "700", marginBottom: 6 }}>Ends</Text>
            <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: "700" }}>{formatTime(endTime)}</Text>
          </Pressable>
        </View>

        <Pressable onPress={save} disabled={saving} style={{ height: 54, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", opacity: saving ? 0.65 : 1 }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Save Working Hours</Text>}
        </Pressable>
      </ScrollView>

      {Platform.OS === "ios" && (
        <Modal visible={!!picker} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Pressable onPress={() => setPicker(null)}>
                  <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: "700" }}>{picker === "start" ? "Start Time" : "End Time"}</Text>
                <Pressable onPress={() => setPicker(null)}>
                  <Text style={{ fontSize: 16, color: colors.brand, fontWeight: "700" }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                themeVariant={isDark ? "dark" : "light"}
                style={{ backgroundColor: colors.bgCard }}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && picker && (
        <DateTimePicker value={pickerValue} mode="time" display="default" onChange={onTimeChange} />
      )}
    </View>
  );
}
