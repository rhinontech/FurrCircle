import React, { useState, useMemo } from "react";
import {
  View,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText as Text } from "./AppText";
import { Search, X, Check } from "./IconCompat";
import { useTheme } from "../../contexts/ThemeContext";

export type Country = {
  name: string;
  dialCode: string;
  flag: string;
};

export const COUNTRIES: Country[] = [
  { name: "Afghanistan", dialCode: "+93", flag: "🇦🇫" },
  { name: "Albania", dialCode: "+355", flag: "🇦🇱" },
  { name: "Algeria", dialCode: "+213", flag: "🇩🇿" },
  { name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { name: "Austria", dialCode: "+43", flag: "🇦🇹" },
  { name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
  { name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { name: "Cambodia", dialCode: "+855", flag: "🇰🇭" },
  { name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { name: "China", dialCode: "+86", flag: "🇨🇳" },
  { name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { name: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
  { name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
  { name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { name: "Ethiopia", dialCode: "+251", flag: "🇪🇹" },
  { name: "Finland", dialCode: "+358", flag: "🇫🇮" },
  { name: "France", dialCode: "+33", flag: "🇫🇷" },
  { name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
  { name: "Greece", dialCode: "+30", flag: "🇬🇷" },
  { name: "Hong Kong", dialCode: "+852", flag: "🇭🇰" },
  { name: "Hungary", dialCode: "+36", flag: "🇭🇺" },
  { name: "India", dialCode: "+91", flag: "🇮🇳" },
  { name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { name: "Iran", dialCode: "+98", flag: "🇮🇷" },
  { name: "Iraq", dialCode: "+964", flag: "🇮🇶" },
  { name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
  { name: "Israel", dialCode: "+972", flag: "🇮🇱" },
  { name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { name: "Jordan", dialCode: "+962", flag: "🇯🇴" },
  { name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { name: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
  { name: "Libya", dialCode: "+218", flag: "🇱🇾" },
  { name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { name: "Morocco", dialCode: "+212", flag: "🇲🇦" },
  { name: "Myanmar", dialCode: "+95", flag: "🇲🇲" },
  { name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
  { name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { name: "Norway", dialCode: "+47", flag: "🇳🇴" },
  { name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { name: "Peru", dialCode: "+51", flag: "🇵🇪" },
  { name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { name: "Poland", dialCode: "+48", flag: "🇵🇱" },
  { name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { name: "Romania", dialCode: "+40", flag: "🇷🇴" },
  { name: "Russia", dialCode: "+7", flag: "🇷🇺" },
  { name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
  { name: "Sudan", dialCode: "+249", flag: "🇸🇩" },
  { name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { name: "Syria", dialCode: "+963", flag: "🇸🇾" },
  { name: "Taiwan", dialCode: "+886", flag: "🇹🇼" },
  { name: "Tanzania", dialCode: "+255", flag: "🇹🇿" },
  { name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { name: "Uganda", dialCode: "+256", flag: "🇺🇬" },
  { name: "Ukraine", dialCode: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { name: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
  { name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
  { name: "Yemen", dialCode: "+967", flag: "🇾🇪" },
  { name: "Zimbabwe", dialCode: "+263", flag: "🇿🇼" },
];

type Props = {
  selected: Country;
  onSelect: (country: Country) => void;
};

export default function CountryPicker({ selected, onSelect }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
    );
  }, [search]);

  const closeModal = () => {
    setVisible(false);
    setSearch("");
  };

  return (
    <>
      {/* Trigger button */}
      <Pressable
        onPress={() => setVisible(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          height: 54,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          backgroundColor: colors.bgSubtle,
        }}
      >
        <Text style={{ fontSize: 20, lineHeight: 26 }}>{selected.flag}</Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, lineHeight: 20 }}>
          {selected.dialCode}
        </Text>
        <Text style={{ fontSize: 10, color: colors.textMuted, lineHeight: 14 }}>▾</Text>
      </Pressable>

      {/* Modal */}
      <Modal visible={visible} animationType="slide" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>
              Select Country
            </Text>
            <Pressable onPress={closeModal} style={[styles.closeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <X size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchWrapper, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search country or dial code..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
                <X size={14} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Country list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: colors.border + "30", marginLeft: 60 }} />
            )}
            renderItem={({ item }) => {
              const isSelected = item.name === selected.name;
              return (
                <Pressable
                  onPress={() => { onSelect(item); closeModal(); }}
                  style={{ backgroundColor: isSelected ? colors.brand + "10" : "transparent" }}
                >
                  <View style={styles.row}>
                    {/* Flag */}
                    <View style={styles.flagContainer}>
                      <Text style={styles.flag}>{item.flag}</Text>
                    </View>
                    {/* Name */}
                    <View style={styles.nameContainer}>
                      <Text
                        style={{
                          fontSize: 15,
                          color: isSelected ? colors.brand : colors.textPrimary,
                          fontWeight: isSelected ? "700" : "400",
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {/* Dial code + checkmark */}
                    <View style={styles.rightContainer}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>
                        {item.dialCode}
                      </Text>
                      {isSelected && (
                        <View style={{ marginLeft: 8 }}>
                          <Check size={16} color={colors.brand} />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
  },
  searchInput: {
    flex: 1,
    height: 46,
    marginLeft: 10,
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  flagContainer: {
    width: 40,
    alignItems: "center",
  },
  flag: {
    fontSize: 24,
    lineHeight: 30,
  },
  nameContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 50,
    justifyContent: "flex-end",
  },
});
