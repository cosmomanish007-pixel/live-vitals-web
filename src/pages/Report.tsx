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

function statusColor(status: HealthStatus | null) {
  switch (status) {
    case 'GREEN': return { bg: 'bg-[hsl(var(--success))]/15', text: 'text-[hsl(var(--success))]', label: 'Normal', border: 'border-[hsl(var(--success))]/30' };
    case 'YELLOW': return { bg: 'bg-[hsl(var(--warning))]/15', text: 'text-[hsl(var(--warning))]', label: 'Attention Needed', border: 'border-[hsl(var(--warning))]/30' };
    case 'RED': return { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Alert', border: 'border-destructive/30' };
    default: return { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Unknown', border: 'border-border' };
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
      supabase
        .from('vitals')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setVital(data as Vital);
        });
    }

    if (!session && sessionId) {
      supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setSession(data as Session);
        });
    }
  }, [sessionId, vital, session]);

  const status = statusColor(vital?.status ?? null);

  /* ================= PDF GENERATOR ================= */
  const generatePDF = () => {
    if (!vital || !session) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('AURA-STETH AI', 20, 20);

    doc.setFontSize(12);
    doc.text('Clinical Monitoring Report', 20, 28);

    doc.setFontSize(11);
    doc.text(`Patient Name: ${session.user_name}`, 20, 40);
    doc.text(`Age: ${session.age}`, 20, 46);
    doc.text(`Gender: ${session.gender}`, 20, 52);
    doc.text(`Mode: ${session.mode}`, 20, 58);
    doc.text(`Session ID: ${session.id}`, 20, 64);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 70);

    autoTable(doc, {
      startY: 80,
      head: [['Parameter', 'Value']],
      body: [
        ['Skin Temperature', `${vital.temp ?? '—'} °C`],
        ['Heart Rate', `${vital.hr ?? '—'} bpm`],
        ['SpO₂', `${vital.spo2 ?? '—'} %`],
        ['Audio Peak', `${vital.audio ?? '—'}`],
        ['Overall Status', vital.status ?? '—'],
      ],
    });

    doc.setFontSize(10);
    doc.text(
      vital.status === 'RED'
        ? '⚠ Alert: Abnormal parameters detected. Clinical attention advised.'
        : 'Vitals within acceptable physiological range.',
      20,
      doc.lastAutoTable.finalY + 15
    );

    doc.save(`AURA_Report_${session.user_name}_${session.id}.pdf`);
  };
  /* ================================================= */

  const vitals = [
    { icon: Thermometer, label: 'Skin Temperature', value: vital?.temp != null ? `${vital.temp}°C` : '—', color: 'text-primary' },
    { icon: HeartPulse, label: 'Heart Rate', value: vital?.hr != null ? `${vital.hr} bpm` : '—', color: 'text-destructive' },
    { icon: Droplets, label: 'SpO₂', value: vital?.spo2 != null ? `${vital.spo2}%` : '—', color: 'text-primary' },
    { icon: Volume2, label: 'Audio Peak', value: vital?.audio != null ? `${vital.audio}` : '—', color: 'text-[hsl(var(--warning))]' },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-lg font-bold">Final Report</h1>
          {session && (
            <p className="text-sm text-muted-foreground mt-1">
              {session.user_name} • Age {session.age}
            </p>
          )}
        </motion.div>

        <Card className={`border ${status.border} ${status.bg}`}>
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Overall Health Status
            </p>
            <p className={`text-2xl font-bold ${status.text}`}>
              {vital?.status ?? '—'}
            </p>
            <p className={`text-sm mt-1 ${status.text}`}>
              {status.label}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v, i) => (
            <motion.div key={v.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 * i }}>
              <Card>
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <v.icon className={`h-6 w-6 mb-2 ${v.color}`} />
                  <p className="text-xs text-muted-foreground">{v.label}</p>
                  <p className={`text-xl font-bold ${v.color}`}>{v.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Download PDF Button */}
        <Button onClick={generatePDF} className="w-full h-12 gap-2">
          <Download className="h-5 w-5" />
          Download Clinical Report (PDF)
        </Button>

        <Button
          onClick={() => navigate('/new-session')}
          className="w-full h-12 gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Start New Session
        </Button>

      </div>
    </div>
  );
};

export default Report;