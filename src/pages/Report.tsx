import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  AlertCircle,
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
   HELPERS
================================= */

function evaluate(value: number | null, min: number, max: number) {
  if (value == null) return { abnormal: false, label: 'Not Recorded' };
  if (value < min || value > max) return { abnormal: true, label: 'Abnormal' };
  return { abnormal: false, label: 'Normal' };
}

function calculateRisk(
  temp: ReturnType<typeof evaluate>,
  hr: ReturnType<typeof evaluate>,
  spo2: ReturnType<typeof evaluate>
) {
  let score = 0;

  if (temp.abnormal) score += 35;
  if (hr.abnormal) score += 35;
  if (spo2.abnormal) score += 30;

  let level: HealthStatus = 'GREEN';
  if (score >= 70) level = 'RED';
  else if (score >= 30) level = 'YELLOW';

  return { score, level };
}

function riskLabel(level: HealthStatus) {
  if (level === 'GREEN') return 'LOW';
  if (level === 'YELLOW') return 'MODERATE';
  return 'HIGH';
}

function riskColor(level: HealthStatus) {
  if (level === 'GREEN') return 'text-green-600';
  if (level === 'YELLOW') return 'text-yellow-500';
  return 'text-red-600';
}

/* ===============================
   COMPONENT
================================= */

const Report = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [vital, setVital] = useState<Vital | null>(
    (location.state as any)?.vital ?? null
  );
  const [session, setSession] = useState<Session | null>(
    (location.state as any)?.session ?? null
  );
  const [consultationStatus, setConsultationStatus] =
    useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  /* ===============================
     FETCH DATA
  ================================= */

  useEffect(() => {
    if (!sessionId) return;

    const fetchData = async () => {
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
  }, [sessionId]); // SAFE dependency

  /* ===============================
     AUTO CONSULT TRIGGER
     (Always defined before return)
  ================================= */

  useEffect(() => {
    if (!vital || !session) return;

    const tempEval = evaluate(
      vital.temp,
      CLINICAL_RANGES.temp.min,
      CLINICAL_RANGES.temp.max
    );
    const hrEval = evaluate(
      vital.hr,
      CLINICAL_RANGES.hr.min,
      CLINICAL_RANGES.hr.max
    );
    const spo2Eval = evaluate(
      vital.spo2,
      CLINICAL_RANGES.spo2.min,
      CLINICAL_RANGES.spo2.max
    );

    const risk = calculateRisk(tempEval, hrEval, spo2Eval);

    const isHighRisk = risk.level === 'RED';
    const shouldAutoConsult = risk.score >= 85;

    if (isHighRisk && shouldAutoConsult && consultationStatus === 'idle') {
      (async () => {
        try {
          setConsultationStatus('loading');

          const { data: existing } = await supabase
            .from('consultation_requests')
            .select('id')
            .eq('session_id', session.id)
            .maybeSingle();

          if (existing) {
            setConsultationStatus('success');
            return;
          }

          await supabase.from('consultation_requests').insert({
            session_id: session.id,
            doctor_id: null,
            risk_level: risk.level,
            status: 'PENDING',
          });

          setConsultationStatus('success');
        } catch {
          setConsultationStatus('error');
        }
      })();
    }
  }, [vital, session]); // SAFE & STABLE

  /* ===============================
     LOADING SCREEN
     (AFTER ALL HOOKS)
  ================================= */

  if (!vital || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading session...
      </div>
    );
  }

  /* ===============================
     COMPUTATION
  ================================= */

  const tempEval = evaluate(
    vital.temp,
    CLINICAL_RANGES.temp.min,
    CLINICAL_RANGES.temp.max
  );
  const hrEval = evaluate(
    vital.hr,
    CLINICAL_RANGES.hr.min,
    CLINICAL_RANGES.hr.max
  );
  const spo2Eval = evaluate(
    vital.spo2,
    CLINICAL_RANGES.spo2.min,
    CLINICAL_RANGES.spo2.max
  );

  const risk = calculateRisk(tempEval, hrEval, spo2Eval);
  const label = riskLabel(risk.level);

  const isHighRisk = risk.level === 'RED';
  const shouldAutoConsult = risk.score >= 85;

  /* ===============================
     PDF
  ================================= */

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('AURA-STETH AI Clinical Report', 14, 20);

    doc.setFontSize(11);
    doc.text(`Patient: ${session.user_name}`, 14, 35);
    doc.text(`Age: ${session.age}`, 14, 42);
    doc.text(`Gender: ${session.gender}`, 14, 49);
    doc.text(`Mode: ${session.mode}`, 14, 56);

    autoTable(doc, {
      startY: 70,
      head: [['Parameter', 'Value', 'Status']],
      body: [
        ['Temperature', `${vital.temp ?? '-'}`, tempEval.label],
        ['Heart Rate', `${vital.hr ?? '-'}`, hrEval.label],
        ['SpO₂', `${vital.spo2 ?? '-'}`, spo2Eval.label],
      ],
    });

    doc.text(`Risk Level: ${label}`, 14, 130);
    doc.text(`Risk Score: ${risk.score}/100`, 14, 138);

    doc.save(`AURA_Report_${session.id}.pdf`);
  };

  /* ===============================
     UI
  ================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold">Clinical Report</h1>
          <p className="text-sm text-slate-500">
            {session.user_name} • Age {session.age}
          </p>
        </motion.div>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-xs text-slate-400">RISK ASSESSMENT</p>
            <p className={`text-4xl font-bold ${riskColor(risk.level)}`}>
              {label}
            </p>
            <p className="text-sm mt-1">Score: {risk.score}/100</p>

            {consultationStatus === 'success' && (
              <div className="flex justify-center mt-3 text-green-600 text-xs">
                <CheckCircle className="h-4 w-4 mr-1" />
                Consultation recorded
              </div>
            )}

            {consultationStatus === 'error' && (
              <div className="flex justify-center mt-3 text-red-600 text-xs">
                <AlertCircle className="h-4 w-4 mr-1" />
                Consultation failed
              </div>
            )}
          </CardContent>
        </Card>

        {isHighRisk && !shouldAutoConsult && consultationStatus === 'idle' && (
          <Button
            onClick={() =>
              supabase.from('consultation_requests').insert({
                session_id: session.id,
                doctor_id: null,
                risk_level: risk.level,
                status: 'PENDING',
              })
            }
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Request Consultation
          </Button>
        )}

        <Button onClick={generatePDF} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>

        <Button
          onClick={() => navigate('/new-session')}
          className="w-full bg-slate-900 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Start New Session
        </Button>

      </div>
    </div>
  );
};

export default Report;