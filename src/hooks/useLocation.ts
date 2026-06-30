import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number;
  longitude: number;
  address: string;
  loading: boolean;
  error: string | null;
}

export function useLocation(): LocationState & { requestLocation: () => Promise<void> } {
  const [state, setState] = useState<LocationState>({
    latitude: 17.4483,
    longitude: 78.3741,
    address: '',
    loading: false,
    error: null,
  });

  const requestLocation = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setState((prev) => ({ ...prev, loading: false, error: 'Location permission denied' }));
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [reverse] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const address = reverse
        ? [reverse.street, reverse.district, reverse.city, reverse.region].filter(Boolean).join(', ')
        : `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;

      setState({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false, error: 'Failed to get location' }));
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return { ...state, requestLocation };
}
