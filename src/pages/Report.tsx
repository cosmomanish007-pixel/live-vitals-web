import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session, HealthStatus } from '@/types/database';
import { Thermometer, HeartPulse, Droplets, Volume2, RefreshCw, Download } from 'lucide-react';
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

const Report = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [vital, setVital] = useState<Vital | null>((location.state as any)?.vital ?? null);
  const [session, setSession] = useState<Session | null>((location.state as any)?.session ?? null);
  const [consultationCreated, setConsultationCreated] = useState(false);
  const [loadingConsultation, setLoadingConsultation] = useState(false);

  /* ===============================
     FETCH DATA
  ================================= */

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;

      if (!vital) {
        const { data } = await supabase
          .from('vitals')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) setVital(data);
      }

      if (!session) {
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (data) setSession(data);
      }
    };

    fetchData();
  }, [sessionId]);

  if (!vital || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  /* ===============================
     RISK
  ================================= */

  const tempEval = evaluateValue(vital.temp, CLINICAL_RANGES.temp.min, CLINICAL_RANGES.temp.max);
  const hrEval = evaluateValue(vital.hr, CLINICAL_RANGES.hr.min, CLINICAL_RANGES.hr.max);
  const spo2Eval = evaluateValue(vital.spo2, CLINICAL_RANGES.spo2.min, CLINICAL_RANGES.spo2.max);

  const risk = calculateRisk(tempEval, hrEval, spo2Eval);
  const riskLabel =
    risk.level === "GREEN" ? "LOW" :
    risk.level === "YELLOW" ? "MODERATE" : "HIGH";

  /* ===============================
     CONSULTATION LOGIC (HYBRID)
  ================================= */

  const createConsultation = useCallback(async () => {
    if (!session) return;
    if (risk.level !== "RED") return;

    setLoadingConsultation(true);

    const { data: existing } = await supabase
      .from("consultation_requests")
      .select("id")
      .eq("session_id", session.id)
      .maybeSingle();

    if (existing) {
      setConsultationCreated(true);
      setLoadingConsultation(false);
      return;
    }

    const { data: doctor } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "doctor")
      .eq("doctor_status", "approved")
      .eq("is_available", true)
      .limit(1)
      .maybeSingle();

    if (!doctor) {
      setLoadingConsultation(false);
      return;
    }

    await supabase.from("consultation_requests").insert({
      session_id: session.id,
      doctor_id: doctor.id,
      risk_level: risk.level,
      status: "PENDING"
    });

    setConsultationCreated(true);
    setLoadingConsultation(false);

  }, [session, risk.level]);

  useEffect(() => {
    if (risk.level === "RED") {
      createConsultation();
    }
  }, [risk.level]);

  /* ===============================
     PDF
  ================================= */

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("AURA-STETH AI - Clinical Report", 14, 15);
    doc.text(`Patient: ${session.user_name}`, 14, 25);
    doc.text(`Risk Level: ${riskLabel}`, 14, 35);
    doc.save(`AURA_Report_${session.id}.pdf`);
  };

  /* ===============================
     UI
  ================================= */

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <h1 className="text-xl font-bold">Clinical Report</h1>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm uppercase">Risk Assessment</p>
            <p className="text-3xl font-bold">{riskLabel}</p>
            <p className="text-sm">Score: {risk.score}/100</p>
          </CardContent>
        </Card>

        {/* 🔴 HIGH RISK HYBRID UI */}
        {risk.level === "RED" && (
          <Card className="border-red-500 border-2">
            <CardContent className="p-5 space-y-3 text-center">
              <p className="font-semibold text-red-600">
                ⚠ High Risk Detected
              </p>

              {consultationCreated ? (
                <p className="text-sm text-muted-foreground">
                  Doctor consultation initiated.
                </p>
              ) : (
                <Button
                  onClick={createConsultation}
                  disabled={loadingConsultation}
                  className="w-full"
                >
                  {loadingConsultation ? "Connecting..." : "Consult Doctor Now"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Button onClick={generatePDF} className="w-full">
          Download Clinical PDF
        </Button>

        <Button onClick={() => navigate('/new-session')} className="w-full" variant="secondary">
          Start New Session
        </Button>

      </div>
    </div>
  );
};

export default Report;