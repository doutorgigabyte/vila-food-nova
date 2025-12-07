import { useCallback, useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { NotificationType, NotificationPriority, NOTIFICATION_CONFIG } from "./useNotifications";

interface NotificationPreferences {
  sound_enabled: boolean;
  vibration_enabled: boolean;
  volume: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  disabled_types: string[];
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  sound_enabled: true,
  vibration_enabled: true,
  volume: 80,
  quiet_hours_start: null,
  quiet_hours_end: null,
  disabled_types: [],
};

// Map notification types to sound files
const SOUND_FILES: Record<NotificationPriority, string> = {
  critical: '/sounds/new-order.mp3',
  high: '/sounds/new-delivery.mp3',
  medium: '/sounds/order-ready.mp3',
  low: '/sounds/payment-success.mp3',
};

// Types that should loop until dismissed
const LOOPING_TYPES: NotificationType[] = [
  'new_order',
  'new_delivery',
  'payment_received',
];

export const useNotificationSound = () => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopingRef = useRef<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching preferences:', error);
        }

        if (data) {
          setPreferences({
            sound_enabled: data.sound_enabled ?? true,
            vibration_enabled: data.vibration_enabled ?? true,
            volume: data.volume ?? 80,
            quiet_hours_start: data.quiet_hours_start,
            quiet_hours_end: data.quiet_hours_end,
            disabled_types: data.disabled_types || [],
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  // Check if in quiet hours
  const isQuietHours = useCallback(() => {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours cross midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [preferences.quiet_hours_start, preferences.quiet_hours_end]);

  // Play sound from file
  const playSoundFile = useCallback((soundFile: string, loop: boolean = false) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(soundFile);
      audio.volume = preferences.volume / 100;
      audio.loop = loop;
      audioRef.current = audio;
      loopingRef.current = loop;
      
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });

      audio.onended = () => {
        if (!loopingRef.current) {
          setIsPlaying(false);
        }
      };
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  }, [preferences.volume]);

  // Stop looping sound
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      loopingRef.current = false;
      setIsPlaying(false);
    }
  }, []);

  // Vibrate device
  const vibrate = useCallback((priority: NotificationPriority) => {
    if (!preferences.vibration_enabled || !navigator.vibrate) return;

    const patterns: Record<NotificationPriority, number[]> = {
      critical: [200, 100, 200, 100, 200],
      high: [200, 100, 200],
      medium: [200],
      low: [100],
    };

    navigator.vibrate(patterns[priority]);
  }, [preferences.vibration_enabled]);

  // Play notification
  const playNotification = useCallback((type: NotificationType) => {
    // Check if sound is enabled
    if (!preferences.sound_enabled) return;
    
    // Check quiet hours
    if (isQuietHours()) return;
    
    // Check if type is disabled
    if (preferences.disabled_types.includes(type)) return;

    const config = NOTIFICATION_CONFIG[type];
    
    // Play sound
    if (config.hasSound) {
      const soundFile = SOUND_FILES[config.priority];
      const shouldLoop = LOOPING_TYPES.includes(type);
      playSoundFile(soundFile, shouldLoop);
    }
    
    // Vibrate
    if (config.vibrate) {
      vibrate(config.priority);
    }
  }, [preferences, isQuietHours, playSoundFile, vibrate]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;

    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...newPreferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      setPreferences(preferences);
    }
  }, [user, preferences]);

  // Test sound
  const testSound = useCallback((priority: NotificationPriority = 'medium') => {
    const soundFile = SOUND_FILES[priority];
    playSoundFile(soundFile, false);
    vibrate(priority);
  }, [playSoundFile, vibrate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    preferences,
    loading,
    isPlaying,
    playNotification,
    stopSound,
    updatePreferences,
    testSound,
    isQuietHours: isQuietHours(),
  };
};
