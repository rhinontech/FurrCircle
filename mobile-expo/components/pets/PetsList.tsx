import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, PawPrint } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { userPetsApi } from "@/services/users/petsApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 20;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 0.72;

type GridItem = { id: string | number; isAddButton?: boolean; [key: string]: any };

interface PetsListProps {
  ListHeaderComponent?: React.ReactElement | null;
  contentContainerStyle?: object;
}

export default function PetsList({ ListHeaderComponent, contentContainerStyle }: PetsListProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPets = async () => {
    try {
      const data = await userPetsApi.listPets();
      setPets(data);
    } catch (error) {
      console.error("Error fetching pets", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const gridData: GridItem[] = [...pets, { id: "__add__", isAddButton: true }];

  const renderItem = ({ item, index }: { item: GridItem; index: number }) => {
    const marginLeft = index % 2 === 1 ? GAP : 0;

    if (item.isAddButton) {
      return (
        <Pressable
          onPress={() => router.push("/pets/add")}
          style={{
            width: CARD_WIDTH,
            marginLeft,
            marginBottom: GAP,
            borderRadius: 20,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            minHeight: IMAGE_HEIGHT + 52,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.bgSubtle,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <Plus size={24} color={colors.brand} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted }}>Add Pet</Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => router.push(`/pets/${item.id}`)}
        style={{
          width: CARD_WIDTH,
          marginLeft,
          marginBottom: GAP,
          borderRadius: 20,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={{ width: CARD_WIDTH, height: IMAGE_HEIGHT }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: CARD_WIDTH,
              height: IMAGE_HEIGHT,
              backgroundColor: colors.bgSubtle,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PawPrint size={40} color={colors.textMuted} />
          </View>
        )}

        <View style={{ paddingHorizontal: 10, paddingVertical: 10 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, textAlign: "center" }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.breed ? (
            <Text
              style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 2 }}
              numberOfLines={1}
            >
              {item.breed}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={gridData}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      numColumns={2}
      contentContainerStyle={{
        paddingHorizontal: H_PADDING,
        paddingTop: 16,
        paddingBottom: 40,
        ...contentContainerStyle,
      }}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
      }
    />
  );
}
