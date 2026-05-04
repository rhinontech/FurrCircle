import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AppText as Text } from "@/components/ui/AppText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Clock3, MapPin, Phone, Star, Stethoscope, Bell, Globe } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userDiscoverApi } from "@/services/users/discoverApi";
import { placesVetsApi } from "@/services/users/placesVetsApi";
import { userRemindersApi } from "@/services/users/remindersApi";
import { userPetsApi } from "@/services/users/petsApi";
import { LinearGradient } from "expo-linear-gradient";
import { PawPrint } from "@/components/ui/IconCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Vet = {
  id: string;
  name?: string;
  clinic_name?: string;
  bio?: string;
  city?: string;
  address?: string;
  phone?: string;
  rating?: number | string;
  userRatingCount?: number;
  specialty?: string;
  avatar_url?: string;
  hours?: string;
  googleMapsUri?: string;
};

export default function VetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  useAuth();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ""));
  const isPlacesVet = Boolean(id) && !isUuid;

  const [vet, setVet] = useState<Vet | null>(null);
  const [loading, setLoading] = useState(true);

  // Reminder modal state
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderReason, setReminderReason] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Pet selection
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [petsLoading, setPetsLoading] = useState(false);

  const clinicName = vet?.clinic_name || vet?.name || "Vet Clinic";

  const handleCall = useCallback(async () => {
    if (!vet?.phone) {
      Alert.alert("Phone unavailable", "This clinic does not have a phone number listed.");
      return;
    }
    const phoneNumber = vet.phone.replace(/[^\d+]/g, "");
    try {
      for (const url of [`telprompt:${phoneNumber}`, `tel:${phoneNumber}`]) {
        if (await Linking.canOpenURL(url)) {
          await Linking.openURL(url);
          return;
        }
      }
      Alert.alert("Call Clinic", `Call ${clinicName} at ${vet.phone}.`);
    } catch {
      Alert.alert("Call Clinic", `Call ${clinicName} at ${vet.phone}.`);
    }
  }, [vet?.phone, clinicName]);

  const handleOpenMaps = useCallback(async () => {
    if (!vet?.googleMapsUri) return;
    try {
      await Linking.openURL(vet.googleMapsUri);
    } catch {
      Alert.alert("Could not open maps");
    }
  }, [vet?.googleMapsUri]);

  const openReminderModal = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setReminderTitle(`Vet visit at ${clinicName}`);
    setReminderDate(tomorrow.toISOString().split("T")[0]);
    setReminderTime("10:00");
    setTempDate(tomorrow);
    setReminderReason("");
    setReminderNote(vet?.address ? `📍 ${vet.address}` : "");
    setSelectedPetId(null);
    setReminderModal(true);

    setPetsLoading(true);
    try {
      const data = await userPetsApi.listPets();
      setPets(data || []);
    } catch {
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  const handleSaveReminder = async () => {

    if (!reminderTitle.trim()) {
      Alert.alert("Title required", "Please enter a title for your reminder.");
      return;
    }
    if (!reminderDate.trim()) {
      Alert.alert("Date required", "Please enter a date (YYYY-MM-DD).");
      return;
    }
    setSavingReminder(true);
    try {
      const dateObj = tempDate;
      if (isNaN(dateObj.getTime())) {
        Alert.alert("Invalid date", "Please select a valid date.");
        return;
      }
      if (dateObj < new Date()) {
        Alert.alert("Invalid Date", "You cannot set a reminder for a time that has already passed.");
        return;
      }
      const notes = [
        reminderReason.trim() ? `Reason: ${reminderReason.trim()}` : "",
        reminderNote.trim(),
      ].filter(Boolean).join("\n");


      await userRemindersApi.createReminder({
        title: reminderTitle.trim(),
        type: "appointment",
        date: dateObj.toISOString(),
        petId: selectedPetId || undefined,
        notes: notes || undefined,
        time: reminderTime
      });

      setReminderModal(false);
      Alert.alert("Reminder Set! 🐾", `We'll remind you: "${reminderTitle.trim()}" on ${reminderDate}.`);
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Could not save reminder. Try again.");
    } finally {
      setSavingReminder(false);
    }
  };

  const fetchVet = useCallback(async () => {
    try {
      if (isPlacesVet) {
        const details = await placesVetsApi.getPlaceDetails(String(id));
        const phone = details.nationalPhoneNumber || details.internationalPhoneNumber || null;
        const weekday = details.regularOpeningHours?.weekdayDescriptions;
        const hours = Array.isArray(weekday) ? weekday.join("\n") : null;
        setVet({
          id: details.placeId,
          name: details.name || undefined,
          clinic_name: details.name || undefined,
          address: details.address || undefined,
          phone: phone || undefined,
          rating: details.rating ?? undefined,
          userRatingCount: details.userRatingCount ?? undefined,
          hours: hours || undefined,
          googleMapsUri: details.googleMapsUri || undefined,
        });
        return;
      }
      const match = await userDiscoverApi.getVetById(String(id));
      setVet(match || null);
    } catch {
      setVet(null);
    } finally {
      setLoading(false);
    }
  }, [id, isPlacesVet]);

  useEffect(() => { fetchVet(); }, [fetchVet]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!vet) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Clinic not found</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>This clinic profile could not be loaded.</Text>
        </View>
      </View>
    );
  }

  const rating = vet.rating ? Number(vet.rating) : null;
  const hoursLines = vet.hours ? vet.hours.split("\n") : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        // Use contentContainerStyle for layout padding/spacing
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24 // Ensures bottom buttons aren't cut off
        }}
        showsVerticalScrollIndicator={false}

      >

        {/* Hero gradient header */}
        <LinearGradient
          colors={isDark ? ["#0f172a", "#1e3a8a"] : ["#dbeafe", "#eff6ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24 }}
        >
          {/* Back button + clinic name in one row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <ChevronLeft size={20} color={isDark ? "#fff" : colors.textPrimary} />
            </Pressable>

            {/* <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.9)", flexShrink: 0 }}>
              {vet.avatar_url ? (
                <Image source={{ uri: vet.avatar_url }} style={{ width: 56, height: 56, borderRadius: 18 }} resizeMode="cover" />
              ) : (
                <Stethoscope size={24} color={isDark ? "#60a5fa" : "#1d4ed8"} />
              )}
            </View> */}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: isDark ? "#fff" : "#1e3a8a", lineHeight: 24 }} numberOfLines={2}>
                {clinicName}
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? "#93c5fd" : "#3b82f6", marginTop: 2, fontWeight: "500" }}>
                {vet.specialty || "General Veterinary Care"}
              </Text>
              {rating && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Star size={13} color="#f59e0b" fill="#f59e0b" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#f59e0b" }}>{rating.toFixed(1)}</Text>
                  {vet.userRatingCount ? (
                    <Text style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>({vet.userRatingCount} reviews)</Text>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Info card */}
        <View style={{ marginHorizontal: 20, marginTop: -16, backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 16 }}>

          {/* Address */}
          {(vet.address || vet.city) && (
            <Pressable
              onPress={vet.googleMapsUri ? handleOpenMaps : undefined}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={16} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", marginBottom: 2 }}>Address</Text>
                <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }}>{vet.address || vet.city}</Text>
                {vet.googleMapsUri && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Globe size={12} color={colors.brand} />
                    <Text style={{ fontSize: 12, color: colors.brand, fontWeight: "600" }}>Open in Maps</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}

          {/* Divider */}
          {(vet.address || vet.city) && (vet.hours || vet.phone) && (
            <View style={{ height: 1, backgroundColor: colors.border }} />
          )}

          {/* Hours */}
          {vet.hours && (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Clock3 size={16} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Hours</Text>
                {hoursLines.map((line, i) => {
                  const [day, ...rest] = line.split(":");
                  const time = rest.join(":").trim();
                  const isClosed = line.toLowerCase().includes("closed");
                  const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }) === day.trim();
                  return (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
                      <Text style={{ fontSize: 13, color: isToday ? colors.brand : colors.textSecondary, fontWeight: isToday ? "700" : "400" }}>
                        {day}
                      </Text>
                      <Text style={{ fontSize: 13, color: isClosed ? colors.textMuted : (isToday ? colors.brand : colors.textSecondary), fontWeight: isToday ? "700" : "400" }}>
                        {time || (isClosed ? "Closed" : "")}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Divider */}
          {vet.hours && vet.phone && <View style={{ height: 1, backgroundColor: colors.border }} />}

          {/* Phone */}
          {vet.phone && (
            <Pressable onPress={handleCall} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Phone size={16} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", marginBottom: 2 }}>Phone</Text>
                <Text style={{ fontSize: 14, color: colors.brand, fontWeight: "600" }}>{vet.phone}</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Action buttons */}
        <View style={{ marginHorizontal: 20, marginTop: 16, gap: 12 }}>
          <Pressable
            onPress={openReminderModal}
            style={{ backgroundColor: colors.brand, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <Bell size={18} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Set Appointment Reminder</Text>
          </Pressable>

          {vet.phone && (
            <Pressable
              onPress={handleCall}
              style={{ backgroundColor: colors.bgCard, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: colors.border }}
            >
              <Phone size={18} color={colors.textPrimary} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>Call Clinic</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Set Reminder Bottom Sheet */}
      <Modal visible={reminderModal} transparent animationType="slide" onRequestClose={() => setReminderModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setReminderModal(false)} />

        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: colors.bgCard,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingBottom: Platform.OS === "ios" ? 40 : 28,
          maxHeight: "90%",
        }}>

          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          >
            <ScrollView
              contentContainerStyle={{ padding: 24, paddingTop: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={18} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>Set Appointment Reminder</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{clinicName}</Text>
                </View>
              </View>

              {/* Pet selection */}
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 8 }}>For which pet?</Text>
              {petsLoading ? (
                <ActivityIndicator size="small" color={colors.brand} style={{ alignSelf: "flex-start", marginBottom: 14 }} />
              ) : pets.length === 0 ? (
                <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <PawPrint size={16} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>No pets found — reminder will be saved without a pet.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                  {pets.map((pet) => {
                    const selected = selectedPetId === pet.id;
                    return (
                      <Pressable
                        key={pet.id}
                        onPress={() => setSelectedPetId(selected ? null : pet.id)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 8,
                          paddingHorizontal: 14, paddingVertical: 10,
                          borderRadius: 14, borderWidth: 1.5,
                          borderColor: selected ? colors.brand : colors.border,
                          backgroundColor: selected ? colors.brand + "12" : colors.bgSubtle,
                        }}
                      >
                        {pet.avatar_url ? (
                          <Image source={{ uri: pet.avatar_url }} style={{ width: 28, height: 28, borderRadius: 8 }} resizeMode="cover" />
                        ) : (
                          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
                            <PawPrint size={14} color={selected ? colors.brand : colors.textMuted} />
                          </View>
                        )}
                        <Text style={{ fontSize: 13, fontWeight: "600", color: selected ? colors.brand : colors.textPrimary }}>{pet.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Title */}
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Title</Text>
              <TextInput
                value={reminderTitle}
                onChangeText={setReminderTitle}
                placeholder="e.g. Vet visit at Sunrise Clinic"
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.bgSubtle, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, marginBottom: 14 }}
              />

              {/* Reason */}
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Reason for visit</Text>
              <TextInput
                value={reminderReason}
                onChangeText={setReminderReason}
                placeholder="e.g. Annual checkup, vaccination, injury..."
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.bgSubtle, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, marginBottom: 14 }}
              />

              {/* Date + Time */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Date</Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={{ backgroundColor: colors.bgSubtle, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, height: 48, justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textPrimary }}>
                      {tempDate.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    Platform.OS === "ios" ? (
                      <Modal transparent animationType="fade" visible={showDatePicker}>
                        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
                          <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, padding: 20, width: "90%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 20 }}>Select Date</Text>
                            <DateTimePicker
                              value={tempDate}
                              mode="date"
                              display="spinner"
                              textColor={colors.textPrimary}
                              minimumDate={new Date()}
                              onChange={(event, selectedDate) => {
                                if (selectedDate) {
                                  const newDate = new Date(tempDate);
                                  newDate.setFullYear(selectedDate.getFullYear());
                                  newDate.setMonth(selectedDate.getMonth());
                                  newDate.setDate(selectedDate.getDate());
                                  setTempDate(newDate);
                                  setReminderDate(newDate.toISOString().split("T")[0]);
                                }
                              }}
                            />
                            <Pressable
                              onPress={() => setShowDatePicker(false)}
                              style={{ marginTop: 20, backgroundColor: colors.brand, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 }}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700" }}>Done</Text>
                            </Pressable>
                          </View>
                        </View>
                      </Modal>
                    ) : (
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            const newDate = new Date(tempDate);
                            newDate.setFullYear(selectedDate.getFullYear());
                            newDate.setMonth(selectedDate.getMonth());
                            newDate.setDate(selectedDate.getDate());
                            setTempDate(newDate);
                            setReminderDate(newDate.toISOString().split("T")[0]);
                          }
                        }}
                      />
                    )
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Time</Text>
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    style={{ backgroundColor: colors.bgSubtle, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, height: 48, justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textPrimary }}>
                      {tempDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
                  </Pressable>
                  {showTimePicker && (
                    Platform.OS === "ios" ? (
                      <Modal transparent animationType="fade" visible={showTimePicker}>
                        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
                          <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, padding: 20, width: "90%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 20 }}>Select Time</Text>
                            <DateTimePicker
                              value={tempDate}
                              mode="time"
                              display="spinner"
                              textColor={colors.textPrimary}
                              minimumDate={new Date()}
                              onChange={(event, selectedDate) => {
                                if (selectedDate) {
                                  const newDate = new Date(tempDate);
                                  newDate.setHours(selectedDate.getHours());
                                  newDate.setMinutes(selectedDate.getMinutes());
                                  setTempDate(newDate);
                                  setReminderTime(newDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false }));
                                }
                              }}
                            />
                            <Pressable
                              onPress={() => setShowTimePicker(false)}
                              style={{ marginTop: 20, backgroundColor: colors.brand, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 }}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700" }}>Done</Text>
                            </Pressable>
                          </View>
                        </View>
                      </Modal>
                    ) : (
                      <DateTimePicker
                        value={tempDate}
                        mode="time"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowTimePicker(false);
                          if (selectedDate) {
                            const newDate = new Date(tempDate);
                            newDate.setHours(selectedDate.getHours());
                            newDate.setMinutes(selectedDate.getMinutes());
                            setTempDate(newDate);
                            setReminderTime(newDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false }));
                          }
                        }}
                      />
                    )
                  )}
                </View>
              </View>

              {/* Note */}
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Note (optional)</Text>
              <TextInput
                value={reminderNote}
                onChangeText={setReminderNote}
                placeholder="Any extra notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                style={{ backgroundColor: colors.bgSubtle, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, minHeight: 60, marginBottom: 20 }}
              />

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setReminderModal(false)}
                  style={{ flex: 1, backgroundColor: colors.bgSubtle, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveReminder}
                  disabled={savingReminder}
                  style={{ flex: 2, backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: savingReminder ? 0.7 : 1 }}
                >
                  {savingReminder
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Save Reminder</Text>
                  }
                </Pressable>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
