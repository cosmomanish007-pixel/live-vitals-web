import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session, HealthStatus } from '@/types/database';
import {
  Thermometer,
  HeartPulse,
  Droplets,
  Volume2,
  RefreshCw,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ===============================
   CLINICAL RANGES
================================= */

const CLINICAL_RANGES = {
  temp: { min: 31, max: 37.5 },
  hr: { min: 60, max: 100 },
  spo2: { min: 80, max: 100 },
};

/* ===============================
   EVALUATION
================================= */

function evaluateValue(value: number | null | undefined, min: number, max: number) {
  if (value == null) return { label: "Not Recorded", abnormal: false };
  if (value < min || value > max) return { label: "Abnormal", abnormal: true };
  return { label: "Normal", abnormal: false };
}

function calculateRisk(tempEval: any, hrEval: any, spo2Eval: any) {
  let score = 0;
  if (tempEval.abnormal) score += 35;
  if (hrEval.abnormal) score += 35;
  if (spo2Eval.abnormal) score += 30;

  let level: HealthStatus = "GREEN";
  if (score >= 70) level = "RED";
  else if (score >= 30) level = "YELLOW";

  return { score, level };
}

function statusColor(status: HealthStatus | null) {
  switch (status) {
    case 'GREEN': return 'text-green-500';
    case 'YELLOW': return 'text-yellow-500';
    case 'RED': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

const Report = () => {

  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [vital, setVital] = useState<Vital | null>((location.state as any)?.vital ?? null);
  const [session, setSession] = useState<Session | null>((location.state as any)?.session ?? null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     FETCH DATA (NO LOOP)
  ================================= */

  useEffect(() => {
    if (!sessionId) return;

    const fetchData = async () => {

      try {

        const { data: vitalData } = await supabase
          .from('vitals')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (vitalData) setVital(vitalData as Vital);
        if (sessionData) setSession(sessionData as Session);

      } catch (err) {
        console.error("Report Fetch Error:", err);
      }

      setLoading(false);
    };

    fetchData();

  }, [sessionId]);

  /* ===============================
     SAFE LOADING UI
  ================================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!vital || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Report data not available.
      </div>
    );
  }

  /* ===============================
     RISK CALCULATION
  ================================= */

  const tempEval = evaluateValue(vital.temp, CLINICAL_RANGES.temp.min, CLINICAL_RANGES.temp.max);
  const hrEval = evaluateValue(vital.hr, CLINICAL_RANGES.hr.min, CLINICAL_RANGES.hr.max);
  const spo2Eval = evaluateValue(vital.spo2, CLINICAL_RANGES.spo2.min, CLINICAL_RANGES.spo2.max);

  const risk = calculateRisk(tempEval, hrEval, spo2Eval);

  const riskLabel =
    risk.level === "GREEN"
      ? "LOW"
      : risk.level === "YELLOW"
      ? "MODERATE"
      : "HIGH";

  /* ===============================
     CONSULTATION TRIGGER
     (USES PROFILES TABLE ONLY)
  ================================= */

  const createConsultationRequest = useCallback(async () => {

    if (risk.level !== "RED") return;

    const { data: existing } = await supabase
      .from('consultation_requests')
      .select('id')
      .eq('session_id', session.id)
      .maybeSingle();

    if (existing) return;

    // FETCH APPROVED DOCTOR FROM PROFILES
    const { data: doctor } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'doctor')
      .eq('doctor_status', 'approved')
      .limit(1)
      .maybeSingle();

    if (!doctor) return;

    await supabase.from('consultation_requests').insert({
      session_id: session.id,
      doctor_id: doctor.id,
      risk_level: risk.level,
      status: 'PENDING'
    });

  }, [risk.level, session.id]);

  useEffect(() => {
    createConsultationRequest();
  }, [createConsultationRequest]);

  /* ===============================
     PDF GENERATION
  ================================= */

  const generatePDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [["Parameter", "Value", "Status"]],
      body: [
        ["Temperature", vital.temp ?? "—", tempEval.label],
        ["Heart Rate", vital.hr ?? "—", hrEval.label],
        ["SpO₂", vital.spo2 ?? "—", spo2Eval.label],
        ["Audio", vital.audio ?? "—", "Info"],
      ],
    });

    doc.text(`Risk Level: ${riskLabel}`, 14, 100);
    doc.text(`Risk Score: ${risk.score}/100`, 14, 110);

    doc.save(`AURA_Report_${session.id}.pdf`);
  };

  /* ===============================
     UI
  ================================= */

  const vitals = [
    { icon: Thermometer, label: 'Temperature', value: vital.temp ?? '—', abnormal: tempEval.abnormal },
    { icon: HeartPulse, label: 'Heart Rate', value: vital.hr ?? '—', abnormal: hrEval.abnormal },
    { icon: Droplets, label: 'SpO₂', value: vital.spo2 ?? '—', abnormal: spo2Eval.abnormal },
    { icon: Volume2, label: 'Audio', value: vital.audio ?? '—', abnormal: false },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-lg font-bold">Clinical Report</h1>
          <p className="text-sm text-muted-foreground">
            {session.user_name} • Age {session.age}
          </p>
        </motion.div>

        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-xs uppercase tracking-wider mb-2">RISK</p>
            <p className={`text-3xl font-bold ${statusColor(risk.level)}`}>
              {riskLabel}
            </p>
            <p className="text-sm">Score: {risk.score}/100</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v) => (
            <Card key={v.label}>
              <CardContent className="flex flex-col items-center p-4">
                <v.icon className="h-6 w-6 mb-2" />
                <p className="text-xs">{v.label}</p>
                <p className={`text-xl font-bold ${v.abnormal ? "text-red-500" : ""}`}>
                  {v.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={generatePDF} className="w-full gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>

        <Button onClick={() => navigate('/new-session')} className="w-full gap-2">
          <RefreshCw className="h-4 w-4" />
          Start New Session
        </Button>

      </div>
    </div>
  );
};

export default Report;