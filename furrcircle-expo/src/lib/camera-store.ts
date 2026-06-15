import { create } from "zustand";

interface CameraState {
  capturedUri: string | null;
  capturedType: "image" | "video" | null;
  setCapturedMedia: (uri: string | null, type: "image" | "video" | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  capturedUri: null,
  capturedType: null,
  setCapturedMedia: (uri, type) => set({ capturedUri: uri, capturedType: type }),
}));
