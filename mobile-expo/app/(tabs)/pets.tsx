import React from "react";
import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { useTheme } from "../../contexts/ThemeContext";
import PetsList from "../../components/pets/PetsList";

export default function PetsScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PetsList 
        ListHeaderComponent={
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 }}>
            My Pets
          </Text>
        }
      />
    </View>
  );
}
