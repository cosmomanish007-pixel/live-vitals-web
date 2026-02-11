import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Session, Vital, HealthStatus } from '@/types/database';
import { Clock, User, Plus, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface SessionWithVital extends Session {
  vital?: Vital | null;
}

function statusBadge(status: HealthStatus | null | undefined) {
  switch (status) {
    case 'GREEN':
      return (
        <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
          Normal
        </Badge>
      );
    case 'YELLOW':
      return (
        <Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">
          Attention
        </Badge>
      );
    case 'RED':
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          Alert
        </Badge>
      );
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

const History = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<SessionWithVital[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [doctorStatus, setDoctorStatus] = useState<string | null>(null);

  /* ===============================
     FETCH PROFILE ROLE
  ================================ */
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role, doctor_status')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfileRole(data.role);
        setDoctorStatus(data.doctor_status ?? null);
      }
    };

    fetchProfile();
  }, [user]);

  /* ===============================
     FETCH USER SESSIONS
  ================================ */
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!sessionData) {
        setLoading(false);
        return;
      }

      const sessionIds = sessionData.map((s: any) => s.id);

      const { data: vitalsData } = await supabase
        .from('vitals')
        .select('*')
        .in('session_id', sessionIds);

      const vitalsMap = new Map<string, Vital>();
      (vitalsData ?? []).forEach((v: any) =>
        vitalsMap.set(v.session_id, v as Vital)
      );

      setSessions(
        (sessionData as Session[]).map((s) => ({
          ...s,
          vital: vitalsMap.get(s.id) ?? null,
        }))
      );

      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  /* ===============================
     ROLE-BASED BUTTON RENDER
  ================================ */
  const renderRoleButton = () => {
    if (profileRole === 'user') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/apply-doctor')}
        >
          Apply as Doctor
        </Button>
      );
    }

    if (profileRole === 'doctor' && doctorStatus === 'pending') {
      return <Badge variant="secondary">Application Pending</Badge>;
    }

    if (profileRole === 'doctor' && doctorStatus === 'approved') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/doctor')}
        >
          Doctor Panel
        </Button>
      );
    }

    if (profileRole === 'admin') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin')}
        >
          Admin Panel
        </Button>
      );
    }

    return null;
  };

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">
            Session History
          </h1>

          <div className="flex gap-2 items-center">
            {renderRoleButton()}

            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate('/new-session')}
            >
              <Plus className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <p>No sessions yet</p>
            <Button
              variant="link"
              onClick={() => navigate('/new-session')}
            >
              Start your first session
            </Button>
          </div>
        ) : (
          sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/report/${s.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {s.user_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(s.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  {statusBadge(s.vital?.status)}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;