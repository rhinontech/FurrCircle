import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, Modal, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Siren, Eye, Plus, Camera, Trash2, Edit2, X, AlertCircle } from "../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { lostPetApi } from "../services/lost/lostPetApi";
import { chatApi } from "../services/chat/chatApi";
import { userApi } from "../services/user/userApi";
import { useAuthStore } from "../src/lib/auth-store";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocationStore } from "../src/lib/location-store";

const lostDoodle = require("../src/assets/doodle-lost.png");
const tabs = ["Lost", "Spotted"] as const;

export default function LostScreen() {
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

  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [status, setStatus] = useState<"lost" | "spotted">("lost");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setImageUri(null);
    setModalVisible(true);
  };

  const openEditModal = (post: any) => {
    setEditingPost(post);
    setStatus(post.status);
    setName(post.name || "");
    setAddress(post.address || "");
    setDescription(post.description || "");
    setImageUri(post.imageUrl);
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert("Permission Required", "Please allow access to photo library to upload a pet image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error("pickImage error", err);
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert("Photo Required", "Please upload a photo of the pet.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Address Required", "Please enter the location or area.");
      return;
    }

    setSubmitting(true);
    try {
    
      let finalImageUrl = imageUri;
      if (imageUri.startsWith("file:/") || imageUri.startsWith("content:/")) {
        const uploadRes = await userApi.uploadImage(imageUri, "reports");
        finalImageUrl = uploadRes.url;
      }

      const payload = {
        name: name.trim() || undefined,
        address: address.trim(),
        description: description.trim() || undefined,
        status,
        imageUrl: finalImageUrl,
      };



      if (editingPost) {
        await lostPetApi.updateLostPet(editingPost.id, payload);
        Alert.alert("Success", "Report updated successfully!");
      } else {
        await lostPetApi.createLostPet(payload);
        Alert.alert("Success", "Report posted successfully!");
      }

      setModalVisible(false);
      fetchPosts();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to submit report.");
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
      Alert.alert("Can't send message", err?.response?.data?.message || err?.message || "Failed to start chat.");
    }
  };

  const handleDelete = (postId: string) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to permanently delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await lostPetApi.deleteLostPet(postId);
              Alert.alert("Deleted", "Report deleted successfully.");
              fetchPosts();
            } catch (err: any) {
              Alert.alert("Error", err?.response?.data?.message || err.message);
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
        <ScreenHeader title="Lost & Found" />

        <ScrollView contentContainerStyle={{ paddingBottom: 110, paddingTop: 4 }}>
          {/* Alert banner */}
          <View style={styles.px5}>
            <View style={styles.alertBanner}>
              <Image source={lostDoodle} style={styles.alertDoodle} resizeMode="contain" />
              <View style={{ maxWidth: "65%" }}>
                <Siren size={20} color={colors.white} />
                <Text style={styles.alertTitle}>{"Alert your local circle when a pet goes missing"}</Text>
                <TouchableOpacity style={styles.alertBtn} onPress={() => openCreateModal("lost")} activeOpacity={0.85}>
                  <Text style={styles.alertBtnText}>Report a lost pet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tab pills */}
          <View style={styles.tabRow}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabPill, tab === t ? { backgroundColor: colors.foreground } : { backgroundColor: tk.card }]}
                activeOpacity={0.85}
              >
                {t === "Lost"
                  ? <Siren size={13} color={tab === t ? colors.white : tk.textMuted} />
                  : <Eye size={13} color={tab === t ? colors.white : tk.textMuted} />}
                <Text style={[styles.tabText, tab === t ? { color: colors.white } : { color: tk.textMuted }]}>{t}</Text>
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
                <Text style={[styles.emptyText, { color: tk.text }]}>No reports found</Text>
                <Text style={[styles.emptySubText, { color: tk.textMuted }]}>Be the first to post a report.</Text>
              </View>
            ) : (
              filteredList.map((p) => {
                const isOwner = p.userId === currentUserId;
                const authorName = p.author?.name || "Someone";

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
                            <Text style={styles.statusBadgeText}>{p.status.toUpperCase()}</Text>
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
                          <Text style={[styles.petName, { color: tk.textMuted, fontStyle: 'italic' }]}>Unnamed Pet</Text>
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
                            Posted by {authorName}
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
            {tab === "Lost" ? "I lost a pet" : "I spotted a pet"}
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
                <Text style={[styles.modalTitle, { color: tk.text }]}>Report Details</Text>
                <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeModalBtn}>
                  <X size={20} color={tk.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {selectedPost?.imageUrl ? (
                  <Image source={{ uri: selectedPost.imageUrl }} style={styles.detailPetImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.detailPetImgPlaceholder, { backgroundColor: tk.inputBg }]} />
                )}

                <View style={[styles.detailStatusBadge, { backgroundColor: selectedPost?.status === "lost" ? colors.coral : colors.success }]}>
                  <Text style={styles.detailStatusText}>{(selectedPost?.status || "").toUpperCase()}</Text>
                </View>

                <Text style={[styles.detailPetName, { color: tk.text }]}>
                  {selectedPost?.name || "Unnamed Pet"}
                </Text>

                <View style={[styles.detailLocationRow, { borderBottomColor: tk.border }]}>
                  <MapPin size={16} color={tk.textMuted} />
                  <Text style={[styles.detailLocationText, { color: tk.text }]}>
                    {selectedPost?.distanceLabel ? `${selectedPost.distanceLabel} • ` : ""}{selectedPost?.address}
                  </Text>
                </View>

                {selectedPost?.description ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.detailLabel, { color: tk.textMuted }]}>Description</Text>
                    <Text style={[styles.detailDescText, { color: tk.text }]}>{selectedPost.description}</Text>
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
                      <Text style={[styles.detailOwnerName, { color: tk.text }]}>{selectedPost?.author?.name || "Someone"}</Text>
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
                        <Text style={[styles.detailActionBtnText, { color: colors.primary }]}>View Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.detailActionBtn, { backgroundColor: colors.primary }]}
                        onPress={handleMessageAuthor}
                      >
                        <Text style={[styles.detailActionBtnText, { color: colors.white }]}>Send Message</Text>
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
                  {editingPost ? "Edit Report" : `Report ${status === "lost" ? "Lost" : "Spotted"} Pet`}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                  <X size={20} color={tk.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                {/* Status Toggle */}
                <Text style={[styles.label, { color: tk.textMuted }]}>Report Status</Text>
                <View style={styles.statusToggleRow}>
                  <TouchableOpacity
                    onPress={() => setStatus("lost")}
                    style={[styles.toggleOption, status === "lost" ? { backgroundColor: colors.coral } : { backgroundColor: tk.inputBg }]}
                  >
                    <Text style={[styles.toggleOptionText, status === "lost" && { color: colors.white }]}>Lost</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setStatus("spotted")}
                    style={[styles.toggleOption, status === "spotted" ? { backgroundColor: colors.success } : { backgroundColor: tk.inputBg }]}
                  >
                    <Text style={[styles.toggleOptionText, status === "spotted" && { color: colors.white }]}>Spotted / Found</Text>
                  </TouchableOpacity>
                </View>

                {/* Photo Picker */}
                <Text style={[styles.label, { color: tk.textMuted }]}>Photo (Required)</Text>
                <TouchableOpacity onPress={pickImage} style={[styles.photoZone, { backgroundColor: tk.inputBg, borderColor: tk.border }]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  ) : (
                    <View style={{ alignItems: "center", gap: 6 }}>
                      <Camera size={28} color={tk.textMuted} />
                      <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: tk.textMuted }}>Upload Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Name */}
                <Text style={[styles.label, { color: tk.textMuted }]}>Pet Name (Optional)</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Max"
                  placeholderTextColor={tk.textMuted}
                  style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, borderWidth: 1 }]}
                />

                {/* Address */}
                <Text style={[styles.label, { color: tk.textMuted }]}>Location / Address (Required)</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="e.g. Central Park, Sector 4"
                  placeholderTextColor={tk.textMuted}
                  style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, borderWidth: 1 }]}
                />

                {/* Description */}
                <Text style={[styles.label, { color: tk.textMuted }]}>Description / Notes (Optional)</Text>
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
                    <Text style={styles.submitBtnText}>{editingPost ? "Save Changes" : "Post Report"}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
          </KeyboardAvoidingView>
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
});
