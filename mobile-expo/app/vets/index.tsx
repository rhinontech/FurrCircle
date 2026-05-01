import React, { useEffect, useState, useMemo } from "react";
import { View, ScrollView, Pressable, TextInput, Image, ActivityIndicator } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { useRouter } from "expo-router";
import { ChevronLeft, Search, Stethoscope, MapPin, Star, ChevronRight, Check } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { placesVetsApi, type PlacesVetLite } from "@/services/users/placesVetsApi";

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
  const { colors } = useTheme();
  const { user } = useAuth();
  const { location } = useLocation();
  const [vets, setVets] = useState<PlacesVetLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);

  const cityLabel = String(location.city || user?.city || "").trim();
  useEffect(() => {
    if (!cityLabel) {
      setLoading(false);
      return;
    }

    setLoading(true);
    placesVetsApi.getCachedByCity(cityLabel)
      .then((data) => setVets(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cityLabel]);

  const sorted = useMemo(() => {
    const filtered = vets.filter(v =>
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
        return [...filtered].sort((a, b) => (a.city || "").localeCompare(b.city || ""));
      default:
        return filtered;
    }
  }, [vets, search, sortKey]);

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? "Sort";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Nearby Vets</Text>
        {/* Sort dropdown trigger */}
        <Pressable
          onPress={() => setSortOpen(v => !v)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: sortOpen ? colors.brand : colors.border }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: sortOpen ? colors.brand : colors.textPrimary }}>{activeSortLabel}</Text>
          <View style={{ transform: [{ rotate: sortOpen ? "270deg" : "90deg" }] }}>
            <ChevronRight size={14} color={sortOpen ? colors.brand : colors.textMuted} />
          </View>
        </Pressable>
      </View>

      {/* Sort dropdown */}
      {sortOpen && (
        <View style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden", zIndex: 10 }}>
          {SORT_OPTIONS.map((opt, i) => (
            <Pressable
              key={opt.key}
              onPress={() => { setSortKey(opt.key); setSortOpen(false); }}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: i < SORT_OPTIONS.length - 1 ? 1 : 0, borderBottomColor: colors.border, backgroundColor: sortKey === opt.key ? colors.brand + "10" : "transparent" }}
            >
              <Text style={{ fontSize: 14, fontWeight: sortKey === opt.key ? "700" : "500", color: sortKey === opt.key ? colors.brand : colors.textPrimary }}>{opt.label}</Text>
              {sortKey === opt.key && <Check size={16} color={colors.brand} />}
            </Pressable>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSubtle, borderRadius: 12, paddingHorizontal: 12, marginHorizontal: 20, marginBottom: 16 }}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          placeholder="Search clinics or city..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, height: 44, marginLeft: 8, fontSize: 14, color: colors.textPrimary }}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {sorted.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
              <Stethoscope size={40} color={colors.textMuted} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary }}>No vets found</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Try a different search or sort</Text>
            </View>
          ) : sorted.map((vet) => (
            <Pressable
              key={vet.id}
              onPress={() => router.push(`/vets/${vet.id}` as any)}
              style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 52, height: 52, borderRadius: 16, overflow: "hidden", backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {(vet as any).avatar_url ? (
                    <Image source={{ uri: (vet as any).avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <Stethoscope size={22} color="#0ea5e9" />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }} numberOfLines={1}>
                    {vet.clinic_name || vet.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted, flex: 1 }} numberOfLines={1}>{vet.address || vet.city || "Nearby"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={{ fontSize: 12, color: "#f59e0b", fontWeight: "700" }}>{Number(vet.rating || 4.5).toFixed(1)}</Text>
                    {vet.userRatingCount ? (
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>({vet.userRatingCount})</Text>
                    ) : null}
                  </View>
                  {!!(vet as any).specialty && (
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }} numberOfLines={1}>{(vet as any).specialty}</Text>
                  )}
                </View>
                <View style={{ backgroundColor: "#e0f2fe", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#bae6fd", flexShrink: 0 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#0369a1" }}>VET</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
