import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, Pressable, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X, Type, Zap, ZapOff, RefreshCcw, Image as ImageIcon } from "lucide-react-native";
import { AppText as Text } from "@/components/ui/AppText";

const { width: SW, height: SH } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  onCapture: (asset: any) => void;
}

export default function StoryCamera({ visible, onClose, onCapture }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"on" | "off">("off");
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  if (!visible) return null;
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center", padding: 20 }}>Camera permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={{ color: "#000", fontWeight: "700" }}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
          <Text style={{ color: "#fff" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
        });
        onCapture(photo);
      } catch (e) {
        console.error("Capture failed", e);
      }
    }
  };

  const CAMERA_HEIGHT = SW * (16 / 9);
  const VERTICAL_MARGIN = (SH - CAMERA_HEIGHT) / 2;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={styles.container}>
        {/* Letterboxed Camera View */}
        <View style={[styles.cameraContainer, { height: CAMERA_HEIGHT, top: VERTICAL_MARGIN }]}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            enableTorch={flash === "on"}
            ratio="16:9"
          />
        </View>

        {/* Full-screen Overlay for Controls */}
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setFlash(flash === "on" ? "off" : "on")} style={styles.iconBtn}>
              {flash === "on" ? <Zap size={24} color="#FFD700" /> : <ZapOff size={24} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Bottom Controls Group */}
          <View style={styles.bottomControls}>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.galleryBtn}>
                 <ImageIcon size={28} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={takePicture} style={styles.captureBtn}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setFacing(facing === "back" ? "front" : "back")} style={styles.flipBtn}>
                <RefreshCcw size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Mode Selector */}
            <View style={styles.modeSelector}>
              <Text style={styles.activeMode}>STORY</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    width: SW,
    position: "absolute",
    overflow: "hidden",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 22,
  },
  bottomControls: {
    gap: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  galleryBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
  },
  flipBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 22,
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  activeMode: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  permissionBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: "center",
  },
});
