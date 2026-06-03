import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
        try {
            const raw = await AsyncStorage.getItem('furr:auth');
            if (raw) return JSON.parse(raw)?.token ?? null;
        } catch { }
        return null;
    }
    return SecureStore.getItemAsync('token');
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? 'http://localhost:5002/api' : '');

if (__DEV__) {
    console.log('[Dev] API_URL:', API_URL);
} else {
    console.log('[Prod] API_URL:', API_URL);
}

export const PublicAxios = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const PrivateAxios = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

PrivateAxios.interceptors.request.use(
    async (config) => {
        try {
            let token = await getToken();
            if (!token) {
                await new Promise(r => setTimeout(r, 250));
                token = await getToken();
                if (!token) {
                    await new Promise(r => setTimeout(r, 500));
                    token = await getToken();
                }
            }
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

PrivateAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const code = error?.response?.data?.code;
        if (code === 'SUBSCRIPTION_LOCKED') {
            try {
                if (Platform.OS !== 'web') await SecureStore.setItemAsync('subscriptionLocked', 'true');
            } catch (secureStoreError) {
                console.error('Failed to persist subscription lock state', secureStoreError);
            }
            DeviceEventEmitter.emit('subscription-locked');
        }
        return Promise.reject(error);
    }
);
