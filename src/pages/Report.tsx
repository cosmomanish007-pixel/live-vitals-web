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
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session, HealthStatus } from '@/types/database';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* =========================================================
   CLINICAL RANGES
========================================================= */

const CLINICAL_RANGES = {
  temp: { min: 31, max: 37.5 },
  hr: { min: 60, max: 100 },
  spo2: { min: 80, max: 100 },
};

/* =========================================================
   EVALUATION
========================================================= */

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

/* =========================================================
   COMPONENT
========================================================= */

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

  /* =========================================================
     FETCH DATA
  ========================================================= */

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
  }, [sessionId]);

  /* =========================================================
     CONSULTATION INSERT
  ========================================================= */

  const createConsultationRequest = useCallback(async () => {
    if (!session || consultationStatus !== 'idle') return;

    try {
      setConsultationStatus('loading');

      const { error } = await supabase
        .from('consultation_requests')
        .insert({
          session_id: session.id,
          doctor_id: null,
          risk_level: risk.level,
          status: 'PENDING',
          doctor_notes: null,
        });

      if (error) throw error;

      setConsultationStatus('success');
    } catch (err) {
      console.error(err);
      setConsultationStatus('error');
    }
  }, [session, consultationStatus]);

  /* =========================================================
     WAIT FOR DATA
  ========================================================= */

  if (!vital || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading session...
      </div>
    );
  }

  /* =========================================================
     CALCULATIONS
  ========================================================= */

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

  /* =========================================================
     AUTO TRIGGER
  ========================================================= */

  useEffect(() => {
    if (isHighRisk && shouldAutoConsult && consultationStatus === 'idle') {
      createConsultationRequest();
    }
  }, [isHighRisk, shouldAutoConsult, consultationStatus, createConsultationRequest]);

  /* =========================================================
     PDF
  ========================================================= */

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('AURA-STETH AI', 14, 15);
    doc.setFontSize(10);
    doc.text('Advanced Clinical Monitoring Report', 14, 22);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    let y = 40;

    doc.text(`Patient: ${session.user_name}`, 14, y); y += 6;
    doc.text(`Age: ${session.age} | Gender: ${session.gender}`, 14, y); y += 6;
    doc.text(`Mode: ${session.mode}`, 14, y); y += 6;
    doc.text(`Session ID: ${session.id}`, 14, y); y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Parameter', 'Measured', 'Clinical Range', 'Flag']],
      body: [
        ['Temperature', `${vital.temp ?? '-'}`, '31 – 37.5 °C', tempEval.label],
        ['Heart Rate', `${vital.hr ?? '-'}`, '60 – 100 bpm', hrEval.label],
        ['SpO₂', `${vital.spo2 ?? '-'}`, '80 – 100 %', spo2Eval.label],
        ['Audio Peak', `${vital.audio ?? '-'}`, 'N/A', 'Info'],
      ],
      headStyles: { fillColor: [37, 99, 235] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.text('Clinical Risk Assessment', 14, finalY);

    const barWidth = pageWidth - 40;
    const riskWidth = (risk.score / 100) * barWidth;

    doc.setFillColor(220, 220, 220);
    doc.rect(14, finalY + 5, barWidth, 8, 'F');

    if (risk.level === 'GREEN') doc.setFillColor(34, 197, 94);
    if (risk.level === 'YELLOW') doc.setFillColor(234, 179, 8);
    if (risk.level === 'RED') doc.setFillColor(220, 38, 38);

    doc.rect(14, finalY + 5, riskWidth, 8, 'F');

    doc.text(`Risk Level: ${label}`, 14, finalY + 20);
    doc.text(`Risk Score: ${risk.score}/100`, 14, finalY + 27);

    doc.save(`AURA_Report_${session.id}.pdf`);
  };

  /* =========================================================
     UI
  ========================================================= */

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
              <div className="flex items-center justify-center gap-2 mt-3 text-green-600 text-xs">
                <CheckCircle className="h-4 w-4" />
                Consultation request recorded
              </div>
            )}

            {consultationStatus === 'error' && (
              <div className="flex items-center justify-center gap-2 mt-3 text-red-600 text-xs">
                <AlertCircle className="h-4 w-4" />
                Failed to create consultation
              </div>
            )}
          </CardContent>
        </Card>

        {isHighRisk && !shouldAutoConsult && consultationStatus === 'idle' && (
          <Button
            onClick={createConsultationRequest}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Request Immediate Consultation
          </Button>
        )}

        <Button onClick={generatePDF} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Clinical PDF
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