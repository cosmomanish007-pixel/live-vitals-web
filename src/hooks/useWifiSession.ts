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
  const [statusMessage, setStatusMessage] = useState('');
  const [statusHistory, setStatusHistory] = useState<Status[]>([]);
  const [vitalData, setVitalData] = useState<Vital | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  /* =========================
     REALTIME SUBSCRIPTION
     ========================= */
  const subscribeToSession = useCallback((sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`session-${sessionId}`)

      // SESSION updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          setSessionState(updated.state);
        }
      )

      // STATUS updates (drives steps UI)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'statuses', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const status = payload.new as Status;
          setStatusMessage(status.message);
          setStatusHistory((prev) => [...prev, status]);
        }
      )

      // FINAL VITALS
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vitals', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setVitalData(payload.new as Vital);
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  /* =========================
     LOAD SESSION BY ID (🔥 FIX)
     ========================= */
  const loadSessionById = useCallback(async (id: string) => {
  try {
    setError(null);

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    setSession(data as Session);
    setSessionState(data.state as SessionState);

    subscribeToSession(data.id);
  } catch (err: any) {
    setError(err.message);
  }
}, [subscribeToSession]);
  /* =========================
     CREATE SESSION
     ========================= */
  const startSession = useCallback(async (input: SessionInput) => {
    if (!user) {
      setError('Not authenticated');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          user_name: input.userName,
          age: input.age,
          gender: input.gender,
          mode: input.mode,
          state: 'CREATED',
        })
        .select()
        .single();

      if (error) throw error;

      setSession(data);
      setSessionState(data.state);
      subscribeToSession(data.id);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [user, subscribeToSession]);

  /* =========================
     START MONITORING (UI ONLY)
     ========================= */
  const beginMonitoring = useCallback(async () => {
    if (!session) return;

    await supabase
      .from('sessions')
      .update({ state: 'STARTED' })
      .eq('id', session.id);

    setSessionState('STARTED');
  }, [session]);

  /* =========================
     RESET
     ========================= */
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

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
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
    loadSessionById, // 🔥 IMPORTANT
    resetSession,
  };
}