import React from "react";
import MapView, { Marker, type MapPressEvent, type Region } from "react-native-maps";

type Props = {
  initialLatitude: number;
  initialLongitude: number;
  markerLatitude?: number;
  markerLongitude?: number;
  onPick: (lat: number, lng: number) => void;
};

export default function LocationPickerMap({
  initialLatitude,
  initialLongitude,
  markerLatitude,
  markerLongitude,
  onPick,
}: Props) {
  const initialRegion: Region = {
    latitude: initialLatitude,
    longitude: initialLongitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const hasMarker = typeof markerLatitude === "number" && typeof markerLongitude === "number";

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      onPress={(e: MapPressEvent) => onPick(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
    >
      {hasMarker && <Marker coordinate={{ latitude: markerLatitude!, longitude: markerLongitude! }} />}
    </MapView>
  );
}
