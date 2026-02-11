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
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Generating Clinical Report...
      </div>
    );
  }

  /* ================= VISUAL HELPERS ================= */

  const riskGradient =
    clinical.riskLevel === 'HIGH'
      ? 'from-red-600 to-red-400'
      : clinical.riskLevel === 'MODERATE'
      ? 'from-yellow-500 to-yellow-300'
      : 'from-green-600 to-green-400';

  const getBadge = (abnormal: boolean) =>
    abnormal
      ? 'bg-red-100 text-red-600'
      : 'bg-green-100 text-green-600';

  /* ================= PDF ================= */

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    /* HEADER */
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
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
          clinical.flags.temp,
        ],
        [
          'Heart Rate',
          vital.hr ?? '—',
          `${NORMAL_RANGES.hr.min} – ${NORMAL_RANGES.hr.max} ${NORMAL_RANGES.hr.unit}`,
          clinical.flags.hr,
        ],
        [
          'SpO₂',
          vital.spo2 ?? '—',
          `${NORMAL_RANGES.spo2.min} – ${NORMAL_RANGES.spo2.max} ${NORMAL_RANGES.spo2.unit}`,
          clinical.flags.spo2,
        ],
        ['Audio Peak', vital.audio ?? '—', 'N/A', 'Info'],
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

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    /* Risk Bar */
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

  const metrics = [
    { key: 'temp', icon: Thermometer, label: 'Temperature', value: vital.temp },
    { key: 'hr', icon: HeartPulse, label: 'Heart Rate', value: vital.hr },
    { key: 'spo2', icon: Droplets, label: 'SpO₂', value: vital.spo2 },
    { key: 'audio', icon: Volume2, label: 'Audio', value: vital.audio },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-xl font-bold">Clinical Report</h1>
          <p className="text-sm text-muted-foreground">
            {session.user_name} • Age {session.age}
          </p>
        </motion.div>

        {/* Risk Card */}
        <Card className={`bg-gradient-to-r ${riskGradient} text-white shadow-lg`}>
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-xs uppercase opacity-80">Risk Assessment</p>
            <p className="text-4xl font-bold">{clinical.riskLevel}</p>
            <p className="text-sm opacity-90">
              Score: {clinical.riskScore}/100
            </p>
            <p className="text-xs opacity-80">
              Data Quality: {clinical.dataQuality}
            </p>
          </CardContent>
        </Card>

        {/* Risk Bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clinical.riskScore}%` }}
            transition={{ duration: 0.8 }}
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${riskGradient}`}
          />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => {
            const abnormal = clinical.flags[m.key as keyof typeof clinical.flags] === 'Abnormal';
            const range = (NORMAL_RANGES as any)[m.key];

            return (
              <Card key={m.label} className={abnormal ? 'border-red-500 border-2' : ''}>
                <CardContent className="flex flex-col items-center p-4 text-center space-y-1">
                  <m.icon className="h-6 w-6" />
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className={`text-xl font-bold ${abnormal ? 'text-red-500' : ''}`}>
                    {m.value ?? '—'}
                  </p>
                  {range && (
                    <p className="text-[10px] text-muted-foreground">
                      {range.min} – {range.max} {range.unit}
                    </p>
                  )}
                  <span className={`text-[10px] px-2 py-1 rounded ${getBadge(abnormal)}`}>
                    {abnormal ? 'Abnormal' : 'Normal'}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Clinical Summary */}
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