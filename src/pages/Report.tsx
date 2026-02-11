import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session, HealthStatus } from '@/types/database';
import { Thermometer, HeartPulse, Droplets, Volume2, RefreshCw, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ===============================
   UPDATED CLINICAL RANGES
================================= */

const CLINICAL_RANGES = {
  temp: { min: 31, max: 37.5, unit: "°C" },
  hr: { min: 60, max: 100, unit: "bpm" },
  spo2: { min: 80, max: 100, unit: "%" },
};

/* ===============================
   MEDICAL EVALUATION ENGINE
================================= */

function evaluateValue(value: number | null | undefined, min: number, max: number) {
  if (value == null) return { label: "Not Recorded", severity: 0 };

  if (value < min) return { label: "Low", severity: 2 };
  if (value > max) return { label: "High", severity: 2 };

  return { label: "Normal", severity: 0 };
}

/* ===============================
   DERIVE OVERALL STATUS
================================= */

function deriveOverallStatus(
  tempEval: any,
  hrEval: any,
  spo2Eval: any
): HealthStatus {

  const severities = [tempEval.severity, hrEval.severity, spo2Eval.severity];
  const maxSeverity = Math.max(...severities);

  if (maxSeverity === 2) return "RED";
  if (maxSeverity === 1) return "YELLOW";
  return "GREEN";
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
  const location = useLocation();
  const navigate = useNavigate();

  const [vital, setVital] = useState<Vital | null>((location.state as any)?.vital ?? null);
  const [session, setSession] = useState<Session | null>((location.state as any)?.session ?? null);

  useEffect(() => {

    if (!vital && sessionId) {
      supabase.from('vitals')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => { if (data) setVital(data as Vital); });
    }

    if (!session && sessionId) {
      supabase.from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
        .then(({ data }) => { if (data) setSession(data as Session); });
    }

  }, [sessionId, vital, session]);

  if (!vital || !session) return null;

  /* ===============================
     EVALUATE VALUES
  ================================= */

  const tempEval = evaluateValue(vital.temp, CLINICAL_RANGES.temp.min, CLINICAL_RANGES.temp.max);
  const hrEval = evaluateValue(vital.hr, CLINICAL_RANGES.hr.min, CLINICAL_RANGES.hr.max);
  const spo2Eval = evaluateValue(vital.spo2, CLINICAL_RANGES.spo2.min, CLINICAL_RANGES.spo2.max);

  const overallStatus = deriveOverallStatus(tempEval, hrEval, spo2Eval);

  /* ===============================
     PDF GENERATION
  ================================= */

  const generatePDF = () => {

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("AURA-STETH AI", 14, 15);
    doc.setFontSize(10);
    doc.text("Advanced Clinical Monitoring Report", 14, 22);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    let y = 40;

    doc.text(`Patient Name: ${session.user_name}`, 14, y); y += 6;
    doc.text(`Age: ${session.age}`, 14, y); y += 6;
    doc.text(`Gender: ${session.gender}`, 14, y); y += 6;
    doc.text(`Mode: ${session.mode}`, 14, y); y += 6;
    doc.text(`Session ID: ${session.id}`, 14, y); y += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);

    y += 12;

    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Measured", "Clinical Range", "Status"]],
      body: [
        [
          "Temperature",
          vital.temp != null ? `${vital.temp} °C` : "—",
          `${CLINICAL_RANGES.temp.min} – ${CLINICAL_RANGES.temp.max} °C`,
          tempEval.label,
        ],
        [
          "Heart Rate",
          vital.hr != null ? `${vital.hr} bpm` : "—",
          `${CLINICAL_RANGES.hr.min} – ${CLINICAL_RANGES.hr.max} bpm`,
          hrEval.label,
        ],
        [
          "SpO₂",
          vital.spo2 != null ? `${vital.spo2}%` : "—",
          `${CLINICAL_RANGES.spo2.min} – ${CLINICAL_RANGES.spo2.max} %`,
          spo2Eval.label,
        ],
        [
          "Audio Peak",
          vital.audio ?? "—",
          "N/A",
          "Informational",
        ],
      ],
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    doc.setDrawColor(0);
    doc.rect(14, finalY, pageWidth - 28, 30);

    doc.setFontSize(12);
    doc.text("Clinical Interpretation", 18, finalY + 8);

    doc.setFontSize(10);

    const interpretation =
      overallStatus === "RED"
        ? "Critical deviation detected in one or more physiological parameters. Immediate medical consultation is strongly recommended."
        : overallStatus === "YELLOW"
        ? "Borderline physiological values observed. Continuous monitoring advised."
        : "All measured parameters fall within acceptable physiological limits.";

    doc.text(
      doc.splitTextToSize(interpretation, pageWidth - 36),
      18,
      finalY + 18
    );

    doc.setFontSize(8);
    doc.text(
      "Confidential Medical Document • Generated by AURA-STETH AI • Not a substitute for professional diagnosis",
      pageWidth / 2,
      285,
      { align: "center" }
    );

    doc.save(`AURA_Report_${session.id}.pdf`);
  };

  /* ===============================
     UI
  ================================= */

  const vitals = [
    { icon: Thermometer, label: 'Temperature', value: vital.temp != null ? `${vital.temp}°C` : '—' },
    { icon: HeartPulse, label: 'Heart Rate', value: vital.hr != null ? `${vital.hr} bpm` : '—' },
    { icon: Droplets, label: 'SpO₂', value: vital.spo2 != null ? `${vital.spo2}%` : '—' },
    { icon: Volume2, label: 'Audio', value: vital.audio != null ? `${vital.audio}` : '—' },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg font-bold">Clinical Report</h1>
          <p className="text-sm text-muted-foreground">
            {session.user_name} • Age {session.age}
          </p>
        </motion.div>

        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-xs uppercase tracking-wider mb-2">Overall Health Status</p>
            <p className={`text-2xl font-bold ${statusColor(overallStatus)}`}>
              {overallStatus}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v) => (
            <Card key={v.label}>
              <CardContent className="flex flex-col items-center p-4 text-center">
                <v.icon className="h-6 w-6 mb-2" />
                <p className="text-xs mb-1">{v.label}</p>
                <p className="text-xl font-bold">{v.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={generatePDF} className="w-full gap-2">
          <Download className="h-4 w-4" />
          Download Clinical PDF
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