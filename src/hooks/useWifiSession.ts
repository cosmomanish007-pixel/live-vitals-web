import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, Status, Vital, SessionState, SessionMode, Gender } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SessionInput {
  userName: string;
  age: number;
  gender: Gender;
  mode: SessionMode;
}

export function useWifiSession() {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusHistory, setStatusHistory] = useState<Status[]>([]);
  const [vitalData, setVitalData] = useState<Vital | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const subscribeToSession = useCallback((sessionId: string) => {
    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          setSessionState(updated.state);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'statuses', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newStatus = payload.new as Status;
          setStatusMessage(newStatus.message);
          setStatusHistory((prev) => [...prev, newStatus]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vitals', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const vital = payload.new as Vital;
          setVitalData(vital);
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  const startSession = useCallback(async (input: SessionInput) => {
    if (!user) {
      setError('Not authenticated');
      return null;
    }

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          user_name: input.userName,
          age: input.age,
          gender: input.gender,
          mode: input.mode,
          state: 'CREATED' as SessionState,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newSession = data as Session;
      setSession(newSession);
      setSessionState(newSession.state);
      subscribeToSession(newSession.id);
      return newSession;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [user, subscribeToSession]);

  const beginMonitoring = useCallback(async () => {
    if (!session) return;

    try {
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ state: 'STARTED' as SessionState })
        .eq('id', session.id);

      if (updateError) throw updateError;
      setSessionState('STARTED');
    } catch (err: any) {
      setError(err.message);
    }
  }, [session]);

  const resetSession = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSession(null);
    setSessionState(null);
    setStatusMessage('');
    setStatusHistory([]);
    setVitalData(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    session,
    sessionState,
    statusMessage,
    statusHistory,
    vitalData,
    error,
    startSession,
    beginMonitoring,
    resetSession,
  };
}
