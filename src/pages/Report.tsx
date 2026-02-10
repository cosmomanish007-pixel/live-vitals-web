import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session, HealthStatus } from '@/types/database';
import { Thermometer, HeartPulse, Droplets, Volume2, RefreshCw } from 'lucide-react';

function statusColor(status: HealthStatus | null) {
  switch (status) {
    case 'GREEN': return { bg: 'bg-[hsl(var(--success))]/15', text: 'text-[hsl(var(--success))]', label: 'Normal', border: 'border-[hsl(var(--success))]/30' };
    case 'YELLOW': return { bg: 'bg-[hsl(var(--warning))]/15', text: 'text-[hsl(var(--warning))]', label: 'Attention Needed', border: 'border-[hsl(var(--warning))]/30' };
    case 'RED': return { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Alert', border: 'border-destructive/30' };
    default: return { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Unknown', border: 'border-border' };
  }
}

const Report = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [vital, setVital] = useState<Vital | null>((location.state as any)?.vital ?? null);
  const [session, setSession] = useState<Session | null>((location.state as any)?.session ?? null);

  useEffect(() => {
    if (!vital && sessionId) {
      supabase.from('vitals').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle()
        .then(({ data }) => { if (data) setVital(data as Vital); });
    }
    if (!session && sessionId) {
      supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle()
        .then(({ data }) => { if (data) setSession(data as Session); });
    }
  }, [sessionId, vital, session]);

  const status = statusColor(vital?.status ?? null);

  const vitals = [
    { icon: Thermometer, label: 'Skin Temperature', value: vital?.temp != null ? `${vital.temp}°C` : '—', color: 'text-primary' },
    { icon: HeartPulse, label: 'Heart Rate', value: vital?.hr != null ? `${vital.hr} bpm` : '—', color: 'text-destructive' },
    { icon: Droplets, label: 'SpO₂', value: vital?.spo2 != null ? `${vital.spo2}%` : '—', color: 'text-primary' },
    { icon: Volume2, label: 'Audio Peak', value: vital?.audio != null ? `${vital.audio}` : '—', color: 'text-[hsl(var(--warning))]' },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg font-bold text-foreground">Final Report</h1>
          {session && <p className="text-sm text-muted-foreground mt-1">{session.user_name} • Age {session.age}</p>}
        </motion.div>

        {/* Overall Status */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className={`border ${status.border} ${status.bg}`}>
            <CardContent className="flex flex-col items-center p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Overall Health Status</p>
              <p className={`text-2xl font-bold vital-font ${status.text}`}>{vital?.status ?? '—'}</p>
              <p className={`text-sm mt-1 ${status.text}`}>{status.label}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vital Cards */}
        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v, i) => (
            <motion.div
              key={v.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Card className="border-border/50 bg-card h-full">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <v.icon className={`h-6 w-6 mb-2 ${v.color}`} />
                  <p className="text-xs text-muted-foreground mb-1">{v.label}</p>
                  <p className={`text-xl font-bold vital-font ${v.color}`}>{v.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* New Session */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Button
            onClick={() => navigate('/new-session')}
            className="w-full h-12 text-base font-semibold gap-2"
            size="lg"
          >
            <RefreshCw className="h-5 w-5" />
            Start New Session
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;
