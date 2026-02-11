import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer,
  HeartPulse,
  Droplets,
  Volume2,
  RefreshCw,
  Download,
  Stethoscope,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session, HealthStatus } from '@/types/database';
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
  if (value == null) return { abnormal: false };
  return { abnormal: value < min || value > max };
}

/* ===============================
   RISK ENGINE
================================= */

function calculateRisk(temp: any, hr: any, spo2: any) {
  let score = 0;
  if (temp.abnormal) score += 35;
  if (hr.abnormal) score += 35;
  if (spo2.abnormal) score += 30;

  let level: HealthStatus = "GREEN";
  if (score >= 70) level = "RED";
  else if (score >= 30) level = "YELLOW";

  return { score, level };
}

function statusColor(status: HealthStatus) {
  if (status === "GREEN") return "text-green-600";
  if (status === "YELLOW") return "text-yellow-500";
  return "text-red-600";
}

/* ===============================
   COMPONENT
================================= */

const Report = () => {

  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [vital, setVital] = useState<Vital | null>((location.state as any)?.vital ?? null);
  const [session, setSession] = useState<Session | null>((location.state as any)?.session ?? null);

  const [consultationStatus, setConsultationStatus] =
    useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  /* ===============================
     FETCH SESSION DATA
  ================================= */

  useEffect(() => {

    if (!vital && sessionId) {
      supabase.from('vitals')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setVital(data);
        });
    }

    if (!session && sessionId) {
      supabase.from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setSession(data);
        });
    }

  }, [sessionId, vital, session]);

  if (!vital || !session) return null;

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

  const isHighRisk = risk.level === "RED";
  const shouldAutoConsult = risk.score >= 85;

  /* ===============================
     CONSULTATION REQUEST
  ================================= */

  const createConsultationRequest = useCallback(async () => {

    if (!session || consultationStatus !== 'idle') return;

    try {
      setConsultationStatus('loading');

      // Check existing
      const { data: existing } = await supabase
        .from("consultation_requests")
        .select("id")
        .eq("session_id", session.id)
        .maybeSingle();

      if (existing) {
        setConsultationStatus('success');
        return;
      }

      // Find available doctor
      const { data: doctor } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "doctor")
        .eq("doctor_status", "approved")
        .eq("is_available", true)
        .limit(1)
        .maybeSingle();

      const doctorId = doctor?.id ?? null;

      const { error } = await supabase
        .from("consultation_requests")
        .insert({
          session_id: session.id,
          doctor_id: doctorId,
          risk_level: risk.level,
          status: "PENDING",
        })
        .select();

      if (error) throw error;

      setConsultationStatus('success');

    } catch (err) {
      console.error("Consultation Error:", err);
      setConsultationStatus('error');
    }

  }, [session, risk.level, consultationStatus]);

  /* ===============================
     AUTO TRIGGER
  ================================= */

  useEffect(() => {
    if (isHighRisk && shouldAutoConsult && consultationStatus === 'idle') {
      createConsultationRequest();
    }
  }, [isHighRisk, shouldAutoConsult, consultationStatus, createConsultationRequest]);

  /* ===============================
     PDF GENERATION (REAL)
  ================================= */

  const generatePDF = () => {

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("AURA-STETH AI Clinical Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`Patient: ${session.user_name}`, 14, 35);
    doc.text(`Age: ${session.age}`, 14, 42);
    doc.text(`Gender: ${session.gender}`, 14, 49);
    doc.text(`Session ID: ${session.id}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [["Parameter", "Value", "Range"]],
      body: [
        ["Temperature", `${vital.temp} °C`, "31 – 37.5"],
        ["Heart Rate", `${vital.hr} bpm`, "60 – 100"],
        ["SpO₂", `${vital.spo2}%`, "80 – 100"],
      ],
    });

    doc.text(`Risk Level: ${riskLabel}`, 14, 120);
    doc.text(`Risk Score: ${risk.score}/100`, 14, 128);

    doc.save(`AURA_Report_${session.id}.pdf`);
  };

  /* ===============================
     UI
  ================================= */

  const vitals = [
    { icon: Thermometer, label: "Temperature", value: `${vital.temp}°C`, abnormal: tempEval.abnormal },
    { icon: HeartPulse, label: "Heart Rate", value: `${vital.hr} bpm`, abnormal: hrEval.abnormal },
    { icon: Droplets, label: "SpO₂", value: `${vital.spo2}%`, abnormal: spo2Eval.abnormal },
    { icon: Volume2, label: "Audio", value: vital.audio ?? "—", abnormal: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <h1 className="text-xl font-bold">Clinical Report</h1>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-xs text-slate-400">RISK ASSESSMENT</p>
            <p className={`text-4xl font-bold ${statusColor(risk.level)}`}>
              {riskLabel}
            </p>
            <p className="text-sm mt-1">Score: {risk.score}/100</p>

            {consultationStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 mt-4 text-green-600 text-xs">
                <CheckCircle className="h-4 w-4" />
                Consultation Request Sent
              </div>
            )}

            {consultationStatus === 'error' && (
              <div className="flex items-center justify-center gap-2 mt-4 text-red-600 text-xs">
                <AlertCircle className="h-4 w-4" />
                Failed to Create Consultation
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v) => (
            <Card key={v.label} className={v.abnormal ? "border-2 border-red-500" : ""}>
              <CardContent className="p-4 text-center">
                <v.icon className="h-6 w-6 mb-2 mx-auto" />
                <p className="text-xs">{v.label}</p>
                <p className="text-xl font-bold">{v.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isHighRisk && !shouldAutoConsult && consultationStatus === 'idle' && (
          <Button onClick={createConsultationRequest} className="w-full bg-red-600 hover:bg-red-700 text-white">
            <Stethoscope className="h-4 w-4 mr-2" />
            Request Immediate Consultation
          </Button>
        )}

        <Button onClick={generatePDF} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Clinical PDF
        </Button>

        <Button onClick={() => navigate('/new-session')} className="w-full bg-slate-900 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Start New Session
        </Button>

      </div>
    </div>
  );
};

export default Report;