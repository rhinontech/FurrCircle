import React, { useState, useEffect, useCallback } from "react";
import { View, Modal, Pressable, Alert, Platform, Image, FlatList, ActivityIndicator } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Camera, X, ChevronDown } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { pickMedia, uploadImage } from "@/services/uploadApi";
import { userCommunityApi } from "@/services/users/communityApi";
import StoryEditor from "./StoryEditor";
import StoryCamera from "./StoryCamera";
import * as MediaLibrary from "expo-media-library";
import type { ImagePickerAsset } from "expo-image-picker";

const PAGE_SIZE = 30;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Memoized individual image component for maximum performance
const GalleryImage = React.memo(({ asset, onPress }: { asset: MediaLibrary.Asset; onPress: (a: MediaLibrary.Asset) => void }) => {
  const [displayUri, setDisplayUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadInfo = async () => {
      try {
        // Only fetch detailed info for the thumbnail
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        if (isMounted) setDisplayUri(info.localUri || info.uri);
      } catch (e) {
        if (isMounted) setDisplayUri(asset.uri);
      }
    };
    loadInfo();
    return () => { isMounted = false; };
  }, [asset.id]);

  return (
    <Pressable onPress={() => onPress(asset)} style={styles.gridItem}>
      <Image 
        source={displayUri ? { uri: displayUri } : undefined} 
        style={styles.imageTile} 
      />
    </Pressable>
  );
});

export default function StoryCreateSheet({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ImagePickerAsset | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  
  // Gallery Pagination State
  const [galleryAssets, setGalleryAssets] = useState<MediaLibrary.Asset[]>([]);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const resetState = () => {
    setSelectedAsset(null);
    setEditorVisible(false);
    setCameraVisible(false);
    setPickerVisible(false);
    setPublishing(false);
    onSuccess();
  };

  // Permission and initial load
  useEffect(() => {
    const init = async () => {
      if (visible) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          setPickerVisible(true);
          loadInitialGallery();
        } else {
          Alert.alert("Permission Required", "Please allow gallery access.", [{ text: "OK", onPress: onClose }]);
        }
      } else {
        setPickerVisible(false);
        setGalleryAssets([]);
        setEndCursor(undefined);
        setHasNextPage(true);
      }
    };
    init();
  }, [visible]);

  const loadInitialGallery = async () => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.photo],
      });
      
      setGalleryAssets(result.assets);
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);
    } catch (e) {
      console.error("Failed to load initial gallery", e);
    }
  };

  const loadMoreAssets = async () => {
    if (!hasNextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: endCursor,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.photo],
      });
      
      // Filter out duplicates to prevent "Duplicate Key" errors
      setGalleryAssets(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const uniqueNew = result.assets.filter(a => !existingIds.has(a.id));
        return [...prev, ...uniqueNew];
      });
      
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);
    } catch (e) {
      console.error("Failed to load more assets", e);
    } finally {
      setLoadingMore(false);
    }
  };



  const handleSource = (source: "camera" | "library") => {
    if (source === "camera") {
      setPickerVisible(false);
      setTimeout(() => setCameraVisible(true), 300);
    }
  };

  const handleSelectAsset = async (asset: MediaLibrary.Asset) => {
    try {
      setPicking(true);
      // Fetch expensive info ONLY when selected
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      setPickerVisible(false);
      setSelectedAsset({
        uri: info.localUri || info.uri,
        width: info.width,
        height: info.height,
        type: "image",
      } as ImagePickerAsset);
      setTimeout(() => setEditorVisible(true), 300);
    } catch (error) {
      Alert.alert("Error", "Could not load photo.");
    } finally {
      setPicking(false);
    }
  };

  const handleEditorPublish = async (uri: string, caption?: string) => {
    if (!selectedAsset) return;
    setPublishing(true);
    try {
      const url = await uploadImage({ ...selectedAsset, uri }, "stories");
      if (url) {
        await userCommunityApi.createStory({ mediaUrl: url, mediaType: "image", caption: caption || "" });
        onClose();
        resetState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const renderItem = ({ item, index }: { item: MediaLibrary.Asset | string; index: number }) => {
    if (item === "camera") {
      return (
        <Pressable onPress={() => handleSource("camera")} style={styles.gridItem}>
          <View style={styles.cameraTile}>
            <Camera size={40} color="#fff" />
          </View>
        </Pressable>
      );
    }
    
    const asset = item as MediaLibrary.Asset;
    return <GalleryImage asset={asset} onPress={handleSelectAsset} />;
  };

  return (
    <>
      <Modal visible={pickerVisible} animationType="slide" transparent={false} statusBarTranslucent>
        <View style={styles.pickerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={28} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Add to story</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Static Recents Label */}
          <View style={styles.recentsBar}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.recentsText}>Recents</Text>
              
            </View>
            {/* <Pressable style={styles.selectBtn}>
              <Text style={styles.selectBtnText}>Select</Text>
            </Pressable> */}
          </View>

          {/* Optimized Photo Grid */}
          <FlatList
            data={["camera", ...galleryAssets]}
            renderItem={renderItem}
            keyExtractor={(item) => (typeof item === "string" ? item : item.id)}
            numColumns={3}
            onEndReached={loadMoreAssets}
            onEndReachedThreshold={0.7}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
            ListFooterComponent={loadingMore ? <ActivityIndicator color="#fff" style={{ margin: 20 }} /> : null}
            contentContainerStyle={{ padding: 1 }}
          />
        </View>
      </Modal>

      <StoryEditor visible={editorVisible} asset={selectedAsset} onCancel={() => { setEditorVisible(false); onClose(); }} onPublish={handleEditorPublish} />
      <StoryCamera visible={cameraVisible} onClose={() => { setCameraVisible(false); onClose(); }} onCapture={(asset) => { setCameraVisible(false); setSelectedAsset(asset); setTimeout(() => setEditorVisible(true), 400); }} />
    </>
  );
}

const styles = {
  pickerContainer: { flex: 1, backgroundColor: "#000", paddingTop: Platform.OS === "ios" ? 50 : 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, height: 60 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  recentsBar: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recentsText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  selectBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  selectBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  gridItem: { width: "33.33%", aspectRatio: 1, padding: 1 },
  cameraTile: { flex: 1, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" },
  imageTile: { flex: 1, backgroundColor: "#121212" },
} as any;
