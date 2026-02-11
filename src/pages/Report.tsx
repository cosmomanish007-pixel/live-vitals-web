import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, HeartPulse, Droplets, Volume2, RefreshCw, Download, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';

/* ========================================================================
   ⚠️ IMPORTANT: INSTRUCTIONS FOR YOUR PROJECT
   
   1. UNCOMMENT the imports below when pasting into your app.
   2. DELETE the "MOCK IMPLEMENTATIONS" section below.
   ======================================================================== */

/* // UNCOMMENT THESE IN YOUR PROJECT:
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session, HealthStatus } from '@/types/database';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
*/

/* ===============================
   MOCK IMPLEMENTATIONS (FOR PREVIEW ONLY)
   DELETE THIS SECTION IN YOUR PROJECT
================================= */

// Mock Types
type HealthStatus = "GREEN" | "YELLOW" | "RED";
interface Session { id: string; user_name: string; age: number; gender: string; mode: string; }
interface Vital { temp: number; hr: number; spo2: number; audio?: string; }

// Mock UI Components
const Button = ({ children, onClick, className, variant, disabled }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${
      className?.includes('bg-red') ? 'bg-red-600 text-white hover:bg-red-700' : 
      variant === 'outline' ? 'border border-slate-200 hover:bg-slate-100 text-slate-900' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${className || ''}`}
  >
    {children}
  </button>
);

const Card = ({ children, className }: any) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className || ''}`}>{children}</div>
);

const CardContent = ({ children, className }: any) => (
  <div className={className}>{children}</div>
);

// Mock Supabase
const mockSupabase = {
  from: (table: string) => ({
    select: (cols: string) => ({
      eq: (key: string, val: any) => ({
        maybeSingle: async () => {
           // Simulate finding a doctor
           if (table === 'profiles') return { data: { id: 'doc_123' } };
           // Simulate checking existing request (return null = none exists)
           if (table === 'consultation_requests') return { data: null };
           return { data: null };
        },
        order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        limit: (n: number) => ({ maybeSingle: async () => ({ data: { id: 'doc_123' } }) }) 
      })
    }),
    insert: async (data: any) => {
      console.log("Supabase Insert:", table, data);
      return { error: null };
    }
  })
};
const supabase = mockSupabase; // Alias for code compatibility

// Mock PDF
const jsPDF = class {
  internal = { pageSize: { getWidth: () => 210 } };
  setFillColor() {}
  rect() {}
  setTextColor() {}
  setFontSize() {}
  text() {}
  splitTextToSize() { return []; }
  save() { alert("PDF Download Simulated (Check console for data)"); }
};
const autoTable = () => {};

/* ===============================
   END OF MOCKS
================================= */


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

  // Initialize with MOCK DATA if location state is empty (for preview)
  const [vital, setVital] = useState<Vital | null>(
    (location.state as any)?.vital ?? { temp: 39.5, hr: 120, spo2: 88, audio: "Normal" }
  );
  const [session, setSession] = useState<Session | null>(
    (location.state as any)?.session ?? { id: "sess_123", user_name: "John Doe", age: 45, gender: "Male", mode: "Standard" }
  );
  
  // Consultation State
  const [consultationStatus, setConsultationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Only fetch if not already present (Mocked for preview to use initial state)
    if (!vital && sessionId) {
       // Real Supabase logic would go here
    }
  }, [sessionId, vital, session]);

  if (!vital || !session) return <div>Loading Session Data...</div>;

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
     CONSULTATION DECISION ENGINE
   ================================= */

  const isHighRisk = risk.level === "RED";
  const shouldAutoConsult = risk.score >= 85;

  /* ===============================
     CREATE CONSULTATION REQUEST
   ================================= */

  const createConsultationRequest = useCallback(async () => {
    if (!session || consultationStatus === 'success' || consultationStatus === 'loading') return;

    setConsultationStatus('loading');

    try {
      // 1. Check if a request already exists for this session
      const { data: existing } = await supabase
        .from("consultation_requests")
        .select("id")
        .eq("session_id", session.id)
        .maybeSingle();

      if (existing) {
        setConsultationStatus('success');
        return;
      }

      // 2. Find an available approved doctor
      const { data: doctor } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "doctor")
        .eq("doctor_status", "approved")
        .eq("is_available", true)
        .limit(1)
        .maybeSingle();

      const doctorId = doctor?.id || null;

      // 3. Insert the request
      const { error } = await supabase.from("consultation_requests").insert({
        session_id: session.id,
        doctor_id: doctorId,
        risk_level: risk.level,
        status: "PENDING",
      });

      if (error) throw error;

      // Artificial delay for preview feel
      setTimeout(() => {
        setConsultationStatus('success');
        console.log("Consultation request created successfully.");
      }, 800);

    } catch (err) {
      console.error("Failed to create consultation:", err);
      setConsultationStatus('error');
    }
  }, [session, risk.level, consultationStatus]);

  /* ===============================
     AUTO-TRIGGER EFFECT
   ================================= */
   
  useEffect(() => {
    // Only trigger if high risk, score >= 85, and we haven't already processed it
    if (isHighRisk && shouldAutoConsult && consultationStatus === 'idle') {
      createConsultationRequest();
    }
  }, [isHighRisk, shouldAutoConsult, consultationStatus, createConsultationRequest]);


  /* ===============================
      PDF GENERATION
   ================================= */

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // ... (PDF logic same as before)
    console.log("Generating PDF for", session.user_name);
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
    <div className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-900">
      <div className="mx-auto max-w-md space-y-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold">Clinical Report</h1>
          <p className="text-sm text-slate-500">
            {session.user_name} • Age {session.age}
          </p>
        </motion.div>

        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-xs uppercase tracking-wider mb-2 font-semibold text-slate-400">RISK ASSESSMENT</p>
            <p className={`text-4xl font-bold ${statusColor(risk.level)}`}>
              {riskLabel}
            </p>
            <p className="text-sm mt-1 font-medium">Score: {risk.score}/100</p>
            <p className="text-xs text-slate-400 mt-1">
              Data Quality: {dataQuality}
            </p>
            
            {/* Auto-Consultation Notice */}
            {isHighRisk && shouldAutoConsult && consultationStatus === 'success' && (
              <div className="flex items-center gap-2 mt-4 text-red-600 bg-red-50 px-3 py-2 rounded-md text-xs font-semibold animate-pulse border border-red-100">
                <AlertCircle className="h-4 w-4" />
                Emergency doctor notified automatically.
              </div>
            )}
            
            {/* Success Manual Notice */}
            {consultationStatus === 'success' && !shouldAutoConsult && (
              <div className="flex items-center gap-2 mt-4 text-green-600 bg-green-50 px-3 py-2 rounded-md text-xs font-semibold border border-green-100">
                <CheckCircle className="h-4 w-4" />
                Consultation request sent.
              </div>
            )}

          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v) => (
            <Card key={v.label} className={v.abnormal ? "border-2 border-red-500" : ""}>
              <CardContent className="flex flex-col items-center p-4 text-center">
                <v.icon className={`h-6 w-6 mb-2 ${v.abnormal ? 'text-red-500' : 'text-slate-600'}`} />
                <p className="text-xs mb-1 text-slate-500">{v.label}</p>
                <p className={`text-xl font-bold ${v.abnormal ? "text-red-500" : "text-slate-900"}`}>
                  {v.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manual Consultation Button (Only if High Risk but NOT auto-triggered) */}
        {isHighRisk && !shouldAutoConsult && consultationStatus !== 'success' && (
          <Button 
            className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" 
            onClick={createConsultationRequest}
            disabled={consultationStatus === 'loading'}
          >
            <Stethoscope className="h-4 w-4" />
            {consultationStatus === 'loading' ? 'Requesting...' : 'Request Immediate Consultation'}
          </Button>
        )}

        <Button onClick={generatePDF} className="w-full gap-2" variant="outline">
          <Download className="h-4 w-4" />
          Download Clinical PDF
        </Button>

        <Button onClick={() => navigate('/new-session')} className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          Start New Session
        </Button>

      </div>
    </div>
  );
};

export default Report;