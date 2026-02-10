import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWifiSession } from '@/hooks/useWifiSession';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Loader2, Circle, Play, User, Calendar, Activity } from 'lucide-react';

const MONITORING_STEPS = [
  'System Initialised',
  'Measuring Skin Temperature',
  'Auscultation Started',
  'Measuring HR & SpO₂',
  'Final Analysis',
];

function getConnectionBadge(state: string | null, statusMsg: string) {
  if (!state || state === 'CREATED')
    return { label: 'Waiting for Device', className: 'bg-muted text-muted-foreground' };

  if (state === 'ERROR')
    return { label: 'Error', className: 'bg-destructive text-destructive-foreground' };

  if (state === 'COMPLETED')
    return { label: 'Completed', className: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]' };

  if (statusMsg)
    return { label: 'Monitoring Live', className: 'bg-primary text-primary-foreground' };

  if (state === 'STARTED')
    return { label: 'Device Connected', className: 'bg-primary/70 text-primary-foreground' };

  return { label: 'Waiting for Device', className: 'bg-muted text-muted-foreground' };
}

const Monitor = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const {
    session,
    sessionState,
    statusMessage,
    statusHistory,
    vitalData,
    error,
    beginMonitoring,
    loadSessionById, // ✅ IMPORTANT
  } = useWifiSession();

  /* 🔥 LOAD SESSION ON PAGE LOAD / REFRESH */
  useEffect(() => {
    if (sessionId && !session) {
      loadSessionById(sessionId);
    }
  }, [sessionId, session, loadSessionById]);

  /* 🔥 AUTO NAVIGATE TO REPORT */
  useEffect(() => {
    if (sessionState === 'COMPLETED' && vitalData) {
      navigate(`/report/${sessionId}`, {
        state: { vital: vitalData, session },
      });
    }
  }, [sessionState, vitalData, navigate, sessionId, session]);

  /* 🔥 STEP TRACKING FROM STATUSES */
  const currentStepIndex = useMemo(() => {
    if (!statusHistory.length) return -1;
    const latestMsg = statusHistory[statusHistory.length - 1].message;
    return MONITORING_STEPS.findIndex(step =>
      latestMsg.toLowerCase().includes(step.toLowerCase())
    );
  }, [statusHistory]);

  const badge = getConnectionBadge(sessionState, statusMessage);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Monitoring</h1>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>

          {session && (
            <Card>
              <CardContent className="flex gap-4 p-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {session.user_name}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Age {session.age}
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  {session.mode}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* START BUTTON */}
        {sessionState === 'CREATED' && (
          <Button onClick={beginMonitoring} className="w-full h-12 gap-2">
            <Play className="h-5 w-5" />
            Start Monitoring
          </Button>
        )}

        {/* MONITORING STEPS */}
        {(sessionState === 'STARTED' || sessionState === 'MONITORING') && (
          <div className="space-y-3">
            {MONITORING_STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isActive = i === currentStepIndex;

              return (
                <Card key={step} className={
                  isActive
                    ? 'border-primary bg-primary/10'
                    : isCompleted
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'opacity-50'
                }>
                  <CardContent className="flex gap-3 p-4">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full">
                      {isCompleted ? <Check /> : isActive ? <Loader2 className="animate-spin" /> : <Circle />}
                    </div>
                    <div>
                      <p className="font-medium">{step}</p>
                      {isActive && <p className="text-xs text-muted-foreground">In progress…</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default Monitor;