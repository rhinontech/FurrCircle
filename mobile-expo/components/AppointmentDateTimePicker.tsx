import React, { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar as CalendarIcon, Clock } from "@/components/ui/IconCompat";
import { useTheme } from "@/contexts/ThemeContext";

import { formatDateLocal } from "../services/shared/dateUtils";

function formatDateValue(d: Date) {
  return formatDateLocal(d);
}

function formatTimeLabel(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatTimeValue(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function parseDateValue(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(`${value.split("T")[0]}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseTimeValue(value?: string) {
  const d = new Date();
  if (!value) return d;

  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFourHour) {
    d.setHours(Number(twentyFourHour[1]), Number(twentyFourHour[2]), 0, 0);
    return d;
  }

  const meridiem = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiem) {
    let hours = Number(meridiem[1]);
    const minutes = Number(meridiem[2]);
    const period = meridiem[3].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    d.setHours(hours, minutes, 0, 0);
  }

  return d;
}

function formatDateLabel(value?: string) {
  if (!value) return "Select date";
  const parsed = parseDateValue(value);
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeDisplay(value?: string) {
  if (!value) return "Select time";
  return formatTimeLabel(parseTimeValue(value));
}

type Props = {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
};

export default function AppointmentDateTimePicker({ date, time, onDateChange, onTimeChange }: Props) {
  const { colors, isDark } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(parseDateValue(date));
  const [pickerTime, setPickerTime] = useState<Date>(parseTimeValue(time));

  return (
    <>
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>Date</Text>
        <Pressable
          onPress={() => {
            setPickerDate(parseDateValue(date));
            setShowDatePicker(true);
          }}
          style={{ height: 50, backgroundColor: colors.bgSubtle, borderRadius: 8, borderWidth: 1, borderColor: date ? colors.brand : colors.border, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={{ fontSize: 14, color: date ? colors.textPrimary : colors.textMuted }}>
            {formatDateLabel(date)}
          </Text>
          <CalendarIcon size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>Time</Text>
        <Pressable
          onPress={() => {
            setPickerTime(parseTimeValue(time));
            setShowTimePicker(true);
          }}
          style={{ height: 50, backgroundColor: colors.bgSubtle, borderRadius: 8, borderWidth: 1, borderColor: time ? colors.brand : colors.border, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={{ fontSize: 14, color: time ? colors.textPrimary : colors.textMuted }}>
            {formatTimeDisplay(time)}
          </Text>
          <Clock size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {Platform.OS === "ios" && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>Select Date</Text>
                <Pressable onPress={() => { onDateChange(formatDateValue(pickerDate)); setShowDatePicker(false); }}>
                  <Text style={{ fontSize: 16, color: colors.brand, fontWeight: "700" }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(_e, d) => { if (d) setPickerDate(d); }}
                themeVariant={isDark ? "dark" : "light"}
                style={{ backgroundColor: colors.bgCard }}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_e, d) => {
            setShowDatePicker(false);
            if (d) onDateChange(formatDateValue(d));
          }}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={showTimePicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>Select Time</Text>
                <Pressable onPress={() => { onTimeChange(formatTimeValue(pickerTime)); setShowTimePicker(false); }}>
                  <Text style={{ fontSize: 16, color: colors.brand, fontWeight: "700" }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerTime}
                mode="time"
                display="spinner"
                onChange={(_e, d) => { if (d) setPickerTime(d); }}
                themeVariant={isDark ? "dark" : "light"}
                style={{ backgroundColor: colors.bgCard }}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={pickerTime}
          mode="time"
          display="default"
          onChange={(_e, d) => {
            setShowTimePicker(false);
            if (d) onTimeChange(formatTimeValue(d));
          }}
        />
      )}
    </>
  );
}
