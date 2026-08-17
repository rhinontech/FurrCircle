import { useEffect, useMemo, useState } from "react";
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  useWindowDimensions, ActivityIndicator,
} from "react-native";
import { GestureHandlerRootView, GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { colors } from "../lib/theme";

interface ImageCropperProps {
  visible: boolean;
  imageUri: string | null;
  imageWidth: number;
  imageHeight: number;
  /** Crop frame aspect ratio (width / height). Defaults to 16:9. */
  aspect?: number;
  onCancel: () => void;
  onCropped: (uri: string) => void;
}

const MAX_SCALE = 4;

/**
 * Full-screen cropper with a fixed-aspect frame. The user drags to reposition
 * and pinches to zoom; "Use photo" crops exactly what is framed via
 * expo-image-manipulator. Works identically on iOS and Android (unlike the
 * native picker, whose `aspect` option is Android-only).
 */
export function ImageCropper({
  visible, imageUri, imageWidth, imageHeight,
  aspect = 16 / 9, onCancel, onCropped,
}: ImageCropperProps) {
  const { width: screenW } = useWindowDimensions();
  const [processing, setProcessing] = useState(false);

  const PAD = 16;
  const FRAME_W = screenW - PAD * 2;
  const FRAME_H = FRAME_W / aspect;

  // Base "cover" size at scale 1 so the image always fully covers the frame.
  const { baseW, baseH } = useMemo(() => {
    if (!imageWidth || !imageHeight) return { baseW: FRAME_W, baseH: FRAME_H };
    const imgAspect = imageWidth / imageHeight;
    if (imgAspect > aspect) return { baseW: FRAME_H * imgAspect, baseH: FRAME_H };
    return { baseW: FRAME_W, baseH: FRAME_W / imgAspect };
  }, [imageWidth, imageHeight, FRAME_W, FRAME_H, aspect]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Reset transforms each time a new image is opened.
  useEffect(() => {
    if (visible) {
      scale.value = 1; savedScale.value = 1;
      tx.value = 0; savedTx.value = 0;
      ty.value = 0; savedTy.value = 0;
    }
  }, [visible, imageUri]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const maxX = Math.max(0, (baseW * scale.value - FRAME_W) / 2);
      const maxY = Math.max(0, (baseH * scale.value - FRAME_H) / 2);
      tx.value = Math.min(Math.max(savedTx.value + e.translationX, -maxX), maxX);
      ty.value = Math.min(Math.max(savedTy.value + e.translationY, -maxY), maxY);
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.min(Math.max(savedScale.value * e.scale, 1), MAX_SCALE);
      scale.value = next;
      const maxX = Math.max(0, (baseW * next - FRAME_W) / 2);
      const maxY = Math.max(0, (baseH * next - FRAME_H) / 2);
      tx.value = Math.min(Math.max(tx.value, -maxX), maxX);
      ty.value = Math.min(Math.max(ty.value, -maxY), maxY);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const handleConfirm = async () => {
    if (!imageUri) return;
    setProcessing(true);
    try {
      const s = scale.value;
      const W = baseW * s;
      const factor = imageWidth / W; // original px per on-screen px
      const fx = (W - FRAME_W) / 2 - tx.value;
      const fy = (baseH * s - FRAME_H) / 2 - ty.value;

      const cropW = FRAME_W * factor;
      const cropH = FRAME_H * factor;
      const originX = Math.min(Math.max(fx * factor, 0), Math.max(0, imageWidth - cropW));
      const originY = Math.min(Math.max(fy * factor, 0), Math.max(0, imageHeight - cropH));

      const ctx = ImageManipulator.manipulate(imageUri);
      ctx.crop({
        originX: Math.round(originX),
        originY: Math.round(originY),
        width: Math.round(cropW),
        height: Math.round(cropH),
      });
      const rendered = await ctx.renderAsync();
      const out = await rendered.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
      onCropped(out.uri);
    } catch (e) {
      console.error("Crop failed:", e);
      onCropped(imageUri); // fall back to the original so the user isn't blocked
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.hint}>Drag to reposition · pinch to zoom</Text>
          <View style={[styles.frame, { width: FRAME_W, height: FRAME_H }]}>
            <GestureDetector gesture={composed}>
              <Animated.View style={{ width: FRAME_W, height: FRAME_H, overflow: "hidden" }}>
                <Animated.Image
                  source={imageUri ? { uri: imageUri } : undefined}
                  style={[
                    {
                      position: "absolute",
                      width: baseW,
                      height: baseH,
                      left: (FRAME_W - baseW) / 2,
                      top: (FRAME_H - baseH) / 2,
                    },
                    animatedStyle,
                  ]}
                  resizeMode="cover"
                />
              </Animated.View>
            </GestureDetector>
            <View pointerEvents="none" style={styles.frameBorder} />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.actionBtn} disabled={processing}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.actionBtn, styles.useBtn]}
              disabled={processing}
              activeOpacity={0.85}
            >
              {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.useText}>Use photo</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  hint: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16 },
  frame: { overflow: "hidden", borderRadius: 8, backgroundColor: "#000" },
  frameBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: "rgba(255,255,255,0.9)", borderRadius: 8 },
  actions: { flexDirection: "row", gap: 12, marginTop: 28, paddingHorizontal: 24 },
  actionBtn: { flex: 1, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  useBtn: { backgroundColor: colors.primary },
  cancelText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  useText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 15 },
});
