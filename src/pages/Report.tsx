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
  temp: { min: 31, max: 37.5, unit: "°C" },
  hr: { min: 60, max: 100, unit: "bpm" },
  spo2: { min: 80, max: 100, unit: "%" },
};

/* ===============================
   EVALUATION ENGINE
================================= */

function evaluateValue(value: number | null | undefined, min: number, max: number) {
  if (value == null) return { label: "Not Recorded", abnormal: false };

  if (value < min || value > max)
    return { label: "Abnormal", abnormal: true };

  return { label: "Normal", abnormal: false };
}

/* ===============================
   RISK ENGINE
================================= */

function calculateRisk(
  tempEval: any,
  hrEval: any,
  spo2Eval: any
) {

  let score = 0;

  if (tempEval.abnormal) score += 35;
  if (hrEval.abnormal) score += 35;
  if (spo2Eval.abnormal) score += 30;

  let level: HealthStatus = "GREEN";

  if (score >= 70) level = "RED";
  else if (score >= 30) level = "YELLOW";
  else level = "GREEN";

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
     EVALUATION
  ================================= */

  const tempEval = evaluateValue(vital.temp, CLINICAL_RANGES.temp.min, CLINICAL_RANGES.temp.max);
  const hrEval = evaluateValue(vital.hr, CLINICAL_RANGES.hr.min, CLINICAL_RANGES.hr.max);
  const spo2Eval = evaluateValue(vital.spo2, CLINICAL_RANGES.spo2.min, CLINICAL_RANGES.spo2.max);

  const risk = calculateRisk(tempEval, hrEval, spo2Eval);

  /* ===============================
    HYBRID CONSULTATION LOGIC
  ================================= */

  const isHighRisk = risk.level === "RED";
  const shouldAutoConsult = risk.score >= 85;

  const createConsultationRequest = useCallback(async () => {
    if (!session) return;

    const { data: existing } = await supabase
      .from("consultation_requests")
      .select("id")
      .eq("session_id", session.id)
      .maybeSingle();

    if (existing) return;

    const { data: doctor } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "doctor")
      .eq("doctor_status", "approved")
      .eq("is_available", true)
      .limit(1)
      .maybeSingle();

    if (!doctor) return;

    await supabase.from("consultation_requests").insert({
      session_id: session.id,
      doctor_id: doctor.id,
      risk_level: risk.level,
      status: "PENDING",
    });

  }, [session, risk.level]);

  useEffect(() => {
    if (isHighRisk && shouldAutoConsult) {
      createConsultationRequest();
    }
  }, [isHighRisk, shouldAutoConsult, createConsultationRequest]);

 /* ===============================
    HYBRID CONSULTATION LOGIC
  ================================= */

  const riskLabel =
    risk.level === "GREEN"
      ? "LOW"
      : risk.level === "YELLOW"
      ? "MODERATE"
      : "HIGH";

  const dataQuality =
    vital.temp != null && vital.hr != null && vital.spo2 != null
      ? "GOOD"
      : "PARTIAL";

  /* ===============================
     PDF GENERATION
  ================================= */

  const generatePDF = () => {

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    /* HEADER */
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

    doc.text(`Patient: ${session.user_name}`, 14, y); y += 6;
    doc.text(`Age: ${session.age} | Gender: ${session.gender}`, 14, y); y += 6;
    doc.text(`Mode: ${session.mode}`, 14, y); y += 6;
    doc.text(`Session ID: ${session.id}`, 14, y); y += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);

    y += 12;

    /* TABLE */

    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Measured", "Clinical Range", "Flag"]],
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
          "Info",
        ],
      ],
      didParseCell: function (data) {
        if (data.column.index === 3 && data.cell.raw === "Abnormal") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        }
      },
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;

    /* RISK SECTION */

    doc.setFontSize(13);
    doc.text("Clinical Risk Assessment", 14, finalY);
    finalY += 8;

    const barWidth = pageWidth - 28;
    const filledWidth = (risk.score / 100) * barWidth;

    // background
    doc.setFillColor(230, 230, 230);
    doc.rect(14, finalY, barWidth, 8, "F");

    // filled
    if (risk.level === "GREEN") doc.setFillColor(22, 163, 74);
    else if (risk.level === "YELLOW") doc.setFillColor(234, 179, 8);
    else doc.setFillColor(220, 38, 38);

    doc.rect(14, finalY, filledWidth, 8, "F");

    finalY += 15;

    doc.setFontSize(11);
    doc.text(`Risk Level: ${riskLabel}`, 14, finalY); finalY += 6;
    doc.text(`Risk Score: ${risk.score}/100`, 14, finalY); finalY += 6;
    doc.text(`Data Quality: ${dataQuality}`, 14, finalY); finalY += 10;

    const interpretation =
      risk.level === "RED"
        ? "Critical physiological deviations detected. Immediate medical consultation recommended."
        : risk.level === "YELLOW"
        ? "Some parameters outside normal range. Monitoring recommended."
        : "Vitals within acceptable physiological limits.";

    doc.text(doc.splitTextToSize(interpretation, pageWidth - 28), 14, finalY);

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
    { icon: Thermometer, label: 'Temperature', value: vital.temp != null ? `${vital.temp}°C` : '—', abnormal: tempEval.abnormal },
    { icon: HeartPulse, label: 'Heart Rate', value: vital.hr != null ? `${vital.hr} bpm` : '—', abnormal: hrEval.abnormal },
    { icon: Droplets, label: 'SpO₂', value: vital.spo2 != null ? `${vital.spo2}%` : '—', abnormal: spo2Eval.abnormal },
    { icon: Volume2, label: 'Audio', value: vital.audio != null ? `${vital.audio}` : '—', abnormal: false },
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
            <p className="text-xs uppercase tracking-wider mb-2">RISK ASSESSMENT</p>
            <p className={`text-3xl font-bold ${statusColor(risk.level)}`}>
              {riskLabel}
            </p>
            <p className="text-sm mt-1">Score: {risk.score}/100</p>
            <p className="text-xs text-muted-foreground mt-1">
              Data Quality: {dataQuality}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v) => (
            <Card key={v.label} className={v.abnormal ? "border-2 border-red-500" : ""}>
              <CardContent className="flex flex-col items-center p-4 text-center">
                <v.icon className="h-6 w-6 mb-2" />
                <p className="text-xs mb-1">{v.label}</p>
                <p className={`text-xl font-bold ${v.abnormal ? "text-red-500" : ""}`}>
                  {v.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      
      {/* HYBRID CONSULT UI */}

      {isHighRisk && shouldAutoConsult && (
        <Card className="border-2 border-red-500">
          <CardContent className="p-4 text-center space-y-2">
            <p className="text-sm font-semibold text-red-600">
              Emergency consultation automatically initiated.
            </p>
            <p className="text-xs text-muted-foreground">
              A doctor has been notified immediately.
            </p>
          </CardContent>
        </Card>
      )}

      {isHighRisk && !shouldAutoConsult && (
        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          onClick={createConsultationRequest}
        >
          Request Immediate Doctor Consultation
        </Button>
      )}

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