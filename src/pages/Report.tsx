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
        Loading Report...
      </div>
    );
  }

  /* ================= UI HELPERS ================= */

  const getRiskGradient = (score: number) => {
    if (score >= 60) return 'from-red-600 to-red-400';
    if (score >= 30) return 'from-yellow-500 to-yellow-300';
    return 'from-green-600 to-green-400';
  };

  const riskGradient = getRiskGradient(clinical.riskScore);

  const qualityColor =
    clinical.dataQuality === 'POOR'
      ? 'text-red-500'
      : clinical.dataQuality === 'PARTIAL'
      ? 'text-yellow-500'
      : 'text-green-500';

  /* ================= PDF ================= */

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    /* HEADER */
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
      head: [['Parameter', 'Measured', 'Clinical Range', 'Flag']],
      body: [
        [
          'Temperature',
          vital.temp ?? '—',
          `${NORMAL_RANGES.temp.min} – ${NORMAL_RANGES.temp.max} ${NORMAL_RANGES.temp.unit}`,
          clinical.abnormalFields.some(f => f.includes('Temperature')) ? 'Abnormal' : 'Normal'
        ],
        [
          'Heart Rate',
          vital.hr ?? '—',
          `${NORMAL_RANGES.hr.min} – ${NORMAL_RANGES.hr.max} ${NORMAL_RANGES.hr.unit}`,
          clinical.abnormalFields.some(f => f.includes('Heart Rate')) ? 'Abnormal' : 'Normal'
        ],
        [
          'SpO₂',
          vital.spo2 ?? '—',
          `${NORMAL_RANGES.spo2.min} – ${NORMAL_RANGES.spo2.max} ${NORMAL_RANGES.spo2.unit}`,
          clinical.abnormalFields.some(f => f.includes('SpO₂')) ? 'Abnormal' : 'Normal'
        ],
        ['Audio Peak', vital.audio ?? '—', 'N/A', 'Info']
      ],
      headStyles: { fillColor: [37, 99, 235] },
      didParseCell: function (data) {
        if (data.column.index === 3 && data.cell.raw === 'Abnormal') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      styles: { fontSize: 10 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    /* RISK BAR */
    doc.setFontSize(12);
    doc.text('Clinical Risk Assessment', 14, finalY);

    const barWidth = pageWidth - 28;
    const filledWidth = (clinical.riskScore / 100) * barWidth;

    doc.setFillColor(230);
    doc.rect(14, finalY + 6, barWidth, 8, 'F');

    if (clinical.riskLevel === 'HIGH') doc.setFillColor(220, 38, 38);
    else if (clinical.riskLevel === 'MODERATE') doc.setFillColor(234, 179, 8);
    else doc.setFillColor(34, 197, 94);

    doc.rect(14, finalY + 6, filledWidth, 8, 'F');

    doc.setFontSize(10);
    doc.text(`Risk Level: ${clinical.riskLevel}`, 14, finalY + 20);
    doc.text(`Risk Score: ${clinical.riskScore}/100`, 14, finalY + 27);
    doc.text(`Data Quality: ${clinical.dataQuality}`, 14, finalY + 34);

    doc.text(
      doc.splitTextToSize(clinical.summary, pageWidth - 28),
      14,
      finalY + 44
    );

    doc.setFontSize(8);
    doc.text(
      'Confidential Medical Document • Generated by AURA-STETH AI',
      pageWidth / 2,
      290,
      { align: 'center' }
    );

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

        <Card className={`bg-gradient-to-r ${riskGradient} text-white shadow-lg`}>
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-xs uppercase opacity-80">Risk Assessment</p>
            <p className="text-4xl font-bold">{clinical.riskLevel}</p>
            <p className="text-sm opacity-90">
              Score: {clinical.riskScore}/100
            </p>
            <p className={`text-xs font-medium ${qualityColor}`}>
              Data Quality: {clinical.dataQuality}
            </p>
          </CardContent>
        </Card>

        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clinical.riskScore}%` }}
            transition={{ duration: 0.8 }}
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${riskGradient}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'temp', icon: Thermometer, label: 'Temperature', value: vital.temp },
            { key: 'hr', icon: HeartPulse, label: 'Heart Rate', value: vital.hr },
            { key: 'spo2', icon: Droplets, label: 'SpO₂', value: vital.spo2 },
            { key: 'audio', icon: Volume2, label: 'Audio', value: vital.audio },
          ].map((v) => {
            const abnormal = clinical.abnormalFields.some(f =>
              f.toLowerCase().includes(v.label.toLowerCase())
            );

            const range = (NORMAL_RANGES as any)[v.key];

            return (
              <Card key={v.label} className={abnormal ? 'border-red-500 border-2' : ''}>
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <v.icon className="h-6 w-6 mb-2" />
                  <p className="text-xs text-muted-foreground">{v.label}</p>
                  <p className={`text-xl font-bold ${abnormal ? 'text-red-500' : ''}`}>
                    {v.value ?? '—'}
                  </p>
                  {range && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Range: {range.min} – {range.max} {range.unit}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <p className="font-semibold">Clinical Summary</p>
            <p>{clinical.summary}</p>
            {clinical.recommendations.length > 0 && (
              <ul className="list-disc list-inside text-muted-foreground">
                {clinical.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
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