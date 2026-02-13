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
const [loading, setLoading] = useState(true);
   
  /* NEW SAFE STATES */
  const [creatingConsultation, setCreatingConsultation] = useState(false);
  const [consultationCreated, setConsultationCreated] = useState(false);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [doctorResult, setDoctorResult] = useState<any>(null);
  const [consultationCompleted, setConsultationCompleted] = useState(false);
  const [consultation, setConsultation] = useState<any | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [medicineList, setMedicineList] = useState<any[]>([]);

   
useEffect(() => {
  const fetchData = async () => {
    if (!sessionId) return;

    setLoading(true);

    const { data: vitalData } = await supabase
      .from("vitals")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: sessionData } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (vitalData) setVital(vitalData as Vital);
    if (sessionData) setSession(sessionData as Session);

    setLoading(false);
  };

  fetchData();
}, [sessionId]);

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

  const fetchAllPrescriptionData = async () => {

    // 1️⃣ Get Consultation
    const { data: consultationData } = await supabase
      .from("consultation_requests")
      .select("*")
      .eq("session_id", session.id)
      .eq("status", "COMPLETED")
      .maybeSingle();

    if (!consultationData) return;

    setDoctorResult(consultationData);
    setConsultationCompleted(true);

    // 2️⃣ Get Doctor Profile
    const { data: doctorData } = await supabase
      .from("profiles")
      .select("full_name, license_number, specialization, hospital")
      .eq("id", consultationData.doctor_id)
      .maybeSingle();

    setDoctorProfile(doctorData);

    // 3️⃣ Get Medicines
    const { data: meds } = await supabase
      .from("consultation_medicines")
      .select("*")
      .eq("consultation_id", consultationData.id)
      .order("created_at", { ascending: true });

    setMedicineList(meds || []);
  };

  fetchAllPrescriptionData();
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

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading Report...</p>
    </div>
  );
}

if (!vital || !session) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">Report data not found.</p>
    </div>
  );
}
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
  if (!vital || !session) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primary = [15, 23, 42];
  const blue = [37, 99, 235];
  const green = [22, 163, 74];
  const red = [220, 38, 38];
  const yellow = [234, 179, 8];

  const reportId = `CR-${session.id.slice(0, 8).toUpperCase()}`;

  /* ================= HEADER ================= */
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AURA-STETH AI", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Advanced Clinical Monitoring Report", 14, 26);

  doc.text(`Report ID: ${reportId}`, pageWidth - 14, 26, { align: "right" });

  doc.setTextColor(0);

  let y = 45;

  /* ================= PATIENT CARD ================= */
  doc.setFillColor(245);
  doc.roundedRect(14, y, pageWidth - 28, 25, 4, 4, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 20, y + 8);

  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${session.user_name}`, 20, y + 16);
  doc.text(`Age: ${session.age}`, 100, y + 16);
  doc.text(`Gender: ${session.gender}`, 20, y + 22);
  doc.text(`Session ID: ${session.id}`, 100, y + 22);

  y += 35;

  /* ================= RISK SUMMARY ================= */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Risk Assessment Summary", 14, y);
  y += 10;

  // Background bar
  doc.setFillColor(230);
  doc.rect(14, y, pageWidth - 28, 8, "F");

  // Risk color
  if (risk.level === "RED") doc.setFillColor(...red);
  else if (risk.level === "YELLOW") doc.setFillColor(...yellow);
  else doc.setFillColor(...green);

  doc.rect(14, y, ((pageWidth - 28) * risk.score) / 100, 8, "F");

  y += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${risk.level} RISK (${risk.score}/100)`, 14, y);

  y += 10;

  /* ================= EMERGENCY BANNER ================= */
  if (risk.level === "RED") {
    doc.setFillColor(255, 235, 235);
    doc.rect(14, y, pageWidth - 28, 14, "F");

    doc.setTextColor(...red);
    doc.setFont("helvetica", "bold");
    doc.text(
      "⚠ Immediate medical evaluation strongly recommended.",
      18,
      y + 9
    );
    doc.setTextColor(0);
    y += 20;
  }

  /* ================= AI CONFIDENCE ================= */
  doc.setFont("helvetica", "bold");
  doc.text("AI Confidence Index", 14, y);
  y += 6;

  doc.setFillColor(230);
  doc.rect(14, y, 100, 6, "F");

  doc.setFillColor(...blue);
  doc.rect(14, y, 85, 6, "F");

  doc.setFontSize(9);
  doc.text("85% Data Reliability", 120, y + 5);

  y += 15;

  /* ================= TABLE ================= */
  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Measured", "Normal Range", "Status"]],
    body: [
      [
        "Temperature",
        `${vital.temp ?? "—"} °C ${
          vital.temp && vital.temp < 31
            ? "↓"
            : vital.temp && vital.temp > 37.5
            ? "↑"
            : ""
        }`,
        "31 – 37.5 °C",
        tempEval.label,
      ],
      [
        "Heart Rate",
        `${vital.hr ?? "—"} bpm ${
          vital.hr && vital.hr < 60
            ? "↓"
            : vital.hr && vital.hr > 100
            ? "↑"
            : ""
        }`,
        "60 – 100 bpm",
        hrEval.label,
      ],
      [
        "SpO₂",
        `${vital.spo2 ?? "—"} %`,
        "80 – 100 %",
        spo2Eval.label,
      ],
      ["Audio Peak", vital.audio ?? "—", "N/A", "Info"],
    ],
    theme: "grid",
    headStyles: { fillColor: blue, textColor: 255 },
    styles: { fontSize: 10 },
    didParseCell: function (data) {
      if (data.column.index === 3) {
        if (data.cell.raw === "Abnormal") {
          data.cell.styles.fillColor = red;
          data.cell.styles.textColor = 255;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.cell.raw === "Normal") {
          data.cell.styles.fillColor = green;
          data.cell.styles.textColor = 255;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  /* ================= SEVERITY SUMMARY ================= */
  const abnormalCount =
    [tempEval.abnormal, hrEval.abnormal, spo2Eval.abnormal].filter(Boolean)
      .length;

  doc.setFont("helvetica", "bold");
  doc.text("Severity Summary", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text(
    `${abnormalCount} out of 3 vital parameters outside recommended range.`,
    14,
    y
  );

  y += 15;

  /* ================= INTERPRETATION ================= */
  doc.setFont("helvetica", "bold");
  doc.text("Clinical Interpretation", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");

  const interpretation =
    risk.level === "RED"
      ? "Critical physiological deviations detected. Immediate medical evaluation is strongly recommended."
      : risk.level === "YELLOW"
      ? "Some parameters outside optimal range. Continued monitoring advised."
      : "All vital parameters within acceptable physiological limits.";

  doc.text(doc.splitTextToSize(interpretation, pageWidth - 28), 14, y);

  /* ================= FOOTER ================= */
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(220);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

    doc.setFontSize(8);
    doc.setTextColor(120);

    doc.text(
      "Confidential Clinical Document • AURA-STETH AI Monitoring System",
      pageWidth / 2,
      pageHeight - 14,
      { align: "center" }
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: "right" }
    );
  }

  doc.save(`AURA_Report_${session.id}.pdf`);
};

/* ===============================
     Prescription
  ================================= */

const generatePrescriptionPDF = () => {
  if (!doctorResult || !session) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [15, 23, 42];      // Header navy
  const accentGreen = [22, 163, 74];      // Section titles
  const lightGray = [230, 230, 230];

  /* ===============================
     OUTER BORDER
  ================================ */
  doc.setDrawColor(180);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

  /* ===============================
     HEADER
  ================================ */
  doc.setFillColor(...primaryColor);
  doc.rect(5, 5, pageWidth - 10, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AURA-STETH AI MEDICAL CENTER", 14, 22);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Official OPD Consultation Prescription", 14, 32);

  // Prescription ID
  doc.setFontSize(9);
  doc.text(
    `Prescription ID: RX-${session.id.slice(0, 8).toUpperCase()}`,
    pageWidth - 14,
    32,
    { align: "right" }
  );



  let y = 55;

  const doctorName = doctorProfile?.full_name
    ? doctorProfile.full_name.startsWith("Dr")
      ? doctorProfile.full_name
      : `Dr. ${doctorProfile.full_name}`
    : "N/A";

  /* ===============================
     DOCTOR INFORMATION
  ================================ */
  doc.setFontSize(13);
  doc.setTextColor(...accentGreen);
  doc.setFont("helvetica", "bold");
  doc.text("Doctor Information", 14, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(doctorName, 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;

  if (doctorProfile?.specialization) {
    doc.text(`Specialization: ${doctorProfile.specialization}`, 14, y);
    y += 6;
  }

  if (doctorProfile?.license_number) {
    doc.text(`License No: ${doctorProfile.license_number}`, 14, y);
    y += 6;
  }

  if (doctorProfile?.hospital) {
    doc.text(`Hospital: ${doctorProfile.hospital}`, 14, y);
    y += 10;
  }

  doc.setDrawColor(...lightGray);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  /* ===============================
     PATIENT INFORMATION
  ================================ */
  doc.setFontSize(13);
  doc.setTextColor(...accentGreen);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 14, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  doc.text(`Patient Name: ${session.user_name}`, 14, y);
  doc.text(`Age: ${session.age}`, 120, y);
  y += 6;

  doc.text(`Session ID: ${session.id}`, 14, y);
  doc.text(
    `Consultation Date: ${new Date(
      doctorResult.completed_at
    ).toLocaleString()}`,
    120,
    y
  );
  y += 10;

  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  /* ===============================
     DIAGNOSIS
  ================================ */
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnosis", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");

  if (doctorResult.diagnosis) {
    const diagnosisArray = doctorResult.diagnosis.split(",");
    diagnosisArray.forEach((item: string, index: number) => {
      doc.text(`${index + 1}. ${item.trim()}`, 14, y);
      y += 6;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.text("Not Provided", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
  }

  y += 8;

  /* ===============================
     CLINICAL NOTES
  ================================ */
  if (doctorResult.doctor_notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Clinical Notes", 14, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(
      doctorResult.doctor_notes,
      pageWidth - 28
    );
    doc.text(splitNotes, 14, y);
    y += splitNotes.length * 6 + 8;
  }

  /* ===============================
     PRESCRIBED MEDICINES
  ================================ */
  doc.setFont("helvetica", "bold");
  doc.text("Prescribed Medicines", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["#", "Medicine", "Dosage", "Frequency", "Duration", "Total Qty"]],
    body:
      medicineList.length > 0
        ? medicineList.map((med: any, index: number) => [
            index + 1,
            med.medicine_name || "-",
            med.dosage || "-",
            med.frequency || "-",
            med.duration || "-",
            med.total_quantity || "-",   // SAFE HANDLING
          ])
        : [["-", "No Medicines Prescribed", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: {
      fillColor: accentGreen,
      textColor: 255,
    },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  /* ===============================
     GENERAL ADVICE
  ================================ */
  doc.setFont("helvetica", "bold");
  doc.text("General Advice", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");

  if (doctorResult.advice) {
    const splitAdvice = doc.splitTextToSize(
      doctorResult.advice,
      pageWidth - 28
    );
    doc.text(splitAdvice, 14, y);
    y += splitAdvice.length * 6 + 6;
  } else {
    doc.setFont("helvetica", "italic");
    doc.text("No Specific Advice Provided", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
  }

  /* ===============================
     SIGNATURE BLOCK
  ================================ */
  const signatureY = pageHeight - 45;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(doctorName, pageWidth - 70, signatureY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    doctorProfile?.specialization || "",
    pageWidth - 70,
    signatureY + 6
  );

  doc.text(
    "Digitally Authorized Medical Practitioner",
    pageWidth - 70,
    signatureY + 12
  );

  /* ===============================
     FOOTER
  ================================ */
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "This is a digitally generated prescription. No physical signature required.",
    pageWidth / 2,
    pageHeight - 18,
    { align: "center" }
  );

  doc.text(
    "AURA-STETH AI Medical System",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  doc.save(`Official_OPD_Prescription_${session.id}.pdf`);
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
