import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, Pressable, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { Heart, MessageCircle, Send, Bookmark, Plus, Bell, MapPin, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { posts, type Post } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { Avatar } from "../../src/components/Avatar";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { userApi } from "../../services/user/userApi";
import { reminderApi } from "../../services/reminder/reminderApi";
import { LocationPickerModal, LocationResult } from "../../src/components/LocationPickerModal";
import { ShareSheet } from "../../src/components/ShareSheet";
import { StoryViewer, type Story, type StoryGroup } from "../../src/components/StoryViewer";
import { StoryEditor } from "../../src/components/StoryEditor";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [composeOpen, setComposeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const tk = useTokens();

  // Story states
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryGroupIndex, setSelectedStoryGroupIndex] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [reminders, setReminders] = useState<any[]>([]);

  // Fetch reminders
  useState(() => {
    reminderApi.getMyReminders()
      .then(data => setReminders(data?.filter((r: any) => !r.isDone) || []))
      .catch(console.error);
  });

  const allStoryGroups: StoryGroup[] = [
    ...(myStories.length > 0
      ? [
          {
            userId: "me",
            username: "Your Story",
            avatar: require("../../src/assets/doodle-boy-dog.png"),
            stories: myStories,
          },
        ]
      : []),
    ...mockStoryGroups,
  ];

  const handlePressStory = (userId: string) => {
    const index = allStoryGroups.findIndex((g) => g.userId === userId);
    if (index !== -1) {
      setSelectedStoryGroupIndex(index);
      setStoryViewerVisible(true);
    }
  };

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow gallery access to share stories.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPickedImageUri(result.assets[0].uri);
      setEditorVisible(true);
    }
  };

  const handleSaveStory = (overlayText: string, caption: string) => {
    if (pickedImageUri) {
      const newStory: Story = {
        id: `my-${Date.now()}`,
        mediaUrl: pickedImageUri,
        mediaType: "image",
        caption: caption || undefined,
        overlayText: overlayText || undefined,
      };
      setMyStories((prev) => [...prev, newStory]);
      setEditorVisible(false);
      setPickedImageUri(null);
      Alert.alert("Success", "Story added to Your Story!");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tk.bg }]}>
      <FeedHeader />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}>
        <StoryRail
          myStories={myStories}
          onPressStory={handlePressStory}
          onAddStory={handleAddStory}
        />
        {reminders.length > 0 && (
          <View style={styles.remindersContainer}>
            <Text style={[styles.sectionTitle, { color: tk.text }]}>Upcoming Reminders</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {reminders.map((r, i) => (
                <View key={r.id} style={[styles.reminderCard, { backgroundColor: tk.card, borderColor: tk.border }]}>
                  <View style={[styles.reminderIconBg, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
                    <Bell size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.reminderTitle, { color: tk.text }]} numberOfLines={1}>{r.title}</Text>
                    <Text style={[styles.reminderTime, { color: tk.textMuted }]}>{r.date} at {r.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.feedList}>
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onShare={(id) => {
                setSharingPostId(id);
                setShareOpen(true);
              }}
            />
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity onPress={() => setComposeOpen(true)} style={styles.fab} activeOpacity={0.85}>
        <Plus size={28} color="#fff" strokeWidth={2.4} />
      </TouchableOpacity>

      <ComposeSheet open={composeOpen} onClose={() => setComposeOpen(false)} />
      <ShareSheet
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          setSharingPostId(null);
        }}
        postId={sharingPostId}
      />
      <StoryViewer
        visible={storyViewerVisible}
        onClose={() => setStoryViewerVisible(false)}
        storyGroups={allStoryGroups}
        initialGroupIndex={selectedStoryGroupIndex}
      />
      <StoryEditor
        visible={editorVisible}
        imageUri={pickedImageUri}
        onCancel={() => {
          setEditorVisible(false);
          setPickedImageUri(null);
        }}
        onSave={handleSaveStory}
      />
    </View>
  );
}

function FeedHeader() {
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const logoSource = dark
    ? require("../../src/assets/furrcircle_dark_logo.png")
    : require("../../src/assets/furrcircle_light_logo.png");

  const user = useAuthStore(s => s.user);
  const setSession = useAuthStore(s => s.setSession);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const handleLocationSelect = async (loc: LocationResult) => {
    setLocationModalVisible(false);
    try {
      const res = await userApi.updateProfile({ latitude: loc.latitude, longitude: loc.longitude, city: loc.city, address: loc.address });
      if (res.success && res.user && user) {
        await setSession({ ...user, ...res.user });
      }
    } catch (err) {
      console.error('Failed to update location', err);
      Alert.alert('Error', 'Failed to save location.');
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: tk.bg }]}>
      <View>
        <Image
          source={logoSource}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => setLocationModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: -4, marginLeft: 2 }}>
          <MapPin size={12} color={tk.textMuted} style={{ marginRight: 2 }} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: tk.textMuted }}>{user?.city || "Select Location"}</Text>
          <ChevronDown size={12} color={tk.textMuted} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={() => router.push("/chat")} style={[styles.iconBtn, { backgroundColor: tk.card }]}>
          <MessageCircle size={20} color={tk.text} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/notifications")} style={[styles.iconBtn, { backgroundColor: tk.card }]}>
          <Bell size={20} color={tk.text} strokeWidth={2} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>
      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleLocationSelect}
      />
    </View>
  );
}

const mockStoryGroups: StoryGroup[] = [
  {
    userId: "moona",
    username: "Moona",
    avatar: require("../../src/assets/doodle-boy-dog.png"),
    stories: [
      { id: "moona-1", mediaUrl: require("../../src/assets/doodle-boy-dog.png"), mediaType: "image", caption: "Sunbathing in the lawn ☀️" },
      { id: "moona-2", mediaUrl: require("../../src/assets/doodle-birthday.png"), mediaType: "image", caption: "Happy birthday to me! 🎂" },
    ]
  },
  {
    userId: "mochi",
    username: "Mochi",
    avatar: require("../../src/assets/doodle-cat.png"),
    stories: [
      { id: "mochi-1", mediaUrl: require("../../src/assets/doodle-cat.png"), mediaType: "image", caption: "Just took a long nap. Feeling cute!" }
    ]
  },
  {
    userId: "kobi",
    username: "Kobi",
    avatar: require("../../src/assets/doodle-birthday.png"),
    stories: [
      { id: "kobi-1", mediaUrl: require("../../src/assets/doodle-walk.png"), mediaType: "image", caption: "Evening walks are the best!" }
    ]
  },
  {
    userId: "biscuit",
    username: "Biscuit",
    avatar: require("../../src/assets/doodle-puppy.png"),
    stories: [
      { id: "biscuit-1", mediaUrl: require("../../src/assets/doodle-puppy.png"), mediaType: "image", caption: "Exploring the backyard 🐕" }
    ]
  },
  {
    userId: "rocky",
    username: "Rocky",
    avatar: require("../../src/assets/doodle-rescue.png"),
    stories: [
      { id: "rocky-1", mediaUrl: require("../../src/assets/doodle-rescue.png"), mediaType: "image", caption: "Found my forever home today! ❤️" }
    ]
  }
];

function StoryRail({
  myStories,
  onPressStory,
  onAddStory,
}: {
  myStories: Story[];
  onPressStory: (userId: string) => void;
  onAddStory: () => void;
}) {
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={styles.storyRail}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 14 }}>
      
      {/* Your Story Bubble */}
      <TouchableOpacity
        onPress={() => (myStories.length > 0 ? onPressStory("me") : onAddStory())}
        style={styles.storyItem}
        activeOpacity={0.8}
      >
        <View style={[styles.storyRing, myStories.length > 0 ? styles.storyRingGradient : (dark ? { backgroundColor: tk.border } : styles.storyRingGray)]}>
          <View style={[styles.storyInner, { backgroundColor: myStories.length > 0 ? "rgba(255,107,107,0.2)" : (dark ? "rgba(240,240,255,0.08)" : "rgba(26,26,46,0.05)"), borderColor: tk.bg }]}>
            {myStories.length > 0 ? (
              <Image source={require("../../src/assets/doodle-boy-dog.png")} style={styles.storyImg} resizeMode="contain" />
            ) : (
              <Plus size={20} color={tk.textMuted} />
            )}
          </View>
          {myStories.length > 0 && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onAddStory();
              }}
              style={[
                styles.miniAddBadge,
                {
                  backgroundColor: colors.coral,
                  borderColor: tk.bg,
                },
              ]}
            >
              <Plus size={10} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.storyLabel, { color: tk.text }]} numberOfLines={1}>Your Story</Text>
      </TouchableOpacity>

      {/* Others' stories */}
      {mockStoryGroups.map((group) => (
        <TouchableOpacity
          key={group.userId}
          onPress={() => onPressStory(group.userId)}
          style={styles.storyItem}
          activeOpacity={0.8}
        >
          <View style={[styles.storyRing, styles.storyRingGradient]}>
            <View style={[styles.storyInner, { backgroundColor: "rgba(255,107,107,0.2)", borderColor: tk.bg }]}>
              <Image source={group.avatar} style={styles.storyImg} resizeMode="contain" />
            </View>
          </View>
          <Text style={[styles.storyLabel, { color: tk.text }]} numberOfLines={1}>{group.username}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PostCard({ post, onShare }: { post: Post; onShare: (id: string) => void }) {
  const router = useRouter();
  const tk = useTokens();
  return (
    <View style={[styles.card, { backgroundColor: tk.card }]}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          onPress={() => router.push(`/p/${post.pet.toLowerCase()}`)}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
        >
          <Avatar source={post.avatar} name={post.pet} size={44} />
          <View style={styles.cardMeta}>
            <Text style={[styles.petName, { color: tk.text }]}>{post.pet}</Text>
            <Text style={[styles.petOwner, { color: tk.textMuted }]}>by {post.owner} · {post.time}</Text>
          </View>
        </TouchableOpacity>
        {post.type === "rescue" && <View style={[styles.typeBadge, { backgroundColor: colors.success }]}><Text style={styles.typeBadgeText}>RESCUE</Text></View>}
        {post.type === "milestone" && <View style={[styles.typeBadge, { backgroundColor: colors.pinky }]}><Text style={styles.typeBadgeText}>MILESTONE</Text></View>}
      </View>

      <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.9}
        style={[styles.imageWrapper, { backgroundColor: post.tintColor }]}>
        <Image source={post.image} style={styles.postImage} />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}><Heart size={24} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.likes}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><MessageCircle size={24} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.comments}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onShare(post.id)}><Send size={24} color={tk.text} /></TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: "auto" }}><Bookmark size={24} color={tk.text} /></TouchableOpacity>
      </View>

      <Text style={[styles.caption, { color: tk.text }]}>
        <Text style={styles.captionBold}>{post.pet} </Text>{post.caption}
      </Text>
      <Text style={styles.tags}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>
    </View>
  );
}

const composeOptions = [
  { label: "New Post", desc: "Share a photo of your pet", tintColor: "rgba(255,107,107,0.15)", to: "/compose" as const },
  { label: "New Reel", desc: "Quick video moment", tintColor: "rgba(37,99,235,0.1)", to: "/reels" as const },
  { label: "Ask the Community", desc: "Get help from pet parents", tintColor: "rgba(255,217,61,0.3)", to: "/ask" as const },
  { label: "Add Memory", desc: "Save to Moona's vault", tintColor: "rgba(255,111,207,0.15)", to: "/memory" as const },
];

function ComposeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const tk = useTokens();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: tk.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
          <Text style={[styles.sheetTitle, { color: tk.text }]}>Create</Text>
          {composeOptions.map((o) => (
            <TouchableOpacity key={o.label} onPress={() => { onClose(); router.push(o.to); }}
              style={[styles.sheetRow, { backgroundColor: tk.bg }]} activeOpacity={0.8}>
              <View style={[styles.sheetIcon, { backgroundColor: o.tintColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetRowTitle, { color: tk.text }]}>{o.label}</Text>
                <Text style={[styles.sheetRowDesc, { color: tk.textMuted }]}>{o.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, paddingTop:10 },
  logoImg: { width: 120, height: 50, alignSelf: "flex-start" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -4, marginLeft: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  storyRail: { flexGrow: 0 },
  storyItem: { alignItems: "center", width: 64, gap: 6 },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 3 },
  storyRingGray: { backgroundColor: "rgba(26,26,46,0.15)" },
  storyRingGradient: { backgroundColor: colors.coral },
  storyInner: { flex: 1, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#F7F8FA", overflow: "hidden" },
  storyImg: { width: "90%", height: "90%" },
  storyLabel: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: colors.foreground + "bb", textAlign: "center" },
  miniAddBadge: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  remindersContainer: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 16, marginBottom: 12 },
  reminderCard: { flexDirection: "row", alignItems: "center", width: 240, padding: 12, borderRadius: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  reminderIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  reminderTime: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  feedList: { gap: 20, paddingHorizontal: 16, marginTop: 12, width: "100%" },
  card: { borderRadius: 24, alignSelf: "stretch", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 0, gap: 10 },
  cardMeta: { flex: 1 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 14, lineHeight: 20 },
  petOwner: { fontSize: 11, fontFamily: "Inter_400Regular" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#fff" },
  imageWrapper: { width: "92%", alignSelf: "center", aspectRatio: 1, marginTop: 12, marginBottom: 4, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  postImage: { width: "80%", height: "80%" },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  caption: { paddingHorizontal: 16, paddingTop: 8, fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  captionBold: { fontFamily: "Poppins_700Bold" },
  tags: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, fontSize: 12, fontFamily: "Poppins_600SemiBold", color: colors.primary },
  fab: { position: "absolute", bottom: 16, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 16, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, paddingHorizontal: 4, marginBottom: 12 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 16, padding: 16, marginBottom: 8 },
  sheetIcon: { width: 48, height: 48, borderRadius: 16 },
  sheetRowTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  sheetRowDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
