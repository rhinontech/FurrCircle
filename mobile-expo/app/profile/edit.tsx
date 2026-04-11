import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Building2, Camera, Check, Clock3, FileText, Mail, MapPin, Phone, Stethoscope, Trash2, User } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth, type User as AuthUser } from "../../contexts/AuthContext";

const FALLBACK_AVATAR = require("../../assets/pet-dog.jpg");
const MAX_IMAGE_LENGTH = 750_000;

type FormState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  bio: string;
  avatar: string;
  clinic_name: string;
  specialty: string;
  yearsExp: string;
  working_hours: string;
};

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
};

const createInitialForm = (user: AuthUser | null): FormState => ({
  name: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  city: user?.city || "",
  address: user?.address || "",
  bio: user?.bio || "",
  avatar: user?.avatar || "",
  clinic_name: user?.clinic_name || "",
  specialty: user?.specialty || "",
  yearsExp: user?.yearsExp ? String(user.yearsExp) : "",
  working_hours: user?.working_hours || "",
});

function InputField({ label, value, onChangeText, placeholder, multiline = false, keyboardType = "default" }: InputFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          backgroundColor: colors.bgInput,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 14 : 0,
          minHeight: multiline ? 120 : 52,
          fontSize: 15,
          color: colors.textPrimary,
        }}
      />
    </View>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
      <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: colors.brandLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Icon size={18} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{description}</Text>
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState<FormState>(() => createInitialForm(user));
  const [saving, setSaving] = useState(false);
  const isVet = user?.role === "veterinarian";

  useEffect(() => {
    setForm(createInitialForm(user));
  }, [user]);

  const avatarSource = useMemo(() => {
    if (!form.avatar) {
      return FALLBACK_AVATAR;
    }

    return { uri: form.avatar };
  }, [form.avatar]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo library access so we can set your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset?.base64) {
      Alert.alert("Upload failed", "We could not read that image. Please try another photo.");
      return;
    }

    const dataUri = `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
    if (dataUri.length > MAX_IMAGE_LENGTH) {
      Alert.alert("Image too large", "Please choose a smaller photo so the app can upload it reliably.");
      return;
    }

    setField("avatar", dataUri);
  };

  const removeAvatar = () => {
    Alert.alert("Remove photo", "Do you want to remove your current profile photo?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setField("avatar", "") },
    ]);
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert("Missing details", "Please add at least your name and email.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar,
        clinic_name: isVet ? form.clinic_name.trim() : undefined,
        specialty: isVet ? form.specialty.trim() : undefined,
        yearsExp: isVet ? form.yearsExp.trim() : undefined,
        working_hours: isVet ? form.working_hours.trim() : undefined,
      });

      Alert.alert("Profile updated", isVet ? "Your vet profile is now up to date." : "Your profile details have been saved.");
      router.back();
    } catch (error: any) {
      Alert.alert("Save failed", error?.message || "We could not update your profile right now.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 56, paddingTop: 16 }}>
        <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary }}>Edit Profile</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {isVet ? "Keep your clinic details and professional photo current." : "Update the details people see on your profile."}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.heroBg, borderRadius: 28, padding: 24, marginBottom: 24 }}>
            <View style={{ alignItems: "center" }}>
              <Image source={avatarSource} style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: "rgba(255,255,255,0.18)" }} resizeMode="cover" />
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 14 }}>{form.name || (isVet ? "Doctor profile" : "Your profile")}</Text>
              <Text style={{ fontSize: 13, color: colors.heroSub, textAlign: "center", marginTop: 4 }}>
                {isVet ? "A polished profile helps pet parents trust your practice faster." : "Add a photo and a few details so your profile feels complete."}
              </Text>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                <Pressable onPress={pickAvatar} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }}>
                  <Camera size={18} color="#fff" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Choose Photo</Text>
                </Pressable>
                {!!form.avatar && (
                  <Pressable onPress={removeAvatar} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 42, borderRadius: 14, backgroundColor: "rgba(15,23,42,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }}>
                    <Trash2 size={18} color="#fff" />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Remove</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
            <SectionTitle icon={User} title="Basic Details" description="These fields are shared across your account and profile." />
            <InputField label="Full Name" value={form.name} onChangeText={(value) => setField("name", value)} placeholder={isVet ? "Dr. Avery Morgan" : "Alex Johnson"} />
            <InputField label="Email" value={form.email} onChangeText={(value) => setField("email", value)} placeholder="you@example.com" keyboardType="email-address" />
            <InputField label="Phone" value={form.phone} onChangeText={(value) => setField("phone", value)} placeholder="+1 555 0100" keyboardType="phone-pad" />
            <InputField label="City" value={form.city} onChangeText={(value) => setField("city", value)} placeholder="San Francisco" />
            <InputField label="Address" value={form.address} onChangeText={(value) => setField("address", value)} placeholder={isVet ? "Clinic address" : "Home or preferred address"} />
          </View>

          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
            <SectionTitle icon={FileText} title="About You" description={isVet ? "Share the care philosophy and strengths of your practice." : "A short intro helps your profile feel more personal."} />
            <InputField label="Bio" value={form.bio} onChangeText={(value) => setField("bio", value)} placeholder={isVet ? "Tell pet parents what makes your care special..." : "Tell the community a bit about you and your pets..."} multiline />
          </View>

          {isVet && (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 24 }}>
              <SectionTitle icon={Stethoscope} title="Practice Details" description="These details power the vet-facing profile card across the app." />
              <InputField label="Clinic or Hospital Name" value={form.clinic_name} onChangeText={(value) => setField("clinic_name", value)} placeholder="PawsCare Animal Hospital" />
              <InputField label="Specialty" value={form.specialty} onChangeText={(value) => setField("specialty", value)} placeholder="Small Animal Medicine" />
              <InputField label="Experience" value={form.yearsExp} onChangeText={(value) => setField("yearsExp", value)} placeholder="8 years" />
              <InputField label="Working Hours" value={form.working_hours} onChangeText={(value) => setField("working_hours", value)} placeholder="Mon-Fri, 9:00 AM - 6:00 PM" />
            </View>
          )}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            {[{
              icon: Mail,
              label: "Contact details help people reach you quickly",
            }, {
              icon: MapPin,
              label: isVet ? "Location improves trust for nearby bookings" : "City makes your profile feel grounded and real",
            }, ...(isVet ? [{
              icon: Building2,
              label: "Clinic and specialty show up on the vet profile card",
            }, {
              icon: Clock3,
              label: "Working hours help set booking expectations",
            }] : [{
              icon: Phone,
              label: "A clear profile helps vets and shelters support you faster",
            }])].map((item) => (
              <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 }}>
                <item.icon size={16} color={colors.brand} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, flexShrink: 1 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{ height: 56, borderRadius: 18, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Check size={20} color="#fff" />}
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{saving ? "Saving..." : "Save Profile"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
