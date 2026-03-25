import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

import { useWifiSession } from '@/hooks/useWifiSession';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, Activity, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Check,
  Loader2,
  Circle,
  User,
  Calendar,
  Download,
} from 'lucide-react';

const MONITORING_STEPS = [
  'System Initialised',
  'Measuring Skin Temperature',
  'Auscultation Started',
  'AI Analysis Running',
  'Measuring HR & SpO₂',
  'Final Analysis',
];

function getConnectionBadge(state: string | null) {
  if (!state || state === 'CREATED')
    return { label: 'Waiting for Device', className: 'bg-muted text-muted-foreground' };

  if (state === 'ERROR')
    return { label: 'Error', className: 'bg-destructive text-destructive-foreground' };

  if (state === 'COMPLETED')
    return {
      label: 'Completed',
      className:
        'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]',
    };

  return { label: 'Monitoring Live', className: 'bg-primary text-primary-foreground' };
}

interface AIResults {
  heartLabel?: string;
  heartProb?: number;
  lungLabel?: string;
  lungConf?: number;
  bpm?: number;
  sqi?: number;
  alert?: boolean;
  valveRisk?: string;
  sysMurmur?: boolean;
  diaMurmur?: boolean;
  normalPct?: number;
  cracklePct?: number;
  wheezePct?: number;
}

const Monitor = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const {
    session,
    sessionState,
    statusHistory,
    vitalData,
    error,
    loadSessionById,
    loading,
  } = useWifiSession();

  const [aiResults, setAiResults] = useState<AIResults>({});

  /* 🔥 LOAD SESSION ONLY ONCE */
  useEffect(() => {
    if (sessionId) {
      loadSessionById(sessionId);
    }
  }, [sessionId]);

  /* 🔥 AUTO NAVIGATE WHEN COMPLETED */
  useEffect(() => {
    if (sessionState === 'COMPLETED' && vitalData) {
      navigate(`/report/${sessionId}`, {
        state: { vital: vitalData, session },
      });
    }
  }, [sessionState, vitalData, navigate, sessionId, session]);

  /* 🔥 LISTEN FOR AI RESULTS FROM VITALS TABLE */
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`ai-results-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vitals',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newVital = payload.new as any;
          
          // Check if this vital has AI data
          if (newVital.ai_heart_label || newVital.ai_lung_label) {
            setAiResults({
              heartLabel: newVital.ai_heart_label,
              heartProb: newVital.ai_heart_prob,
              lungLabel: newVital.ai_lung_label,
              lungConf: newVital.ai_lung_conf,
              bpm: newVital.ai_bpm,
              sqi: newVital.ai_sqi,
              alert: newVital.ai_alert,
              valveRisk: newVital.ai_valve_risk,
              sysMurmur: newVital.ai_sys_murmur,
              diaMurmur: newVital.ai_dia_murmur,
              normalPct: newVital.ai_normal_pct,
              cracklePct: newVital.ai_crackle_pct,
              wheezePct: newVital.ai_wheeze_pct,
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  /* 🔥 STEP TRACKING */
  const currentStepIndex = useMemo(() => {
    if (!statusHistory.length) return -1;

    const latest = statusHistory[statusHistory.length - 1].message;

    return MONITORING_STEPS.findIndex(step =>
      latest.toLowerCase().includes(step.toLowerCase())
    );
  }, [statusHistory]);

  const badge = getConnectionBadge(sessionState);

  /* 📄 PDF GENERATION */
  const downloadPdf = () => {
    if (!session || !vitalData) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('AURA-STETH AI – Clinical Report', 20, 20);

    doc.setFontSize(11);
    doc.text(`Patient Name: ${session.user_name}`, 20, 40);
    doc.text(`Age: ${session.age}`, 20, 48);
    doc.text(`Gender: ${session.gender}`, 20, 56);
    doc.text(`Mode: ${session.mode}`, 20, 64);

    doc.text('Vitals Summary', 20, 80);
    doc.text(`Skin Temperature: ${vitalData.temp ?? '--'} °C`, 20, 90);
    doc.text(`Heart Rate: ${vitalData.hr ?? '--'} bpm`, 20, 98);
    doc.text(`SpO₂: ${vitalData.spo2 ?? '--'} %`, 20, 106);
    doc.text(`Audio Peak: ${vitalData.audio ?? '--'}`, 20, 114);
    doc.text(`Overall Status: ${vitalData.status}`, 20, 122);

    // Add AI Results to PDF if available
    if (aiResults.heartLabel) {
      doc.text('AI Analysis Results', 20, 140);
      doc.text(`Heart Classification: ${aiResults.heartLabel} (${aiResults.heartProb?.toFixed(1)}%)`, 20, 148);
      doc.text(`Lung Classification: ${aiResults.lungLabel} (${aiResults.lungConf?.toFixed(1)}%)`, 20, 156);
      if (aiResults.bpm) doc.text(`AI BPM: ${aiResults.bpm.toFixed(0)}`, 20, 164);
      if (aiResults.alert) doc.text('⚠️ AI ALERT: Abnormal findings detected', 20, 172);
    }

    doc.text('Generated by AURA-STETH AI', 20, 190);

    doc.save(`AURA_STETH_Report_${session.id}.pdf`);
  };

  /* 🔥 LOADING SKELETON */
  if (loading || !sessionState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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

        {/* 🔥 AI ANALYSIS RESULTS - DISPLAY WHEN AVAILABLE */}
        {aiResults.heartLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={aiResults.alert ? "border-2 border-red-500" : "border-primary/30"}>
              <CardContent className="p-5 space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">AI Analysis Results</h2>
                  {aiResults.alert && (
                    <Badge variant="destructive" className="animate-pulse">
                      ALERT DETECTED
                    </Badge>
                  )}
                </div>

                {/* Heart & Lung Grid */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Heart Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-5 w-5 text-red-500" />
                      <h3 className="font-semibold">Heart Sound</h3>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Classification:</span>
                        <Badge 
                          variant={aiResults.heartLabel === "Abnormal" ? "destructive" : "default"}
                          className={aiResults.heartLabel === "Normal" ? "bg-green-500" : ""}
                        >
                          {aiResults.heartLabel || "Unknown"}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Abnormal Probability:</span>
                        <span className="font-mono font-bold">
                          {aiResults.heartProb?.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">AI BPM:</span>
                        <span className="font-mono font-bold">{aiResults.bpm?.toFixed(0)} bpm</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Signal Quality:</span>
                        <span className="font-mono">
                          {aiResults.sqi?.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Murmur Detection */}
                    {(aiResults.sysMurmur || aiResults.diaMurmur) && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                        <p className="text-xs font-semibold text-red-500 mb-1">⚠️ Murmur Detected</p>
                        <div className="flex gap-2 text-xs">
                          {aiResults.sysMurmur && <span>Systolic</span>}
                          {aiResults.diaMurmur && <span>Diastolic</span>}
                        </div>
                      </div>
                    )}
                    
                    {/* Valve Risk */}
                    {aiResults.valveRisk && aiResults.valveRisk !== "None" && (
                      <div className="mt-2 p-2 bg-yellow-500/10 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-600">
                          Valve Risk: {aiResults.valveRisk}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Lung Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Wind className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold">Lung Sound</h3>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Classification:</span>
                        <Badge 
                          variant={
                            aiResults.lungLabel === "Crackle" || aiResults.lungLabel === "Wheeze" 
                              ? "destructive" 
                              : "default"
                          }
                          className={aiResults.lungLabel === "Normal" ? "bg-green-500" : ""}
                        >
                          {aiResults.lungLabel || "Unknown"}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <span className="font-mono font-bold">
                          {aiResults.lungConf?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Lung Sound Distribution */}
                    {(aiResults.normalPct !== undefined || aiResults.cracklePct !== undefined || aiResults.wheezePct !== undefined) && (
                      <div className="mt-3 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Sound Distribution</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Normal</span>
                            <span className="font-mono">{aiResults.normalPct?.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-green-500 h-1.5 rounded-full" 
                              style={{ width: `${aiResults.normalPct || 0}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs mt-2">
                            <span>Crackle</span>
                            <span className="font-mono">{aiResults.cracklePct?.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-yellow-500 h-1.5 rounded-full" 
                              style={{ width: `${aiResults.cracklePct || 0}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs mt-2">
                            <span>Wheeze</span>
                            <span className="font-mono">{aiResults.wheezePct?.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-red-500 h-1.5 rounded-full" 
                              style={{ width: `${aiResults.wheezePct || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* AI Alert Banner */}
                {aiResults.alert && (
                  <div className="mt-3 p-3 bg-red-500/20 rounded-lg border border-red-500 animate-pulse">
                    <p className="text-sm font-bold text-red-600 text-center">
                      🚨 CRITICAL ALERT: AI Analysis indicates abnormal findings. Medical attention recommended.
                    </p>
                  </div>
                )}
                
                {/* BPM Comparison (if sensor data available) */}
                {vitalData && aiResults.bpm && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sensor BPM:</span>
                      <span className="font-mono">{vitalData.hr || '--'} bpm</span>
                      <span className="text-muted-foreground">AI BPM:</span>
                      <span className="font-mono">{aiResults.bpm.toFixed(0)} bpm</span>
                      <Badge 
                        variant={Math.abs((vitalData.hr || 0) - aiResults.bpm) > 10 ? "destructive" : "outline"}
                      >
                        Diff: {Math.abs((vitalData.hr || 0) - aiResults.bpm).toFixed(0)} bpm
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Timestamp */}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  AI Analysis completed during monitoring
                </p>
                
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* MONITORING STEPS */}
        {sessionState !== 'CREATED' && sessionState !== 'COMPLETED' && (
          <div className="space-y-3">
            {MONITORING_STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isActive = i === currentStepIndex;
              const isAIStep = step === 'AI Analysis Running';
              
              return (
                <Card
                  key={step}
                  className={
                    isActive
                      ? isAIStep 
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-primary bg-primary/10'
                      : isCompleted
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'opacity-40'
                  }
                >
                  <CardContent className="flex gap-3 p-4">
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : isActive ? (
                      <Loader2 className={`animate-spin ${isAIStep ? 'text-purple-500' : 'text-primary'}`} />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <p className={isAIStep && isActive ? 'text-purple-500 font-semibold' : ''}>
                      {step}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* PDF DOWNLOAD */}
        {sessionState === 'COMPLETED' && vitalData && (
          <Button onClick={downloadPdf} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Clinical PDF Report
          </Button>
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
