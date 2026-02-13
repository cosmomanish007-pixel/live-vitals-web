import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Activity,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Database,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

/* ===============================
   TYPES
================================= */

interface DoctorProfile {
  id: string;
  license_number: string | null;
  specialization: string | null;
  hospital: string | null;
  doctor_status: string | null;
}

interface SessionData {
  id: string;
  user_name: string;
  state: string;
  risk_level: string | null;
  created_at: string;
}

/* ===============================
   COMPONENT
================================= */

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doctorRequests, setDoctorRequests] = useState<DoctorProfile[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [search, setSearch] = useState("");

  /* ===============================
     ROLE CHECK
  ================================ */

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!data || data.role !== "admin") {
        navigate("/");
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  /* ===============================
     FETCH DATA
  ================================ */

  const fetchDoctorRequests = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, license_number, specialization, hospital, doctor_status")
      .eq("role", "doctor")
      .eq("doctor_status", "pending");

    if (data) setDoctorRequests(data);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("id, user_name, state, risk_level, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setSessions(data);
  };

  useEffect(() => {
    if (!authorized) return;
    fetchDoctorRequests();
    fetchSessions();
  }, [authorized]);

  /* ===============================
     STATS
  ================================ */

  const totalSessions = sessions.length;
  const highRisk = sessions.filter((s) => s.risk_level === "RED").length;
  const yellowRisk = sessions.filter((s) => s.risk_level === "YELLOW").length;
  const greenRisk = sessions.filter((s) => s.risk_level === "GREEN").length;

  const pieData = [
    { name: "RED", value: highRisk },
    { name: "YELLOW", value: yellowRisk },
    { name: "GREEN", value: greenRisk },
  ];

  const COLORS = ["#ef4444", "#facc15", "#22c55e"];

  /* ===============================
     FILTERED SESSIONS
  ================================ */

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) =>
      s.user_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [sessions, search]);

  /* ===============================
     APPROVE DOCTOR
  ================================ */

  const approveDoctor = async (id: string) => {
    await supabase
      .from("profiles")
      .update({ doctor_status: "approved" })
      .eq("id", id);

    fetchDoctorRequests();
  };

  /* ===============================
     LOADING
  ================================ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authorized) return null;

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <Badge className="bg-green-600 text-white px-3 py-1">
          System Operational
        </Badge>
      </div>

      {/* KPI CARDS */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">

        <KPI icon={<Activity />} label="Total Sessions" value={totalSessions} />
        <KPI icon={<AlertTriangle />} label="High Risk" value={highRisk} color="text-red-500" />
        <KPI icon={<TrendingUp />} label="Moderate Risk" value={yellowRisk} color="text-yellow-500" />
        <KPI icon={<ShieldCheck />} label="Stable Sessions" value={greenRisk} color="text-green-500" />
        <KPI icon={<Users />} label="Pending Approvals" value={doctorRequests.length} />
        <KPI icon={<Database />} label="Database" value="Online" />

      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-8">

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={90}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* DOCTOR APPROVALS */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Doctor Approvals</h2>

        {doctorRequests.length === 0 && (
          <p className="text-muted-foreground">No pending approvals.</p>
        )}

        {doctorRequests.map((doc) => (
          <Card key={doc.id} className="mb-4">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p><strong>Doctor ID:</strong> {doc.id}</p>
                <p>License: {doc.license_number || "—"}</p>
                <p>Specialization: {doc.specialization || "—"}</p>
              </div>
              <Button onClick={() => approveDoctor(doc.id)}>
                Approve
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SESSION MONITORING */}
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Session Monitoring</h2>
          <Input
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {filteredSessions.map((session) => (
          <Card key={session.id} className="mb-3">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{session.user_name}</p>
                <Badge
                  className={
                    session.risk_level === "RED"
                      ? "bg-red-600 text-white"
                      : session.risk_level === "YELLOW"
                      ? "bg-yellow-500 text-black"
                      : "bg-green-600 text-white"
                  }
                >
                  {session.risk_level}
                </Badge>
              </div>

              <Button
                variant="secondary"
                onClick={() => navigate(`/report/${session.id}`)}
              >
                View
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

/* ===============================
   KPI COMPONENT
================================= */

const KPI = ({
  icon,
  label,
  value,
  color = "text-primary",
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-6 space-y-2">
        <div className={`h-6 w-6 ${color}`}>{icon}</div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default AdminDashboard;
