import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

export type UploadFolder = 'profiles' | 'pets' | 'posts' | 'events' | 'stamps' | 'reports' | 'certificates' | 'stories';

const normalizeBaseUrl = (value?: string | null) => {
  const fallback = 'http://127.0.0.1:5001';
  return (value || fallback).replace(/\/+$/, '');
};

const getBaseUrl = () => {
  const expoExtra = Constants.expoConfig?.extra;
  return normalizeBaseUrl(
    process.env.EXPO_PUBLIC_API_URL || (expoExtra?.apiUrl as string | undefined)
  );
};

const baseRoot = getBaseUrl();
const API_BASE_URL = /\/api$/.test(baseRoot) ? baseRoot : `${baseRoot}/api`;

export const pickImage = async (options?: {
  aspect?: [number, number];
  allowsEditing?: boolean;
}): Promise<ImagePicker.ImagePickerAsset | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library access is required to upload images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? false,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
};

export const uploadImage = async (
  asset: ImagePicker.ImagePickerAsset,
  folder: UploadFolder
): Promise<string> => {
  const token = await AsyncStorage.getItem('user_token');
  const mimeType = asset.mimeType || 'image/jpeg';
  const ext = mimeType.split('/')[1] || 'jpg';

  const formData = new FormData();
  formData.append('image', {
    uri: asset.uri,
    type: mimeType,
    name: `upload.${ext}`,
  } as any);

  const response = await fetch(`${API_BASE_URL}/upload/${folder}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server error (HTTP ${response.status}) — please try again.`);
  }
  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data.url as string;
};

export const pickAndUploadImage = async (
  folder: UploadFolder,
  options?: { aspect?: [number, number]; allowsEditing?: boolean }
): Promise<string | null> => {
  const asset = await pickImage(options);
  if (!asset) return null;
  return uploadImage(asset, folder);
};

export const captureImage = async (options?: {
  aspect?: [number, number];
  allowsEditing?: boolean;
}): Promise<ImagePicker.ImagePickerAsset | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera access is required to capture records.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? false,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
};

export const captureAndUploadImage = async (
  folder: UploadFolder,
  options?: { aspect?: [number, number]; allowsEditing?: boolean }
): Promise<string | null> => {
  const asset = await captureImage(options);
  if (!asset) return null;
  return uploadImage(asset, folder);
};

export const pickAndUploadMedia = async (
  folder: UploadFolder
): Promise<{ url: string; mediaType: 'image' | 'video' } | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library access is required.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 0.8,
    videoMaxDuration: 30,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const url = await uploadImage(asset, folder);
  const mediaType = (asset.type === 'video' || asset.mimeType?.startsWith('video/')) ? 'video' : 'image';
  return { url, mediaType };
};

export const captureAndUploadStory = async (
  folder: UploadFolder
): Promise<{ url: string; mediaType: 'image' | 'video' } | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera access is required.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 0.8,
    videoMaxDuration: 30,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const url = await uploadImage(asset, folder);
  const mediaType = (asset.type === 'video' || asset.mimeType?.startsWith('video/')) ? 'video' : 'image';
  return { url, mediaType };
};

// Pick image or video without uploading — used for the story editor flow
export const pickMedia = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library access is required.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 0.65,
    videoMaxDuration: 30,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
};

// Capture from camera without uploading — 9:16 portrait ratio for stories
export const captureStoryCamera = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera access is required.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 0.65,
    videoMaxDuration: 30,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
};
