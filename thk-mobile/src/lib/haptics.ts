import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const safeHaptics = {
  impact: async (options?: { style: ImpactStyle }) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact(options || { style: ImpactStyle.Light });
      } catch (e) {}
    }
  },
  selection: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionStart();
      } catch (e) {}
    }
  },
  selectionStart: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionStart();
      } catch (e) {}
    }
  },
  selectionChanged: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionChanged();
      } catch (e) {}
    }
  },
  vibrate: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.vibrate();
      } catch (e) {}
    }
  }
};
