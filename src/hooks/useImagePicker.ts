import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

interface ImagePickerState {
  uri: string | null;
  loading: boolean;
  error: string | null;
}

export function useImagePicker() {
  const [state, setState] = useState<ImagePickerState>({ uri: null, loading: false, error: null });

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setState((prev) => ({ ...prev, loading: false, error: 'Gallery permission denied' }));
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setState({ uri: result.assets[0].uri, loading: false, error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: 'Failed to pick image' }));
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setState((prev) => ({ ...prev, loading: false, error: 'Camera permission denied' }));
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setState({ uri: result.assets[0].uri, loading: false, error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: 'Failed to take photo' }));
    }
  };

  const clearImage = () => setState({ uri: null, loading: false, error: null });

  return { ...state, pickImage, takePhoto, clearImage };
}
