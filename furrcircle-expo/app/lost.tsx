import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, Modal, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Keyboard, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Siren, Eye, Plus, Camera, Trash2, Edit2, X, AlertCircle } from "../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { lostPetApi } from "../services/lost/lostPetApi";
import { chatApi } from "../services/chat/chatApi";
import { userApi } from "../services/user/userApi";
import { petApi } from "../services/pet/petApi";
import { useAuthStore } from "../src/lib/auth-store";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocationStore } from "../src/lib/location-store";
import { useLanguage } from "../src/lib/language-context";

const lostDoodle = require("../src/assets/doodle-lost.png");
const tabs = ["Lost", "Spotted"] as const;
const { width: screenWidth } = Dimensions.get("window");
const carouselImageWidth = screenWidth - 40;

export default function LostScreen() {
  const { t } = useLanguage();
  const tk = useTokens();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const currentUserId = user?.id;
  const locationLat = useLocationStore((s) => s.latitude);
  const locationLng = useLocationStore((s) => s.longitude);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const [tab, setTab] = useState<(typeof tabs)[number]>("Lost");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const getTabLabel = (tabName: string) => {
    if (tabName === "Lost") return t("lostTab");
    if (tabName === "Spotted") return t("spottedTab");
    return tabName;
  };

  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [status, setStatus] = useState<"lost" | "spotted">("lost");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [myPets, setMyPets] = useState<any[]>([]);

  // Geolocation Map State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const mapRef = useRef<MapView | null>(null);

  const isWeb = Platform.OS === "web";

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedPost]);

  useEffect(() => {
    if (mapModalVisible) {
      setTempLat(latitude || locationLat || 37.78825);
      setTempLng(longitude || locationLng || -122.4324);
    }
  }, [mapModalVisible]);

  useEffect(() => {
    petApi.getMyPets()
      .then((res) => setMyPets(res || []))
      .catch((err) => console.log("Failed to load my pets", err));
  }, []);

  const handleSelectPet = (pet: any) => {
    setName(pet.name || "");
    if (pet.avatar_url) {
      setImages([pet.avatar_url]);
    }
    const locationStr = user?.address || user?.city || "";
    setAddress(locationStr);
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const coords = locationLat && locationLng ? { lat: locationLat, lng: locationLng } : undefined;
      const data = await lostPetApi.getLostPets(coords);
      setPosts(data || []);
    } catch (err) {
      console.error("Failed to load lost pets", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [locationLat, locationLng])
  );

  const openCreateModal = (initialStatus: "lost" | "spotted") => {
    setEditingPost(null);
    setStatus(initialStatus);
    setName("");
    setAddress("");
    setDescription("");
    setImages([]);
    setLatitude(null);
    setLongitude(null);
    setModalVisible(true);
  };

  const openEditModal = (post: any) => {
    setEditingPost(post);
    setStatus(post.status);
    setName(post.name || "");
    setAddress(post.address || "");
    setDescription(post.description || "");
    setLatitude(post.latitude ? parseFloat(post.latitude) : null);
    setLongitude(post.longitude ? parseFloat(post.longitude) : null);
    if (post.images && post.images.length > 0) {
      setImages(post.images);
    } else if (post.imageUrl) {
      setImages([post.imageUrl]);
    } else {
      setImages([]);
    }
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert(t("permissionRequiredTitle"), t("photoLibraryPermissionMsg"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 4 - images.length,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const pickedUris = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...pickedUris].slice(0, 4));
      }
    } catch (err) {
      console.error("pickImage error", err);
    }
  };

  const handlePinCurrentLocation = async () => {
    try {
      let { status: gpsStatus } = await Location.requestForegroundPermissionsAsync();
      if (gpsStatus !== 'granted') {
        Alert.alert(t("permissionDeniedTitle"), t("locationPermissionPinMsg"));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setTempLat(lat);
      setTempLng(lng);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 1000);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t("errorTitle"), t("couldNotFetchLocationMsg"));
    }
  };

  const handleConfirmLocation = async () => {
    if (tempLat && tempLng) {
      setLatitude(tempLat);
      setLongitude(tempLng);
      setMapModalVisible(false);

      // Trigger reverse geocoding to auto-fill address
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: tempLat, longitude: tempLng });
        if (geocode && geocode.length > 0) {
          const first = geocode[0];
          const parts = [
            first.name || first.streetNumber,
            first.street,
            first.district || first.subregion || first.city,
            first.city || first.region,
          ].filter(Boolean);
          const formatted = parts.join(", ");
          if (formatted) {
            setAddress(formatted);
          }
        }
      } catch (err) {
        console.warn("Reverse geocode failed", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert(t("photoRequiredTitle"), t("uploadAtLeastOnePhotoMsg"));
      return;
    }
    if (!address.trim()) {
      Alert.alert(t("addressRequiredTitle"), t("enterLocationAreaMsg"));
      return;
    }

    setSubmitting(true);
    try {
      const uploadedImages: string[] = [];
      for (const img of images) {
        if (img.startsWith("file:/") || img.startsWith("content:/")) {
          const uploadRes = await userApi.uploadImage(img, "reports");
          uploadedImages.push(uploadRes.url);
        } else {
          uploadedImages.push(img);
        }
      }

      const payload = {
        name: name.trim() || undefined,
        address: address.trim(),
        description: description.trim() || undefined,
        status,
        imageUrl: uploadedImages[0],
        images: uploadedImages,
        latitude: status === "spotted" ? latitude : null,
        longitude: status === "spotted" ? longitude : null,
      };

      if (editingPost) {
        await lostPetApi.updateLostPet(editingPost.id, payload);
        Alert.alert(t("success"), t("reportUpdatedSuccess"));
      } else {
        await lostPetApi.createLostPet(payload);
        Alert.alert(t("success"), t("reportPostedSuccess"));
      }

      setModalVisible(false);
      fetchPosts();
    } catch (err: any) {
      Alert.alert(t("errorTitle"), err?.response?.data?.message || err.message || t("failedToSubmitReport"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageAuthor = async () => {
    const recipientId = selectedPost?.userId;
    if (!recipientId) return;
    try {
      const conv = await chatApi.startChat(recipientId);
      setSelectedPost(null);
      router.push({ pathname: "/chat", params: { id: conv.id } });
    } catch (err: any) {
      Alert.alert(t("cantSendMessageTitle"), err?.response?.data?.message || err?.message || t("failedToStartChat"));
    }
  };

  const handleDelete = (postId: string) => {
    Alert.alert(
      t("deleteReportTitle"),
      t("deleteReportConfirmMsg"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("deleteAction"),
          style: "destructive",
          onPress: async () => {
            try {
              await lostPetApi.deleteLostPet(postId);
              Alert.alert(t("deletedTitle"), t("reportDeletedSuccess"));
              fetchPosts();
            } catch (err: any) {
              Alert.alert(t("errorTitle"), err?.response?.data?.message || err.message);
            }
          }
        }
      ]
    );
  };

  const filteredList = posts.filter(
    (p) => (tab === "Lost" ? p.status === "lost" : p.status === "spotted")
  );

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={t("lostFound")} />

        <ScrollView contentContainerStyle={{ paddingBottom: 110, paddingTop: 4 }}>
          {/* Alert banner */}
          <View style={styles.px5}>
            <View style={styles.alertBanner}>
              <Image source={lostDoodle} style={styles.alertDoodle} resizeMode="contain" />
              <View style={{ maxWidth: "65%" }}>
                <Siren size={20} color={colors.white} />
                <Text style={styles.alertTitle}>{t("alertMissingText")}</Text>
                <TouchableOpacity style={styles.alertBtn} onPress={() => openCreateModal("lost")} activeOpacity={0.85}>
                  <Text style={styles.alertBtnText}>{t("reportLostPetBtn")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tab pills */}
          <View style={styles.tabRow}>
            {tabs.map((tabItem) => (
              <TouchableOpacity
                key={tabItem}
                onPress={() => setTab(tabItem)}
                style={[styles.tabPill, tab === tabItem ? { backgroundColor: colors.foreground } : { backgroundColor: tk.card }]}
                activeOpacity={0.85}
              >
                {tabItem === "Lost"
                  ? <Siren size={13} color={tab === tabItem ? colors.white : tk.textMuted} />
                  : <Eye size={13} color={tab === tabItem ? colors.white : tk.textMuted} />}
                <Text style={[styles.tabText, tab === tabItem ? { color: colors.white } : { color: tk.textMuted }]}>{getTabLabel(tabItem)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pet cards */}
          <View style={styles.px5}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : filteredList.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: tk.card, borderColor: tk.border }]}>
                <AlertCircle size={32} color={tk.textMuted} />
                <Text style={[styles.emptyText, { color: tk.text }]}>{t("noReportsFound")}</Text>
                <Text style={[styles.emptySubText, { color: tk.textMuted }]}>{t("firstToPostReport")}</Text>
              </View>
            ) : (
              filteredList.map((p) => {
                const isOwner = p.userId === currentUserId;
                const authorName = p.author?.name || t("someoneFallback");

                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedPost(p)}
                    activeOpacity={0.9}
                    style={[
                      styles.card,
                      {
                        backgroundColor: tk.card,
                        borderLeftColor: p.status === "lost" ? colors.coral : colors.success,
                        borderLeftWidth: 5,
                        borderColor: tk.border,
                        borderWidth: 1,
                      }
                    ]}
                  >
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      {/* Pet Image */}
                      {p.imageUrl ? (
                        <Image source={{ uri: p.imageUrl }} style={styles.petImg} resizeMode="cover" />
                      ) : (
                        <View style={[styles.petImgPlaceholder, { backgroundColor: tk.inputBg }]} />
                      )}

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <View style={styles.badgeRow}>
                          <View style={[styles.statusBadge, { backgroundColor: p.status === "lost" ? colors.coral : colors.success }]}>
                            <Text style={styles.statusBadgeText}>{getTabLabel(p.status === "lost" ? "Lost" : "Spotted").toUpperCase()}</Text>
                          </View>

                          {/* Owner controls */}
                          {isOwner && (
                            <View style={styles.ownerControls}>
                              <TouchableOpacity
                                onPress={(e) => { (e as any).stopPropagation?.(); openEditModal(p); }}
                                style={styles.actionIcon}
                                activeOpacity={0.7}
                              >
                                <Edit2 size={13} color={tk.text} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={(e) => { (e as any).stopPropagation?.(); handleDelete(p.id); }}
                                style={styles.actionIcon}
                                activeOpacity={0.7}
                              >
                                <Trash2 size={13} color="#FF4D4D" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>

                        {p.name ? (
                          <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
                        ) : (
                          <Text style={[styles.petName, { color: tk.textMuted, fontStyle: 'italic' }]}>{t("unnamedPet")}</Text>
                        )}

                        <View style={styles.areaRow}>
                          <MapPin size={12} color={tk.textMuted} />
                          <Text style={[styles.areaText, { color: tk.textMuted }]} numberOfLines={1}>
                            {p.distanceLabel ? `${p.distanceLabel} • ` : ""}{p.address}
                          </Text>
                        </View>

                        {p.description ? (
                          <Text style={[styles.petDesc, { color: tk.textMuted }]} numberOfLines={2}>{p.description}</Text>
                        ) : null}

                        <View style={{ borderTopWidth: 1, borderTopColor: tk.border, marginTop: 8, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: tk.textMuted }}>
                            {t("postedByAuthor")} {authorName}
                          </Text>
                          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: tk.textMuted }}>
                            {new Date(p.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openCreateModal(tab === "Lost" ? "lost" : "spotted")}
          activeOpacity={0.85}
        >
          <Plus size={16} color={colors.white} strokeWidth={3} />
          <Text style={styles.fabText}>
            {tab === "Lost" ? t("iLostPetAction") : t("iSpottedPetAction")}
          </Text>
        </TouchableOpacity>

        {/* Detail Modal */}
        <Modal
          visible={!!selectedPost}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedPost(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: tk.card, maxHeight: '85%', paddingBottom: 0 + insets.bottom }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: tk.text }]}>{t("reportDetailsTitle")}</Text>
                <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeModalBtn}>
                  <X size={20} color={tk.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {(() => {
                  const postImages = selectedPost?.images && selectedPost.images.length > 0
                    ? selectedPost.images
                    : (selectedPost?.imageUrl ? [selectedPost.imageUrl] : []);

                  return postImages.length > 0 ? (
                    <View style={{ position: 'relative', marginBottom: 16 }}>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                          const idx = Math.round(e.nativeEvent.contentOffset.x / carouselImageWidth);
                          setCurrentImageIndex(idx);
                        }}
                        scrollEventThrottle={16}
                        style={[styles.detailPetImgScroll, { width: carouselImageWidth }]}
                      >
                        {postImages.map((imgUrl: string, idx: number) => (
                          <Image key={idx} source={{ uri: imgUrl }} style={[styles.detailPetImgItem, { width: carouselImageWidth }]} resizeMode="cover" />
                        ))}
                      </ScrollView>
                      {postImages.length > 1 && (
                        <View style={styles.carouselIndicatorContainer}>
                          {postImages.map((_: any, idx: number) => (
                            <View
                              key={idx}
                              style={[
                                styles.carouselIndicatorDot,
                                currentImageIndex === idx ? { backgroundColor: colors.primary } : { backgroundColor: 'rgba(255,255,255,0.5)' }
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.detailPetImgPlaceholder, { backgroundColor: tk.inputBg }]} />
                  );
                })()}

                <View style={[styles.detailStatusBadge, { backgroundColor: selectedPost?.status === "lost" ? colors.coral : colors.success }]}>
                  <Text style={styles.detailStatusText}>{getTabLabel(selectedPost?.status === "lost" ? "Lost" : "Spotted").toUpperCase()}</Text>
                </View>

                <Text style={[styles.detailPetName, { color: tk.text }]}>
                  {selectedPost?.name || t("unnamedPet")}
                </Text>

                <View style={[styles.detailLocationRow, { borderBottomColor: tk.border }]}>
                  <MapPin size={16} color={tk.textMuted} />
                  <Text style={[styles.detailLocationText, { color: tk.text }]}>
                    {selectedPost?.distanceLabel ? `${selectedPost.distanceLabel} • ` : ""}{selectedPost?.address}
                  </Text>
                </View>

                {selectedPost?.description ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.detailLabel, { color: tk.textMuted }]}>{t("descriptionLabel")}</Text>
                    <Text style={[styles.detailDescText, { color: tk.text }]}>{selectedPost.description}</Text>
                  </View>
                ) : null}

                {/* Geolocation Map inside Detail view */}
                {selectedPost?.latitude && selectedPost?.longitude ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.detailLabel, { color: tk.textMuted }]}>{t("pinnedLocationLabel")}</Text>
                    <View style={[styles.detailMapContainer, { borderColor: tk.border }]}>
                      {!isWeb ? (
                        <MapView
                          style={{ width: '100%', height: 160 }}
                          initialRegion={{
                            latitude: parseFloat(selectedPost.latitude),
                            longitude: parseFloat(selectedPost.longitude),
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          }}
                          scrollEnabled={true}
                          zoomEnabled={true}
                        >
                          <Marker
                            coordinate={{
                              latitude: parseFloat(selectedPost.latitude),
                              longitude: parseFloat(selectedPost.longitude),
                            }}
                            pinColor={colors.coral}
                          />
                        </MapView>
                      ) : (
                        <View style={{ height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: tk.inputBg }}>
                          <Text style={{ color: tk.textMuted }}>Coordinates: {selectedPost.latitude}, {selectedPost.longitude}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.openInMapsBtn}
                        onPress={() => {
                          const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                          const latLng = `${selectedPost.latitude},${selectedPost.longitude}`;
                          const label = selectedPost.name ? `${selectedPost.name}'s Last Known Location` : 'Spotted Pet Location';
                          const url = Platform.select({
                            ios: `${scheme}${label}@${latLng}`,
                            android: `${scheme}${latLng}(${label})`
                          });
                          if (url) {
                            import('react-native').then(({ Linking }) => Linking.openURL(url));
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.openInMapsText}>{t("getDirectionsBtn")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Owner info */}
                <View style={[styles.detailOwnerSection, { borderColor: tk.border, backgroundColor: tk.inputBg }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {selectedPost?.author?.avatar_url ? (
                      <Image source={{ uri: selectedPost.author.avatar_url }} style={styles.detailAvatar} />
                    ) : (
                      <View style={[styles.detailAvatar, { backgroundColor: colors.coral + "33", alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.coral }}>
                          {(selectedPost?.author?.name || "?")[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={[styles.detailOwnerName, { color: tk.text }]}>{selectedPost?.author?.name || t("someoneFallback")}</Text>
                      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: tk.textMuted }}>
                        @{selectedPost?.author?.username}
                      </Text>
                    </View>
                  </View>

                  {selectedPost?.userId !== currentUserId && (
                    <View style={styles.detailActionRow}>
                      <TouchableOpacity
                        style={[styles.detailActionBtn, { borderColor: colors.primary, borderWidth: 1 }]}
                        onPress={() => {
                          const authorUsername = selectedPost?.author?.username;
                          setSelectedPost(null);
                          if (authorUsername) {
                            router.push(`/u/${authorUsername}`);
                          }
                        }}
                      >
                        <Text style={[styles.detailActionBtnText, { color: colors.primary }]}>{t("viewProfileBtn")}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.detailActionBtn, { backgroundColor: colors.primary }]}
                        onPress={handleMessageAuthor}
                      >
                        <Text style={[styles.detailActionBtnText, { color: colors.white }]}>{t("sendMessageBtn")}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Create/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: tk.card, paddingBottom: keyboardVisible ? 0 : 0 + insets.bottom }]}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: tk.text }]}>
                    {editingPost ? t("editReportTitle") : (status === "lost" ? t("reportLostPetTitle") : t("reportSpottedPetTitle"))}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                    <X size={20} color={tk.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                  {/* Status Toggle */}
                  <Text style={[styles.label, { color: tk.textMuted }]}>{t("reportStatusLabel")}</Text>
                  <View style={styles.statusToggleRow}>
                    <TouchableOpacity
                      onPress={() => setStatus("lost")}
                      style={[styles.toggleOption, status === "lost" ? { backgroundColor: colors.coral } : { backgroundColor: tk.inputBg }]}
                    >
                      <Text style={[styles.toggleOptionText, status === "lost" && { color: colors.white }]}>{getTabLabel("Lost")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setStatus("spotted")}
                      style={[styles.toggleOption, status === "spotted" ? { backgroundColor: colors.success } : { backgroundColor: tk.inputBg }]}
                    >
                      <Text style={[styles.toggleOptionText, status === "spotted" && { color: colors.white }]}>{t("spottedFoundStatus")}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Select from My Pets */}
                  {!editingPost && status === "lost" && myPets.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.label, { color: tk.textMuted }]}>{t("selectFromMyPetsLabel")}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                        {myPets.map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => handleSelectPet(p)}
                            style={[
                              styles.petOptionCard,
                              { backgroundColor: tk.inputBg, borderColor: tk.border, borderWidth: 1 }
                            ]}
                            activeOpacity={0.8}
                          >
                            <Image source={p.avatar_url?.startsWith('http') ? { uri: p.avatar_url } : require("../src/assets/doodle-boy-dog.png")} style={styles.petOptionAvatar} />
                            <Text style={[styles.petOptionName, { color: tk.text }]} numberOfLines={1}>{p.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Multi-Photo Picker */}
                  <Text style={[styles.label, { color: tk.textMuted }]}>{t("photosRequiredLabel")}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
                    {images.map((uri, index) => (
                      <View key={index} style={styles.photoWrapper}>
                        <Image source={{ uri }} style={styles.pickedImage} resizeMode="cover" />
                        <TouchableOpacity
                          onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                          style={styles.deletePhotoBtn}
                          activeOpacity={0.8}
                        >
                          <X size={14} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {images.length < 4 && (
                      <TouchableOpacity onPress={pickImage} style={[styles.photoZoneSmall, { backgroundColor: tk.inputBg, borderColor: tk.border }]}>
                        <Camera size={20} color={tk.textMuted} />
                        <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: tk.textMuted, marginTop: 4 }}>{t("addPhotoLabel")}</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>

                  {/* Name */}
                  <Text style={[styles.label, { color: tk.textMuted }]}>{t("petNameOptionalLabel")}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Max"
                    placeholderTextColor={tk.textMuted}
                    style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, borderWidth: 1 }]}
                  />

                  {/* Location Pinning Option */}
                  {status === "spotted" && (
                    <>
                      <Text style={[styles.label, { color: tk.textMuted }]}>{t("pinGeolocationLabel")}</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => setMapModalVisible(true)}
                          style={[styles.mapBtn, { backgroundColor: tk.inputBg, borderColor: tk.border, borderWidth: 1 }]}
                          activeOpacity={0.8}
                        >
                          <MapPin size={16} color={colors.primary} />
                          <Text style={[styles.mapBtnText, { color: tk.text }]}>
                            {latitude && longitude ? t("changePinLocationBtn") : t("selectPinOnMapBtn")}
                          </Text>
                        </TouchableOpacity>
                        {latitude && longitude && (
                          <TouchableOpacity
                            onPress={() => { setLatitude(null); setLongitude(null); }}
                            style={styles.clearLocBtn}
                            activeOpacity={0.8}
                          >
                            <Trash2 size={16} color="#FF4D4D" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Mini Preview of Pinned Location */}
                      {latitude && longitude && (
                        <View style={[styles.miniMapContainer, { borderColor: tk.border, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }]}>
                          {!isWeb ? (
                            <MapView
                              style={{ width: '100%', height: 110 }}
                              initialRegion={{
                                latitude,
                                longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                              }}
                              scrollEnabled={false}
                              zoomEnabled={false}
                              pitchEnabled={false}
                              rotateEnabled={false}
                            >
                              <Marker coordinate={{ latitude, longitude }} pinColor={colors.coral} />
                            </MapView>
                          ) : (
                            <View style={{ height: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: tk.inputBg }}>
                              <Text style={{ color: tk.textMuted, fontSize: 12 }}>{t("mapPreviewLabel")} (Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)})</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  )}

                  {/* Address */}
                  <Text style={[styles.label, { color: tk.textMuted }]}>{t("locationAddressRequiredLabel")}</Text>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="e.g. Central Park, Sector 4"
                    placeholderTextColor={tk.textMuted}
                    style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, borderWidth: 1 }]}
                  />

                  {/* Description */}
                  <Text style={[styles.label, { color: tk.textMuted }]}>{t("descriptionNotesOptionalLabel")}</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="e.g. Wearing a red collar, friendly but timid."
                    placeholderTextColor={tk.textMuted}
                    multiline
                    style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' }]}
                  />

                  {/* Submit button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.submitBtnText}>{editingPost ? t("saveChangesBtn") : t("postReportBtn")}</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
          {/* Map Picker Modal */}
          <Modal
            visible={mapModalVisible}
            animationType="slide"
            onRequestClose={() => setMapModalVisible(false)}
          >
            <View style={{ flex: 1, backgroundColor: tk.bg }}>
              {/* Header */}
              <View style={[styles.mapHeader, { borderBottomColor: tk.border, borderBottomWidth: 1, paddingTop: 10 + insets.top, backgroundColor: tk.card }]}>
                <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.mapHeaderBtn}>
                  <X size={20} color={tk.text} />
                </TouchableOpacity>
                <Text style={[styles.mapHeaderTitle, { color: tk.text }]}>{t("pinLocationTitle")}</Text>
                <TouchableOpacity onPress={handleConfirmLocation} style={[styles.mapHeaderBtn, styles.mapConfirmBtn]}>
                  <Text style={{ color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 13 }}>{t("confirmBtn")}</Text>
                </TouchableOpacity>
              </View>

              {!isWeb ? (
                <View style={{ flex: 1, position: 'relative' }}>
                  <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: tempLat || locationLat || 37.78825,
                      longitude: tempLng || locationLng || -122.4324,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }}
                    onPress={(e) => {
                      const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
                      setTempLat(lat);
                      setTempLng(lng);
                      if (mapRef.current) {
                        mapRef.current.animateToRegion({
                          latitude: lat,
                          longitude: lng,
                          latitudeDelta: 0.015,
                          longitudeDelta: 0.015,
                        }, 500);
                      }
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: tempLat || locationLat || 37.78825,
                        longitude: tempLng || locationLng || -122.4324,
                      }}
                      pinColor={colors.coral}
                    />
                  </MapView>

                  {/* Current Location Button */}
                  <TouchableOpacity
                    style={[styles.currentLocationBtn, { backgroundColor: tk.card }]}
                    onPress={handlePinCurrentLocation}
                    activeOpacity={0.8}
                  >
                    <MapPin size={22} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <Text style={{ color: tk.text, textAlign: 'center', marginBottom: 20 }}>{t("mapWebNotSupported")}</Text>
                  <TouchableOpacity onPress={() => setMapModalVisible(false)} style={[styles.submitBtn, { width: 200 }]}>
                    <Text style={styles.submitBtnText}>{t("goBackBtn")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Modal>
        </Modal>


      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  alertBanner: { backgroundColor: colors.coral, borderRadius: 24, padding: 20, marginBottom: 4, overflow: "hidden", position: "relative" },
  alertDoodle: { position: "absolute", right: -14, bottom: -10, width: 110, height: 110 },
  alertTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white, lineHeight: 22, marginTop: 8, marginBottom: 12 },
  alertBtn: { alignSelf: "flex-start", backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  alertBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.coral },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  tabPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  tabText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  card: { borderRadius: 24, padding: 16, marginBottom: 12 },
  petImg: { width: 80, height: 80, borderRadius: 16 },
  petImgPlaceholder: { width: 80, height: 80, borderRadius: 16 },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.white },
  ownerControls: { flexDirection: "row", gap: 8 },
  actionIcon: { padding: 4 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 16, lineHeight: 22 },
  petDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  areaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  fab: { position: "absolute", bottom: 24, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 12 },
  fabText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  emptyState: { borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  emptyText: { fontFamily: "Poppins_700Bold", fontSize: 16, marginTop: 12 },
  emptySubText: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  closeModalBtn: { padding: 4 },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, marginBottom: 6, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 8 },
  statusToggleRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  toggleOption: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  toggleOptionText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.foreground + "88" },
  photoZone: { borderRadius: 20, borderStyle: "dashed", borderWidth: 1.5, minHeight: 140, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8 },
  previewImage: { width: "100%", height: 140 },
  submitBtn: { marginTop: 24, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: "center" },
  submitBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: colors.white },

  detailPetImg: { width: "100%", height: 340, borderRadius: 20, marginBottom: 16 },
  detailPetImgPlaceholder: { width: "100%", height: 340, borderRadius: 20, marginBottom: 16 },
  detailStatusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  detailStatusText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.white },
  detailPetName: { fontFamily: "Poppins_700Bold", fontSize: 24, lineHeight: 30, marginBottom: 8 },
  detailLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 16, borderBottomWidth: 1 },
  detailLocationText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  detailLabel: { fontFamily: "Poppins_700Bold", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
  detailDescText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  detailOwnerSection: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 24, gap: 16 },
  detailAvatar: { width: 44, height: 44, borderRadius: 22 },
  detailOwnerName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  detailActionRow: { flexDirection: 'row', gap: 12 },
  detailActionBtn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  detailActionBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  petOptionCard: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  petOptionAvatar: { width: 32, height: 32, borderRadius: 16 },
  petOptionName: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  // New Geolocation Map & Carousel styles
  photoWrapper: { position: 'relative', width: 90, height: 90, borderRadius: 16, overflow: 'hidden' },
  pickedImage: { width: '100%', height: '100%' },
  deletePhotoBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  photoZoneSmall: { width: 90, height: 90, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  mapBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  mapBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  clearLocBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FF4D4D20', alignItems: 'center', justifyContent: 'center' },
  miniMapContainer: { width: '100%', height: 110, borderWidth: 1 },

  mapModalContainer: { flex: 1 },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  mapHeaderBtn: { padding: 8 },
  mapConfirmBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 16 },
  mapHeaderTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  currentLocationBtn: { position: 'absolute', bottom: 30, right: 20, width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },

  detailPetImgScroll: { borderRadius: 20, height: 340 },
  detailPetImgItem: { height: 340, borderRadius: 20 },
  carouselIndicatorContainer: { position: 'absolute', bottom: 16, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  carouselIndicatorDot: { width: 8, height: 8, borderRadius: 4 },

  detailMapContainer: { width: '100%', height: 210, borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  openInMapsBtn: { height: 44, width: '100%', backgroundColor: colors.primary + "1A", alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#eaeaea' },
  openInMapsText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: colors.primary },
});
