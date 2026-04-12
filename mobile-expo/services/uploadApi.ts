import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

export type UploadFolder = 'profiles' | 'pets' | 'posts' | 'events' | 'stamps' | 'reports' | 'certificates';

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

const API_BASE_URL = getBaseUrl();

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
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
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

  const response = await fetch(`${API_BASE_URL}/api/upload/${folder}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
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
