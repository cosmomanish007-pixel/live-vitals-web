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
   EVALUATION ENGINE
========================================================= */

function evaluate(value: number | null, min: number, max: number) {
  if (value == null) return { abnormal: false, label: 'Not Recorded' };
  if (value < min || value > max) return { abnormal: true, label: 'Abnormal' };
  return { abnormal: false, label: 'Normal' };
}

function calculateRisk(temp: any, hr: any, spo2: any) {
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

    if (!vital) {
      supabase
        .from('vitals')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setVital(data);
        });
    }

    if (!session) {
      supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setSession(data);
        });
    }
  }, [sessionId, vital, session]);

  if (!vital || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading session...
      </div>
    );
  }

  /* =========================================================
     EVALUATION + RISK (ALL HOOK SAFE)
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
     CONSULTATION REQUEST
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
  }, [session, consultationStatus, risk.level]);

  /* =========================================================
     AUTO TRIGGER
  ========================================================= */

  useEffect(() => {
    if (isHighRisk && shouldAutoConsult && consultationStatus === 'idle') {
      createConsultationRequest();
    }
  }, [isHighRisk, shouldAutoConsult, consultationStatus, createConsultationRequest]);

  /* =========================================================
     PDF GENERATION (MEDICAL GRADE)
  ========================================================= */

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('AURA-STETH AI', 14, 16);

    doc.setFontSize(10);
    doc.text('Advanced Clinical Monitoring Report', 14, 23);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    let y = 40;

    doc.text(`Patient: ${session.user_name}`, 14, y); y += 6;
    doc.text(`Age: ${session.age}`, 14, y); y += 6;
    doc.text(`Gender: ${session.gender}`, 14, y); y += 6;
    doc.text(`Mode: ${session.mode}`, 14, y); y += 6;
    doc.text(`Session ID: ${session.id}`, 14, y);

    autoTable(doc, {
      startY: 75,
      head: [['Parameter', 'Measured', 'Clinical Range', 'Status']],
      body: [
        ['Temperature', `${vital.temp ?? '-'}`, '31 – 37.5 °C', tempEval.label],
        ['Heart Rate', `${vital.hr ?? '-'}`, '60 – 100 bpm', hrEval.label],
        ['SpO₂', `${vital.spo2 ?? '-'}`, '80 – 100 %', spo2Eval.label],
        ['Audio Peak', `${vital.audio ?? '-'}`, 'N/A', 'Info'],
      ],
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.text(`Risk Level: ${label}`, 14, 140);
    doc.text(`Risk Score: ${risk.score}/100`, 14, 148);

    doc.setFontSize(8);
    doc.text(
      'Confidential Medical Document • Generated by AURA-STETH AI • Not a substitute for professional diagnosis',
      pageWidth / 2,
      285,
      { align: 'center' }
    );

    doc.save(`AURA_Report_${session.id}.pdf`);
  };

  /* =========================================================
     UI
  ========================================================= */

  const vitals = [
    { icon: Thermometer, label: 'Temperature', value: `${vital.temp ?? '-'}°C`, abnormal: tempEval.abnormal },
    { icon: HeartPulse, label: 'Heart Rate', value: `${vital.hr ?? '-'} bpm`, abnormal: hrEval.abnormal },
    { icon: Droplets, label: 'SpO₂', value: `${vital.spo2 ?? '-'}%`, abnormal: spo2Eval.abnormal },
    { icon: Volume2, label: 'Audio', value: `${vital.audio ?? '-'}`, abnormal: false },
  ];

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
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v) => (
            <Card key={v.label} className={v.abnormal ? 'border-2 border-red-500' : ''}>
              <CardContent className="p-4 text-center">
                <v.icon className="h-6 w-6 mb-2 mx-auto" />
                <p className="text-xs">{v.label}</p>
                <p className="text-xl font-bold">{v.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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