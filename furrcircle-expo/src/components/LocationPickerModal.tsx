import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useTokens } from '../lib/theme-store';
import { MapPin, X, Search, LocateFixed } from './ui/icons';

export interface LocationResult {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationResult) => void;
}

export function LocationPickerModal({ visible, onClose, onSelectLocation }: LocationPickerModalProps) {
  const tk = useTokens();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoLocating, setAutoLocating] = useState(false);

  const autoSelectLocation = async () => {
    setAutoLocating(true);
    setErrorMsg('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      
      if (!location) {
        setErrorMsg('Failed to fetch location.');
        return;
      }
      
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`, {
        headers: { 'User-Agent': 'FurrCircleApp/1.0' }
      });
      const data = await response.json();
      
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown City';
        onSelectLocation({
          address: data.display_name,
          city: city,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (err) {
      setErrorMsg('Failed to get current location.');
    } finally {
      setAutoLocating(false);
    }
  };

  const searchLocation = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
        headers: { 'User-Agent': 'FurrCircleApp/1.0' }
      });
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setErrorMsg('No results found for this location.');
        setResults([]);
        return;
      }
      
      const mappedResults: LocationResult[] = data.map((loc: any) => {
        const addressParts = loc.display_name.split(', ');
        return {
          address: loc.display_name,
          city: addressParts[0],
          latitude: parseFloat(loc.lat),
          longitude: parseFloat(loc.lon),
        };
      });
      setResults(mappedResults);
    } catch (err) {
      setErrorMsg('Failed to search location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
          <View style={[styles.header, { borderBottomColor: tk.border }]}>
            <Text style={[styles.title, { color: tk.text }]}>Search Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={tk.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchRow}>
            <View style={[styles.inputWrapper, { backgroundColor: tk.card, borderColor: tk.border }]}>
              <Search size={20} color={tk.textMuted} style={styles.searchIcon} />
              <TextInput
                style={[styles.input, { color: tk.text }]}
                placeholder="Enter city or address"
                placeholderTextColor={tk.textMuted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={styles.autoLocateBtn} 
              onPress={autoSelectLocation}
              disabled={autoLocating}
            >
              {autoLocating ? (
                <ActivityIndicator size="small" color={tk.textMuted} />
              ) : (
                <LocateFixed size={18} color={tk.textMuted} />
              )}
              <Text style={[styles.autoLocateText, { color: tk.text }]}>
                {autoLocating ? "Locating..." : "Use current location"}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : errorMsg ? (
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{errorMsg}</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.resultItem, { borderBottomColor: tk.border }]} 
                  onPress={() => onSelectLocation(item)}
                >
                  <View style={styles.resultIconWrapper}>
                    <MapPin size={20} color={tk.textMuted} />
                  </View>
                  <View style={styles.resultTextWrapper}>
                    <Text style={[styles.resultCity, { color: tk.text }]}>{item.city || item.address}</Text>
                    <Text style={[styles.resultAddress, { color: tk.textMuted }]}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
  searchRow: {
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  autoLocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  autoLocateText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultIconWrapper: {
    width: 40,
    alignItems: 'center',
  },
  resultTextWrapper: {
    flex: 1,
    paddingLeft: 8,
  },
  resultCity: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  resultAddress: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
