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

// Frequências para sons gerados programaticamente
const SOUND_FREQUENCIES: Record<NotificationPriority, { freq: number; duration: number; repeats: number }> = {
  critical: { freq: 880, duration: 200, repeats: 3 },
  high: { freq: 660, duration: 250, repeats: 2 },
  medium: { freq: 520, duration: 300, repeats: 1 },
  low: { freq: 440, duration: 400, repeats: 1 },
};

export const useNotificationSound = () => {
  const { user } = useAuth();
  const audioContextRef = useRef<AudioContext | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Carregar preferências do usuário
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

  // Verificar se está no horário silencioso
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
      // Horário atravessa meia-noite
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [preferences.quiet_hours_start, preferences.quiet_hours_end]);

  // Criar AudioContext sob demanda
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Tocar som gerado programaticamente
  const playGeneratedSound = useCallback((priority: NotificationPriority) => {
    const ctx = getAudioContext();
    const config = SOUND_FREQUENCIES[priority];
    const volume = preferences.volume / 100;

    for (let i = 0; i < config.repeats; i++) {
      const startTime = ctx.currentTime + (i * (config.duration + 100) / 1000);
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = priority === 'critical' ? 'square' : 'sine';
      oscillator.frequency.setValueAtTime(config.freq, startTime);
      
      // Envelope ADSR simples
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, startTime + config.duration / 2000);
      gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration / 1000);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + config.duration / 1000);
    }
  }, [getAudioContext, preferences.volume]);

  // Vibrar dispositivo
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

  // Tocar notificação
  const playNotification = useCallback((type: NotificationType) => {
    // Verificar se som está habilitado
    if (!preferences.sound_enabled) return;
    
    // Verificar horário silencioso
    if (isQuietHours()) return;
    
    // Verificar se tipo está desabilitado
    if (preferences.disabled_types.includes(type)) return;

    const config = NOTIFICATION_CONFIG[type];
    
    // Tocar som
    if (config.hasSound) {
      playGeneratedSound(config.priority);
    }
    
    // Vibrar
    if (config.vibrate) {
      vibrate(config.priority);
    }
  }, [preferences, isQuietHours, playGeneratedSound, vibrate]);

  // Atualizar preferências
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
      // Reverter em caso de erro
      setPreferences(preferences);
    }
  }, [user, preferences]);

  // Testar som
  const testSound = useCallback((priority: NotificationPriority = 'medium') => {
    playGeneratedSound(priority);
    vibrate(priority);
  }, [playGeneratedSound, vibrate]);

  return {
    preferences,
    loading,
    playNotification,
    updatePreferences,
    testSound,
    isQuietHours: isQuietHours(),
  };
};
