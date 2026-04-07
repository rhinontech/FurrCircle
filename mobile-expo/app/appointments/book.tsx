import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Calendar as CalendarIcon, Clock, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { vetId, vetName } = useLocalSearchParams();
  const { colors } = useTheme();

  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const data = await api.get("/pets");
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
    if (!selectedPet || !date || !time || !reason) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/appointments", {
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

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 16 }}>With {vetName}</Text>
        
        {/* Select Pet */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>Select Pet</Text>
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

        {/* Date & Time */}
        <View style={{ gap: 16, marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Date</Text>
            <TextInput 
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
              style={{ backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 52, color: colors.textPrimary }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Time</Text>
            <TextInput 
              placeholder="HH:MM AM/PM"
              placeholderTextColor={colors.textMuted}
              value={time}
              onChangeText={setTime}
              style={{ backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 52, color: colors.textPrimary }}
            />
          </View>
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
          disabled={submitting}
          style={{ backgroundColor: colors.brand, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Request Appointment</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}
