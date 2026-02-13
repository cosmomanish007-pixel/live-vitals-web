import { useAuth } from "@/hooks/useAuth";
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

function calculateRisk(tempEval: any, hrEval: any, spo2Eval: any) {

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
  const { user } = useAuth();
  const [vital, setVital] = useState<Vital | null>((location.state as any)?.vital ?? null);
  const [session, setSession] = useState<Session | null>((location.state as any)?.session ?? null);

  /* NEW SAFE STATES */
  const [creatingConsultation, setCreatingConsultation] = useState(false);
  const [consultationCreated, setConsultationCreated] = useState(false);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [doctorResult, setDoctorResult] = useState<any>(null);
  const [consultationCompleted, setConsultationCompleted] = useState(false);
  const [consultation, setConsultation] = useState<any | null>(null);
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

  useEffect(() => {
    if (!user) return;

    const fetchRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (data) setProfileRole(data.role);
    };

    fetchRole();
  }, [user]);

/* ===============================
  CONSULTATION REPORT 
================================= */

   
useEffect(() => {
  if (!session) return;

  const fetchDoctorResult = async () => {
    const { data } = await supabase
      .from("consultation_requests")
      .select("*")
      .eq("session_id", session.id)
      .eq("status", "COMPLETED")
      .maybeSingle();

    if (data) {
      setDoctorResult(data);
      setConsultationCompleted(true);
    }
  };

  fetchDoctorResult();
}, [session]);
/* ===============================
   RLS DEBUG TEST (TEMPORARY)
================================= */

  useEffect(() => {
    const testProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      console.log("Profiles visible to current user:", data);
      console.log("Error:", error);
    };

    testProfiles();
  }, []);

  if (!vital || !session) return null;

  /* ===============================
     EVALUATION
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

  const dataQuality =
    vital.temp != null && vital.hr != null && vital.spo2 != null
      ? "GOOD"
      : "PARTIAL";

  /* ===============================
     MANUAL CONSULTATION (SAFE)
  ================================= */

  const handleConsultationRequest = async () => {
    try {
      setCreatingConsultation(true);

      const { data: existing } = await supabase
        .from("consultation_requests")
        .select("id")
        .eq("session_id", session.id)
        .maybeSingle();

      if (existing) {
        setConsultationCreated(true);
        setCreatingConsultation(false);
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
        alert("No doctors available right now.");
        setCreatingConsultation(false);
        return;
      }

      await supabase.from("consultation_requests").insert({
        session_id: session.id,
        doctor_id: doctor.id,
        risk_level: risk.level,
        status: "PENDING",
      });

      setConsultationCreated(true);
      alert("Consultation request sent.");

    } catch (error) {
      console.error(error);
    } finally {
      setCreatingConsultation(false);
    }
  };

  /* ===============================
     PDF GENERATION (UNCHANGED)
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

    doc.text(`Patient: ${session.user_name}`, 14, y); y += 6;
    doc.text(`Age: ${session.age} | Gender: ${session.gender}`, 14, y); y += 6;
    doc.text(`Mode: ${session.mode}`, 14, y); y += 6;
    doc.text(`Session ID: ${session.id}`, 14, y); y += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);

    y += 12;

    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Measured", "Clinical Range", "Flag"]],
      body: [
        ["Temperature", vital.temp != null ? `${vital.temp} °C` : "—",
          `${CLINICAL_RANGES.temp.min} – ${CLINICAL_RANGES.temp.max} °C`,
          tempEval.label],
        ["Heart Rate", vital.hr != null ? `${vital.hr} bpm` : "—",
          `${CLINICAL_RANGES.hr.min} – ${CLINICAL_RANGES.hr.max} bpm`,
          hrEval.label],
        ["SpO₂", vital.spo2 != null ? `${vital.spo2}%` : "—",
          `${CLINICAL_RANGES.spo2.min} – ${CLINICAL_RANGES.spo2.max} %`,
          spo2Eval.label],
        ["Audio Peak", vital.audio ?? "—", "N/A", "Info"],
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

    doc.setFontSize(12);
    doc.text("Clinical Interpretation", 14, finalY);
    finalY += 8;

    const interpretation =
      risk.level === "RED"
        ? "Critical physiological deviations detected. Immediate medical consultation recommended."
        : risk.level === "YELLOW"
        ? "Some parameters outside normal range. Monitoring recommended."
        : "Vitals within acceptable physiological limits.";

    doc.text(
      doc.splitTextToSize(interpretation, pageWidth - 28),
      14,
      finalY
    );
    doc.save(`AURA_Report_${session.id}.pdf`);
  };

   const generatePrescriptionPDF = () => {
     if (!doctorResult) return;
   
     const doc = new jsPDF();
     const pageWidth = doc.internal.pageSize.getWidth();
   
     /* HEADER */
     doc.setFillColor(22, 163, 74);
     doc.rect(0, 0, pageWidth, 28, "F");
   
     doc.setTextColor(255, 255, 255);
     doc.setFontSize(16);
     doc.text("Official Medical Prescription", 14, 18);
   
     doc.setTextColor(0, 0, 0);
     doc.setFontSize(11);
   
     let y = 40;
   
     /* PATIENT INFO */
     doc.text(`Patient Name: ${session?.user_name}`, 14, y); y += 6;
     doc.text(`Age: ${session?.age}`, 14, y); y += 6;
     doc.text(`Session ID: ${session?.id}`, 14, y); y += 6;
     doc.text(
       `Consultation Date: ${new Date(doctorResult.completed_at).toLocaleString()}`,
       14,
       y
     );
   
     y += 12;
   
     /* DOCTOR NOTES */
     doc.setFontSize(13);
     doc.text("Doctor Notes", 14, y);
     y += 8;
   
     doc.setFontSize(11);
     doc.text(
       doc.splitTextToSize(
         doctorResult.doctor_notes || "No notes provided.",
         pageWidth - 28
       ),
       14,
       y
     );
   
     y += 20;
   
     /* PRESCRIPTION TABLE */
     doc.setFontSize(13);
     doc.text("Prescribed Medication", 14, y);
     y += 8;
   
     autoTable(doc, {
     startY: y,
     head: [["Medicine", "Dosage", "Frequency", "Duration"]],
     body: doctorResult.prescription_items?.map((med: any) => [
       med.name,
       med.dosage,
       med.frequency,
       med.duration,
     ]) || [],
     headStyles: { fillColor: [22, 163, 74] },
     styles: { fontSize: 11 },
   });
   
     const finalY = (doc as any).lastAutoTable.finalY + 20;
   
     /* SIGNATURE BLOCK */
     doc.setFontSize(11);
     doc.text("Doctor Signature:", 14, finalY);
     doc.line(14, finalY + 8, 80, finalY + 8);
   
     doc.text("Authorized Digital Medical Record", pageWidth / 2, 285, {
       align: "center",
     });
   
     doc.save(`Prescription_${session?.id}.pdf`);
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
          </CardContent>
        </Card>

        {risk.score >= 70 && profileRole === "user" && !consultationCompleted && (
          <Card className="border-2 border-red-500">
            <CardContent className="p-5 text-center space-y-3">
              <p className="font-semibold text-red-600">
                High Risk Detected
              </p>

              {consultationCreated ? (
                <p className="text-sm text-muted-foreground">
                  Consultation request already sent.
                </p>
              ) : (
                <Button
                  onClick={handleConsultationRequest}
                  disabled={creatingConsultation}
                  className="w-full"
                >
                  {creatingConsultation
                    ? "Sending..."
                    : "Request Doctor Consultation"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
         {vitals.map((v) => (
           <Card
             key={v.label}
             className={v.abnormal ? "border-2 border-red-500" : ""}
           >
             <CardContent className="flex flex-col items-center p-4 text-center">
               <v.icon
                 className={`h-6 w-6 mb-2 ${
                   v.abnormal ? "text-red-500" : "text-muted-foreground"
                 }`}
               />
         
               <p className="text-xs mb-1 text-muted-foreground">
                 {v.label}
               </p>
         
               <p
                 className={`text-xl font-bold ${
                   v.abnormal ? "text-red-600" : "text-white"
                 }`}
               >
                 {v.value}
               </p>
             </CardContent>
           </Card>
         ))}
        </div>

         
      {doctorResult && profileRole === "user" && (
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="font-semibold text-green-700 text-lg">
              Consultation Completed Successfully
            </h3>
      
            <p className="text-sm text-muted-foreground">
              Your doctor has completed the consultation.
              Download the official prescription below.
            </p>
      
            <Button
              onClick={generatePrescriptionPDF}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Doctor Prescription
            </Button>
      
            {doctorResult.completed_at && (
              <p className="text-xs text-muted-foreground">
                Completed on:{" "}
                {new Date(doctorResult.completed_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
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
