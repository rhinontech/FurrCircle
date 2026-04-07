import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Camera, Check, Trash2 } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

const speciesOptions = ["Dog", "Cat", "Rabbit", "Bird", "Fish", "Other"];
const genderOptions = ["Male", "Female", "Unknown"];

export default function AddPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  const { colors } = useTheme();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState(""); // We maintain this for UI, but backend likes birth_date
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("Unknown");
  const [birthDate, setBirthDate] = useState("");
  const [microchipId, setMicrochipId] = useState("");

  useEffect(() => {
    if (isEditing) {
      fetchPetData();
    }
  }, [id]);

  const fetchPetData = async () => {
    try {
      const data = await api.get(`/pets/${id}`);
      setName(data.name || "");
      setSpecies(data.species || "");
      setBreed(data.breed || "");
      setAge(data.age || "");
      setWeight(data.weight || "");
      setGender(data.gender || "Unknown");
      setBirthDate(data.birth_date || "");
      setMicrochipId(data.microchip_id || "");
    } catch (error) {
      console.error("Error fetching pet", error);
      Alert.alert("Error", "Could not load pet data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !species) {
      Alert.alert("Error", "Please fill in at least name and species.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        species,
        breed,
        age,
        weight,
        gender,
        birth_date: birthDate || null,
        microchip_id: microchipId,
      };

      if (isEditing) {
        await api.put(`/pets/${id}`, payload);
        Alert.alert("Success", `${name}'s info has been updated! ✨`);
      } else {
        await api.post('/pets', payload);
        Alert.alert("Success", `${name} has been added! 🎉`);
      }
      router.back();
    } catch (error: any) {
      console.error("Error saving pet", error);
      Alert.alert("Error", error.message || "Failed to save pet.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Remove Pet",
      `Are you sure you want to remove ${name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/pets/${id}`);
              router.replace("/(tabs)/pets");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete pet.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{isEditing ? "Edit Pet" : "Add New Pet"}</Text>
          <View style={{ flex: 1 }} />
          {isEditing && (
            <Pressable onPress={handleDelete} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={20} color="#e11d48" />
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Pressable style={{ width: 112, height: 112, borderRadius: 28, backgroundColor: colors.bgSubtle, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={28} color={colors.textMuted} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 4 }}>Add Photo</Text>
            </Pressable>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Pet Name *</Text>
            <TextInput
              placeholder="e.g. Buddy"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={{ backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, color: colors.textPrimary }}
              maxLength={50}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Species *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {speciesOptions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSpecies(s)}
                  style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, backgroundColor: species === s ? colors.brand : colors.bgCard, borderColor: species === s ? colors.brand : colors.border }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: species === s ? '#fff' : colors.textSecondary }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Gender</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {genderOptions.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, backgroundColor: gender === g ? colors.brand : colors.bgCard, borderColor: gender === g ? colors.brand : colors.border }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: gender === g ? '#fff' : colors.textSecondary }}>{g}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Breed</Text>
            <TextInput
              placeholder="e.g. Golden Retriever"
              placeholderTextColor={colors.textMuted}
              value={breed}
              onChangeText={setBreed}
              style={{ backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, color: colors.textPrimary }}
              maxLength={50}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Age (Label)</Text>
              <TextInput
                placeholder="e.g. 3 yrs"
                placeholderTextColor={colors.textMuted}
                value={age}
                onChangeText={setAge}
                style={{ backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, color: colors.textPrimary }}
                maxLength={20}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Weight</Text>
              <TextInput
                placeholder="e.g. 28 kg"
                placeholderTextColor={colors.textMuted}
                value={weight}
                onChangeText={setWeight}
                style={{ backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, color: colors.textPrimary }}
                maxLength={20}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Birth Date (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="e.g. 2021-05-20"
              placeholderTextColor={colors.textMuted}
              value={birthDate}
              onChangeText={setBirthDate}
              style={{ backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, color: colors.textPrimary }}
              maxLength={10}
            />
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Microchip ID</Text>
            <TextInput
              placeholder="e.g. 985112345678"
              placeholderTextColor={colors.textMuted}
              value={microchipId}
              onChangeText={setMicrochipId}
              style={{ backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, color: colors.textPrimary }}
              maxLength={50}
            />
          </View>

          <Pressable 
            onPress={handleSubmit} 
            disabled={saving}
            style={{ width: '100%', height: 56, backgroundColor: colors.brand, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Check size={20} color="#fff" />
            )}
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 }}>
              {isEditing ? (saving ? "Saving..." : "Save Changes") : (saving ? "Adding..." : "Add Pet")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
