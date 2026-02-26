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
  const [loading, setLoading] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  /* =========================
     REALTIME
  ========================= */
  const subscribeToSession = useCallback(async(sessionId: string) => {
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
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
          const status = payload.new as Status;
          setStatusMessage(status.message);
          setStatusHistory((prev) => [...prev, status]);
        }
      )

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
     LOAD SESSION (PRODUCTION SAFE)
  ========================= */
  const loadSessionById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;
      if (!sessionData) return;

      setSession(sessionData);
      setSessionState(sessionData.state);

      const { data: statuses } = await supabase
        .from('statuses')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (statuses && statuses.length > 0) {
        setStatusHistory(statuses);
        setStatusMessage(statuses[statuses.length - 1].message);
      }

      const { data: vital } = await supabase
        .from('vitals')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (vital) setVitalData(vital);

      subscribeToSession(id);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create session');

      setSession(data);
      setSessionState(data.state);
      subscribeToSession(data.id);

      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Session creation error:', err);
      return null;
    }
  }, [user, subscribeToSession]);

  const beginMonitoring = useCallback(async () => {
    if (!session) return;

    await supabase
      .from('sessions')
      .update({ state: 'STARTED' })
      .eq('id', session.id);

    setSessionState('STARTED');
  }, [session]);

  const resetSession = useCallback(async() => {
    if (channelRef.current) {
  await channelRef.current.unsubscribe();
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
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
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
    loading,
    startSession,
    beginMonitoring,
    resetSession,
    loadSessionById,
  };
}