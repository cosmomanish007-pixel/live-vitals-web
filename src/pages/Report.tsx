import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Vital, Session } from '@/types/database';
import {
  Thermometer,
  HeartPulse,
  Droplets,
  Volume2,
  RefreshCw,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { analyzeVitals, NORMAL_RANGES } from '@/lib/clinicalEngine';

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

  /* ================= FETCH ================= */

  useEffect(() => {
    if (!vital && sessionId) {
      supabase
        .from('vitals')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => data && setVital(data as Vital));
    }

    if (!session && sessionId) {
      supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
        .then(({ data }) => data && setSession(data as Session));
    }
  }, [sessionId, vital, session]);

  /* ================= ANALYSIS ================= */

  const clinical = useMemo(() => {
    if (!vital) return null;
    return analyzeVitals(vital);
  }, [vital]);

  if (!vital || !session || !clinical) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Clinical Report...
      </div>
    );
  }

  /* ================= STRICT RANGE CHECK ================= */

  const evaluateField = (
    value: number | null | undefined,
    min: number,
    max: number
  ) => {
    if (value == null) return 'Not Recorded';
    if (value < min) return 'Low';
    if (value > max) return 'High';
    return 'Normal';
  };

  const tempStatus = evaluateField(
    vital.temp,
    NORMAL_RANGES.temp.min,
    NORMAL_RANGES.temp.max
  );

  const hrStatus = evaluateField(
    vital.hr,
    NORMAL_RANGES.hr.min,
    NORMAL_RANGES.hr.max
  );

  const spo2Status = evaluateField(
    vital.spo2,
    NORMAL_RANGES.spo2.min,
    NORMAL_RANGES.spo2.max
  );

  const getStatusColor = (status: string) => {
    if (status === 'Low') return 'text-yellow-500';
    if (status === 'High') return 'text-red-500';
    if (status === 'Normal') return 'text-green-500';
    return 'text-muted-foreground';
  };

  /* ================= PDF ================= */

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(10, 25, 55);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('AURA-STETH AI – Advanced Clinical Report', 14, 18);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    let y = 45;

    doc.text(`Patient: ${session.user_name}`, 14, y); y += 6;
    doc.text(`Age: ${session.age} | Gender: ${session.gender}`, 14, y); y += 6;
    doc.text(`Mode: ${session.mode}`, 14, y); y += 6;
    doc.text(`Session ID: ${session.id}`, 14, y); y += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);

    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Parameter', 'Measured', 'Clinical Range', 'Status']],
      body: [
        [
          'Temperature',
          vital.temp ?? '—',
          `${NORMAL_RANGES.temp.min} – ${NORMAL_RANGES.temp.max} ${NORMAL_RANGES.temp.unit}`,
          tempStatus,
        ],
        [
          'Heart Rate',
          vital.hr ?? '—',
          `${NORMAL_RANGES.hr.min} – ${NORMAL_RANGES.hr.max} ${NORMAL_RANGES.hr.unit}`,
          hrStatus,
        ],
        [
          'SpO₂',
          vital.spo2 ?? '—',
          `${NORMAL_RANGES.spo2.min} – ${NORMAL_RANGES.spo2.max} ${NORMAL_RANGES.spo2.unit}`,
          spo2Status,
        ],
        ['Audio Peak', vital.audio ?? '—', 'N/A', 'Informational'],
      ],
      headStyles: { fillColor: [37, 99, 235] },
      didParseCell: function (data) {
        if (data.column.index === 3) {
          if (data.cell.raw === 'High') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.cell.raw === 'Low') {
            data.cell.styles.textColor = [234, 179, 8];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      styles: { fontSize: 10 },
    });

    doc.save(`AURA_Clinical_Report_${session.id}.pdf`);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-xl font-bold">Clinical Report</h1>
          <p className="text-sm text-muted-foreground">
            {session.user_name} • Age {session.age}
          </p>
        </motion.div>

        {/* VITAL CARDS */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Temperature',
              value: vital.temp,
              status: tempStatus,
              icon: Thermometer,
              range: NORMAL_RANGES.temp,
            },
            {
              label: 'Heart Rate',
              value: vital.hr,
              status: hrStatus,
              icon: HeartPulse,
              range: NORMAL_RANGES.hr,
            },
            {
              label: 'SpO₂',
              value: vital.spo2,
              status: spo2Status,
              icon: Droplets,
              range: NORMAL_RANGES.spo2,
            },
            {
              label: 'Audio',
              value: vital.audio,
              status: 'Informational',
              icon: Volume2,
              range: null,
            },
          ].map((v) => (
            <Card
              key={v.label}
              className={`transition-all ${
                v.status !== 'Normal' && v.status !== 'Informational'
                  ? 'border-red-500 border-2 shadow-md shadow-red-500/20'
                  : ''
              }`}
            >
              <CardContent className="flex flex-col items-center p-4 text-center">
                <v.icon className="h-6 w-6 mb-2" />
                <p className="text-xs text-muted-foreground">{v.label}</p>
                <p className={`text-xl font-bold ${getStatusColor(v.status)}`}>
                  {v.value ?? '—'}
                </p>
                {v.range && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Range: {v.range.min} – {v.range.max} {v.range.unit}
                  </p>
                )}
                <p className={`text-xs mt-1 ${getStatusColor(v.status)}`}>
                  {v.status}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <p className="font-semibold">Clinical Summary</p>
            <p>{clinical.summary}</p>
          </CardContent>
        </Card>

        <Button onClick={generatePDF} className="w-full gap-2">
          <Download className="h-4 w-4" />
          Download Advanced Clinical PDF
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