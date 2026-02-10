import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (!state || state === 'CREATED') return { label: 'Waiting for Device', className: 'bg-muted text-muted-foreground' };
  if (state === 'ERROR') return { label: 'Error', className: 'bg-destructive text-destructive-foreground' };
  if (state === 'COMPLETED') return { label: 'Completed', className: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]' };
  if (statusMsg) return { label: 'Monitoring Live', className: 'bg-primary text-primary-foreground' };
  if (state === 'STARTED') return { label: 'Device Connected', className: 'bg-primary/70 text-primary-foreground' };
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
    resetSession,
  } = useWifiSession();

  // Reconnect to existing session on mount
  useEffect(() => {
    if (sessionId && !session) {
      // The hook will subscribe when session is loaded
      // For now we rely on the session being set from UserDetails navigation
    }
  }, [sessionId, session]);

  // Navigate to report when complete
  useEffect(() => {
    if (sessionState === 'COMPLETED' && vitalData) {
      navigate(`/report/${sessionId}`, { state: { vital: vitalData, session } });
    }
  }, [sessionState, vitalData, sessionId, navigate, session]);

  const currentStepIndex = useMemo(() => {
    if (!statusHistory.length) return -1;
    const latestMsg = statusHistory[statusHistory.length - 1].message;
    return MONITORING_STEPS.findIndex((step) =>
      latestMsg.toLowerCase().includes(step.toLowerCase())
    );
  }, [statusHistory]);

  const badge = getConnectionBadge(sessionState, statusMessage);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground">Monitoring</h1>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>

          {session && (
            <Card className="border-border/50 bg-card">
              <CardContent className="flex gap-4 p-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{session.user_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Age {session.age}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  <span>{session.mode}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Start button */}
        {sessionState === 'CREATED' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={beginMonitoring} className="w-full h-12 text-base font-semibold gap-2" size="lg">
              <Play className="h-5 w-5" />
              Start Monitoring
            </Button>
          </motion.div>
        )}

        {/* Steps */}
        {(sessionState === 'STARTED' || sessionState === 'MONITORING') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {MONITORING_STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isActive = i === currentStepIndex;
              const isPending = i > currentStepIndex;

              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`border transition-all duration-300 ${
                    isActive
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                      : isCompleted
                      ? 'border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5'
                      : 'border-border/30 bg-card/50 opacity-50'
                  }`}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCompleted
                          ? 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]'
                          : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step}
                        </p>
                        {isActive && (
                          <p className="text-xs text-muted-foreground mt-0.5">In progress...</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Monitor;
