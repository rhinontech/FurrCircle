import React, { useEffect, useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, StyleSheet, Linking } from "react-native";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Search, Stethoscope, MapPin, Star, ChevronRight, Check, Phone } from "../../src/components/ui/icons";
import { useTokens } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { placesApi } from "../../services/places/placesApi";
import { colors } from "../../src/lib/theme";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useLocationStore } from "../../src/lib/location-store";

type SortKey = "default" | "alpha_asc" | "alpha_desc" | "rating" | "distance";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "alpha_asc", label: "A → Z" },
  { key: "alpha_desc", label: "Z → A" },
  { key: "rating", label: "Top Rated" },
  { key: "distance", label: "Nearest First" },
];

export default function AllVetsScreen() {
  const router = useRouter();
  const tk = useTokens();
  const user = useAuthStore(s => s.user);
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const locationCity = useLocationStore(s => s.city);
  const locationLat = useLocationStore(s => s.latitude);
  const locationLng = useLocationStore(s => s.longitude);
  const cityLabel = String(locationCity || "").trim();
  
  useEffect(() => {
    if (!cityLabel) {
      setLoading(false);
      return;
    }

    setLoading(true);
    placesApi.getVetsByCity(cityLabel, locationLat, locationLng)
      .then((data) => setVets(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cityLabel, locationLat, locationLng]);

  const sorted = useMemo(() => {
    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    const withDistance = vets.map(v => {
      let distance = null;
      let distanceLabel = null;
      if (locationLat != null && locationLng != null && v.latitude != null && v.longitude != null) {
        distance = getDistance(locationLat, locationLng, Number(v.latitude), Number(v.longitude));
        distanceLabel = `${distance.toFixed(1)} km away`;
      }
      return { ...v, distance, distanceLabel };
    });

    const filtered = withDistance.filter(v =>
      (v.clinic_name || v.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.address || "").toLowerCase().includes(search.toLowerCase())
    );
    switch (sortKey) {
      case "alpha_asc":
        return [...filtered].sort((a, b) => (a.clinic_name || a.name || "").localeCompare(b.clinic_name || b.name || ""));
      case "alpha_desc":
        return [...filtered].sort((a, b) => (b.clinic_name || b.name || "").localeCompare(a.clinic_name || a.name || ""));
      case "rating":
        return [...filtered].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      case "distance":
        return [...filtered].sort((a, b) => {
          if (a.distance == null && b.distance == null) return 0;
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });
      default:
        return filtered;
    }
  }, [vets, search, sortKey, locationLat, locationLng]);

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? "Sort";

  return (
    <PageContainer>
    <View style={{ flex: 1, backgroundColor: tk.bg }}>
      <ScreenHeader title="Nearby Vets" />

      {/* Sort dropdown trigger */}
      <View style={{ paddingHorizontal: 20, marginVertical: 12, alignItems: 'flex-end' }}>
        <TouchableOpacity
            onPress={() => setSortOpen(v => !v)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: tk.card, borderWidth: 1, borderColor: sortOpen ? colors.primary : tk.border }}
        >
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: sortOpen ? colors.primary : tk.text }}>{activeSortLabel}</Text>
            <View style={{ transform: [{ rotate: sortOpen ? "270deg" : "90deg" }] }}>
            <ChevronRight size={14} color={sortOpen ? colors.primary : tk.textMuted} />
            </View>
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {sortOpen && (
        <View style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: tk.card, borderRadius: 16, borderWidth: 1, borderColor: tk.border, overflow: "hidden", zIndex: 10 }}>
          {SORT_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => { setSortKey(opt.key); setSortOpen(false); }}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: i < SORT_OPTIONS.length - 1 ? 1 : 0, borderBottomColor: tk.border, backgroundColor: sortKey === opt.key ? colors.primary + "10" : "transparent" }}
            >
              <Text style={{ fontSize: 14, fontFamily: sortKey === opt.key ? "Inter_700Bold" : "Inter_500Medium", color: sortKey === opt.key ? colors.primary : tk.text }}>{opt.label}</Text>
              {sortKey === opt.key && <Check size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: tk.card, borderRadius: 12, paddingHorizontal: 12, marginHorizontal: 20, marginBottom: 16 }}>
        <Search size={16} color={tk.textMuted} />
        <TextInput
          placeholder="Search clinics or city..."
          placeholderTextColor={tk.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, height: 44, marginLeft: 8, fontSize: 14, fontFamily: "Inter_400Regular", color: tk.text }}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
          {!cityLabel ? (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
              <MapPin size={40} color={tk.textMuted} />
              <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: tk.text }}>Location not set</Text>
              <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: tk.textMuted, textAlign: "center", marginBottom: 12 }}>
                Please set your home city to see nearby vets.
              </Text>
              <TouchableOpacity onPress={() => router.push("/settings")} style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
                <Text style={{ color: colors.white, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Add Location</Text>
              </TouchableOpacity>
            </View>
          ) : sorted.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
              <Stethoscope size={40} color={tk.textMuted} />
              <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: tk.text }}>No vets found</Text>
              <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: tk.textMuted }}>Try a different search or sort</Text>
            </View>
          ) : sorted.map((vet) => (
            <TouchableOpacity
              key={vet.id}
              onPress={() => router.push(`/vets/${vet.id}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: tk.card, borderRadius: 24, padding: 12 }}
            >
              <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "rgba(37,99,235,0.1)", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                <Image source={require("../../src/assets/doodle-vet.png")} style={{ width: "80%", height: "80%" }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 15, color: tk.text }} numberOfLines={1}>
                  {vet.clinic_name || vet.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Stethoscope size={12} color={tk.textMuted} />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: tk.textMuted, flex: 1 }} numberOfLines={1}>
                    {vet.address ? vet.address.split(',')[0] : "General"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Star size={12} color={colors.sunshine} fill={colors.sunshine} />
                  <Text style={{ fontSize: 12, color: tk.textMuted, fontFamily: "Inter_400Regular", marginRight: 6 }}>{vet.rating || "N/A"}</Text>
                  <MapPin size={12} color={tk.textMuted} />
                  <Text style={{ fontSize: 12, color: tk.textMuted, fontFamily: "Inter_400Regular" }}>{vet.distanceLabel || vet.city || cityLabel}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); if (vet.phone) Linking.openURL(`tel:${vet.phone}`); }}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Phone size={16} color={colors.white} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
    </PageContainer>
  );
}
